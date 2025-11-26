import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/Auth/LoginPage';
import { HomePage } from './components/Home/HomePage';
import { testFirestoreConnection } from './utils/testFirestore';

export default function App() {
  const { user, loading, loginWithGoogle, loginWithMicrosoft, logout } = useAuth();

  // Test Firestore AFTER user logs in
  useEffect(() => {
    if (user) {
      console.log('🔥 User logged in, testing Firestore...');
      testFirestoreConnection();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return user ? (
    <HomePage user={user} onLogout={logout} />
  ) : (
    <LoginPage onGoogleLogin={loginWithGoogle} onMicrosoftLogin={loginWithMicrosoft} />
  );
}