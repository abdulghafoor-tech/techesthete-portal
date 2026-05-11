import React, { useEffect } from 'react';
import { X, MessageSquare, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Avatar from './Avatar';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    // Auto-dismiss after duration (default 5 seconds)
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  // Handle different notification types
  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'success';
  const isInfo = notification.type === 'info';
  const isMessage = !isError && !isSuccess && !isInfo;

  // Error/Success/Info notifications
  if (isError || isSuccess || isInfo) {
    const bgColor = isError ? 'bg-red-50 border-red-200' : isSuccess ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
    const textColor = isError ? 'text-red-800' : isSuccess ? 'text-green-800' : 'text-blue-800';
    const Icon = isError ? AlertCircle : isSuccess ? CheckCircle : Info;
    const iconColor = isError ? 'text-red-600' : isSuccess ? 'text-green-600' : 'text-blue-600';

    return (
      <div className={`${bgColor} rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-[400px] animate-slideInRight border`}>
        <div className="flex items-start gap-3">
          <Icon size={20} className={iconColor} />
          <div className="flex-1 min-w-0">
            <p className={`${textColor} text-sm break-words`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => onClose(notification.id)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Message notifications
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-[400px] animate-slideInRight border border-gray-200">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar 
          name={notification.senderName || 'User'}
          size="sm"
        />
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {notification.senderName || 'Unknown User'}
            </p>
            <button
              onClick={() => onClose(notification.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Channel/DM name */}
          {notification.channelName && (
            <p className="text-purple-600 text-xs mb-1 flex items-center gap-1">
              <MessageSquare size={12} />
              #{notification.channelName}
            </p>
          )}
          
          {/* Message content */}
          <p className="text-gray-700 text-sm break-words line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notification;