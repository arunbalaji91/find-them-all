import React from 'react';

export const CameraPreview = ({ images, onRemove }) => {
  if (images.length === 0) return null;

  return (
    <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-3 max-h-32 overflow-y-auto">
      <div className="flex gap-2 flex-wrap">
        {images.map((img, idx) => (
          <div key={idx} className="relative inline-block">
            <img
              src={img.url}
              alt={`Captured ${idx + 1}`}
              className="h-24 w-24 object-cover rounded-lg border-2 border-blue-400"
            />
            <button
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition z-10"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};