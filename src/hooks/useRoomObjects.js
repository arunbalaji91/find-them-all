import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { getBatchSignedUrls } from '../utils/gcsUpload';

export const useRoomObjects = (roomId) => {
    const [objects, setObjects] = useState([]);
    const [objectsWithUrls, setObjectsWithUrls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Subscribe to objects collection
    useEffect(() => {
        if (!roomId) {
            setLoading(false);
            return;
        }

        console.log('🎯 Subscribing to objects for room:', roomId);

        const objectsRef = collection(db, 'rooms', roomId, 'objects');
        const q = query(objectsRef, orderBy('label', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const objectsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ Objects updated:', objectsData.length);
                setObjects(objectsData);
                setLoading(false);
            },
            (err) => {
                console.error('❌ Objects subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [roomId]);

    // Fetch signed URLs for crop images
    useEffect(() => {
        const fetchSignedUrls = async () => {
            if (objects.length === 0) {
                setObjectsWithUrls([]);
                return;
            }

            try {
                const filePaths = objects
                    .filter(o => o.cropGcsPath)
                    .map(o => o.cropGcsPath);

                if (filePaths.length === 0) {
                    setObjectsWithUrls(objects);
                    return;
                }

                const urls = await getBatchSignedUrls(filePaths);

                const objectsWithSignedUrls = objects.map(obj => {
                    const urlData = urls.find(u => u.filePath === obj.cropGcsPath);
                    return {
                        ...obj,
                        cropSignedUrl: urlData?.signedUrl || null
                    };
                });

                setObjectsWithUrls(objectsWithSignedUrls);
            } catch (err) {
                console.error('❌ Error fetching object signed URLs:', err);
                setError(err.message);
            }
        };

        fetchSignedUrls();
    }, [objects]);

    // Update object label
    const updateLabel = async (objectId, newLabel) => {
        try {
            await updateDoc(doc(db, 'rooms', roomId, 'objects', objectId), {
                label: newLabel,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Label updated:', objectId, newLabel);

            // TODO: Agent will sync to Pinecone + GCS
            // For now, just update Firestore

        } catch (err) {
            console.error('❌ Label update error:', err);
            throw err;
        }
    };

    // Toggle verified status
    const toggleVerified = async (objectId, verified) => {
        try {
            await updateDoc(doc(db, 'rooms', roomId, 'objects', objectId), {
                verified,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Verified toggled:', objectId, verified);
        } catch (err) {
            console.error('❌ Toggle verified error:', err);
            throw err;
        }
    };

    return {
        objects: objectsWithUrls,
        loading,
        error,
        updateLabel,
        toggleVerified
    };
};