import React from 'react';
import { Box, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export const ProjectCard = ({ project }) => {
  const statusConfig = {
    uploading: { color: 'bg-blue-100 text-blue-800', icon: Upload, text: 'Uploading' },
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
        <p className="text-sm text-gray-500">{project.imageCount} images • {new Date(project.createdAt).toLocaleDateString()}</p>
        {project.status === 'completed' && project.objectCount && (
          <p className="text-sm text-indigo-600 mt-2">{project.objectCount} objects detected</p>
        )}
      </div>
    </div>
  );
};