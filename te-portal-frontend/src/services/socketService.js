import io from 'socket.io-client';
import notificationService from './notificationService';
import { addNotification } from '../redux/slices/uiSlice';
import { 
  addMessage, 
  addDirectMessage, 
  markChannelAsRead, 
  markDMAsRead,
  addReaction,
  removeReaction,
  updateMessage,
  updateDirectMessage,
  fetchDirectConversations
} from '../redux/slices/messageSlice';
import { fetchChannels } from '../redux/slices/channelSlice';

// ✅ Use import.meta.env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  constructor() {
    this.socket = null;
    this.store = null; // Will be set when connecting
    this.currentChannelId = null;
    this.currentConversationId = null;
    this.onlineUsers = new Set(); // Track online users
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onNewMessage: null,
      onNewDirectMessage: null,
      onJoinedChannel: null,
      onError: null,
      onMessageDeleted: null,
      onDirectMessageDeleted: null,
      onUserOnline: null,
      onUserOffline: null,
    };
  }

  setStore(store) {
    this.store = store;
  }

  setCurrentChannel(channelId) {
    this.currentChannelId = channelId;
    if (channelId && this.store) {
      // Mark channel as read when switching to it
      this.store.dispatch(markChannelAsRead(channelId));
    }
  }

  setCurrentConversation(conversationId) {
    this.currentConversationId = conversationId;
    if (conversationId && this.store) {
      // Mark DM as read when switching to it
      this.store.dispatch(markDMAsRead(conversationId));
    }
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  connect(token) {
    if (!token) {
      console.error('❌ Cannot connect socket: No token provided');
      return null;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting socket with token...');
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('User not found') || error.message.includes('Authentication'))) {
        console.error('❌ Authentication failed - invalid or expired token');
        
        // Disconnect socket to prevent reconnection attempts
        if (this.socket) {
          this.socket.disconnect();
        }
        
        // Notify user
        if (this.store) {
          this.store.dispatch(addNotification({
            type: 'error',
            message: 'Session expired. Please log in again.',
            duration: 5000
          }));
        }
      }
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    // User presence events
    this.socket.on('user_online', (data) => {
      console.log('User came online:', data.userId);
      this.onlineUsers.add(data.userId);
      if (this.callbacks.onUserOnline) {
        this.callbacks.onUserOnline(data);
      }
    });

    this.socket.on('user_offline', (data) => {
      console.log('User went offline:', data.userId);
      this.onlineUsers.delete(data.userId);
      if (this.callbacks.onUserOffline) {
        this.callbacks.onUserOffline(data);
      }
    });

    this.socket.on('online_users', (data) => {
      console.log('Online users list:', data.users);
      this.onlineUsers = new Set(data.users);
    });

    this.socket.on('joined_channel', (data) => {
      console.log('Joined channel:', data.channelId);
      if (this.callbacks.onJoinedChannel) {
        this.callbacks.onJoinedChannel(data);
      }
    });

    this.socket.on('new_message', (message) => {
      console.log('New message received:', message);
      
      if (this.store) {
        const state = this.store.getState();
        const currentUser = state.auth.user;
        const currentWorkspace = state.workspace.currentWorkspace;
        const currentChannel = state.channel.currentChannel;
        
        // Add message to store
        this.store.dispatch(addMessage(message));
        
        // Show notification and increment unread count only if not from current user
        if (message.senderId !== currentUser?.id) {
          const isCurrentChannel = this.currentChannelId === message.channelId;
          
          if (!isCurrentChannel) {
            // Find the channel name from the message
            const channels = state.channel.channels || [];
            const messageChannel = channels.find(ch => ch.id === message.channelId);
            const channelName = messageChannel?.name || 'Channel';
            
            // Show browser notification
            notificationService.showMessageNotification(
              message.senderName || `User ${message.senderId}`,
              message.content,
              channelName,
              message.channelId,
              currentWorkspace?.id
            );
            
            // Show in-app notification
            this.store.dispatch(addNotification({
              type: 'info',
              message: message.content,
              senderName: message.senderName || `User ${message.senderId}`,
              channelName: channelName,
              duration: 4000
            }));
          }
        }
      }
      
      if (this.callbacks.onNewMessage) {
        this.callbacks.onNewMessage(message);
      }
    });

    // Message editing
    this.socket.on('message_edited', (data) => {
      console.log('Message edited:', data);
      if (this.store) {
        this.store.dispatch(updateMessage({ 
          messageId: data.messageId, 
          content: data.content, 
          isEdited: true 
        }));
      }
    });

    this.socket.on('direct_message_edited', (data) => {
      console.log('Direct message edited:', data);
      if (this.store) {
        this.store.dispatch(updateDirectMessage({ 
          messageId: data.messageId, 
          content: data.content, 
          isEdited: true 
        }));
      }
    });

    // Message deletion
    this.socket.on('message_deleted', (data) => {
      console.log('Message deleted:', data);
      if (this.callbacks.onMessageDeleted) {
        this.callbacks.onMessageDeleted(data);
      }
    });

    // Reactions
    this.socket.on('reaction_added', (data) => {
      console.log('👍 Reaction added event received:', data);
      if (this.store) {
        this.store.dispatch(addReaction({
          messageId: data.messageId,
          userId: data.userId,
          emoji: data.emoji,
          reactionId: data.reactionId,
          user: data.user
        }));
        console.log('✅ Reaction dispatched to Redux store');
      }
      if (this.callbacks.onReactionAdded) {
        this.callbacks.onReactionAdded(data);
      }
    });

    this.socket.on('reaction_removed', (data) => {
      console.log('👎 Reaction removed event received:', data);
      if (this.store) {
        this.store.dispatch(removeReaction({
          messageId: data.messageId,
          reactionId: data.reactionId
        }));
        console.log('✅ Reaction removal dispatched to Redux store');
      }
      if (this.callbacks.onReactionRemoved) {
        this.callbacks.onReactionRemoved(data);
      }
    });

    // Threads
    this.socket.on('thread_reply_added', (reply) => {
      console.log('Thread reply added:', reply);
      
      if (this.callbacks.onThreadReplyAdded) {
        this.callbacks.onThreadReplyAdded(reply);
      }
    });

    this.socket.on('message_thread_updated', (data) => {
      console.log('Message thread updated:', data);
      
      // Update parent message thread count in Redux
      if (this.store) {
        this.store.dispatch(updateMessage({
          messageId: data.messageId,
          replyCount: data.replyCount || data.threadReplyCount || 0,
          threadReplyCount: data.threadReplyCount,
          lastThreadReplyAt: data.lastThreadReplyAt
        }));
      }
    });

    // DM Threads
    this.socket.on('dm_thread_reply_added', (reply) => {
      console.log('DM thread reply added:', reply);
      
      if (this.callbacks.onDMThreadReplyAdded) {
        this.callbacks.onDMThreadReplyAdded(reply);
      }
    });

    this.socket.on('dm_message_thread_updated', (data) => {
      console.log('DM message thread updated:', data);
      
      // Update parent message thread count in Redux
      if (this.store) {
        this.store.dispatch(updateDirectMessage({
          messageId: data.messageId,
          replyCount: data.replyCount || 0
        }));
      }
    });

    this.socket.on('dm_thread_replies', (data) => {
      console.log('DM thread replies received:', data);
      
      if (this.callbacks.onDMThreadReplies) {
        this.callbacks.onDMThreadReplies(data);
      }
    });

    // Pinning
    this.socket.on('message_pinned', (data) => {
      console.log('Message pinned:', data);
      if (this.callbacks.onMessagePinned) {
        this.callbacks.onMessagePinned(data);
      }
    });

    this.socket.on('message_unpinned', (data) => {
      console.log('Message unpinned:', data);
      if (this.callbacks.onMessageUnpinned) {
        this.callbacks.onMessageUnpinned(data);
      }
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      if (this.callbacks.onUserTyping) {
        this.callbacks.onUserTyping(data);
      }
    });

    this.socket.on('user_stopped_typing', (data) => {
      if (this.callbacks.onUserStoppedTyping) {
        this.callbacks.onUserStoppedTyping(data);
      }
    });

    this.socket.on('joined-conversation', (data) => {
      console.log('Joined conversation:', data.conversationId);
    });

    this.socket.on('new_direct_message', (message) => {
      console.log('📨 New direct message received:', message);
      console.log('📨 Sender name from message:', message.senderName);
      console.log('📨 Sender ID from message:', message.senderId);
      console.log('📨 Full message object:', JSON.stringify(message, null, 2));
      
      if (this.store) {
        const state = this.store.getState();
        const currentUser = state.auth.user;
        const currentWorkspace = state.workspace.currentWorkspace;
        
        // Add message to store
        this.store.dispatch(addDirectMessage(message));
        
        // Show notification and increment unread count only if not from current user
        if (message.senderId !== currentUser?.id) {
          const isCurrentConversation = this.currentConversationId === message.conversationId;
          
          if (!isCurrentConversation) {
            console.log('🔔 Showing notification for sender:', message.senderName);
            
            // Show browser notification
            notificationService.showDMNotification(
              message.senderName || `User ${message.senderId}`,
              message.content,
              message.conversationId,
              currentWorkspace?.id,
              message.senderImage
            );
            
            // Show in-app notification
            this.store.dispatch(addNotification({
              type: 'info',
              message: message.content,
              senderName: message.senderName || `User ${message.senderId}`,
              duration: 4000
            }));
          }
        }
      }
      
      if (this.callbacks.onNewDirectMessage) {
        this.callbacks.onNewDirectMessage(message);
      }
    });

    // Handle new conversation notification
    this.socket.on('new_conversation', (data) => {
      console.log('📢 New conversation notification received:', data);
      
      if (this.store) {
        const state = this.store.getState();
        const currentWorkspace = state.workspace.currentWorkspace;
        
        // Refresh conversations list for the current workspace
        if (currentWorkspace?.id) {
          this.store.dispatch(fetchDirectConversations(currentWorkspace.id));
          console.log('✅ Refreshed conversations list');
        }
        
        // Show notification about new conversation
        if (data.message) {
          this.store.dispatch(addNotification({
            type: 'info',
            message: `New message from ${data.message.senderName}`,
            duration: 4000
          }));
        }
      }
    });

    // Handle new channel notification
    this.socket.on('channel_created', (data) => {
      console.log('📢 New channel notification received:', data);
      
      if (this.store) {
        const state = this.store.getState();
        const currentWorkspace = state.workspace.currentWorkspace;
        
        // Refresh channels list if it's for the current workspace
        if (currentWorkspace?.id === data.workspaceId) {
          this.store.dispatch(fetchChannels(data.workspaceId));
          console.log('✅ Refreshed channels list');
          
          // Show notification about new channel
          this.store.dispatch(addNotification({
            type: 'success',
            message: `New channel created: #${data.channel.name}`,
            duration: 4000
          }));
        }
      }
    });

    // Handle member added to channel notification
    this.socket.on('member_added_to_channel', (data) => {
      console.log('📢 Member added to channel notification received:', data);
      
      if (this.store) {
        const state = this.store.getState();
        const currentWorkspace = state.workspace.currentWorkspace;
        
        // Refresh channels list if it's for the current workspace
        if (currentWorkspace?.id === data.workspaceId) {
          this.store.dispatch(fetchChannels(data.workspaceId));
          console.log('✅ Refreshed channels list after being added');
          
          // Show notification about being added to channel
          this.store.dispatch(addNotification({
            type: 'success',
            message: `You were added to #${data.channel.name}`,
            duration: 4000
          }));
        }
      }
    });

    // Message deletion
    this.socket.on('message_deleted', (data) => {
      console.log('Message deleted:', data);
      if (this.callbacks.onMessageDeleted) {
        this.callbacks.onMessageDeleted(data);
      }
    });

    this.socket.on('direct_message_deleted', (data) => {
      console.log('Direct message deleted:', data);
      if (this.callbacks.onDirectMessageDeleted) {
        this.callbacks.onDirectMessageDeleted(data);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      
      // Show user-friendly error notification
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: error.message || 'Connection error occurred',
          duration: 5000
        }));
      }
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.socket.on('join-error', (error) => {
      console.error('Join error:', error);
      
      // Show user-friendly error notification
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: error.message || 'Failed to join conversation',
          duration: 5000
        }));
      }
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
  }

  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
    }
  }

  joinChannel(channelId, workspaceId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Joining channel:', channelId);
    this.setCurrentChannel(channelId);
    this.socket.emit('join_channel', { channelId, workspaceId });
  }

  leaveChannel(channelId) {
    if (!this.socket) return;
    console.log('Leaving channel:', channelId);
    this.socket.emit('leave_channel', { channelId });
  }

  sendMessage(channelId, content, attachments = []) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Connection error. Please refresh the page.',
          duration: 5000
        }));
      }
      return;
    }
    
    if (!this.socket.connected) {
      console.error('❌ Socket is not connected');
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Not connected to server. Please check your connection.',
          duration: 5000
        }));
      }
      return;
    }
    
    console.log('📤 Sending message to channel:', {
      channelId,
      contentLength: content?.length || 0,
      attachmentsCount: attachments.length,
      socketId: this.socket.id
    });
    
    try {
      this.socket.emit('send_message', { channelId, content, attachments });
      console.log('✅ Message emitted successfully');
    } catch (error) {
      console.error('❌ Error emitting message:', error);
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Failed to send message. Please try again.',
          duration: 5000
        }));
      }
    }
  }

  joinConversation(conversationId, workspaceId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Joining conversation:', conversationId);
    this.setCurrentConversation(conversationId);
    this.socket.emit('join-conversation', { conversationId, workspaceId });
  }

  leaveConversation(conversationId) {
    if (!this.socket) return;
    console.log('Leaving conversation:', conversationId);
    this.socket.emit('leave-conversation', { conversationId });
  }

  sendDirectMessage(conversationId, content, attachments = []) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Connection error. Please refresh the page.',
          duration: 5000
        }));
      }
      return;
    }
    
    if (!this.socket.connected) {
      console.error('❌ Socket is not connected. Status:', this.socket.connected);
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Not connected to server. Please check your connection.',
          duration: 5000
        }));
      }
      return;
    }
    
    console.log('📤 Sending direct message:', {
      conversationId,
      contentLength: content?.length || 0,
      attachmentsCount: attachments.length,
      socketId: this.socket.id,
      connected: this.socket.connected
    });
    
    try {
      this.socket.emit('send-direct-message', { conversationId, content, attachments });
      console.log('✅ Message emitted successfully');
    } catch (error) {
      console.error('❌ Error emitting message:', error);
      if (this.store) {
        this.store.dispatch(addNotification({
          type: 'error',
          message: 'Failed to send message. Please try again.',
          duration: 5000
        }));
      }
    }
  }

  // Typing indicators for channels
  emitTypingStart(channelId) {
    if (!this.socket) return;
    this.socket.emit('typing_start', { channelId });
  }

  emitTypingStop(channelId) {
    if (!this.socket) return;
    this.socket.emit('typing_stop', { channelId });
  }

  // Typing indicators for direct messages
  emitDMTypingStart(conversationId) {
    if (!this.socket) return;
    this.socket.emit('dm_typing_start', { conversationId });
  }

  emitDMTypingStop(conversationId) {
    if (!this.socket) return;
    this.socket.emit('dm_typing_stop', { conversationId });
  }

  editMessage(messageId, content) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Editing channel message:', messageId);
    this.socket.emit('edit_message', { messageId, content });
  }

  editDirectMessage(messageId, content) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Editing direct message:', messageId);
    this.socket.emit('edit-direct-message', { messageId, content });
  }

  deleteMessage(messageId, channelId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Deleting channel message:', messageId);
    this.socket.emit('delete_message', { messageId, channelId });
  }

  deleteDirectMessage(messageId, conversationId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('Deleting direct message:', messageId);
    this.socket.emit('delete-direct-message', { messageId, conversationId });
  }

  // ============================================================================
  // THREAD METHODS
  // ============================================================================

  getThreadReplies(messageId, isChannel = true) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    const eventName = isChannel ? 'get_thread_replies' : 'get_dm_thread_replies';
    console.log('📨 Getting thread replies for message:', messageId, 'isChannel:', isChannel);
    this.socket.emit(eventName, { messageId });
  }

  sendThreadReply(channelOrConversationId, parentMessageId, content, attachments = [], isChannel = true) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const eventName = isChannel ? 'send_thread_reply' : 'send_dm_thread_reply';
    const data = isChannel
      ? {
          channelId: channelOrConversationId,
          parentMessageId,
          content,
          attachments,
        }
      : {
          conversationId: channelOrConversationId,
          parentMessageId,
          content,
          attachments,
        };

    console.log('📨 Sending thread reply:', data);
    this.socket.emit(eventName, data);
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.onlineUsers.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
