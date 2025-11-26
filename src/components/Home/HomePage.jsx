import React, { useState } from 'react';
import { Camera, LogOut, Box, Loader, Plus } from 'lucide-react';
import { CameraCapture } from '../Camera/CameraCapture';
import { StatsCards } from './StatsCards';
import { ProjectsGrid } from './ProjectsGrid';
import { AgentChatButton } from '../Agent/AgentChatButton';
import { AgentChatPanel } from '../Agent/AgentChatPanel';
import { useRooms } from '../../hooks/useRooms';
import { useAgentChat } from '../../hooks/useAgentChat';

export const HomePage = ({ user, onLogout }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Firestore hooks
  const { rooms, loading, createRoom } = useRooms(user?.uid);
  const { 
    chats, 
    messages, 
    unreadTotal, 
    activeChat, 
    setActiveChat, 
    sendMessage, 
    markAsRead 
  } = useAgentChat(user?.uid);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    try {
      setIsProcessing(true);
      await createRoom(newRoomName.trim());
      setNewRoomName('');
      setShowNewRoomModal(false);
      // Open chat to show agent welcome message
      setShowChat(true);
    } catch (error) {
      alert('Failed to create room: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async (capturedImages) => {
    setShowCamera(false);
    // TODO: Implement GCS upload with signed URLs
    console.log('Captured images:', capturedImages.length);
    alert('Photo upload coming soon! Images captured: ' + capturedImages.length);
  };

  // Convert rooms to format expected by ProjectsGrid
  const groups = rooms.map(room => ({
    id: room.id,
    name: room.name,
    status: room.status === 'complete' ? 'completed' : room.status,
    imageCount: room.photosCount || 0,
    detectionCount: room.objectsCount || 0,
    createdAt: room.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
  }));

  if (loading) {
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
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Find Them All</h1>
              <p className="text-sm text-gray-500">Welcome, {user.displayName || user.email}</p>
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
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setShowNewRoomModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Room
          </button>
          
          {rooms.length > 0 && (
            <button
              onClick={() => setShowCamera(true)}
              disabled={isProcessing}
              className="bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Upload Photos
            </button>
          )}
        </div>

        {/* Stats */}
        <StatsCards groups={groups} />

        {/* Rooms Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rooms</h2>
          <ProjectsGrid groups={groups} />
        </div>
      </main>

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name (e.g., Master Bedroom)"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewRoomModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || isProcessing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Agent Chat */}
      <AgentChatButton
        unreadCount={unreadTotal}
        onClick={() => setShowChat(true)}
      />
      
      <AgentChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        messages={messages}
        onSendMessage={sendMessage}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
};