import React, { useState } from 'react';
import { Home, Users, Loader } from 'lucide-react';

export const RoleSelectionPage = ({ user, onRoleSelect }) => {
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (role) => {
    setSelecting(true);
    try {
      await onRoleSelect(role);
    } catch (error) {
      alert('Failed to set role: ' + error.message);
      setSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user.displayName || user.email}!
          </h1>
          <p className="text-gray-600">How will you be using Find Them All?</p>
        </div>

        <div className="space-y-4">
          {/* Host Option */}
          <button
            onClick={() => handleSelect('host')}
            disabled={selecting}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
                <Home className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Host</h3>
                <p className="text-sm text-gray-500">
                  I want to create room baselines and track my property's items for damage detection.
                </p>
              </div>
            </div>
          </button>

          {/* Guest Option */}
          <button
            onClick={() => handleSelect('guest')}
            disabled={selecting}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Guest</h3>
                <p className="text-sm text-gray-500">
                  I'm checking into a property and want to document the room condition.
                </p>
              </div>
            </div>
          </button>
        </div>

        {selecting && (
          <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Setting up your account...</span>
          </div>
        )}
      </div>
    </div>
  );
};