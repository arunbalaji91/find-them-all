import React from 'react';
import { Home, Box, Loader } from 'lucide-react';

export const StatsCards = ({ projects }) => {
  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalObjects = completedProjects.reduce((acc, p) => acc + (p.objectCount || 0), 0);
  const processingCount = projects.filter(p => p.status === 'processing' || p.status === 'uploading').length;

  return (
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
            <p className="text-3xl font-bold text-gray-900">{totalObjects}</p>
          </div>
          <Box className="w-10 h-10 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Processing</p>
            <p className="text-3xl font-bold text-gray-900">{processingCount}</p>
          </div>
          <Loader className="w-10 h-10 text-yellow-600" />
        </div>
      </div>
    </div>
  );
};