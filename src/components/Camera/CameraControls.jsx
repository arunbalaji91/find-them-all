import React from 'react';

export const CameraControls = ({ 
  capabilities, 
  zoom, 
  brightness, 
  contrast, 
  saturation, 
  onZoomChange, 
  onBrightnessChange, 
  onContrastChange, 
  onSaturationChange, 
  onReset 
}) => {
  return (
    <div className="bg-gray-900 border-t-2 border-gray-700 px-4 py-3 max-h-40 overflow-y-auto">
      <div className="space-y-3 text-white text-sm">
        {capabilities.zoom && (
          <div className="flex items-center gap-3">
            <label className="w-24 font-medium">Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min={capabilities.zoom?.min || 1}
              max={capabilities.zoom?.max || 5}
              step={(capabilities.zoom?.max || 5 - capabilities.zoom?.min || 1) / 100}
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="w-24 font-medium">Brightness: {brightness}%</label>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={brightness}
            onChange={(e) => onBrightnessChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-24 font-medium">Contrast: {contrast}%</label>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={contrast}
            onChange={(e) => onContrastChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-24 font-medium">Saturation: {saturation}%</label>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={saturation}
            onChange={(e) => onSaturationChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={onReset}
          className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-medium transition text-xs"
        >
          Reset Controls
        </button>
      </div>
    </div>
  );
};