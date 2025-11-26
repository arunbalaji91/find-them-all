import React from 'react';
import { MessageCircle } from 'lucide-react';

export const AgentChatButton = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
      title="Chat with AI Agent"
    >
      <MessageCircle className="w-6 h-6" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};