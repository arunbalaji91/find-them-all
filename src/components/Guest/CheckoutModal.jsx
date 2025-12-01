import React, { useState } from 'react';
import { X, Camera, AlertTriangle, Loader, ArrowRight } from 'lucide-react';

export const CheckoutModal = ({ 
  isOpen, 
  roomName, 
  depositAmount = 100,
  onClose, 
  onCheckoutWithPhotos,
  onCheckoutWithoutPhotos,
  loading 
}) => {
  const [step, setStep] = useState('choice'); // 'choice' | 'confirm_skip'

  if (!isOpen) return null;

  const handleSkipClick = () => {
    setStep('confirm_skip');
  };

  const handleConfirmSkip = () => {
    onCheckoutWithoutPhotos();
  };

  const handleBack = () => {
    setStep('choice');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Check Out</h2>
            <button 
              onClick={onClose}
              disabled={loading}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Checking out from {roomName}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choice' ? (
            <>
              <p className="text-gray-600 mb-6">
                Would you like to take photos of the room before leaving? This helps the host 
                assess the room condition and speeds up your deposit refund.
              </p>

              {/* Options */}
              <div className="space-y-4">
                {/* Option 1: Upload Photos */}
                <button
                  onClick={onCheckoutWithPhotos}
                  disabled={loading}
                  className="w-full p-5 border-2 border-green-500 bg-green-50 rounded-xl hover:bg-green-100 transition text-left group disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Upload Room Photos
                      </h3>
                      <p className="text-sm text-gray-600">
                        Take photos of the room to speed up your ${depositAmount} deposit refund.
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
                        <span>Recommended</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Skip Photos */}
                <button
                  onClick={handleSkipClick}
                  disabled={loading}
                  className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition text-left disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-300 text-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Skip & Check Out
                      </h3>
                      <p className="text-sm text-gray-500">
                        Complete checkout without uploading photos.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirm Skip Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">
                      Refund Processing May Be Delayed
                    </h3>
                    <p className="text-sm text-amber-700">
                      Without room photos, the host will need to manually inspect the room 
                      before processing your ${depositAmount} deposit refund. This typically 
                      takes 3-5 business days instead of instant processing.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to check out without uploading photos?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmSkip}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Skip & Check Out'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loading overlay */}
        {loading && step === 'choice' && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};