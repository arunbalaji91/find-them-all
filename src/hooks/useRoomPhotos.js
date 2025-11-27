import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

export const useRoomPhotos = (roomId) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Subscribe to photos collection
    useEffect(() => {
        if (!roomId) {
            setLoading(false);
            return;
        }

        console.log('📷 Subscribing to photos for room:', roomId);

        const photosRef = collection(db, 'rooms', roomId, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const photosData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ Photos updated:', photosData.length);
                setPhotos(photosData);
                setLoading(false);
            },
            (err) => {
                console.error('❌ Photos subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [roomId]);

    // Request photo upload - Agent will provide signed URL
    const requestPhotoUpload = async (file) => {
        try {
            console.log('📤 Requesting upload for:', file.name);

            // Write photo metadata with status 'pending'
            // Agent will detect this and generate signed URL
            const photoRef = await addDoc(collection(db, 'rooms', roomId, 'photos'), {
                filename: file.name,
                size: file.size,
                contentType: file.type || 'image/jpeg',
                status: 'pending',  // Agent watches for this
                createdAt: serverTimestamp()
            });

            console.log('✅ Photo request created:', photoRef.id);
            return { photoId: photoRef.id, file };
        } catch (err) {
            console.error('❌ Error requesting upload:', err);
            throw err;
        }
    };

    // Upload file using signed URL from Agent
    const uploadWithSignedUrl = async (photoId, file, signedUrl) => {
        try {
            console.log('📤 Uploading to GCS:', file.name);

            const response = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type || 'image/jpeg' },
                body: file
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            // Update photo status to uploaded
            await updateDoc(doc(db, 'rooms', roomId, 'photos', photoId), {
                status: 'uploaded',
                uploadedAt: serverTimestamp()
            });

            console.log('✅ Photo uploaded successfully');
            return true;
        } catch (err) {
            console.error('❌ Upload error:', err);

            // Mark as failed
            await updateDoc(doc(db, 'rooms', roomId, 'photos', photoId), {
                status: 'failed',
                error: err.message
            });

            throw err;
        }
    };

    // Upload multiple photos
    const uploadPhotos = async (files) => {
        setUploading(true);
        setError(null);

        try {
            const fileArray = Array.from(files);
            console.log('📤 Uploading', fileArray.length, 'photos');

            // Step 1: Create pending photo documents
            const pendingPhotos = await Promise.all(
                fileArray.map(file => requestPhotoUpload(file))
            );

            // Step 2: Wait for Agent to provide signed URLs and upload
            // For now, we'll poll for signed URLs
            for (const { photoId, file } of pendingPhotos) {
                await waitForSignedUrlAndUpload(photoId, file);
            }

            console.log('✅ All photos uploaded');
            return true;
        } catch (err) {
            console.error('❌ Upload error:', err);
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    // Wait for Agent to provide signed URL, then upload
    const waitForSignedUrlAndUpload = (photoId, file) => {
        return new Promise((resolve, reject) => {
            const photoRef = doc(db, 'rooms', roomId, 'photos', photoId);
            const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error('Timeout waiting for signed URL'));
            }, 30000); // 30 second timeout

            const unsubscribe = onSnapshot(photoRef, async (snapshot) => {
                const data = snapshot.data();

                if (data?.signedUrl && data?.status === 'ready_to_upload') {
                    clearTimeout(timeout);
                    unsubscribe();

                    try {
                        await uploadWithSignedUrl(photoId, file, data.signedUrl);
                        resolve(true);
                    } catch (err) {
                        reject(err);
                    }
                } else if (data?.status === 'failed') {
                    clearTimeout(timeout);
                    unsubscribe();
                    reject(new Error(data.error || 'Failed to get signed URL'));
                }
            });
        });
    };

    // Delete photo
    const deletePhoto = async (photoId) => {
        try {
            console.log('🗑️ Deleting photo:', photoId);
            await deleteDoc(doc(db, 'rooms', roomId, 'photos', photoId));
            console.log('✅ Photo deleted');
        } catch (err) {
            console.error('❌ Delete error:', err);
            throw err;
        }
    };

    // Get photos that are ready to display (uploaded or have signed download URL)
    const displayablePhotos = photos.filter(p =>
        p.status === 'uploaded' || p.downloadUrl
    );

    return {
        photos,
        displayablePhotos,
        loading,
        uploading,
        error,
        uploadPhotos,
        deletePhoto
    };
};