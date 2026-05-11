import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import CreateDirectMessageModal from '../chat/CreateDirectMessageModal';
import { fetchDirectConversations, setCurrentConversation } from '../../redux/slices/messageSlice';
import { getWorkspaceUsers } from '../../api/userApi';
import socketService from '../../services/socketService';
import apiClient from '../../api/index';
import { SOCKET_URL } from '../../utils/constants';

const DirectMessageSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { workspaceId: urlWorkspaceId, conversationId } = useParams();
  const { token, user: currentUser } = useSelector(state => state.auth);
  const { directConversations, unreadDMCounts } = useSelector(state => state.message);
  const { currentWorkspace } = useSelector(state => state.workspace);

  // Use URL workspace ID first, then fall back to current workspace from Redux
  const workspaceId = urlWorkspaceId || currentWorkspace?.id;

  const handleDeleteConversation = async (convId) => {
    if (!confirm('Are you sure you want to delete this conversation? This will remove all messages.')) {
      return;
    }

    try {
      await apiClient.delete(`/workspaces/${workspaceId}/direct-conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh conversations list
      dispatch(fetchDirectConversations(workspaceId));
      
      // Navigate to workspace home if we're currently viewing this conversation
      if (parseInt(conversationId) === parseInt(convId)) {
        navigate(`/workspace/${workspaceId}`);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!workspaceId || !token) return;
      try {
        console.log('DirectMessageSection: Fetching users for workspace:', workspaceId);
        const usersRes = await getWorkspaceUsers(token, workspaceId);
        console.log('DirectMessageSection: Users response:', usersRes);
        
        const userData = usersRes.data?.data || usersRes.data || [];
        const userMap = {};
        userData.forEach(u => userMap[u.id] = u);
        setUsersMap(userMap);
        console.log('DirectMessageSection: User map created:', userMap);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };
    fetchUsers();

    if (workspaceId) {
      console.log('DirectMessageSection: Fetching direct conversations for workspace:', workspaceId);
      dispatch(fetchDirectConversations(workspaceId));
    }
  }, [workspaceId, token, dispatch]);

  // Log conversations when they change
  useEffect(() => {
    console.log('DirectMessageSection: Direct conversations updated:', directConversations);
    console.log('DirectMessageSection: Conversations count:', directConversations.length);
  }, [directConversations]);

  useEffect(() => {
    if (conversationId && directConversations.length > 0) {
      const current = directConversations.find(c => c.id === parseInt(conversationId));
      if (current) {
        dispatch(setCurrentConversation(current));
      }
    }
  }, [conversationId, directConversations, dispatch]);

  // Listen for online/offline events
  useEffect(() => {
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);

    // Get initial online users
    if (socketService.isConnected()) {
      setOnlineUsers(socketService.onlineUsers);
    }

    return () => {
      // Cleanup listeners
    };
  }, []);

  const getOtherUser = (conv) => {
    if (!currentUser) return null;
    
    // Use userOne and userTwo from conversation if available (from API)
    if (conv.userOne && conv.userTwo) {
      return conv.userOneId === currentUser.id ? conv.userTwo : conv.userOne;
    }
    
    // Fallback to usersMap (old method)
    const otherId = conv.userOneId === currentUser.id ? conv.userTwoId : conv.userOneId;
    return usersMap[otherId] || { name: 'Unknown User', id: otherId };
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) || socketService.isUserOnline(userId);
  };

  return (
    <>
      <div className="px-3 py-2">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2 group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[13px] font-semibold text-purple-200 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Direct messages</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="opacity-0 group-hover:opacity-100 hover:bg-purple-700 p-1 rounded transition text-purple-200"
            title="New Direct Message"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* DM List */}
        {isExpanded && (
          <div className="space-y-0.5">
            {directConversations.length === 0 ? (
              <div className="space-y-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-purple-700/50 transition text-purple-200 text-sm"
                >
                  <MessageSquare size={16} />
                  <span>Start a conversation</span>
                </button>
              </div>
            ) : (
              directConversations.map((dm) => {
                const otherUser = getOtherUser(dm);
                const isActive = parseInt(conversationId) === dm.id;
                const unreadCount = unreadDMCounts[dm.id] || 0;
                const userIsOnline = isUserOnline(otherUser.id);
                
                return (
                  <Link
                    key={dm.id}
                    to={`/workspace/${workspaceId}/dm/${dm.id}`}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors group/dm ${
                      isActive 
                        ? 'bg-purple-700 text-white' 
                        : 'hover:bg-purple-700/50 text-purple-100'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded overflow-hidden bg-purple-900 flex items-center justify-center">
                        {otherUser.image ? (
                          <img 
                            src={`${SOCKET_URL}${otherUser.image}`} 
                            alt={otherUser.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs font-bold text-purple-200">
                            {otherUser.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      {/* Online status indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#3f0e40] rounded-full ${
                        userIsOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <span className="truncate text-sm font-medium flex-1">{otherUser.name}</span>
                    
                    {/* Show delete icon for admins or if user is "Unknown User" */}
                    {(currentUser?.roleId === 1 || otherUser.name === 'Unknown User') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteConversation(dm.id);
                        }}
                        className="opacity-0 group-hover/dm:opacity-100 hover:bg-red-600 p-1 rounded transition text-purple-200 hover:text-white"
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    {/* Unread count badge */}
                    {unreadCount > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
      {showModal && <CreateDirectMessageModal onClose={() => setShowModal(false)} workspaceId={workspaceId} />}
    </>
  );
};

export default DirectMessageSection;