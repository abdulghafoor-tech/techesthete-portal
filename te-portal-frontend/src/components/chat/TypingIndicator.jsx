import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../../services/socketService';

const TypingIndicator = ({ isChannel = true, id }) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!id) return;

    const handleUserTyping = (data) => {
      // Don't show typing indicator for current user
      if (data.userId === user?.id) return;

      if (isChannel) {
        // For channels, check if it's the current channel
        if (data.channelId === id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(data.userName || `User ${data.userId}`);
            return newSet;
          });
        }
      } else {
        // For DMs, check if it's the current conversation
        if (data.conversationId === id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add('typing');
            return newSet;
          });
        }
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.userId === user?.id) return;

      if (isChannel) {
        if (data.channelId === id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            // Remove all entries (we don't have userName in stop event)
            newSet.clear();
            return newSet;
          });
        }
      } else {
        if (data.conversationId === id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete('typing');
            return newSet;
          });
        }
      }
    };

    // Listen to appropriate events
    if (isChannel) {
      socketService.socket?.on('user_typing', handleUserTyping);
      socketService.socket?.on('user_stopped_typing', handleUserStoppedTyping);
    } else {
      socketService.socket?.on('dm_user_typing', handleUserTyping);
      socketService.socket?.on('dm_user_stopped_typing', handleUserStoppedTyping);
    }

    return () => {
      if (isChannel) {
        socketService.socket?.off('user_typing', handleUserTyping);
        socketService.socket?.off('user_stopped_typing', handleUserStoppedTyping);
      } else {
        socketService.socket?.off('dm_user_typing', handleUserTyping);
        socketService.socket?.off('dm_user_stopped_typing', handleUserStoppedTyping);
      }
      setTypingUsers(new Set());
    };
  }, [id, isChannel, user?.id]);

  if (typingUsers.size === 0) return null;

  const typingArray = Array.from(typingUsers);

  return (
    <div className="text-xs text-gray-500 italic px-1">
      {isChannel ? (
        // For channels: show "Abdul Ghafoor is typing..."
        typingArray.length === 1 ? (
          <span>{typingArray[0]} is typing...</span>
        ) : (
          <span>{typingArray.length} people are typing...</span>
        )
      ) : (
        // For DMs: just show "typing..."
        <span>typing...</span>
      )}
    </div>
  );
};

export default TypingIndicator;
