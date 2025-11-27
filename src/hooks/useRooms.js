import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

export const useRooms = (userId) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        console.log('🏠 Subscribing to rooms for user:', userId);

        const roomsRef = collection(db, 'rooms');
        const q = query(
            roomsRef,
            where('hostId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const roomsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ Rooms updated:', roomsData.length);
                setRooms(roomsData);
                setLoading(false);
            },
            (err) => {
                console.error('❌ Rooms subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Create room - just write to Firestore, Agent will handle GCS and chat
    const createRoom = async (roomName) => {
        if (!userId) throw new Error('No user ID');

        try {
            console.log('📝 Creating room:', roomName);

            const roomData = {
                hostId: userId,
                name: roomName,
                status: 'created',  // Agent watches for this
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                agentMessage: 'Setting up your room...',
                photosCount: 0,
                objectsCount: 0,
                gcsPath: null  // Agent will set this after creating GCS folder
            };

            const docRef = await addDoc(collection(db, 'rooms'), roomData);
            console.log('✅ Room created in Firestore:', docRef.id);

            // Agent will detect this and:
            // 1. Create GCS folder
            // 2. Update room status to 'awaiting_photos'
            // 3. Create chat document
            // 4. Send welcome message

            return docRef.id;
        } catch (err) {
            console.error('❌ Error creating room:', err);
            throw err;
        }
    };

    // Delete room - just update status, Agent handles cleanup
    const deleteRoom = async (roomId) => {
        try {
            console.log('🗑️ Marking room for deletion:', roomId);

            await updateDoc(doc(db, 'rooms', roomId), {
                status: 'deleting',
                updatedAt: serverTimestamp()
            });

            console.log('✅ Room marked for deletion, agent will clean up');

            // Agent will detect status='deleting' and:
            // 1. Delete GCS folder
            // 2. Delete Pinecone vectors
            // 3. Delete Firestore subcollections
            // 4. Delete room document

            return true;
        } catch (err) {
            console.error('❌ Error deleting room:', err);
            throw err;
        }
    };

    return { rooms, loading, error, createRoom, deleteRoom };
};