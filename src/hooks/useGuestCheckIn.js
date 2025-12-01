import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

/**
 * Hook to manage guest check-in and check-out
 * 
 * Rules:
 * - A guest can only be checked into ONE room at a time
 * - A room can only have ONE guest checked in at a time
 * - Check-out creates a checkout document for processing
 */
export const useGuestCheckIn = (userId, userName) => {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [currentCheckout, setCurrentCheckout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Subscribe to the room this guest is currently checked into
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        console.log('🔍 Checking for current guest room:', userId);

        const roomsRef = collection(db, 'rooms');
        const q = query(
            roomsRef,
            where('status', '==', 'complete'),
            where('lockedByGuestId', '==', userId)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                if (snapshot.empty) {
                    console.log('✅ Guest not checked into any room');
                    setCurrentRoom(null);
                } else {
                    const roomDoc = snapshot.docs[0];
                    const roomData = { id: roomDoc.id, ...roomDoc.data() };
                    console.log('✅ Guest checked into room:', roomData.name);
                    setCurrentRoom(roomData);
                }
                setLoading(false);
            },
            (err) => {
                console.error('❌ Current room subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Subscribe to active checkout if exists
    useEffect(() => {
        if (!currentRoom) {
            setCurrentCheckout(null);
            return;
        }

        const checkoutsRef = collection(db, 'rooms', currentRoom.id, 'checkouts');
        const q = query(
            checkoutsRef,
            where('guestId', '==', userId),
            where('status', 'in', ['pending', 'uploading', 'processing', 'awaiting_confirmation'])
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                if (snapshot.empty) {
                    setCurrentCheckout(null);
                } else {
                    const checkoutDoc = snapshot.docs[0];
                    setCurrentCheckout({ id: checkoutDoc.id, ...checkoutDoc.data() });
                }
            },
            (err) => {
                console.error('❌ Checkout subscription error:', err);
            }
        );

        return () => unsubscribe();
    }, [currentRoom, userId]);

    /**
     * Check into a room
     * @param {string} roomId - The room to check into
     * @returns {Promise<boolean>} - Success status
     */
    const checkIn = async (roomId) => {
        if (!userId) throw new Error('Not logged in');
        if (currentRoom) throw new Error('Already checked into a room. Check out first.');

        try {
            console.log('🔒 Checking into room:', roomId);

            // Get room to verify it's not locked
            const roomRef = doc(db, 'rooms', roomId);

            console.log('📖 Attempting to read room...');
            const roomSnap = await getDoc(roomRef);
            console.log('✅ Room read successful');

            if (!roomSnap.exists()) {
                throw new Error('Room not found');
            }

            const roomData = roomSnap.data();
            console.log('📋 Room data:', roomData.status, roomData.isLocked);

            if (roomData.isLocked) {
                throw new Error('Room is already occupied by another guest');
            }

            if (roomData.status !== 'complete') {
                throw new Error('Room is not ready for guests');
            }

            // Lock the room for this guest
            console.log('📝 Attempting to update room...');
            await updateDoc(roomRef, {
                isLocked: true,
                lockedByGuestId: userId,
                lockedByGuestName: userName || 'Guest',
                lockedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('✅ Room update successful');

            console.log('✅ Successfully checked into room');
            return true;

        } catch (err) {
            console.error('❌ Check-in error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Start checkout process
     * @param {string} roomId - The room to check out from
     * @param {boolean} willUploadPhotos - Whether guest will upload photos
     * @returns {Promise<string>} - Checkout document ID
     */
    const startCheckout = async (roomId, willUploadPhotos = true) => {
        if (!userId) throw new Error('Not logged in');
        if (!currentRoom || currentRoom.id !== roomId) {
            throw new Error('Not checked into this room');
        }

        try {
            console.log('📤 Starting checkout for room:', roomId);

            // Create checkout document
            const checkoutData = {
                guestId: userId,
                guestName: userName || 'Guest',
                roomId: roomId,
                hostId: currentRoom.hostId,
                status: willUploadPhotos ? 'pending' : 'skipped_photos',
                photosUploaded: false,
                skippedPhotos: !willUploadPhotos,
                photoCount: 0,
                missingObjects: [],
                refundDeduction: 0,
                depositAmount: currentRoom.depositAmount || 100,
                confirmedByGuest: false,
                createdAt: serverTimestamp()
            };

            const checkoutsRef = collection(db, 'rooms', roomId, 'checkouts');
            const checkoutDoc = await addDoc(checkoutsRef, checkoutData);

            console.log('✅ Checkout started:', checkoutDoc.id);

            // If skipping photos, immediately unlock room
            if (!willUploadPhotos) {
                await unlockRoom(roomId);
            }

            return checkoutDoc.id;

        } catch (err) {
            console.error('❌ Start checkout error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Confirm refund and complete checkout
     * @param {string} roomId - The room
     * @param {string} checkoutId - The checkout to confirm
     */
    const confirmRefund = async (roomId, checkoutId) => {
        if (!userId) throw new Error('Not logged in');

        try {
            console.log('✅ Confirming refund for checkout:', checkoutId);

            // Update checkout status
            await updateDoc(doc(db, 'rooms', roomId, 'checkouts', checkoutId), {
                status: 'complete',
                confirmedByGuest: true,
                completedAt: serverTimestamp()
            });

            // Unlock the room
            await unlockRoom(roomId);

            console.log('✅ Checkout complete, room unlocked');

        } catch (err) {
            console.error('❌ Confirm refund error:', err);
            setError(err.message);
            throw err;
        }
    };

    /**
     * Unlock a room (internal helper)
     */
    const unlockRoom = async (roomId) => {
        await updateDoc(doc(db, 'rooms', roomId), {
            isLocked: false,
            lockedByGuestId: null,
            lockedByGuestName: null,
            lockedAt: null,
            updatedAt: serverTimestamp()
        });
    };

    /**
     * Check if a room is available for check-in
     */
    const canCheckIn = (room) => {
        // Can't check in if already in a room
        if (currentRoom) return false;
        // Can't check in if room is locked
        if (room.isLocked) return false;
        // Can only check in to complete rooms
        if (room.status !== 'complete') return false;
        return true;
    };

    /**
     * Check if guest is checked into a specific room
     */
    const isCheckedInto = (roomId) => {
        return currentRoom?.id === roomId;
    };

    return {
        currentRoom,
        currentCheckout,
        loading,
        error,
        checkIn,
        startCheckout,
        confirmRefund,
        canCheckIn,
        isCheckedInto
    };
};