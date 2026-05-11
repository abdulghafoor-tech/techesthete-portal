import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDirectMessages } from '../redux/slices/messageSlice';
import { clearCurrentChannel, fetchChannels } from '../redux/slices/channelSlice';
import socketService from '../services/socketService';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import Loader from '../components/common/Loader';
import TopBar from '../components/layout/TopBar';
import NavigationRail from '../components/layout/NavigationRail';

const DirectMessagePage = () => {
  const dispatch = useDispatch();
  const { workspaceId, conversationId } = useParams();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { loading, currentConversation, messagesByConversation } = useSelector((state) => state.message);
  const { channels } = useSelector((state) => state.channel);

  // Fetch channels if not loaded
  useEffect(() => {
    if (workspaceId && channels.length === 0) {
      console.log('📂 Fetching channels for workspace:', workspaceId);
      dispatch(fetchChannels(parseInt(workspaceId)));
    }
  }, [workspaceId, channels.length, dispatch]);

  useEffect(() => {
  
    dispatch(clearCurrentChannel());

    if (workspaceId && conversationId) {
      // Join conversation via socket
      socketService.joinConversation(conversationId, workspaceId);

      // Fetch messages
      dispatch(fetchDirectMessages({
        workspaceId,
        conversationId
      }));
    }

    
    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, workspaceId, dispatch]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader size="lg" text="Loading conversation..." />
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

export default DirectMessagePage;