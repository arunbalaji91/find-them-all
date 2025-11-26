import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { getBatchSignedUrls, uploadToGCS, buildPhotoPath } from '../utils/gcsUpload';

export const useRoomPhotos = (roomId, hostId) => {
    const [photos, setPhotos] = useState([]);
    const [photosWithUrls, setPhotosWithUrls] = useState([]);
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
        const q = query(photosRef, orderBy('uploadedAt', 'desc'));

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

    // Fetch signed URLs when photos change
    useEffect(() => {
        const fetchSignedUrls = async () => {
            if (photos.length === 0) {
                setPhotosWithUrls([]);
                return;
            }

            try {
                const filePaths = photos.map(p => p.gcsPath);
                const urls = await getBatchSignedUrls(filePaths);

                const photosWithSignedUrls = photos.map(photo => {
                    const urlData = urls.find(u => u.filePath === photo.gcsPath);
                    return {
                        ...photo,
                        signedUrl: urlData?.signedUrl || null
                    };
                });

                setPhotosWithUrls(photosWithSignedUrls);
            } catch (err) {
                console.error('❌ Error fetching signed URLs:', err);
                setError(err.message);
            }
        };

        fetchSignedUrls();
    }, [photos]);

    // Upload photos
    const uploadPhotos = async (files) => {
        if (!roomId || !hostId) {
            throw new Error('Room ID and Host ID required');
        }

        setUploading(true);
        setError(null);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const filename = `${Date.now()}_${file.name}`;
                const gcsPath = buildPhotoPath(hostId, roomId, filename);

                // Upload to GCS
                await uploadToGCS(file, gcsPath);

                // Add metadata to Firestore
                const photoDoc = await addDoc(collection(db, 'rooms', roomId, 'photos'), {
                    filename,
                    gcsPath,
                    uploadedAt: serverTimestamp(),
                    size: file.size
                });

                return photoDoc.id;
            });

            const uploadedIds = await Promise.all(uploadPromises);

            // Update room photo count
            await updateDoc(doc(db, 'rooms', roomId), {
                photosCount: increment(uploadedIds.length),
                updatedAt: serverTimestamp(),
                status: 'uploading'
            });

            console.log('✅ Uploaded photos:', uploadedIds.length);
            return uploadedIds;

        } catch (err) {
            console.error('❌ Upload error:', err);
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    // Delete photo
    const deletePhoto = async (photoId, gcsPath) => {
        try {
            await deleteDoc(doc(db, 'rooms', roomId, 'photos', photoId));

            await updateDoc(doc(db, 'rooms', roomId), {
                photosCount: increment(-1),
                updatedAt: serverTimestamp()
            });

            console.log('✅ Photo deleted:', photoId);
        } catch (err) {
            console.error('❌ Delete error:', err);
            throw err;
        }
    };

    return {
        photos: photosWithUrls,
        loading,
        uploading,
        error,
        uploadPhotos,
        deletePhoto
    };
};