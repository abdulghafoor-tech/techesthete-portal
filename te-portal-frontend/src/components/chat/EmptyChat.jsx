import React from 'react';
import { MessageSquare } from 'lucide-react';

const EmptyChat = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Select a channel
        </h2>
        <p className="text-gray-600">
          Choose a channel from the sidebar to start messaging
        </p>
      </div>
    </div>
  );
};

export default EmptyChat;