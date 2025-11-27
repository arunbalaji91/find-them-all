import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useUser } from './hooks/useUser';
import { LoginPage } from './components/Auth/LoginPage';
import { RoleSelectionPage } from './components/Auth/RoleSelectionPage';
import { HostHomePage } from './components/Host/HostHomePage';
import { GuestHomePage } from './components/Guest/GuestHomePage';
import { RoomDetailPage } from './components/Room/RoomDetailPage';
import './App.css';

function App() {
  const { user, loading: authLoading, loginWithGoogle, loginWithMicrosoft, logout } = useAuth();
  const { userData, loading: userLoading, role, setRole } = useUser(user?.uid);

  // Show loading while checking auth or user data
  if (authLoading || (user && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → Login page
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route 
            path="*" 
            element={
              <LoginPage 
                onGoogleLogin={loginWithGoogle} 
                onMicrosoftLogin={loginWithMicrosoft} 
              />
            } 
          />
        </Routes>
      </BrowserRouter>
    );
  }

  // Logged in but no role selected → Role selection page
  if (!role) {
    return (
      <BrowserRouter>
        <Routes>
          <Route 
            path="*" 
            element={
              <RoleSelectionPage 
                user={user} 
                onRoleSelect={setRole} 
              />
            } 
          />
        </Routes>
      </BrowserRouter>
    );
  }

  // Host routes
  if (role === 'host') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HostHomePage user={user} onLogout={logout} />} />
          <Route path="/room/:roomId" element={<RoomDetailPage user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Guest routes
  if (role === 'guest') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestHomePage user={user} onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Fallback
  return null;
}

export default App;