import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
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

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    provider: firebaseUser.providerData[0]?.providerId
                });
                await updateUserProfile(firebaseUser);
                await logAuthEvent(firebaseUser.uid, 'login', true);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google login error:', error);
            await logAuthEvent(null, 'login_failed', false);
            alert('Login failed: ' + error.message);
        }
    };

    const loginWithMicrosoft = async () => {
        try {
            await signInWithPopup(auth, microsoftProvider);
        } catch (error) {
            console.error('Microsoft login error:', error);
            await logAuthEvent(null, 'login_failed', false);
            alert('Login failed: ' + error.message);
        }
    };

    const logout = async () => {
        try {
            if (user) await logAuthEvent(user.uid, 'logout', true);
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return { user, loading, loginWithGoogle, loginWithMicrosoft, logout };
};