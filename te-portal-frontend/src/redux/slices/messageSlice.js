import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as messageApi from '../../api/messageApi';

export const fetchChannelMessages = createAsyncThunk(
  'message/fetchChannelMessages',
  async ({ workspaceId, channelId }, { getState, rejectWithValue }) => {
    try {
      console.log('📥 Fetching channel messages:', { workspaceId, channelId });
      const { auth } = getState();
      const response = await messageApi.getChannelMessages(auth.token, workspaceId, channelId);
      console.log('✅ Fetched', response.data?.length || 0, 'channel messages');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch channel messages:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const fetchDirectConversations = createAsyncThunk(
  'message/fetchDirectConversations',
  async (workspaceId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await messageApi.getDirectConversations(auth.token, workspaceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchDirectMessages = createAsyncThunk(
  'message/fetchDirectMessages',
  async ({ workspaceId, conversationId }, { getState, rejectWithValue }) => {
    try {
      console.log('📥 Fetching direct messages:', { workspaceId, conversationId });
      const { auth } = getState();
      const response = await messageApi.getConversationMessages(auth.token, workspaceId, conversationId);
      console.log('✅ Fetched direct messages:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch direct messages:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch direct messages');
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    // Store messages by channelId: { [channelId]: [messages] }
    messagesByChannel: {},
    // Store messages by conversationId: { [conversationId]: [messages] }
    messagesByConversation: {},
    directConversations: [],
    currentConversation: null,
    editingMessage: null,
    loading: false,
    error: null,
    
    unreadCounts: {}, 
    unreadDMCounts: {}, 
    lastReadTimestamps: {}, 
    currentUserId: null,
    
    // Keep track of current channel/conversation for backwards compatibility
    currentChannelId: null,
    currentConversationId: null,
  },
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      state.currentConversationId = action.payload?.id || null;
    },
    setCurrentChannelId: (state, action) => {
      state.currentChannelId = action.payload;
    },
    setEditingMessage: (state, action) => {
      state.editingMessage = action.payload;
    },
    clearEditingMessage: (state) => {
      state.editingMessage = null;
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const channelId = message.channelId;
      
      // Initialize array if it doesn't exist
      if (!state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = [];
      }
      
      // Add message if it doesn't already exist
      const exists = state.messagesByChannel[channelId].some(m => m.id === message.id);
      if (!exists) {
        state.messagesByChannel[channelId].push(message);
      }
      
      // Update unread count
      if (message.senderId !== state.currentUserId && channelId !== state.currentChannelId) {
        state.unreadCounts[channelId] = (state.unreadCounts[channelId] || 0) + 1;
      }
    },
    
    updateMessage: (state, action) => {
      const { messageId, ...updates } = action.payload;
      
      // Search through all channels
      for (const channelId in state.messagesByChannel) {
        const message = state.messagesByChannel[channelId].find(m => m.id === messageId);
        if (message) {
          Object.assign(message, updates);
          break;
        }
      }
    },

    updateDirectMessage: (state, action) => {
      const { messageId, ...updates } = action.payload;
      
      // Search through all conversations
      for (const conversationId in state.messagesByConversation) {
        const message = state.messagesByConversation[conversationId].find(m => m.id === messageId);
        if (message) {
          Object.assign(message, updates);
          break;
        }
      }
    },
    
    deleteMessage: (state, action) => {
      const { messageId } = action.payload;
      
      // Search through all channels
      for (const channelId in state.messagesByChannel) {
        state.messagesByChannel[channelId] = state.messagesByChannel[channelId].filter(m => m.id !== messageId);
      }
    },
    
    addReaction: (state, action) => {
      const { messageId, userId, emoji, reactionId, user } = action.payload;
      
      // Create reaction object with user info
      const reactionData = { 
        id: reactionId, 
        userId, 
        emoji,
        user: user || { id: userId, name: 'Unknown User' }
      };
      
      // Search in channel messages
      for (const channelId in state.messagesByChannel) {
        const message = state.messagesByChannel[channelId].find(m => m.id === messageId);
        if (message) {
          if (!message.reactions) {
            message.reactions = [];
          }
          // Check if reaction already exists to prevent duplicates
          const exists = message.reactions.some(r => r.id === reactionId);
          if (!exists) {
            message.reactions.push(reactionData);
          }
          return;
        }
      }
      
      // Search in direct messages
      for (const conversationId in state.messagesByConversation) {
        const message = state.messagesByConversation[conversationId].find(m => m.id === messageId);
        if (message) {
          if (!message.reactions) {
            message.reactions = [];
          }
          // Check if reaction already exists to prevent duplicates
          const exists = message.reactions.some(r => r.id === reactionId);
          if (!exists) {
            message.reactions.push(reactionData);
          }
          return;
        }
      }
    },
    
    removeReaction: (state, action) => {
      const { messageId, reactionId } = action.payload;
      
      // Search in channel messages
      for (const channelId in state.messagesByChannel) {
        const message = state.messagesByChannel[channelId].find(m => m.id === messageId);
        if (message && message.reactions) {
          message.reactions = message.reactions.filter(r => r.id !== reactionId);
          return;
        }
      }
      
      // Search in direct messages
      for (const conversationId in state.messagesByConversation) {
        const message = state.messagesByConversation[conversationId].find(m => m.id === messageId);
        if (message && message.reactions) {
          message.reactions = message.reactions.filter(r => r.id !== reactionId);
          return;
        }
      }
    },
    
    addDirectMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      
      // Initialize array if it doesn't exist
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      
      // Add message if it doesn't already exist
      const exists = state.messagesByConversation[conversationId].some(m => m.id === message.id);
      if (!exists) {
        state.messagesByConversation[conversationId].push(message);
      }
      
      // Update unread count
      if (message.senderId !== state.currentUserId && conversationId !== state.currentConversationId) {
        state.unreadDMCounts[conversationId] = (state.unreadDMCounts[conversationId] || 0) + 1;
      }
    },

    deleteDirectMessage: (state, action) => {
      const { messageId } = action.payload;
      
      // Search through all conversations
      for (const conversationId in state.messagesByConversation) {
        state.messagesByConversation[conversationId] = state.messagesByConversation[conversationId].filter(m => m.id !== messageId);
      }
    },
    

    markChannelAsRead: (state, action) => {
      const channelId = action.payload;
      state.unreadCounts[channelId] = 0;
      state.lastReadTimestamps[channelId] = Date.now();
    },
    
    
    markDMAsRead: (state, action) => {
      const conversationId = action.payload;
      state.unreadDMCounts[conversationId] = 0;
    },
    
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    
    clearMessages: (state) => {
      state.messagesByChannel = {};
    },
    
    clearDirectMessages: (state) => {
      state.messagesByConversation = {};
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
    
      .addCase(fetchChannelMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('⏳ Loading channel messages...');
      })
      .addCase(fetchChannelMessages.fulfilled, (state, action) => {
        state.loading = false;
        const messages = Array.isArray(action.payload) ? action.payload : [];
        
        // Extract channelId from the first message or from the action meta
        if (messages.length > 0) {
          const channelId = messages[0].channelId;
          state.messagesByChannel[channelId] = messages;
          state.currentChannelId = channelId;
          console.log('✅ Channel messages loaded for channel', channelId, ':', messages.length);
        } else {
          // If no messages, we need to get channelId from the action meta
          const channelId = action.meta.arg.channelId;
          state.messagesByChannel[channelId] = [];
          state.currentChannelId = channelId;
          console.log('✅ No messages for channel', channelId);
        }
      })
      .addCase(fetchChannelMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('❌ Failed to load channel messages:', action.payload);
      })
      
      .addCase(fetchDirectMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('⏳ Loading direct messages...');
      })
      .addCase(fetchDirectMessages.fulfilled, (state, action) => {
        state.loading = false;
        const messages = action.payload.messages || [];
        const conversationId = action.payload.conversationId;
        
        if (conversationId) {
          state.messagesByConversation[conversationId] = messages;
          state.currentConversationId = conversationId;
          console.log('✅ Direct messages loaded for conversation', conversationId, ':', messages.length);
          
          state.currentConversation = {
            id: conversationId,
            userOneId: action.payload.userOneId,
            userTwoId: action.payload.userTwoId,
            userOne: action.payload.userOne,
            userTwo: action.payload.userTwo,
          };
        }
      })
      .addCase(fetchDirectMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('❌ Failed to load direct messages:', action.payload);
      })
      
      .addCase(fetchDirectConversations.fulfilled, (state, action) => {
        state.directConversations = action.payload;
      });
  }
});

export const { 
  addMessage, 
  updateMessage,
  updateDirectMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  addDirectMessage,
  deleteDirectMessage,
  clearMessages, 
  clearDirectMessages, 
  clearError,
  markChannelAsRead,
  markDMAsRead,
  setCurrentConversation,
  setCurrentChannelId,
  setCurrentUserId,
  setEditingMessage,
  clearEditingMessage
} = messageSlice.actions;

export default messageSlice.reducer;
