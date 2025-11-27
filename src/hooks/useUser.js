import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const useUser = (userId) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                console.log('👤 Fetching user data:', userId);
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    console.log('✅ User data loaded, role:', data.role || 'not set');
                    setUserData({ id: userSnap.id, ...data });
                } else {
                    console.log('⚠️ User document not found');
                    setUserData(null);
                }
            } catch (err) {
                console.error('❌ Error fetching user:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const setRole = async (role) => {
        if (!userId) throw new Error('No user ID');

        try {
            console.log('🔄 Setting user role to:', role);
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: role,
                roleSelectedAt: serverTimestamp()
            });

            setUserData(prev => ({ ...prev, role }));
            console.log('✅ Role updated successfully');
            return true;
        } catch (err) {
            console.error('❌ Error setting role:', err);
            throw err;
        }
    };

    return {
        userData,
        loading,
        error,
        role: userData?.role || null,
        setRole
    };
};