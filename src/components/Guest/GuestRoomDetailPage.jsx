import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader, 
  Camera, 
  LogOut as CheckOutIcon,
  LockOpen,
  User,
  Image,
  Box,
  Upload,
  X,
  ImageOff
} from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useGuestCheckIn } from '../../hooks/useGuestCheckIn';
import { CheckInSuccessModal } from './CheckInSuccessModal';
import { CheckoutModal } from './CheckoutModal';
import { RefundSummaryModal } from './RefundSummaryModal';

export const GuestRoomDetailPage = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Room state
  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // UI state
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Guest check-in hook
  const { 
    currentRoom, 
    currentCheckout,
    checkIn, 
    startCheckout,
    confirmRefund,
    isCheckedInto,
    canCheckIn: canCheckInFn 
  } = useGuestCheckIn(user?.uid, user?.displayName);

  const isCheckedIn = isCheckedInto(roomId);
  const canCheckIn = room && canCheckInFn(room);

  // Subscribe to room data
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
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

  // Subscribe to room photos
  useEffect(() => {
    if (!roomId) return;

    const photosRef = collection(db, 'rooms', roomId, 'photos');
    const unsubscribe = onSnapshot(
      photosRef,
      (snapshot) => {
        const photosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPhotos(photosData);
        setPhotosLoading(false);
      },
      (err) => {
        console.error('Photos subscription error:', err);
        setPhotosLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      await checkIn(roomId);
      setShowCheckInSuccess(true);
    } catch (err) {
      alert('Check-in failed: ' + err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle checkout with photos
  const handleCheckoutWithPhotos = () => {
    setShowCheckoutModal(false);
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle photo selection
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      // Create checkout first
      const checkoutId = await startCheckout(roomId, true);

      // Create upload batch for the checkout
      const batchData = {
        status: 'pending',
        guestId: user.uid,
        photos: Array.from(files).map(f => ({
          filename: f.name,
          size: f.size,
          contentType: f.type || 'image/jpeg'
        })),
        totalCount: files.length,
        createdAt: serverTimestamp()
      };

      const batchRef = await addDoc(
        collection(db, 'rooms', roomId, 'checkouts', checkoutId, 'uploadBatches'),
        batchData
      );

      // Store files for upload when signed URLs arrive
      window._pendingCheckoutFiles = window._pendingCheckoutFiles || {};
      window._pendingCheckoutFiles[batchRef.id] = Array.from(files);

      // Listen for signed URLs
      const unsubscribe = onSnapshot(
        doc(db, 'rooms', roomId, 'checkouts', checkoutId, 'uploadBatches', batchRef.id),
        async (snapshot) => {
          const batch = snapshot.data();
          if (!batch) return;

          if (batch.status === 'ready_to_upload' && batch.photos) {
            const filesToUpload = window._pendingCheckoutFiles[batchRef.id];
            if (filesToUpload) {
              try {
                // Upload each file
                for (const photo of batch.photos) {
                  const file = filesToUpload.find(f => f.name === photo.filename);
                  if (!file || !photo.signedUrl) continue;

                  const response = await fetch(photo.signedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'image/jpeg' },
                    body: file
                  });

                  if (!response.ok) {
                    throw new Error(`Failed to upload ${photo.filename}`);
                  }
                }

                // Mark as uploaded
                await updateDoc(snapshot.ref, {
                  status: 'uploaded',
                  uploadedAt: serverTimestamp()
                });

                // Cleanup
                delete window._pendingCheckoutFiles[batchRef.id];
                unsubscribe();

              } catch (err) {
                console.error('Upload error:', err);
                await updateDoc(snapshot.ref, {
                  status: 'failed',
                  error: err.message
                });
              }
            }
          } else if (batch.status === 'uploaded' || batch.status === 'failed') {
            unsubscribe();
            setUploading(false);
          }
        }
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Error starting checkout with photos:', err);
      alert('Failed to upload photos: ' + err.message);
      setUploading(false);
    }
  };

  // Handle checkout without photos
  const handleCheckoutWithoutPhotos = async () => {
    try {
      setCheckingOut(true);
      await startCheckout(roomId, false);
      setShowCheckoutModal(false);
      // Room will be unlocked, navigate to home
      navigate('/');
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  // Handle refund confirmation
  const handleConfirmRefund = async () => {
    if (!currentCheckout) return;

    try {
      setCheckingOut(true);
      await confirmRefund(roomId, currentCheckout.id);
      navigate('/');
    } catch (err) {
      alert('Failed to confirm: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  // Loading state
  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  // Check if awaiting refund confirmation
  const awaitingConfirmation = currentCheckout?.status === 'awaiting_confirmation';

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
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <User className="w-4 h-4" />
                  <span>Hosted by {room.hostName || 'Host'}</span>
                  <span>•</span>
                  <Image className="w-4 h-4" />
                  <span>{room.photosCount || 0} photos</span>
                  <span>•</span>
                  <Box className="w-4 h-4" />
                  <span>{room.objectsCount || 0} items</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isCheckedIn ? (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={uploading || checkingOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {uploading || checkingOut ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckOutIcon className="w-5 h-5" />
                  )}
                  Check Out
                </button>
              ) : canCheckIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {checkingIn ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <LockOpen className="w-5 h-5" />
                  )}
                  Check In
                </button>
              ) : null}
            </div>
          </div>

          {/* Status Banner */}
          {isCheckedIn && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">✓ You're checked in!</span> Enjoy your stay. Click "Check Out" when you're ready to leave.
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-800">Uploading photos and processing checkout...</p>
            </div>
          )}

          {currentCheckout?.status === 'processing' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-purple-600 animate-spin" />
              <p className="text-sm text-purple-800">Agent is comparing your photos with the baseline...</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Room Photos</h2>
          </div>

          {photosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No photos available for this room</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  {photo.downloadUrl ? (
                    <img
                      src={photo.downloadUrl}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-white text-xs truncate">{photo.filename}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Hidden file input for checkout photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxPhoto.downloadUrl}
            alt={lightboxPhoto.filename}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Check-in Success Modal */}
      <CheckInSuccessModal
        isOpen={showCheckInSuccess}
        roomName={room.name}
        onClose={() => setShowCheckInSuccess(false)}
        onViewRoom={() => setShowCheckInSuccess(false)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        roomName={room.name}
        depositAmount={room.depositAmount || 100}
        onClose={() => setShowCheckoutModal(false)}
        onCheckoutWithPhotos={handleCheckoutWithPhotos}
        onCheckoutWithoutPhotos={handleCheckoutWithoutPhotos}
        loading={checkingOut}
      />

      {/* Refund Summary Modal */}
      <RefundSummaryModal
        isOpen={awaitingConfirmation}
        checkout={currentCheckout}
        depositAmount={room.depositAmount || 100}
        onConfirm={handleConfirmRefund}
        loading={checkingOut}
      />
    </div>
  );
};