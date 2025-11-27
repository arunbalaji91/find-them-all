import React from 'react';
import { Construction, LogOut } from 'lucide-react';

export const GuestHomePage = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Find Them All</h1>
            <p className="text-sm text-gray-500">Guest: {user.displayName || user.email}</p>
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

      {/* Coming Soon */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Construction className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Features Coming Soon</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            We're working on guest check-in features. Soon you'll be able to document room conditions 
            at check-in and checkout to protect yourself from unfair damage claims.
          </p>
        </div>
      </main>
    </div>
  );
};