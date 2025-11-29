import React, { useState } from 'react';
import { Trash2, Check, X, Loader, ImageOff, CheckSquare, Square } from 'lucide-react';

export const PhotoGallery = ({ 
  photos, 
  loading, 
  onDeletePhotos,
  deleting 
}) => {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const toggleSelect = (photoId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)));
    }
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await onDeletePhotos(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectMode(false);
      setShowConfirmDelete(false);
    } catch (error) {
      alert('Failed to delete photos: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ImageOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No photos uploaded yet</p>
        <p className="text-sm">Upload photos to start object detection</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{photos.length} photos</span>
        
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button
                onClick={selectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={cancelSelect}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={selectedIds.size === 0 || deleting}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete ({selectedIds.size})
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group ${
              selectedIds.has(photo.id) ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => {
              if (selectMode) {
                toggleSelect(photo.id);
              } else {
                setLightboxPhoto(photo);
              }
            }}
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

            {/* Select checkbox */}
            {selectMode && (
              <div className="absolute top-2 left-2">
                {selectedIds.has(photo.id) ? (
                  <CheckSquare className="w-6 h-6 text-indigo-600 bg-white rounded" />
                ) : (
                  <Square className="w-6 h-6 text-gray-400 bg-white/80 rounded" />
                )}
              </div>
            )}

            {/* Hover overlay */}
            {!selectMode && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-white text-xs truncate">{photo.filename}</span>
              </div>
            )}
          </div>
        ))}
      </div>

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
          <div className="absolute bottom-4 text-white text-center">
            {lightboxPhoto.filename}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedIds.size} photo{selectedIds.size > 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Loader className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};