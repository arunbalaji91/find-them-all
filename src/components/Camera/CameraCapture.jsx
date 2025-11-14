import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertCircle, X } from 'lucide-react';
import { CameraControls } from './CameraControls';
import { CameraPreview } from './CameraPreview';

export const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [capabilities, setCapabilities] = useState({});
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const constraints = videoTrack.getCapabilities();
        setCapabilities(constraints);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const updateCameraConstraints = async (newConstraints) => {
    try {
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) await videoTrack.applyConstraints(newConstraints);
    } catch (err) {
      console.error('Error applying constraints:', err);
    }
  };

  const handleZoom = (value) => {
    setZoom(value);
    updateCameraConstraints({ zoom: value });
  };

  const handleFacingModeChange = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImages(prev => [...prev, { url: imageUrl, blob }]);
    }, 'image/jpeg', 0.95);
  };

  const handleDone = async () => {
    if (capturedImages.length > 0) {
      await onCapture(capturedImages);
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={onClose} className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* VIDEO FEED */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}
        />
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 flex justify-between items-center">
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition">
            <X className="w-6 h-6" />
          </button>
          <button onClick={handleFacingModeChange} className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition text-sm font-medium px-3 py-2 flex items-center gap-2">
            🔄 {facingMode === 'environment' ? 'Front' : 'Back'}
          </button>
        </div>
      </div>

      {/* CONTROLS */}
      <CameraControls
        capabilities={capabilities}
        zoom={zoom}
        brightness={brightness}
        contrast={contrast}
        saturation={saturation}
        onZoomChange={handleZoom}
        onBrightnessChange={setBrightness}
        onContrastChange={setContrast}
        onSaturationChange={setSaturation}
        onReset={() => {
          setZoom(1);
          setBrightness(100);
          setContrast(100);
          setSaturation(100);
        }}
      />

      {/* PREVIEW */}
      <CameraPreview images={capturedImages} onRemove={removeImage} />

      {/* BUTTONS */}
      <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-3 flex gap-3 items-center justify-between">
        <button onClick={capturePhoto} disabled={!stream} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          Capture
        </button>

        {capturedImages.length > 0 && (
          <button onClick={handleDone} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95">
            ✓ Done ({capturedImages.length})
          </button>
        )}
      </div>
    </div>
  );
};