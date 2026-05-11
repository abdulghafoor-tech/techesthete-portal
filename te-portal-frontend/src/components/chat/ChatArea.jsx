import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import socketService from '../../services/socketService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import FilesView from './FilesView';
import EmptyChat from './EmptyChat';
import ThreadPanel from './ThreadPanel';

const ChatArea = () => {
  const { channelId, conversationId } = useParams();
  const { currentChannel } = useSelector((state) => state.channel);
  const { currentConversation } = useSelector((state) => state.message);
  const [activeTab, setActiveTab] = useState('messages');
  const [threadMessage, setThreadMessage] = useState(null);

  console.log('🔥 ChatArea LOADED!');
  console.log('ChatArea Debug:', {
    channelId,
    conversationId,
    currentChannel,
    currentConversation
  });

  // Reset to messages tab when switching conversations/channels
  useEffect(() => {
    setActiveTab('messages');
    setThreadMessage(null); // Close thread when switching
  }, [channelId, conversationId]);

  // Update socket service with current context
  useEffect(() => {
    if (channelId) {
      socketService.setCurrentChannel(parseInt(channelId));
    } else {
      socketService.setCurrentChannel(null);
    }

    if (conversationId) {
      socketService.setCurrentConversation(parseInt(conversationId));
    } else {
      socketService.setCurrentConversation(null);
    }

    // Cleanup when component unmounts or context changes
    return () => {
      if (channelId) {
        socketService.setCurrentChannel(null);
      }
      if (conversationId) {
        socketService.setCurrentConversation(null);
      }
    };
  }, [channelId, conversationId]);

  // Decide if we are in a valid chat state
  const isChannel = !!channelId;
  const isDirectMessage = !!conversationId;
  
  // For channels, check if currentChannel exists
  // For DMs, check if conversationId exists (we'll load the conversation)
  const isValid = isChannel ? !!currentChannel : isDirectMessage;

  console.log('🔥 ChatArea validation:', {
    isChannel,
    isDirectMessage,
    isValid,
    'currentChannel exists': !!currentChannel,
    'conversationId exists': !!conversationId
  });

  if (!isValid) {
    console.log('🔥 ChatArea: Not valid, showing EmptyChat');
    return <EmptyChat />;
  }

  const contextId = isChannel ? channelId : conversationId;

  console.log('🔥 ChatArea: Rendering chat interface', { isChannel, contextId });

  const handleOpenThread = (message) => {
    console.log('📨 Opening thread for message:', message.id);
    setThreadMessage(message);
  };

  const handleCloseThread = () => {
    console.log('❌ Closing thread');
    setThreadMessage(null);
  };

  return (
    <div className="flex-1 flex bg-white">
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          isChannel={isChannel} 
          id={contextId} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {activeTab === 'messages' ? (
          <>
            <MessageList onOpenThread={handleOpenThread} />
            <MessageInput 
              isChannel={isChannel} 
              id={contextId} 
              threadMessage={threadMessage}
            />
          </>
        ) : activeTab === 'files' ? (
          <FilesView isChannel={isChannel} />
        ) : null}
      </div>

      {/* Thread Panel */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onClose={handleCloseThread}
          isChannel={isChannel}
        />
      )}
    </div>
  );
};

export default ChatArea;