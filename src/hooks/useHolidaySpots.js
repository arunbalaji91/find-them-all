import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';

/**
 * Hook to fetch holiday spots recommendations from the Agent
 * 
 * Flow:
 * 1. UI creates a request document in Firestore
 * 2. Agent detects the request and processes it
 * 3. Agent updates the document with recommendations
 * 4. UI displays the recommendations
 * 
 * Auto-refreshes every 60 seconds
 */
export const useHolidaySpots = (userId) => {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentRequestId, setCurrentRequestId] = useState(null);

    // Create a new request for holiday spots
    const requestHolidaySpots = useCallback(async () => {
        if (!userId) return;

        try {
            console.log('🌴 Requesting holiday spots...');
            setLoading(true);

            // Create request document
            const requestData = {
                guestId: userId,
                type: 'holiday_spots',
                status: 'pending',
                requestedAt: serverTimestamp(),
                // Include current date info for the agent
                date: new Date().toISOString().split('T')[0],
                dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                month: new Date().toLocaleDateString('en-US', { month: 'long' }),
                response: null
            };

            const requestsRef = collection(db, 'holidaySpotRequests');
            const docRef = await addDoc(requestsRef, requestData);

            console.log('✅ Holiday spots request created:', docRef.id);
            setCurrentRequestId(docRef.id);

            return docRef.id;

        } catch (err) {
            console.error('❌ Error requesting holiday spots:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [userId]);

    // Subscribe to the current request for updates
    useEffect(() => {
        if (!currentRequestId) return;

        console.log('👀 Watching for holiday spots response:', currentRequestId);

        const unsubscribe = onSnapshot(
            doc(db, 'holidaySpotRequests', currentRequestId),
            (snapshot) => {
                if (!snapshot.exists()) return;

                const data = snapshot.data();

                if (data.status === 'complete' && data.response) {
                    console.log('✅ Holiday spots received:', data.response);
                    setSpots(data.response.spots || []);
                    setLastUpdated(new Date());
                    setLoading(false);
                } else if (data.status === 'error') {
                    console.error('❌ Holiday spots error:', data.error);
                    setError(data.error);
                    setLoading(false);
                }
                // If still pending, keep loading
            },
            (err) => {
                console.error('❌ Holiday spots subscription error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentRequestId]);

    // Check for existing recent request on mount
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const checkExistingRequest = async () => {
            try {
                // Check for a recent request from this user (within last 2 minutes)
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

                const requestsRef = collection(db, 'holidaySpotRequests');
                const q = query(
                    requestsRef,
                    where('guestId', '==', userId),
                    where('status', '==', 'complete'),
                    orderBy('requestedAt', 'desc'),
                    limit(1)
                );

                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const recentRequest = snapshot.docs[0].data();
                    const requestTime = recentRequest.requestedAt?.toDate();

                    // If request is recent, use its data
                    if (requestTime && requestTime > twoMinutesAgo && recentRequest.response) {
                        console.log('✅ Using recent holiday spots data');
                        setSpots(recentRequest.response.spots || []);
                        setLastUpdated(requestTime);
                        setLoading(false);
                        return;
                    }
                }

                // No recent request, create a new one
                await requestHolidaySpots();

            } catch (err) {
                console.error('❌ Error checking existing request:', err);
                // If there's an error, try to create a new request anyway
                await requestHolidaySpots();
            }
        };

        checkExistingRequest();
    }, [userId, requestHolidaySpots]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing holiday spots...');
            requestHolidaySpots();
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [userId, requestHolidaySpots]);

    // Manual refresh function
    const refresh = useCallback(() => {
        requestHolidaySpots();
    }, [requestHolidaySpots]);

    return {
        spots,
        loading,
        error,
        lastUpdated,
        refresh
    };
};