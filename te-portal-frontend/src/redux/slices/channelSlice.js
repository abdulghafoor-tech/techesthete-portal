import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as channelApi from '../../api/channelApi';
import { getObjectFromStorage, saveObjectToStorage, removeFromStorage } from '../../services/storageService';

// Storage keys
const CHANNELS_KEY = 'channels';
const CURRENT_CHANNEL_KEY = 'currentChannel';

export const fetchChannels = createAsyncThunk(
  'channel/fetchAll',
  async (workspaceId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await channelApi.getChannels(auth.token, workspaceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channels');
    }
  }
);

export const createChannel = createAsyncThunk(
  'channel/create',
  async ({ workspaceId, name, type, members = [] }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await channelApi.createChannel(auth.token, workspaceId, name, type, members);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create channel');
    }
  }
);

export const deleteChannel = createAsyncThunk(
  'channel/delete',
  async ({ workspaceId, channelId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await channelApi.deleteChannel(auth.token, workspaceId, channelId);
      return channelId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete channel');
    }
  }
);

export const updateChannel = createAsyncThunk(
  'channel/update',
  async ({ workspaceId, channelId, name }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await channelApi.updateChannel(auth.token, workspaceId, channelId, name);
      return { channelId, name };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update channel');
    }
  }
);

const channelSlice = createSlice({
  name: 'channel',
  initialState: {
    channels: getObjectFromStorage(CHANNELS_KEY) || [],
    currentChannel: getObjectFromStorage(CURRENT_CHANNEL_KEY) || null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
      saveObjectToStorage(CURRENT_CHANNEL_KEY, action.payload);
    },
    clearCurrentChannel: (state) => {
      state.currentChannel = null;
      removeFromStorage(CURRENT_CHANNEL_KEY);
    },
    clearChannels: (state) => {
      state.channels = [];
      state.currentChannel = null;
      removeFromStorage(CHANNELS_KEY);
      removeFromStorage(CURRENT_CHANNEL_KEY);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload;
        saveObjectToStorage(CHANNELS_KEY, action.payload);
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(createChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.loading = false;
        state.channels.push(action.payload);
        saveObjectToStorage(CHANNELS_KEY, state.channels);
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== action.payload);
        saveObjectToStorage(CHANNELS_KEY, state.channels);
        if (state.currentChannel?.id === action.payload) {
          state.currentChannel = null;
          removeFromStorage(CURRENT_CHANNEL_KEY);
        }
      })
      
      .addCase(updateChannel.fulfilled, (state, action) => {
        const channel = state.channels.find(c => c.id === action.payload.channelId);
        if (channel) {
          channel.name = action.payload.name;
        }
        if (state.currentChannel?.id === action.payload.channelId) {
          state.currentChannel.name = action.payload.name;
          saveObjectToStorage(CURRENT_CHANNEL_KEY, state.currentChannel);
        }
        saveObjectToStorage(CHANNELS_KEY, state.channels);
      });
  }
});

export const { setCurrentChannel, clearCurrentChannel, clearChannels, clearError } = channelSlice.actions;
export default channelSlice.reducer;