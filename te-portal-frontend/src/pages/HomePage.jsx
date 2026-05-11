import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchWorkspaces } from '../redux/slices/workspaceSlice';
import { fetchChannels } from '../redux/slices/channelSlice';
import { addNotification } from '../redux/slices/uiSlice';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import Loader from '../components/common/Loader';

const HomePage = () => {
  const dispatch = useDispatch();
  const { workspaceId, channelId } = useParams();
  const [searchParams] = useSearchParams();
  
  const { currentWorkspace, loading: workspaceLoading } = useSelector(
    (state) => state.workspace
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Handle Gmail OAuth callback
  useEffect(() => {
    const gmailStatus = searchParams.get('gmail');
    if (gmailStatus === 'connected') {
      dispatch(addNotification({
        type: 'success',
        message: 'Gmail connected successfully!',
        duration: 5000
      }));
      // Remove query param from URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gmailStatus === 'error') {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to connect Gmail. Please try again.',
        duration: 5000
      }));
      // Remove query param from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, dispatch]);
  
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, isAuthenticated]);

  // Fetch channels when currentWorkspace changes OR when workspaceId from URL is available
  useEffect(() => {
    const effectiveWorkspaceId = workspaceId || currentWorkspace?.id;
    
    if (effectiveWorkspaceId) {
      console.log('📂 Fetching channels for workspace:', effectiveWorkspaceId);
      dispatch(fetchChannels(effectiveWorkspaceId));
    }
  }, [currentWorkspace, workspaceId, dispatch]);

  if (workspaceLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader size="lg" text="Loading your workspace..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default HomePage;