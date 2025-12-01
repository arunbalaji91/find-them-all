import React from 'react';
import { X, AlertCircle, CheckCircle, DollarSign, Loader, Package } from 'lucide-react';

export const RefundSummaryModal = ({ 
  isOpen, 
  checkout,
  depositAmount = 100,
  onConfirm,
  loading 
}) => {
  if (!isOpen || !checkout) return null;

  const missingObjects = checkout.missingObjects || [];
  const deduction = checkout.refundDeduction || 0;
  const refundAmount = depositAmount - deduction;
  const hasMissingItems = missingObjects.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 text-white ${
          hasMissingItems 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-green-500 to-emerald-500'
        }`}>
          <div className="flex items-center gap-3">
            {hasMissingItems ? (
              <AlertCircle className="w-8 h-8" />
            ) : (
              <CheckCircle className="w-8 h-8" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {hasMissingItems ? 'Items Found Missing' : 'Room Verified!'}
              </h2>
              <p className="text-sm text-white/80">
                {hasMissingItems 
                  ? 'Some items were not found in your checkout photos'
                  : 'All items were found in good condition'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Missing Objects List */}
          {hasMissingItems && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Missing Items ({missingObjects.length})
              </h3>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {missingObjects.map((item, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.cropUrl && (
                        <img 
                          src={item.cropUrl} 
                          alt={item.label}
                          className="w-10 h-10 rounded object-cover bg-gray-200"
                        />
                      )}
                      <span className="text-gray-900">{item.label}</span>
                    </div>
                    <span className="text-red-600 font-medium">-$10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refund Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Refund Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Original Deposit</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
              {hasMissingItems && (
                <div className="flex justify-between text-red-600">
                  <span>Deductions ({missingObjects.length} items × $10)</span>
                  <span>-${deduction.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Your Refund</span>
                  <span className={refundAmount >= depositAmount ? 'text-green-600' : 'text-amber-600'}>
                    ${refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-sm text-gray-500 mb-6">
            By clicking confirm, you acknowledge the refund amount and the room will be 
            unlocked for the next guest. Your refund will be processed within 24 hours.
          </p>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-white transition flex items-center justify-center gap-2 ${
              hasMissingItems 
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-green-500 hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm & Complete Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};