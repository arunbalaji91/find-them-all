import React, { useState } from 'react';
import { X, Check, Edit2, Loader, Tag } from 'lucide-react';

export const ObjectsModal = ({ isOpen, onClose, objects, loading, onUpdateLabel, onToggleVerified }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(null);

  const handleEdit = (obj) => {
    setEditingId(obj.id);
    setEditValue(obj.label);
  };

  const handleSave = async (objectId) => {
    if (!editValue.trim()) return;

    setSaving(objectId);
    try {
      await onUpdateLabel(objectId, editValue.trim());
      setEditingId(null);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleKeyPress = (e, objectId) => {
    if (e.key === 'Enter') {
      handleSave(objectId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Detected Objects ({objects.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : objects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No objects detected yet.</p>
              <p className="text-sm mt-1">Upload photos and run object detection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`border rounded-lg overflow-hidden ${
                    obj.verified ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  {/* Object image */}
                  <div className="aspect-square bg-gray-100">
                    {obj.cropSignedUrl ? (
                      <img
                        src={obj.cropSignedUrl}
                        alt={obj.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="p-3">
                    {editingId === obj.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, obj.id)}
                          className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(obj.id)}
                          disabled={saving === obj.id}
                          className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          {saving === obj.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{obj.label}</span>
                        <button
                          onClick={() => handleEdit(obj)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Confidence & Verified */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {Math.round((obj.confidence || 0) * 100)}% confidence
                      </span>
                      <button
                        onClick={() => onToggleVerified(obj.id, !obj.verified)}
                        className={`text-xs px-2 py-0.5 rounded ${
                          obj.verified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {obj.verified ? 'Verified' : 'Unverified'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};