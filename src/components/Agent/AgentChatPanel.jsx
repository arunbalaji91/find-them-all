import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

export const AgentChatPanel = ({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage,
  chats,
  activeChat,
  onSelectChat,
  onMarkAsRead
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen && activeChat) {
      onMarkAsRead(activeChat);
    }
  }, [isOpen, activeChat]);

  const handleSend = () => {
    if (inputText.trim() && activeChat) {
      onSendMessage(activeChat, inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button 
          onClick={onClose}
          className="hover:bg-indigo-700 p-1 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat List (if no active chat) */}
      {!activeChat && (
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-sm text-gray-500 px-2 py-1">Select a room to chat:</p>
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg mb-1 transition"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900">Room Chat</span>
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </button>
          ))}
          {chats.length === 0 && (
            <p className="text-center text-gray-400 py-8">No chats yet. Create a room to start!</p>
          )}
        </div>
      )}

      {/* Messages (if active chat) */}
      {activeChat && (
        <>
          {/* Back button */}
          <button 
            onClick={() => onSelectChat(null)}
            className="text-left px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50 border-b"
          >
            ← Back to chats
          </button>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'host' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.sender === 'host'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {msg.sender === 'agent' ? (
                      <Bot className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="text-xs opacity-75">
                      {msg.sender === 'agent' ? 'AI Agent' : 'You'}
                    </span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};