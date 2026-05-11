import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { store } from './redux/store';
import socketService from './services/socketService';
import notificationService from './services/notificationService';
import { addMessage, addDirectMessage, deleteMessage, deleteDirectMessage, setCurrentUserId } from './redux/slices/messageSlice';
import { addNotification } from './redux/slices/uiSlice';
import NotificationContainer from './components/common/NotificationContainer';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import ChannelPage from './pages/ChannelPage';
import DirectMessagePage from './pages/DirectMessagePage';
import JoinWorkspacePage from './pages/JoinWorkspacePage';
import GmailPage from './pages/GmailPage';
import CalendarPage from './pages/CalendarPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      // Set current user ID for unread count logic
      dispatch(setCurrentUserId(user.id));
      
      // Set the Redux store in socket service
      socketService.setStore(store);
      
      // Request notification permission
      notificationService.requestPermission();

      // Connect socket
      const socket = socketService.connect(token);
      
      if (!socket) {
        console.error('Failed to connect socket - no token');
        return;
      }

      // Enhanced socket event handlers with error handling
      socketService.on('connect', () => {
        console.log('✅ Socket connected successfully');
      });

      socketService.on('newMessage', (message) => {
        console.log('📨 New message received:', message);
        // Socket service now handles this automatically
      });

      socketService.on('newDirectMessage', (message) => {
        console.log('📨 New direct message received:', message);
        // Socket service now handles this automatically
      });

      socketService.on('messageDeleted', (data) => {
        console.log('🗑️ Message deleted:', data);
        try {
          dispatch(deleteMessage(data));
        } catch (error) {
          console.error('❌ Error handling message deletion:', error);
        }
      });

      socketService.on('directMessageDeleted', (data) => {
        console.log('🗑️ Direct message deleted:', data);
        try {
          dispatch(deleteDirectMessage(data));
        } catch (error) {
          console.error('❌ Error handling direct message deletion:', error);
        }
      });

      socketService.on('error', (error) => {
        console.error('❌ Socket error:', error);
        
        // Check if it's an authentication error
        if (error.message && error.message.includes('User not found')) {
          console.error('❌ Authentication error - logging out');
          dispatch(addNotification({
            type: 'error',
            message: 'Session expired. Please log in again.',
          }));
          // Don't auto-logout here, let user see the error
        } else {
          dispatch(addNotification({
            type: 'error',
            message: 'Connection error. Trying to reconnect...',
          }));
        }
      });

      socketService.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected the client, try to reconnect
          socketService.connect(token);
        }
      });

      // Handle reconnection
      socketService.socket?.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        dispatch(addNotification({
          type: 'success',
          message: 'Reconnected successfully!',
        }));
      });

      socketService.socket?.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
      });

      socketService.socket?.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed');
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to reconnect. Please refresh the page.',
        }));
      });

      // Cleanup
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, user, dispatch]);

  return (
    <div className="App">
      {/* Notification Container */}
      <NotificationContainer />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/join-workspace"
          element={
            <PublicRoute>
              <JoinWorkspacePage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId/channel/:channelId"
          element={
            <ProtectedRoute>
              <ChannelPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId/dm/:conversationId"
          element={
            <ProtectedRoute>
              <DirectMessagePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId/gmail"
          element={
            <ProtectedRoute>
              <GmailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;