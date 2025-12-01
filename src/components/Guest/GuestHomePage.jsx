import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, LogOut, Loader, Home, MapPin } from 'lucide-react';
import { useAllRooms } from '../../hooks/useAllRooms';
import { useGuestCheckIn } from '../../hooks/useGuestCheckIn';
import { useHolidaySpots } from '../../hooks/useHolidaySpots';
import { HolidaySpotsBanner } from './HolidaySpotsBanner';
import { GuestRoomCard } from './GuestRoomCard';
import { CheckInSuccessModal } from './CheckInSuccessModal';

export const GuestHomePage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [checkingIn, setCheckingIn] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [checkedInRoomName, setCheckedInRoomName] = useState('');
  const [checkedInRoomId, setCheckedInRoomId] = useState('');

  // Hooks
  const { rooms, loading: roomsLoading } = useAllRooms();
  const { 
    currentRoom, 
    loading: checkInLoading, 
    checkIn, 
    canCheckIn: canCheckInFn,
    isCheckedInto 
  } = useGuestCheckIn(user?.uid, user?.displayName);
  const { 
    spots, 
    loading: spotsLoading, 
    lastUpdated, 
    refresh: refreshSpots 
  } = useHolidaySpots(user?.uid);

  // Handle check-in
  const handleCheckIn = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      setCheckingIn(true);
      await checkIn(roomId);
      setCheckedInRoomName(room.name);
      setCheckedInRoomId(roomId);
      setShowSuccessModal(true);
    } catch (err) {
      alert('Check-in failed: ' + err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  // Close success modal
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
  };

  // View room after check-in
  const handleViewRoom = () => {
    setShowSuccessModal(false);
    navigate(`/guest/room/${checkedInRoomId}`);
  };

  // Loading state
  if (roomsLoading || checkInLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Find Them All</h1>
              <p className="text-sm text-gray-500">Guest: {user.displayName || user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Room Banner */}
        {currentRoom && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">You're currently checked into</p>
                  <h2 className="text-xl font-bold">{currentRoom.name}</h2>
                </div>
              </div>
              <button
                onClick={() => navigate(`/guest/room/${currentRoom.id}`)}
                className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
              >
                Go to Room
              </button>
            </div>
          </div>
        )}

        {/* Holiday Spots Banner */}
        <HolidaySpotsBanner
          spots={spots}
          loading={spotsLoading}
          lastUpdated={lastUpdated}
          onRefresh={refreshSpots}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Rooms</p>
                <p className="text-3xl font-bold text-gray-900">
                  {rooms.filter(r => !r.isLocked).length}
                </p>
              </div>
              <Home className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900">{rooms.length}</p>
              </div>
              <Box className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Your Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentRoom ? 'Checked In' : 'Not Checked In'}
                </p>
              </div>
              <MapPin className="w-10 h-10 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Rooms</h2>
          
          {rooms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms available</h3>
              <p className="text-gray-500">
                There are no rooms ready for guests at the moment. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <GuestRoomCard
                  key={room.id}
                  room={room}
                  canCheckIn={canCheckInFn(room)}
                  isCheckedIn={isCheckedInto(room.id)}
                  hasOtherRoom={currentRoom && currentRoom.id !== room.id}
                  onCheckIn={handleCheckIn}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Check-in loading overlay */}
      {checkingIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
            <span>Checking you in...</span>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <CheckInSuccessModal
        isOpen={showSuccessModal}
        roomName={checkedInRoomName}
        onClose={handleCloseSuccess}
        onViewRoom={handleViewRoom}
      />
    </div>
  );
};