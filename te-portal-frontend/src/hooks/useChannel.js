import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchChannels,
  setCurrentChannel,
  createChannel as createChannelAction,
} from '../redux/slices/channelSlice';
import { fetchChannelMessages } from '../redux/slices/messageSlice';
import socketService from '../services/socketService';

export const useChannel = () => {
  const dispatch = useDispatch();
  const { channels, currentChannel, loading, error } = useSelector(
    (state) => state.channel
  );
  const { currentWorkspace } = useSelector((state) => state.workspace);

  useEffect(() => {
    if (currentWorkspace && channels.length === 0) {
      dispatch(fetchChannels(currentWorkspace.id));
    }
  }, [dispatch, currentWorkspace, channels.length]);

  const selectChannel = (channel) => {

    if (currentChannel) {
      socketService.leaveChannel(currentChannel.id);
    }

    
    dispatch(setCurrentChannel(channel));

    
    if (currentWorkspace) {
      socketService.joinChannel(channel.id, currentWorkspace.id);
      dispatch(fetchChannelMessages({
        workspaceId: currentWorkspace.id,
        channelId: channel.id,
      }));
    }
  };

  const createChannel = async (name, type) => {
    if (!currentWorkspace) return;
    
    return await dispatch(createChannelAction({
      workspaceId: currentWorkspace.id,
      name,
      type,
    }));
  };

  return {
    channels,
    currentChannel,
    loading,
    error,
    selectChannel,
    createChannel,
  };
};
