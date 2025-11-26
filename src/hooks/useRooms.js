import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
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

    const createRoom = async (roomName) => {
        try {
            const roomData = {
                hostId: userId,
                name: roomName,
                status: 'created',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                agentMessage: 'Welcome! Please upload photos of your room.',
                photosCount: 0,
                objectsCount: 0
            };

            const docRef = await addDoc(collection(db, 'rooms'), roomData);
            console.log('✅ Room created:', docRef.id);

            // Also create agent state
            await addDoc(collection(db, 'agentState'), {
                roomId: docRef.id,
                hostId: userId,
                currentStep: 'awaiting_photos',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Create chat for this room
            await addDoc(collection(db, 'chats'), {
                roomId: docRef.id,
                hostId: userId,
                participants: ['agent', 'host'],
                unreadCount: 1,
                lastMessage: 'Welcome! Please upload photos of your room.',
                lastMessageAt: serverTimestamp()
            });

            return docRef.id;
        } catch (err) {
            console.error('❌ Error creating room:', err);
            throw err;
        }
    };

    return { rooms, loading, error, createRoom };
};