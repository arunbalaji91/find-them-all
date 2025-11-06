import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, LogOut, Home, Box, AlertCircle, CheckCircle, Loader } from 'lucide-react';

// Mock authentication - In production, replace with Firebase Auth
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    setTimeout(() => {
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }, 500);
  }, []);

  const loginWithGoogle = () => {
    // Mock login - Replace with actual Firebase Google Auth
    const mockUser = {
      id: '1',
      name: 'Demo User',
      email: 'demo@gmail.com',
      provider: 'google'
    };
    setUser(mockUser);
    sessionStorage.setItem('user', JSON.stringify(mockUser));
  };

  const loginWithMicrosoft = () => {
    // Mock login - Replace with actual Firebase Microsoft Auth
    const mockUser = {
      id: '2',
      name: 'Demo User',
      email: 'demo@outlook.com',
      provider: 'microsoft'
    };
    setUser(mockUser);
    sessionStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  return { user, loading, loginWithGoogle, loginWithMicrosoft, logout };
};

// Login Page Component
const LoginPage = ({ onGoogleLogin, onMicrosoftLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Them All</h1>
          <p className="text-gray-600">AI-Powered 3D Room Scanner</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={onMicrosoftLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Continue with Microsoft
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

// Camera Capture Component
const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImages(prev => [...prev, { url: imageUrl, blob }]);
    }, 'image/jpeg', 0.95);
  };

  const handleDone = () => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center p-4">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {capturedImages.length > 0 && (
        <div className="bg-gray-900 p-4 overflow-x-auto">
          <div className="flex gap-2">
            {capturedImages.map((img, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img src={img.url} alt={`Capture ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Cancel
        </button>
        
        <div className="text-white text-sm">
          {capturedImages.length} photo{capturedImages.length !== 1 ? 's' : ''} captured
        </div>

        <div className="flex gap-2">
          <button
            onClick={capturePhoto}
            disabled={!stream}
            className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {capturedImages.length > 0 && (
            <button
              onClick={handleDone}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }) => {
  const statusConfig = {
    processing: { color: 'bg-yellow-100 text-yellow-800', icon: Loader, text: 'Processing' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Failed' }
  };

  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Box className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className={`absolute top-2 right-2 ${config.color} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {config.text}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
        <p className="text-sm text-gray-500">{project.imageCount} images • {project.date}</p>
        {project.status === 'completed' && project.objectCount && (
          <p className="text-sm text-indigo-600 mt-2">{project.objectCount} objects detected</p>
        )}
      </div>
    </div>
  );
};

// Main Home/Dashboard Component
const HomePage = ({ user, onLogout }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Living Room Scan',
      status: 'completed',
      imageCount: 8,
      objectCount: 24,
      date: '2 days ago',
      thumbnail: null
    },
    {
      id: 2,
      name: 'Bedroom Scan',
      status: 'processing',
      imageCount: 6,
      date: '1 hour ago',
      thumbnail: null
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (capturedImages) => {
    setShowCamera(false);
    setIsProcessing(true);

    // Create new project
    const newProject = {
      id: Date.now(),
      name: `Room Scan ${projects.length + 1}`,
      status: 'processing',
      imageCount: capturedImages.length,
      date: 'Just now',
      thumbnail: capturedImages[0].url
    };

    setProjects(prev => [newProject, ...prev]);

    // Simulate ML processing
    // In production: Upload images to cloud storage, trigger ML pipeline
    setTimeout(() => {
      setProjects(prev => prev.map(p => 
        p.id === newProject.id 
          ? { ...p, status: 'completed', objectCount: Math.floor(Math.random() * 30) + 10 }
          : p
      ));
      setIsProcessing(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Find Them All</h1>
              <p className="text-sm text-gray-500">Welcome, {user.name}</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New Scan Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCamera(true)}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            <Camera className="w-5 h-5" />
            Start New Room Scan
          </button>
          {isProcessing && (
            <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Processing images with ML models...
            </p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <Home className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Objects Detected</p>
                <p className="text-3xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'completed').reduce((acc, p) => acc + (p.objectCount || 0), 0)}
                </p>
              </div>
              <Box className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-3xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'processing').length}
                </p>
              </div>
              <Loader className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Room Scans</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No scans yet</h3>
              <p className="text-gray-500 mb-6">Start by capturing images of your room</p>
              <button
                onClick={() => setShowCamera(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                Create Your First Scan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* ML Integration Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            ML Pipeline Integration Required
          </h3>
          <p className="text-sm text-blue-800">
            This is a demo interface. To enable actual 3D reconstruction and object detection, you'll need to:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
            <li>Set up Firebase Storage for image uploads</li>
            <li>Create a Python backend (Flask/FastAPI) for ML processing</li>
            <li>Integrate 3D reconstruction models (NeRF, Gaussian Splatting, or COLMAP)</li>
            <li>Add object detection models (YOLO, Detectron2)</li>
            <li>Deploy on cloud GPU (Google Cloud, AWS, or Azure)</li>
          </ul>
        </div>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  const { user, loading, loginWithGoogle, loginWithMicrosoft, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onGoogleLogin={loginWithGoogle}
        onMicrosoftLogin={loginWithMicrosoft}
      />
    );
  }

  return <HomePage user={user} onLogout={logout} />;
}