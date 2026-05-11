import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as workspaceApi from '../../api/workspaceApi';
import { saveToStorage, getFromStorage } from '../../services/storageService';


export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await workspaceApi.getWorkspaces(auth.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/create',
  async (name, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await workspaceApi.createWorkspace(auth.token, name);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
    }
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspace/delete',
  async (workspaceId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await workspaceApi.deleteWorkspace(auth.token, workspaceId);
      return workspaceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workspace');
    }
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspace/update',
  async ({ workspaceId, data }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await workspaceApi.updateWorkspace(auth.token, workspaceId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workspace');
    }
  }
);

const workspaceSlice = createSlice({ 
  name: 'workspace',
  initialState: {
    workspaces: [],
    currentWorkspace: JSON.parse(getFromStorage('currentWorkspace')) || null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
      saveToStorage('currentWorkspace', JSON.stringify(action.payload));
      // Clear channels when switching workspace
      localStorage.removeItem('channels');
      localStorage.removeItem('currentChannel');
    },
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      localStorage.removeItem('currentWorkspace');
      localStorage.removeItem('channels');
      localStorage.removeItem('currentChannel');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch workspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
        if (action.payload.length > 0 && !state.currentWorkspace) {
          state.currentWorkspace = action.payload[0];
          saveToStorage('currentWorkspace', JSON.stringify(action.payload[0]));
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create workspace
      .addCase(createWorkspace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces.push(action.payload.newWorkspace);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete workspace
      .addCase(deleteWorkspace.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = state.workspaces.filter(w => w.id !== action.payload);
        if (state.currentWorkspace?.id === action.payload) {
          state.currentWorkspace = state.workspaces[0] || null;
          if (state.currentWorkspace) {
            saveToStorage('currentWorkspace', JSON.stringify(state.currentWorkspace));
          } else {
            localStorage.removeItem('currentWorkspace');
          }
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; 
      })
      // Update workspace
      .addCase(updateWorkspace.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        // Update in workspaces list
        const index = state.workspaces.findIndex(w => w.id === action.payload.workspace.id);
        if (index !== -1) {
          state.workspaces[index] = action.payload.workspace;
        }
        // Update current workspace if it's the one being updated
        if (state.currentWorkspace?.id === action.payload.workspace.id) {
          state.currentWorkspace = action.payload.workspace;
          saveToStorage('currentWorkspace', JSON.stringify(action.payload.workspace));
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setCurrentWorkspace, clearCurrentWorkspace, clearError } = workspaceSlice.actions;
export default workspaceSlice.reducer;