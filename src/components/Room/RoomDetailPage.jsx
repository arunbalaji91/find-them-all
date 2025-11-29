import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Tag, Loader, Camera, Play } from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Hooks
  const { 
    photos, 
    loading: photosLoading, 
    uploading, 
    deleting: deletingPhotos,
    uploadPhotos, 
    deletePhotos 
  } = useRoomPhotos(roomId, user?.uid);
  
  const { objects, loading: objectsLoading, updateLabel, toggleVerified } = useRoomObjects(roomId);
  const { chats, messages, unreadTotal, activeChat, setActiveChat, sendMessage, markAsRead } = useAgentChat(user?.uid, roomId);

  // Subscribe to room data
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.status === 'deleting' || !snapshot.exists()) {
            navigate('/');
            return;
          }
          setRoom({ id: snapshot.id, ...data });
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

  // Delete room handler
  const handleDeleteRoom = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'deleting',
        updatedAt: serverTimestamp()
      });
      // Navigation will happen automatically when room status changes
    } catch (err) {
      alert('Failed to delete room: ' + err.message);
      setDeleting(false);
    }
  };

  // Process room handler
  const handleProcessRoom = async () => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'ready_to_process',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Failed to start processing: ' + err.message);
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-gray-100 text-gray-700',
      awaiting_photos: 'bg-yellow-100 text-yellow-700',
      uploading: 'bg-blue-100 text-blue-700',
      ready_to_process: 'bg-purple-100 text-purple-700',
      processing: 'bg-purple-100 text-purple-700',
      review: 'bg-orange-100 text-orange-700',
      complete: 'bg-green-100 text-green-700',
      deleting: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const canUpload = ['awaiting_photos', 'review', 'complete'].includes(room?.status);
  const canProcess = room?.status === 'awaiting_photos' && (room?.photosCount || 0) > 0;

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

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
                    {room.status?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {room.photosCount || 0} photos • {room.objectsCount || 0} objects
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canProcess && (
                <button
                  onClick={handleProcessRoom}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Play className="w-5 h-5" />
                  Process Photos
                </button>
              )}

              <button
                onClick={() => setShowObjectsModal(true)}
                disabled={objects.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Tag className="w-5 h-5" />
                View Objects ({objects.length})
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
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

          {/* Status Messages */}
          {room.status === 'created' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-yellow-600 animate-spin" />
              <p className="text-sm text-yellow-800">Agent is setting up your room...</p>
            </div>
          )}

          {room.status === 'processing' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-purple-600 animate-spin" />
              <p className="text-sm text-purple-800">Processing photos... This may take several minutes.</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Photos</h2>
            </div>
            {canUpload && (
              <PhotoUploader onUpload={uploadPhotos} uploading={uploading} />
            )}
          </div>

          {uploading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-800">Uploading photos...</p>
            </div>
          )}

          {room.status === 'created' ? (
            <div className="text-center py-12 text-gray-500">
              <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-600" />
              <p>Waiting for room setup to complete...</p>
            </div>
          ) : (
            <PhotoGallery
              photos={photos}
              loading={photosLoading}
              onDeletePhotos={deletePhotos}
              deleting={deletingPhotos}
            />
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Room?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete "{room.name}" and all its photos and objects. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

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