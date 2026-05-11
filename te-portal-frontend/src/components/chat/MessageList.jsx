import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Message from './Message';
import Loader from '../common/Loader';
import { formatDateSeparator, isDifferentDay } from '../../utils/dateFormatter';

const MessageList = ({ onOpenThread }) => {
  const { channelId, conversationId } = useParams();
  const { messagesByChannel, messagesByConversation, loading } = useSelector((state) => state.message);
  const messagesEndRef = useRef(null);

  // Get messages for current channel or conversation
  // Filter out thread replies (messages with parentMessageId)
  const allMessages = conversationId 
    ? (messagesByConversation[conversationId] || [])
    : (messagesByChannel[channelId] || []);
  
  const currentMessages = allMessages.filter(msg => !msg.parentMessageId);

  console.log('MessageList Debug:', {
    channelId,
    conversationId,
    messagesByChannelKeys: Object.keys(messagesByChannel),
    messagesByConversationKeys: Object.keys(messagesByConversation),
    allMessagesCount: allMessages.length,
    filteredMessagesCount: currentMessages.length
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!currentMessages || currentMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-1">No messages yet</p>
          <p className="text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="py-4">
        {currentMessages.map((message, index) => {
          const previousMessage = index > 0 ? currentMessages[index - 1] : null;
          const showDateSeparator = !previousMessage || isDifferentDay(
            previousMessage.createdAt,
            message.createdAt
          );

          return (
            <React.Fragment key={message.id || index}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4 px-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="px-4 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                    {formatDateSeparator(message.createdAt)}
                  </div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}
              <Message message={message} onReply={onOpenThread} />
            </React.Fragment>
          );
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;