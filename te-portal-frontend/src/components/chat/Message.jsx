import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, Edit3, Smile, MessageSquare, Share2, MoreVertical } from 'lucide-react';
import Avatar from '../common/Avatar';
import socketService from '../../services/socketService';
import { setEditingMessage } from '../../redux/slices/messageSlice';
import { getImageUrl } from '../../utils/imageUtils';
import UserProfileModal from '../common/UserProfileModal';
import { getUserProfile } from '../../api/userApi';
import MessageReactions from './MessageReactions';
import EmailMessage from './EmailMessage';
import MeetingInvitationMessage from './MeetingInvitationMessage';

const Message = ({ message, onReply, compact = false }) => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [showActions, setShowActions] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [localReactions, setLocalReactions] = useState(message.reactions || []);
  const isOwnMessage = message.senderId === user?.id;

  // Real-time reaction subscription for this specific message
  useEffect(() => {
    // Initialize local reactions from props
    setLocalReactions(message.reactions || []);

    // Set up real-time listeners for this message's reactions
    const handleReactionAdded = (data) => {
      console.log('👍 Message component received reaction_added:', data, 'for messageId:', message.id);
      if (data.messageId === message.id) {
        console.log('✅ Updating local reactions for message:', message.id);
        setLocalReactions((prev) => {
          // Check if reaction already exists (prevent duplicates)
          const exists = prev.some(r => r.id === data.reactionId);
          if (exists) {
            console.log('⚠️ Reaction already exists, skipping');
            return prev;
          }
          
          const newReaction = {
            id: data.reactionId,
            emoji: data.emoji,
            userId: data.userId,
            user: data.user
          };
          console.log('➕ Adding new reaction:', newReaction);
          return [...prev, newReaction];
        });
      }
    };

    const handleReactionRemoved = (data) => {
      console.log('👎 Message component received reaction_removed:', data, 'for messageId:', message.id);
      if (data.messageId === message.id) {
        console.log('✅ Removing reaction from local state for message:', message.id);
        setLocalReactions((prev) => {
          const filtered = prev.filter(r => r.id !== data.reactionId);
          console.log('➖ Filtered reactions:', filtered);
          return filtered;
        });
      }
    };

    // Subscribe to socket events
    if (socketService.socket) {
      socketService.socket.on('reaction_added', handleReactionAdded);
      socketService.socket.on('reaction_removed', handleReactionRemoved);
      console.log('🔌 Subscribed to reaction events for message:', message.id);
    }

    // Cleanup on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('reaction_added', handleReactionAdded);
        socketService.socket.off('reaction_removed', handleReactionRemoved);
        console.log('🔌 Unsubscribed from reaction events for message:', message.id);
      }
    };
  }, [message.id, message.reactions]);

  // Update local reactions when message prop changes (e.g., on channel switch)
  useEffect(() => {
    setLocalReactions(message.reactions || []);
  }, [message.reactions]);

  // If this is an email message, render EmailMessage component
  if (message.messageType === 'email') {
    return <EmailMessage message={message} onReply={onReply} compact={compact} />;
  }

  // If this is a meeting invitation, render MeetingInvitationMessage component
  if (message.messageType === 'meeting_invitation') {
    return <MeetingInvitationMessage message={message} compact={compact} />;
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewProfile = async () => {
    if (loadingProfile) return;
    
    setLoadingProfile(true);
    try {
      const response = await getUserProfile(token, message.senderId);
      if (response.data.success) {
        setProfileUser(response.data.user);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleDeleteMessage = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      // Check if it's a direct message or channel message
      if (message.conversationId) {
        socketService.deleteDirectMessage(message.id, message.conversationId);
      } else if (message.channelId) {
        socketService.deleteMessage(message.id, message.channelId);
      }
    }
  };

  const handleEditMessage = () => {
    // Set the message to be edited in Redux state
    dispatch(setEditingMessage(message));
    setShowActions(false);
    setShowMoreMenu(false);
  };

  const handleReplyInThread = () => {
    // Open thread panel with this message as parent
    if (onReply) {
      onReply(message);
    }
    // TODO: Integrate with ThreadPanel component
    console.log('Opening thread for message:', message.id);
    setShowActions(false);
  };

  const handleAddReaction = (emoji) => {
    // Add reaction via socket
    const isChannel = !!message.channelId;
    
    if (isChannel) {
      // For channel messages
      socketService.socket?.emit('add_reaction', {
        messageId: message.id,
        emoji: emoji
      });
    } else {
      // For direct messages
      socketService.socket?.emit('add_dm_reaction', {
        messageId: message.id,
        emoji: emoji
      });
    }
    
    console.log('Added reaction:', emoji, 'to message:', message.id);
    setShowEmojiPicker(false);
    setShowActions(false);
  };

  const handleForwardMessage = () => {
    // TODO: Open forward modal to select recipient
    alert('Forward functionality coming soon! You can forward this message to another channel or user.');
    console.log('Forward message:', message.id, 'Content:', message.content);
    setShowActions(false);
  };

  const handleRemoveReaction = (reactionId) => {
    const isChannel = !!message.channelId;
    
    if (isChannel) {
      socketService.socket?.emit('remove_reaction', {
        reactionId: reactionId,
        messageId: message.id
      });
    } else {
      socketService.socket?.emit('remove_dm_reaction', {
        reactionId: reactionId,
        messageId: message.id
      });
    }
    
    console.log('Removed reaction:', reactionId);
  };

  const senderName = isOwnMessage ? user?.name : (message.User?.name || message.senderName || `User ${message.senderId}`);
  const senderImage = isOwnMessage ? user?.image : (message.User?.image || message.senderImage);

  // Function to render message content with highlighted mentions
  const renderMessageContent = (content) => {
    if (!content) return null;
    
    // Regex to match @mentions (e.g., @JohnDoe, @AbdulGhafoor)
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add highlighted mention
      parts.push(
        <span
          key={match.index}
          className="bg-blue-100 text-blue-700 px-1 rounded font-medium hover:bg-blue-200 cursor-pointer"
          title={`Mentioned: ${match[1]}`}
        >
          @{match[1]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      <div 
        className="flex gap-4 px-5 py-2 hover:bg-slate-50 transition-colors group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowMoreMenu(false);
          setShowEmojiPicker(false);
        }}
      >
        {/* Avatar - Clickable */}
        <div className="mt-0.5 cursor-pointer" onClick={handleViewProfile}>
          <Avatar
            src={senderImage || (isOwnMessage ? user?.image : null)}
            name={senderName}
            size="sm"
            online={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Sender name and time */}
          <div className="flex items-baseline gap-2 mb-0.5">
            <span 
              className="font-bold text-[15px] text-slate-900 hover:underline cursor-pointer"
              onClick={handleViewProfile}
            >
              {senderName}
            </span>
            <span className="text-[12px] text-slate-500 font-medium">
              {formatTime(message.createdAt)}
              {message.isEdited && (
                <span className="ml-1 text-[11px] text-slate-400">(edited)</span>
              )}
            </span>
          </div>

          {/* Message content */}
          <div className="text-[15px] text-slate-800 leading-normal">
            {message.content && (
              <p className="break-words whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
            )}

            {/* Render Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`${message.content ? 'mt-3' : ''} flex flex-wrap gap-2`}>
                {message.attachments.map((file, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group/file">
                    {file.mimetype?.startsWith('image/') ? (
                      <img
                        src={getImageUrl(file.url)}
                        alt={file.filename}
                        className="max-w-md max-h-[400px] rounded-md object-contain"
                        onClick={() => window.open(getImageUrl(file.url), '_blank')}
                      />
                    ) : (
                      <a
                        href={getImageUrl(file.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-1 text-slate-700 hover:text-blue-600 font-medium"
                      >
                        <div className="p-2 bg-slate-100 rounded group-hover/file:bg-blue-50 transition-colors">
                          <span className="text-xs uppercase font-bold text-slate-500">File</span>
                        </div>
                        <span className="text-sm">{file.filename}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Reactions */}
            <MessageReactions
              reactions={localReactions}
              currentUserId={user?.id}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />

            {/* Thread Reply Count */}
            {message.replyCount > 0 && (
              <button
                onClick={handleReplyInThread}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                <MessageSquare size={16} />
                <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hover Actions - Left side of message */}
        {showActions && (
          <div className="absolute -top-4 right-12 bg-white border border-slate-200 rounded-lg shadow-lg flex items-center z-10">
            {/* Emoji Reaction */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-slate-100 text-slate-600 hover:text-yellow-500 rounded-lg transition-colors"
                title="Add reaction"
              >
                <Smile size={18} />
              </button>
              
              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <div className="bg-white border border-slate-300 rounded-xl shadow-2xl p-3 w-[280px]">
                    <div className="text-xs font-semibold text-slate-600 mb-2 px-1">
                      Quick reactions
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {['👍', '❤️', '😂', '😮', '😢', '😭', '🙏', '🎉', '👏', '🔥', '✅', '👀', '💯', '🚀', '💪', '🤔', '😊', '🎊'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(emoji)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-blue-50 rounded-lg text-2xl transition-all hover:scale-110 active:scale-95"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply in Thread */}
            <button
              onClick={handleReplyInThread}
              className="p-2 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
              title="Reply in thread"
            >
              <MessageSquare size={18} />
            </button>

            {/* Forward Message */}
            <button
              onClick={handleForwardMessage}
              className="p-2 hover:bg-slate-100 text-slate-600 hover:text-green-600 rounded-lg transition-colors"
              title="Forward message"
            >
              <Share2 size={18} />
            </button>

            {/* More Options (Three dots) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                title="More actions"
              >
                <MoreVertical size={18} />
              </button>

              {/* More Menu Dropdown */}
              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px] z-50">
                  {isOwnMessage && (
                    <>
                      <button
                        onClick={handleEditMessage}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition text-sm text-slate-700"
                      >
                        <Edit3 size={16} />
                        <span>Edit message</span>
                      </button>
                      <button
                        onClick={handleDeleteMessage}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition text-sm text-red-600"
                      >
                        <Trash2 size={16} />
                        <span>Delete message</span>
                      </button>
                    </>
                  )}
                  {!isOwnMessage && (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      No actions available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfileModal && profileUser && (
        <UserProfileModal
          user={profileUser}
          onClose={() => {
            setShowProfileModal(false);
            setProfileUser(null);
          }}
        />
      )}
    </>
  );
};

export default Message;