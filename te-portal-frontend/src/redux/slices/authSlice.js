import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import { saveToStorage, getFromStorage, removeFromStorage } from '../../services/storageService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(email, password);
      if (response.data.success) {
        saveToStorage('token', response.data.token);
        saveToStorage('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue(response.data.msg || response.data.message);
    } catch (error) {
      // Backend sends 'msg' field for error messages
      return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      if (response.data.success) {
        // Email verification required - don't save token or auto-login
        return {
          success: true,
          message: response.data.message,
          user: response.data.user,
          requiresVerification: true,
          previewUrl: response.data.previewUrl // For testing with Ethereal
        };
      }
      return rejectWithValue('Registration failed');
    } catch (error) {
      if (error.response?.status === 409 || error.response?.status === 400) {
        return rejectWithValue(error.response?.data?.message || 'Registration failed');
      }
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await authApi.updateProfile(auth.token, userData);
      saveToStorage('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(getFromStorage('user')) || null,
    token: getFromStorage('token') || null,
    isAuthenticated: !!getFromStorage('token'),
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      removeFromStorage('token');
      removeFromStorage('user');
      removeFromStorage('currentWorkspace');
      removeFromStorage('channels');
      removeFromStorage('currentChannel');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Don't set user or token - email verification required
        // Keep user logged out until they verify email
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;