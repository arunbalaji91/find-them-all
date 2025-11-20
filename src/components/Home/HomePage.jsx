import React, { useState, useEffect } from 'react';
import { Camera, LogOut, Box, Loader } from 'lucide-react';
import { CameraCapture } from '../Camera/CameraCapture';
import { StatsCards } from './StatsCards';
import { ProjectsGrid } from './ProjectsGrid';
import { uploadToGCS, listGroups } from '../../utils/uploadToGCS';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const HomePage = ({ user, onLogout }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  /**
   * Load all groups for current user from backend
   * Session cookie is automatically included via credentials: 'include'
   */
  const loadGroups = async () => {
    try {
      console.log('📋 Loading groups from backend...');
      const data = await listGroups(20, 0);
      setGroups(data.groups || []);
      console.log('✅ Groups loaded:', data.groups?.length || 0);
    } catch (error) {
      console.error('❌ Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle captured images from camera
   * Upload to backend which handles: validation, group creation, ML processing
   */
  const handleCapture = async (capturedImages) => {
    setShowCamera(false);
    setIsProcessing(true);
    setUploadProgress('Starting upload...');

    console.log('📸 Starting upload process for', capturedImages.length, 'images');

    try {
      // Create group name from timestamp
      const groupName = `Room Scan ${new Date().toLocaleString()}`;
      console.log('📁 Group name:', groupName);

      const uploadedCount = capturedImages.length;
      let uploadedImages = [];

      // Upload each image to backend
      for (let i = 0; i < capturedImages.length; i++) {
        try {
          console.log(`\n📤 Uploading image ${i + 1}/${capturedImages.length}...`);
          setUploadProgress(`Uploading image ${i + 1}/${capturedImages.length}...`);
          
          // Call uploadToGCS with NEW signature (no firebaseToken)
          const result = await uploadToGCS(
            capturedImages[i].blob,
            `image_${i + 1}.jpg`,
            groupName  // ✅ Pass groupName instead of firebaseToken
          );
          
          console.log(`✅ Image ${i + 1} uploaded successfully`);
          console.log('   - Group ID:', result.groupId);
          
          uploadedImages.push({
            index: i + 1,
            groupId: result.groupId,
            gcsPath: result.gcsPath,
            publicUrl: result.publicUrl
          });

        } catch (imageError) {
          console.error(`❌ Failed to upload image ${i + 1}:`, imageError);
          setUploadProgress(`Error uploading image ${i + 1}: ${imageError.message}`);
          throw imageError;
        }
      }
      
      console.log(`\n✅ All ${uploadedCount} images uploaded!`);
      setUploadProgress('Upload complete! Processing with ML...');
      
      // Reload groups from backend
      console.log('🔄 Reloading groups...');
      await loadGroups();
      
      console.log('🎉 All done!');
      setUploadProgress('');

    } catch (error) {
      console.error('❌ Upload Process Error:', error);
      console.error('Error message:', error.message);
      setUploadProgress(`❌ Error: ${error.message}`);
      alert('Upload failed: ' + error.message + '\n\nCheck browser console (F12) for details');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Find Them All</h1>
              <p className="text-sm text-gray-500">Welcome, {user.displayName || user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button 
            onClick={() => setShowCamera(true)} 
            disabled={isProcessing} 
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            <Camera className="w-5 h-5" />
            Start New Room Scan
          </button>
          {uploadProgress && (
            <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </p>
          )}
        </div>

        <StatsCards groups={groups} />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Room Scans</h2>
          <ProjectsGrid groups={groups} />
        </div>
      </main>

      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
};