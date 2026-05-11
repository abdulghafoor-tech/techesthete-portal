import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { addMessage } from '../redux/slices/messageSlice';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect socket
      socketService.connect(token);

      // Set up event listeners
      socketService.on('connect', () => {
        console.log('Socket connected');
      });

      socketService.on('newMessage', (message) => {
        dispatch(addMessage(message));
      });

      socketService.on('error', (error) => {
        console.error('Socket error:', error);
      });

      
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token, dispatch]);

  return {
    isConnected: socketService.isConnected(),
    socket: socketService.socket,
  };
};
