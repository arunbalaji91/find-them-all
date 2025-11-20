import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { googleProvider, microsoftProvider } from '../firebase';
import { db } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔍 Firebase auth state changed');

            if (firebaseUser) {
                try {
                    // Step 1: Get Firebase token
                    console.log('📤 Getting Firebase token...');
                    const firebaseToken = await firebaseUser.getIdToken();

                    // Step 2: Exchange Firebase token for HttpOnly session cookie
                    console.log('🔐 Exchanging token for session...');
                    await exchangeTokenForSession(firebaseToken);

                    // Step 3: Set user state
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        provider: firebaseUser.providerData[0]?.providerId
                    });

                    console.log('✅ User logged in:', firebaseUser.email);

                    // Step 4: Update user profile in Firestore
                    await updateUserProfile(firebaseUser);

                    // Step 5: Log auth event
                    await logAuthEvent(firebaseUser.uid, 'login', true);

                } catch (error) {
                    console.error('❌ Login failed:', error);
                    setUser(null);
                    // Logout from Firebase if session creation failed
                    await signOut(auth);
                }
            } else {
                console.log('👤 No Firebase user');
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    /**
     * Exchange Firebase token for HttpOnly session cookie
     * Backend creates session in Firestore and returns HttpOnly cookie
     */
    const exchangeTokenForSession = async (firebaseToken) => {
        try {
            console.log('📤 Sending Firebase token to backend...');

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // 🔐 IMPORTANT: Include cookies in request/response
                body: JSON.stringify({
                    firebaseToken: firebaseToken
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();
            console.log('✅ Session created. HttpOnly cookie set by browser.');
            console.log('   (You cannot see it in JS - that\'s the security feature!)');

            return data.user;

        } catch (error) {
            console.error('❌ Session exchange failed:', error.message);
            throw error;
        }
    };

    const updateUserProfile = async (firebaseUser) => {
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            const userData = {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                provider: firebaseUser.providerData[0]?.providerId,
                lastLogin: serverTimestamp(),
                loginCount: userDoc.exists() ? (userDoc.data().loginCount || 0) + 1 : 1
            };
            if (!userDoc.exists()) userData.createdAt = serverTimestamp();
            await setDoc(userRef, userData, { merge: true });
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    };

    const logAuthEvent = async (userId, eventType, success) => {
        try {
            await addDoc(collection(db, 'auth_logs'), {
                userId,
                eventType,
                success,
                provider: auth.currentUser?.providerData[0]?.providerId,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging auth event:', error);
        }
    };

    const loginWithGoogle = async () => {
        try {
            console.log('🔐 Logging in with Google...');
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle the rest (get token, exchange for session)
        } catch (error) {
            console.error('❌ Google login error:', error);
            await logAuthEvent(null, 'login_failed', false);
            alert('Login failed: ' + error.message);
        }
    };

    const loginWithMicrosoft = async () => {
        try {
            console.log('🔐 Logging in with Microsoft...');
            await signInWithPopup(auth, microsoftProvider);
            // onAuthStateChanged will handle the rest (get token, exchange for session)
        } catch (error) {
            console.error('❌ Microsoft login error:', error);
            await logAuthEvent(null, 'login_failed', false);
            alert('Login failed: ' + error.message);
        }
    };

    const logout = async () => {
        try {
            if (user) {
                console.log('🚪 Logging out...');

                // Step 1: Delete session from backend
                await deleteBackendSession();

                // Step 2: Log auth event
                await logAuthEvent(user.uid, 'logout', true);
            }

            // Step 3: Logout from Firebase
            await signOut(auth);

            setUser(null);
            console.log('✅ Logout successful');

        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    };

    /**
     * Delete session from backend
     * Browser automatically includes HttpOnly session cookie
     */
    const deleteBackendSession = async () => {
        try {
            console.log('📤 Deleting backend session...');

            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'  // 🔐 Include HttpOnly cookie
            });

            if (!response.ok) {
                throw new Error('Failed to delete session');
            }

            console.log('✅ Backend session deleted');

        } catch (error) {
            console.error('❌ Failed to delete session:', error);
            // Don't throw - logout should complete even if backend fails
        }
    };

    return { user, loading, loginWithGoogle, loginWithMicrosoft, logout };
};