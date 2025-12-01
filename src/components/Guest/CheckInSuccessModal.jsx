import React from 'react';
import { PartyPopper, Home, X } from 'lucide-react';

export const CheckInSuccessModal = ({ isOpen, roomName, onClose, onViewRoom }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative animate-bounce-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Confetti icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Congratulations!
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          You're now checked into
        </p>
        <p className="text-xl font-semibold text-indigo-600 mb-4">
          {roomName}
        </p>

        {/* Enjoy message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            ✨ Enjoy your stay! ✨
          </p>
          <p className="text-sm text-green-600 mt-1">
            When you're ready to leave, just click "Check Out" to complete your visit.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 transition"
          >
            Close
          </button>
          <button
            onClick={onViewRoom}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Home className="w-5 h-5" />
            View Room
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};