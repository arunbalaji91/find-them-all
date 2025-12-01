import React from 'react';
import { MapPin, Loader, Sparkles } from 'lucide-react';

export const HolidaySpotsBanner = ({ spots, loading, lastUpdated }) => {
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 mb-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-xl font-bold">Today's Holiday Spots in the US</h2>
        </div>
      </div>

      {/* Content */}
      {loading && spots.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-white/80" />
          <span className="ml-3 text-white/80">Finding the best spots for today...</span>
        </div>
      ) : spots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spots.map((spot, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{spot.name}</h3>
                  <p className="text-sm text-white/80 mt-1">{spot.description}</p>
                  {spot.reason && (
                    <p className="text-xs text-emerald-200 mt-2 italic">
                      ✨ {spot.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-white/80">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recommendations available right now.</p>
          <p className="text-sm">Check back in a moment!</p>
        </div>
      )}

      {/* Footer with timestamp */}
      {lastUpdated && (
        <div className="mt-4 text-right text-xs text-white/60">
          Last updated: {formatTime(lastUpdated)} • Auto-refreshes every minute
        </div>
      )}
    </div>
  );
};