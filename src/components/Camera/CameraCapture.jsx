import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertCircle, X, Settings } from 'lucide-react';
import { CameraControls } from './CameraControls';
import { CameraPreview } from './CameraPreview';

export const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [capabilities, setCapabilities] = useState({});
  const [settings, setSettings] = useState({});
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [facingMode, setFacingMode] = useState('environment');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      // Request maximum resolution with all available constraints
      const constraints = {
        video: {
          facingMode: facingMode,
          // Request ultra-high resolution
          width: { ideal: 4096 },
          height: { ideal: 2160 },
          // Request high frame rate for smooth preview
          frameRate: { ideal: 60 },
          // Request autofocus
          focusMode: { ideal: ['continuous', 'auto'] },
          // Request auto exposure
          exposureMode: { ideal: ['continuous', 'auto'] },
          // Request auto white balance
          whiteBalanceMode: { ideal: ['continuous', 'auto'] },
          // Request torch/flash if available
          torch: false,
          // Aspect ratio preference
          aspectRatio: { ideal: 16 / 9 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Get the video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        // Get capabilities
        const constraints = videoTrack.getCapabilities();
        setCapabilities(constraints);
        console.log('Camera capabilities:', constraints);

        // Get current settings
        const settings = videoTrack.getSettings();
        setSettings(settings);
        console.log('Camera settings:', settings);

        // Try to apply initial constraints for best quality
        try {
          await videoTrack.applyConstraints({
            width: { ideal: 4096 },
            height: { ideal: 2160 },
            frameRate: { ideal: 60 }
          });
        } catch (err) {
          console.warn('Could not apply high resolution constraints:', err);
          // Fallback to whatever resolution is available
        }
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions and try again.');
      console.error('Camera error:', err);
    }
  };

  const updateCameraConstraints = async (newConstraints) => {
    try {
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) {
        await videoTrack.applyConstraints(newConstraints);
        // Update settings after applying constraints
        const updatedSettings = videoTrack.getSettings();
        setSettings(updatedSettings);
      }
    } catch (err) {
      console.error('Error applying constraints:', err);
    }
  };

  const handleZoom = (value) => {
    setZoom(value);
    updateCameraConstraints({ zoom: value });
  };

  const handleFacingModeChange = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newMode,
          width: { ideal: 4096 },
          height: { ideal: 2160 },
          frameRate: { ideal: 60 }
        },
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

    // Create a canvas with the same resolution as the video
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // Apply CSS filters for brightness, contrast, saturation
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob with high quality
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImages(prev => [...prev, { 
        url: imageUrl, 
        blob,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        size: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
      }]);
    }, 'image/jpeg', 0.98); // 0.98 = 98% quality
  };

  const handleDone = async () => {
    if (capturedImages.length > 0) {
      // Only send blob data to parent, not metadata
      const imagesToSend = capturedImages.map(img => ({
        blob: img.blob,
        url: img.url
      }));
      await onCapture(imagesToSend);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTorch = async () => {
    try {
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) {
        const canTorch = capabilities.torch !== undefined;
        if (canTorch) {
          await updateCameraConstraints({ torch: !capabilities.torch });
        }
      }
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
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
        
        {/* RESOLUTION INDICATOR */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          {settings.width ? `${settings.width}x${settings.height}` : 'Loading...'} 
          {settings.frameRate ? ` @ ${settings.frameRate}fps` : ''}
        </div>

        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 flex justify-between items-center">
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2">
            {capabilities.torch && (
              <button 
                onClick={toggleTorch} 
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-2 transition"
                title="Toggle Flashlight"
              >
                💡
              </button>
            )}
            <button 
              onClick={handleFacingModeChange} 
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition text-sm font-medium px-3 py-2 flex items-center gap-2"
            >
              🔄 {facingMode === 'environment' ? 'Front' : 'Back'}
            </button>
          </div>
        </div>

        {/* CAMERA INFO OVERLAY */}
        <div className="absolute top-16 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-xs max-w-xs">
          <div className="font-semibold mb-2">Camera Info:</div>
          {capabilities.zoom && (
            <div>Zoom: {capabilities.zoom?.min || 1}x - {capabilities.zoom?.max || 5}x</div>
          )}
          {capabilities.focusMode && (
            <div>Focus: {Array.isArray(capabilities.focusMode) ? capabilities.focusMode.join(', ') : 'Available'}</div>
          )}
          {capabilities.exposureMode && (
            <div>Exposure: {Array.isArray(capabilities.exposureMode) ? capabilities.exposureMode.join(', ') : 'Available'}</div>
          )}
          {capabilities.whiteBalanceMode && (
            <div>White Balance: {Array.isArray(capabilities.whiteBalanceMode) ? capabilities.whiteBalanceMode.join(', ') : 'Available'}</div>
          )}
        </div>
      </div>

      {/* CONTROLS TOGGLE */}
      <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 text-white text-sm hover:bg-gray-800 py-2 rounded transition"
        >
          <Settings className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
        </button>
      </div>

      {/* CAMERA CONTROLS */}
      {showAdvanced && (
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
      )}

      {/* PREVIEW */}
      <CameraPreview images={capturedImages} onRemove={removeImage} />

      {/* BUTTONS */}
      <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-3 flex gap-3 items-center justify-between">
        <button 
          onClick={capturePhoto} 
          disabled={!stream} 
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Capture
        </button>

        {capturedImages.length > 0 && (
          <button 
            onClick={handleDone} 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            ✓ Done ({capturedImages.length})
          </button>
        )}
      </div>

      {/* CAPTURED IMAGES INFO */}
      {capturedImages.length > 0 && (
        <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-2 text-white text-xs">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedImages.map((img, idx) => (
              <div key={idx} className="whitespace-nowrap">
                <span className="text-gray-400">Image {idx + 1}:</span> {img.resolution} ({img.size})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};