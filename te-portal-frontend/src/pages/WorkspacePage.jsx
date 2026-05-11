import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setCurrentWorkspace } from '../redux/slices/workspaceSlice';
import { fetchChannels, clearChannels } from '../redux/slices/channelSlice';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import Loader from '../components/common/Loader';

import TopBar from '../components/layout/TopBar';

const WorkspacePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const { workspaces, currentWorkspace, loading } = useSelector(
    (state) => state.workspace
  );

  useEffect(() => {
    const workspace = workspaces.find(w => w.id === parseInt(workspaceId));

    if (workspace) {
      dispatch(setCurrentWorkspace(workspace));
      
      dispatch(clearChannels());
      dispatch(fetchChannels(workspace.id));
    } else if (!loading && workspaces.length > 0) {
      
      navigate(`/workspace/${workspaces[0].id}`);
    }
  }, [workspaceId, workspaces, dispatch, navigate, loading]);

  if (loading || !currentWorkspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader size="lg" text="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {}
      <Sidebar />

      {}
      <div className="flex-1 flex flex-col overflow-hidden">
        {}
        <TopBar />

        {}
        <ChatArea />
      </div>
    </div>
  );
};

export default WorkspacePage;