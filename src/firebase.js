// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (paste yours here)
const firebaseConfig = {
    apiKey: "AIzaSyDdfZJv7Wl7uWMor7saI3bGmJWqciPo5Rc",
    authDomain: "find-them-all-249c5.firebaseapp.com",
    projectId: "find-them-all-249c5",
    storageBucket: "find-them-all-249c5.firebasestorage.app",
    messagingSenderId: "427127613501",
    appId: "1:427127613501:web:250e4fe8498a28e3a16254"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth providers
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');

// Optional: Force account selection for Google
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export default app;