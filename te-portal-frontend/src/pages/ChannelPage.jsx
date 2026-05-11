import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setCurrentChannel, fetchChannels } from '../redux/slices/channelSlice';
import { fetchChannelMessages, setCurrentChannelId } from '../redux/slices/messageSlice';
import socketService from '../services/socketService';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import Loader from '../components/common/Loader';
import TopBar from '../components/layout/TopBar';
import NavigationRail from '../components/layout/NavigationRail';

const ChannelPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaceId, channelId } = useParams();

  const { channels, currentChannel, loading: channelLoading } = useSelector(
    (state) => state.channel
  );
  const { currentWorkspace } = useSelector((state) => state.workspace);

  // Fetch channels if not loaded
  useEffect(() => {
    if (workspaceId && channels.length === 0) {
      console.log('📂 Fetching channels for workspace:', workspaceId);
      dispatch(fetchChannels(parseInt(workspaceId)));
    }
  }, [workspaceId, channels.length, dispatch]);

  useEffect(() => {
    const channel = channels.find(c => c.id === parseInt(channelId));

    if (channel && currentWorkspace) {
      
      dispatch(setCurrentChannel(channel));
      
      // Set current channel ID in message slice
      dispatch(setCurrentChannelId(channel.id));

      
      socketService.joinChannel(channel.id, currentWorkspace.id);

  
      dispatch(fetchChannelMessages({
        workspaceId: currentWorkspace.id,
        channelId: channel.id
      }));
    } else if (!channelLoading && channels.length > 0) {
      
      navigate(`/workspace/${workspaceId}/channel/${channels[0].id}`);
    }


    return () => {
      if (channel) {
        socketService.leaveChannel(channel.id);
      }
    };
  }, [channelId, channels, currentWorkspace, dispatch, navigate, channelLoading, workspaceId]);

  if (channelLoading || !currentChannel) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader size="lg" text="Loading channel..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {}
      <TopBar />

      {}
      <div className="flex-1 flex overflow-hidden">
        {}
        <NavigationRail />

        {}
        <Sidebar />

        {}
        <ChatArea />
      </div>
    </div>
  );
};

export default ChannelPage;