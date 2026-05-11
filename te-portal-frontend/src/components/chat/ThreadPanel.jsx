import React, { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import socketService from '../../services/socketService';
import Message from './Message';

const ThreadPanel = ({ parentMessage, onClose, isChannel = true }) => {
  const { user } = useSelector((state) => state.auth);
  const [replies, setReplies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const repliesEndRef = useRef(null);

  useEffect(() => {
    if (parentMessage) {
      loadThreadReplies();
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [parentMessage?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const scrollToBottom = () => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreadReplies = () => {
    console.log('📨 Loading thread replies for message:', parentMessage.id, 'isChannel:', isChannel);
    setLoading(true);
    socketService.getThreadReplies(parentMessage.id, isChannel);
  };

  const setupSocketListeners = () => {
    console.log('🔌 Setting up thread socket listeners');
    if (isChannel) {
      socketService.socket.on('thread_replies', handleThreadReplies);
      socketService.socket.on('thread_reply_added', handleNewReply);
    } else {
      socketService.socket.on('dm_thread_replies', handleThreadReplies);
      socketService.socket.on('dm_thread_reply_added', handleNewReply);
    }
  };

  const cleanupSocketListeners = () => {
    console.log('🔌 Cleaning up thread socket listeners');
    if (isChannel) {
      socketService.socket.off('thread_replies', handleThreadReplies);
      socketService.socket.off('thread_reply_added', handleNewReply);
    } else {
      socketService.socket.off('dm_thread_replies', handleThreadReplies);
      socketService.socket.off('dm_thread_reply_added', handleNewReply);
    }
  };

  const handleThreadReplies = (data) => {
    console.log('📨 Received thread replies:', data);
    console.log('📨 Parent message ID:', parentMessage.id);
    console.log('📨 Data message ID:', data.messageId || data.parentMessageId);
    console.log('📨 Replies count:', data.replies?.length);
    
    const dataMessageId = data.messageId || data.parentMessageId;
    if (dataMessageId === parentMessage.id) {
      console.log('✅ Setting replies:', data.replies);
      setReplies(data.replies);
      setLoading(false);
    } else {
      console.log('❌ Parent message ID mismatch');
    }
  };

  const handleNewReply = (reply) => {
    console.log('📨 New thread reply:', reply);
    if (reply.parentMessageId === parentMessage.id) {
      setReplies((prev) => [...prev, reply]);
    }
  };

  if (!parentMessage) return null;

  return (
    <div className="w-[500px] border-l border-gray-200 bg-white flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Thread</h2>
            {replies.length > 0 && (
              <p className="text-xs text-gray-500">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Parent Message - Compact View */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 mb-1 font-medium">Thread</div>
        <Message
          message={parentMessage}
          currentUserId={user?.id}
          isThread={false}
          hideThreadButton={true}
          compact={true}
        />
      </div>

      {/* Replies - Read Only */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading replies...</div>
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <MessageSquare size={48} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium">No replies yet</p>
            <p className="text-xs mt-1">Type in the message box below to reply</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 font-medium mb-2">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
            {replies.map((reply) => (
              <Message
                key={reply.id}
                message={reply}
                currentUserId={user?.id}
                isThread={true}
                hideThreadButton={true}
              />
            ))}
            <div ref={repliesEndRef} />
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          💬 Reply to this thread using the message box below
        </p>
      </div>
    </div>
  );
};

export default ThreadPanel;
