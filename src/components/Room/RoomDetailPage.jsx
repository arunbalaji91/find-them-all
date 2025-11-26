import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Tag, Loader, Camera } from 'lucide-react';
import { doc, onSnapshot, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { PhotoGallery } from './PhotoGallery';
import { PhotoUploader } from './PhotoUploader';
import { ObjectsModal } from './ObjectsModal';
import { useRoomPhotos } from '../../hooks/useRoomPhotos';
import { useRoomObjects } from '../../hooks/useRoomObjects';
import { AgentChatButton } from '../Agent/AgentChatButton';
import { AgentChatPanel } from '../Agent/AgentChatPanel';
import { useAgentChat } from '../../hooks/useAgentChat';

export const RoomDetailPage = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [showObjectsModal, setShowObjectsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Hooks
  const { photos, loading: photosLoading, uploading, uploadPhotos, deletePhoto } = useRoomPhotos(roomId, user?.uid);
  const { objects, loading: objectsLoading, updateLabel, toggleVerified } = useRoomObjects(roomId);
  const { chats, messages, unreadTotal, activeChat, setActiveChat, sendMessage, markAsRead } = useAgentChat(user?.uid, roomId);

  // Subscribe to room data
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId),
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom({ id: snapshot.id, ...snapshot.data() });
        } else {
          navigate('/');
        }
        setRoomLoading(false);
      },
      (err) => {
        console.error('Room subscription error:', err);
        setRoomLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, navigate]);

// Delete room handler - just update status, agent handles cleanup
const handleDeleteRoom = async () => {
  if (!confirm('Delete this room and all its data? This cannot be undone.')) return;

  setDeleting(true);
  try {
    // Just update status - Agent will handle all cleanup
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'deleting',
      updatedAt: serverTimestamp()
    });

    // Navigate away - agent will clean up in background
    navigate('/');
  } catch (err) {
    alert('Failed to delete room: ' + err.message);
    setDeleting(false);
  }
};

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-gray-100 text-gray-700',
      awaiting_photos: 'bg-yellow-100 text-yellow-700',
      uploading: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      review: 'bg-orange-100 text-orange-700',
      complete: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(room.status)}`}>
                    {room.status?.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {room.photosCount || 0} photos • {room.objectsCount || 0} objects
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Objects Button */}
              <button
                onClick={() => setShowObjectsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              >
                <Tag className="w-5 h-5" />
                View Objects ({objects.length})
              </button>

              {/* Delete Room Button */}
              <button
                onClick={handleDeleteRoom}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                Delete Room
              </button>
            </div>
          </div>

          {/* Agent Message */}
          {room.agentMessage && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800">
                <span className="font-medium">🤖 Agent: </span>
                {room.agentMessage}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Photos</h2>
            </div>
            <PhotoUploader onUpload={uploadPhotos} uploading={uploading} />
          </div>

          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            onDelete={deletePhoto}
          />
        </div>
      </main>

      {/* Objects Modal */}
      <ObjectsModal
        isOpen={showObjectsModal}
        onClose={() => setShowObjectsModal(false)}
        objects={objects}
        loading={objectsLoading}
        onUpdateLabel={updateLabel}
        onToggleVerified={toggleVerified}
      />

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
        currentRoomId={roomId}
        currentRoomName={room?.name}
      />
    </div>
  );
};