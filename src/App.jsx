import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/Auth/LoginPage';
import { HomePage } from './components/Home/HomePage';
import { RoomDetailPage } from './components/Room/RoomDetailPage';
import './App.css';

function App() {
  const { user, loading, loginWithGoogle, loginWithMicrosoft, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <Route 
            path="*" 
            element={
              <LoginPage 
                onGoogleLogin={loginWithGoogle} 
                onMicrosoftLogin={loginWithMicrosoft} 
              />
            } 
          />
        ) : (
          <>
            <Route path="/" element={<HomePage user={user} onLogout={logout} />} />
            <Route path="/room/:roomId" element={<RoomDetailPage user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;