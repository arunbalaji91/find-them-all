import React, { useState } from 'react';
import { Trash2, Loader, X } from 'lucide-react';

export const PhotoGallery = ({ photos, loading, onDelete }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (photo, e) => {
    e.stopPropagation();
    if (!confirm('Delete this photo?')) return;

    setDeleting(photo.id);
    try {
      await onDelete(photo.id, photo.gcsPath);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
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
        <p>No photos uploaded yet.</p>
        <p className="text-sm mt-1">Upload photos to start detecting objects.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            {photo.signedUrl ? (
              <img
                src={photo.signedUrl}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(photo, e)}
              disabled={deleting === photo.id}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              {deleting === photo.id ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>

            {/* Filename */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.filename}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto.signedUrl}
            alt={selectedPhoto.filename}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};