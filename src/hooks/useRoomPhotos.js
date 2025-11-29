import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    where
} from 'firebase/firestore';

export const useRoomPhotos = (roomId, hostId) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [activeBatch, setActiveBatch] = useState(null);

    // Subscribe to photos collection
    useEffect(() => {
        if (!roomId) {
            setLoading(false);
            return;
        }

        const photosRef = collection(db, 'rooms', roomId, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const photosData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPhotos(photosData);
                setLoading(false);
            },
            (err) => {
                console.error('Photos subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [roomId]);

    // Subscribe to active upload batch
    useEffect(() => {
        if (!roomId) return;

        const batchesRef = collection(db, 'rooms', roomId, 'uploadBatches');
        const q = query(batchesRef, where('status', 'in', ['pending', 'ready_to_upload', 'uploading']));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                setActiveBatch(null);
                setUploading(false);
                return;
            }

            const batch = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setActiveBatch(batch);

            // If batch is ready_to_upload, upload files to GCS
            if (batch.status === 'ready_to_upload' && batch.photos) {
                setUploading(true);
                await uploadFilesToGCS(batch);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Upload files to GCS using signed URLs
    const uploadFilesToGCS = async (batch) => {
        const files = batch._localFiles; // Files stored temporarily
        if (!files || files.length === 0) {
            console.log('No local files to upload');
            return;
        }

        try {
            console.log('Uploading files to GCS...');

            // Upload each file
            const uploadPromises = batch.photos.map(async (photo, index) => {
                const file = files.find(f => f.name === photo.filename);
                if (!file || !photo.signedUrl) return;

                const response = await fetch(photo.signedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'image/jpeg' },
                    body: file
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${photo.filename}`);
                }
            });

            await Promise.all(uploadPromises);

            // Mark batch as uploaded
            await updateDoc(doc(db, 'rooms', roomId, 'uploadBatches', batch.id), {
                status: 'uploaded',
                uploadedAt: serverTimestamp()
            });

            console.log('All files uploaded successfully');

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);

            await updateDoc(doc(db, 'rooms', roomId, 'uploadBatches', batch.id), {
                status: 'failed',
                error: err.message
            });
        }
    };

    // Create upload batch
    const uploadPhotos = async (files) => {
        if (!roomId || !hostId) throw new Error('Missing roomId or hostId');

        setUploading(true);
        setError(null);

        try {
            const fileArray = Array.from(files);
            console.log(`Creating upload batch for ${fileArray.length} files`);

            // Create batch document
            const batchData = {
                status: 'pending',
                hostId,
                photos: fileArray.map(f => ({
                    filename: f.name,
                    size: f.size,
                    contentType: f.type || 'image/jpeg'
                })),
                totalCount: fileArray.length,
                createdAt: serverTimestamp()
            };

            const batchRef = await addDoc(
                collection(db, 'rooms', roomId, 'uploadBatches'),
                batchData
            );

            // Store files locally for upload when signed URLs arrive
            // We need to store them somewhere accessible
            window._pendingUploadFiles = window._pendingUploadFiles || {};
            window._pendingUploadFiles[batchRef.id] = fileArray;

            console.log('Upload batch created:', batchRef.id);

            // Set up listener for this specific batch
            const unsubscribe = onSnapshot(
                doc(db, 'rooms', roomId, 'uploadBatches', batchRef.id),
                async (snapshot) => {
                    const batch = snapshot.data();
                    if (!batch) return;

                    if (batch.status === 'ready_to_upload' && batch.photos) {
                        const files = window._pendingUploadFiles[batchRef.id];
                        if (files) {
                            try {
                                // Upload each file
                                for (const photo of batch.photos) {
                                    const file = files.find(f => f.name === photo.filename);
                                    if (!file || !photo.signedUrl) continue;

                                    const response = await fetch(photo.signedUrl, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': file.type || 'image/jpeg' },
                                        body: file
                                    });

                                    if (!response.ok) {
                                        throw new Error(`Failed to upload ${photo.filename}`);
                                    }
                                }

                                // Mark as uploaded
                                await updateDoc(snapshot.ref, {
                                    status: 'uploaded',
                                    uploadedAt: serverTimestamp()
                                });

                                // Cleanup
                                delete window._pendingUploadFiles[batchRef.id];
                                unsubscribe();
                                setUploading(false);

                            } catch (err) {
                                console.error('Upload error:', err);
                                await updateDoc(snapshot.ref, {
                                    status: 'failed',
                                    error: err.message
                                });
                                setError(err.message);
                                setUploading(false);
                            }
                        }
                    } else if (batch.status === 'uploaded' || batch.status === 'failed') {
                        unsubscribe();
                        setUploading(false);
                    }
                }
            );

            return batchRef.id;

        } catch (err) {
            console.error('Error creating upload batch:', err);
            setError(err.message);
            setUploading(false);
            throw err;
        }
    };

    // Create delete batch
    const deletePhotos = async (photoIds) => {
        if (!roomId || photoIds.length === 0) return;

        setDeleting(true);
        setError(null);

        try {
            // Get photo data for the batch
            const photosToDelete = photos.filter(p => photoIds.includes(p.id));

            const batchData = {
                status: 'pending',
                photos: photosToDelete.map(p => ({
                    photoId: p.id,
                    filename: p.filename,
                    gcsPath: p.gcsPath
                })),
                totalCount: photosToDelete.length,
                createdAt: serverTimestamp()
            };

            await addDoc(
                collection(db, 'rooms', roomId, 'deleteBatches'),
                batchData
            );

            console.log('Delete batch created for', photoIds.length, 'photos');

            // The agent will handle the actual deletion
            // Photos will disappear from the subscription when deleted

        } catch (err) {
            console.error('Error creating delete batch:', err);
            setError(err.message);
            throw err;
        } finally {
            setDeleting(false);
        }
    };

    // Get active photos (not pending delete)
    const activePhotos = photos.filter(p => p.status !== 'pending_delete');

    return {
        photos: activePhotos,
        allPhotos: photos,
        loading,
        uploading,
        deleting,
        error,
        activeBatch,
        uploadPhotos,
        deletePhotos
    };
};