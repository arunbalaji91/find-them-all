import React, { useState, useEffect } from 'react';
import { Camera, LogOut, Box, Loader } from 'lucide-react';
import { auth, db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { CameraCapture } from '../Camera/CameraCapture';
import { StatsCards } from './StatsCards';
import { ProjectsGrid } from './ProjectsGrid';
import { uploadToGCS } from '../../utils/uploadToGCS';

export const HomePage = ({ user, onLogout }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().getTime() || Date.now()
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (capturedImages) => {
    setShowCamera(false);
    setIsProcessing(true);
    setUploadProgress('Creating project...');

    try {
      const firebaseToken = await auth.currentUser.getIdToken();
      const projectData = {
        userId: user.uid,
        name: `Room Scan ${projects.length + 1}`,
        status: 'uploading',
        imageCount: capturedImages.length,
        createdAt: serverTimestamp(),
        images: []
      };
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      const uploadedImages = [];
      for (let i = 0; i < capturedImages.length; i++) {
        setUploadProgress(`Uploading image ${i + 1}/${capturedImages.length}...`);
        const { gcsPath, publicUrl } = await uploadToGCS(
          capturedImages[i].blob,
          `image_${i + 1}.jpg`,
          firebaseToken
        );
        uploadedImages.push({
          imageId: `img_${Date.now()}_${i}`,
          gcsPath,
          publicUrl,
          fileName: `image_${i + 1}.jpg`,
          uploadedAt: serverTimestamp(),
          size: capturedImages[i].blob.size
        });
      }
      
      await updateDoc(doc(db, 'projects', docRef.id), {
        status: 'processing',
        images: uploadedImages
      });
      
      setUploadProgress('Upload complete! Processing with ML...');
      await loadProjects();
      
      setTimeout(async () => {
        await updateDoc(doc(db, 'projects', docRef.id), {
          status: 'completed',
          objectCount: Math.floor(Math.random() * 30) + 10
        });
        await loadProjects();
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
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
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button onClick={() => setShowCamera(true)} disabled={isProcessing} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
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

        <StatsCards projects={projects} />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Room Scans</h2>
          <ProjectsGrid projects={projects} />
        </div>
      </main>

      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
    </div>
  );
};