import React from 'react';
import { Box, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export const ProjectCard = ({ project }) => {
  // Backend group structure:
  // {
  //   id: "group_123",
  //   name: "Room Scan 11/20/2024...",
  //   status: "uploading|processing|completed|failed",
  //   imageCount: 5,
  //   detectionCount: 12,
  //   thumbnail: "gs://bucket/thumbnail.jpg",
  //   createdAt: "2024-11-20T10:30:00Z"
  // }

  const statusConfig = {
    uploading: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: Upload, 
      text: 'Uploading' 
    },
    processing: { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: Loader, 
      text: 'Processing' 
    },
    completed: { 
      color: 'bg-green-100 text-green-800', 
      icon: CheckCircle, 
      text: 'Completed' 
    },
    failed: { 
      color: 'bg-red-100 text-red-800', 
      icon: AlertCircle, 
      text: 'Failed' 
    }
  };
  
  const config = statusConfig[project.status] || statusConfig.processing;
  const StatusIcon = config.icon;

  // Format date from ISO string
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.warn('formatDate failed for', dateString, e);
      return 'Unknown date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* THUMBNAIL */}
      <div className="aspect-video bg-gray-200 relative">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if thumbnail fails to load
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Box className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* STATUS BADGE */}
        <div className={`absolute top-2 right-2 ${config.color} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {config.text}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* NAME */}
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {project.name}
        </h3>
        
        {/* METADATA */}
        <p className="text-sm text-gray-500">
          {project.imageCount || 0} images • {formatDate(project.createdAt)}
        </p>
        
        {/* DETECTION COUNT (if completed) */}
        {project.status === 'completed' && project.detectionCount && (
          <p className="text-sm text-indigo-600 mt-2">
            {project.detectionCount} objects detected
          </p>
        )}

        {/* PROCESSING STATE (if processing) */}
        {(project.status === 'processing' || project.status === 'uploading') && (
          <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
            <Loader className="w-3 h-3 animate-spin" />
            Processing...
          </p>
        )}

        {/* ERROR STATE (if failed) */}
        {project.status === 'failed' && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed to process
          </p>
        )}
      </div>
    </div>
  );
};