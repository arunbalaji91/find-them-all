import React from 'react';
import { Home, Box, Loader } from 'lucide-react';

export const StatsCards = ({ groups }) => {
  // Groups structure from backend:
  // {
  //   id: "group_123",
  //   name: "Room Scan...",
  //   status: "processing|completed",
  //   imageCount: 5,
  //   detectionCount: 12,
  //   thumbnail: "url",
  //   createdAt: "2024-11-20..."
  // }

  const completedGroups = groups.filter(g => g.status === 'completed');
  const totalObjects = completedGroups.reduce((acc, g) => acc + (g.detectionCount || 0), 0);
  const processingCount = groups.filter(g => g.status === 'processing' || g.status === 'uploading').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Scans</p>
            <p className="text-3xl font-bold text-gray-900">{groups.length}</p>
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