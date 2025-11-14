import React from 'react';
import { Camera } from 'lucide-react';
import { ProjectCard } from './ProjectCard';

export const ProjectsGrid = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No scans yet</h3>
        <p className="text-gray-500 mb-6">Start by capturing images of your room</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => <ProjectCard key={project.id} project={project} />)}
    </div>
  );
};