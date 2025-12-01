import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Lock, 
  LockOpen, 
  User, 
  Image, 
  Box,
  ChevronRight 
} from 'lucide-react';

export const GuestRoomCard = ({ 
  room, 
  canCheckIn, 
  isCheckedIn, 
  hasOtherRoom,
  onCheckIn 
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/guest/room/${room.id}`);
  };

  const handleCheckInClick = (e) => {
    e.stopPropagation(); // Prevent card click
    onCheckIn(room.id);
  };

  // Determine card state
  const isLocked = room.isLocked;
  const isLockedByOther = isLocked && !isCheckedIn;
  
  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
        isLockedByOther ? 'opacity-60' : ''
      } ${isCheckedIn ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-200 relative">
        {room.thumbnail ? (
          <img 
            src={room.thumbnail} 
            alt={room.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          isCheckedIn 
            ? 'bg-green-100 text-green-800' 
            : isLockedByOther 
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
        }`}>
          {isCheckedIn ? (
            <>
              <LockOpen className="w-3 h-3" />
              Your Room
            </>
          ) : isLockedByOther ? (
            <>
              <Lock className="w-3 h-3" />
              Occupied
            </>
          ) : (
            <>
              <LockOpen className="w-3 h-3" />
              Available
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Room Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
          {room.name}
        </h3>
        
        {/* Host Info */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <User className="w-4 h-4" />
          <span>Hosted by {room.hostName || 'Host'}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            <span>{room.photosCount || 0} photos</span>
          </div>
          <div className="flex items-center gap-1">
            <Box className="w-4 h-4" />
            <span>{room.objectsCount || 0} items</span>
          </div>
        </div>

        {/* Locked By Info */}
        {isLockedByOther && (
          <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <Lock className="w-4 h-4 text-red-500" />
            <span>Currently occupied by {room.lockedByGuestName || 'a guest'}</span>
          </div>
        )}

        {/* Action Button */}
        {isCheckedIn ? (
          <button
            onClick={handleCardClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <span>View Your Room</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : canCheckIn ? (
          <button
            onClick={handleCheckInClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <LockOpen className="w-4 h-4" />
            <span>Check In</span>
          </button>
        ) : isLockedByOther ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Unavailable</span>
          </button>
        ) : hasOtherRoom ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Check out first</span>
          </button>
        ) : (
          <button
            onClick={handleCardClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};