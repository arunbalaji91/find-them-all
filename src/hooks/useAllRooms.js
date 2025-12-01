import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';

/**
 * Hook to fetch all completed rooms from all hosts
 * Used by guests to browse available rooms
 */
export const useAllRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🏠 Subscribing to all completed rooms...');

        const roomsRef = collection(db, 'rooms');
        const q = query(
            roomsRef,
            where('status', '==', 'complete'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const roomsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ All rooms updated:', roomsData.length);
                setRooms(roomsData);
                setLoading(false);
            },
            (err) => {
                console.error('❌ All rooms subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { rooms, loading, error };
};