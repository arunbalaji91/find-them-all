import React, { useRef } from 'react';
import { Upload, Loader } from 'lucide-react';

export const PhotoUploader = ({ onUpload, uploading }) => {
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        await onUpload(files);
        // Reset input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
        id="photo-upload"
      />
      <label
        htmlFor="photo-upload"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition ${
          uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {uploading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Photos
          </>
        )}
      </label>
    </div>
  );
};