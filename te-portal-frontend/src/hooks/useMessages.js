import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage } from '../redux/slices/messageSlice';
import socketService from '../services/socketService';

export const useMessages = () => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.message);
  const { currentChannel } = useSelector((state) => state.channel);

  useEffect(() => {
    
    const handleNewMessage = (message) => {
      dispatch(addMessage(message));
    };

    socketService.on('newMessage', handleNewMessage);

    return () => {
      
      socketService.socket?.off('new_message', handleNewMessage);
    };
  }, [dispatch]);

  const sendMessage = (content) => {
    if (!currentChannel || !content.trim()) return;
    socketService.sendMessage(currentChannel.id, content);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
};
