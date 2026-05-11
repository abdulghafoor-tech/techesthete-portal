import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Search, Settings, Users, Hash, Lock, Star, ChevronDown, Headphones, Info, UserPlus, Mail } from 'lucide-react';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import socketService from '../../services/socketService';
import { getChannelMembers } from '../../api/channelApi';
import { getUserProfile } from '../../api/userApi';
import TypingIndicator from './TypingIndicator';
import AddMemberToChannelModal from '../channel/AddMemberToChannelModal';
import ChannelMembersModal from '../channel/ChannelMembersModal';
import UserProfileModal from '../common/UserProfileModal';
import { SOCKET_URL } from '../../utils/constants';

const ChatHeader = ({ activeTab, onTabChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { channelId, workspaceId } = useParams();
  const { currentChannel } = useSelector((state) => state.channel);
  const { currentConversation } = useSelector((state) => state.message);
  const { user: currentUser, token } = useSelector((state) => state.auth);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [channelMembers, setChannelMembers] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMembersListModal, setShowMembersListModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Handle Gmail navigation
  const handleGmailClick = () => {
    navigate(`/workspace/${workspaceId}/gmail`);
  };

  // Fetch channel members function
  const fetchMembers = async () => {
    if (channelId && workspaceId && token) {
      try {
        const response = await getChannelMembers(token, workspaceId, channelId);
        setChannelMembers(response.data.members || []);
        setMemberCount(response.data.count || 0);
      } catch (error) {
        console.error('Error fetching channel members:', error);
      }
    }
  };

  // Fetch channel members when channel changes
  useEffect(() => {
    if (currentChannel) {
      fetchMembers();
      // Reset modal states when channel changes
      setShowMembersListModal(false);
      setShowAddMemberModal(false);
    }
  }, [channelId, workspaceId, token, currentChannel]);

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

  // Determine other user for DM
  const getOtherUser = () => {
    if (!currentConversation || !currentUser) return null;
    
    // Check for lowercase properties (from API)
    if (currentConversation.userOne && currentConversation.userTwo) {
      return currentConversation.userOneId === currentUser.id
        ? currentConversation.userTwo
        : currentConversation.userOne;
    }
    
    // Fallback to uppercase (backward compatibility)
    if (currentConversation.UserOne && currentConversation.UserTwo) {
      return currentConversation.UserOne?.id === currentUser.id
        ? currentConversation.UserTwo
        : currentConversation.UserOne;
    }
    
    return null;
  };

  const otherUser = !currentChannel ? getOtherUser() : null;
  
  // Check if other user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) || socketService.isUserOnline(userId);
  };
  
  const userIsOnline = otherUser ? isUserOnline(otherUser.id) : false;

  // Handle viewing user profile
  const handleViewProfile = async (userId) => {
    if (loadingProfile) return;
    
    setLoadingProfile(true);
    try {
      const response = await getUserProfile(token, userId);
      if (response.data.success) {
        setProfileUser(response.data.user);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="flex flex-col bg-white shrink-0 border-b border-slate-200">
      <div className="h-[49px] flex items-center justify-between px-4">
        <div className="flex items-center gap-4"> {/* Increased gap for profile alignment */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden hover:bg-gray-100 p-1 rounded transition"
          >
            <Menu size={18} />
          </button>

          {currentChannel ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-bold text-gray-900">
                  {currentChannel.type === 'private' ? (
                    <Lock size={16} className="text-gray-500" />
                  ) : (
                    <Hash size={18} className="text-gray-500" />
                  )}
                  <span className="text-lg leading-none pt-0.5">{currentChannel.name || 'Select a channel'}</span>
                  <ChevronDown size={14} className="text-gray-500 ml-1" />
                </div>
                {/* Typing Indicator for Channels */}
                {currentChannel && (
                  <TypingIndicator isChannel={true} id={currentChannel.id} />
                )}
              </div>
              
              {/* Channel Members */}
              {memberCount > 0 && (
                <button 
                  onClick={() => setShowMembersListModal(true)}
                  className="flex items-center gap-1.5 ml-2 hover:bg-gray-100 px-2 py-1 rounded-lg transition cursor-pointer"
                  title="View all members"
                >
                  {/* Overlapping Avatars */}
                  <div className="flex items-center -space-x-2">
                    {channelMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={member.id}
                        className="w-6 h-6 rounded border-2 border-white bg-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                        style={{ zIndex: 3 - index }}
                        title={member.name}
                      >
                        {member.image ? (
                          <img 
                            src={`${SOCKET_URL}${member.image}`} 
                            alt={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          member.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Member Count */}
                  <span className="text-sm text-gray-600 font-medium">{memberCount}</span>
                </button>
              )}
            </div>
          ) : otherUser ? (
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 -ml-2 pl-2 pr-3 py-1 rounded-lg transition-colors" onClick={() => handleViewProfile(otherUser.id)}>
              {/* User Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {otherUser.image ? (
                    <img 
                      src={`${SOCKET_URL}${otherUser.image}`} 
                      alt={otherUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    otherUser.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                {/* Online Status Indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                  userIsOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              {/* User Info */}
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 leading-tight">{otherUser.name}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium leading-tight ${
                    userIsOnline ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {userIsOnline ? 'Active' : 'Offline'}
                  </span>
                  {/* Typing Indicator for DMs */}
                  {currentConversation && (
                    <TypingIndicator isChannel={false} id={currentConversation.id} />
                  )}
                </div>
              </div>
              
              <ChevronDown size={14} className="text-gray-500 ml-1" />
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 leading-none pt-0.5">Select a conversation</span>
          )}

          <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-yellow-400">
            <Star size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <button 
            onClick={handleGmailClick}
            className="flex items-center gap-1 hover:bg-slate-100 py-1.5 px-3 rounded-lg transition border border-transparent hover:border-slate-200"
            title="Open Gmail"
          >
            <Mail size={18} className="text-blue-600" />
          </button>
          <button className="flex items-center gap-1 hover:bg-slate-100 py-1.5 px-3 rounded-lg transition border border-transparent hover:border-slate-200">
            <Headphones size={18} />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <button className="hover:bg-slate-100 p-2 rounded-lg transition border border-transparent hover:border-slate-200">
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 gap-6 h-9">
        <button 
          onClick={() => onTabChange('messages')}
          className={`h-full border-b-2 ${
            activeTab === 'messages' 
              ? 'border-blue-600 text-slate-800 font-bold' 
              : 'border-transparent text-slate-500 font-medium hover:border-slate-300 hover:text-slate-800'
          } text-sm flex items-center px-1 transition-colors`}
        >
          Messages
        </button>
        <button 
          onClick={() => onTabChange('files')}
          className={`h-full border-b-2 ${
            activeTab === 'files' 
              ? 'border-blue-600 text-slate-800 font-bold' 
              : 'border-transparent text-slate-500 font-medium hover:border-slate-300 hover:text-slate-800'
          } text-sm flex items-center px-1 transition-colors`}
        >
          Files
        </button>
        <div className="h-full border-b-2 border-transparent text-sm font-medium text-slate-500 flex items-center px-1">
          <ChevronDown size={14} className="mr-1" />
          More
        </div>
      </div>

      {/* Modals */}
      {currentChannel && (
        <>
          <AddMemberToChannelModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            channelId={currentChannel.id}
            workspaceId={workspaceId}
            onMemberAdded={fetchMembers}
          />
          <ChannelMembersModal
            isOpen={showMembersListModal}
            onClose={() => setShowMembersListModal(false)}
            channelId={currentChannel.id}
            workspaceId={workspaceId}
            channelName={currentChannel.name}
          />
        </>
      )}

      {/* User Profile Modal */}
      {showProfileModal && profileUser && (
        <UserProfileModal
          user={profileUser}
          onClose={() => {
            setShowProfileModal(false);
            setProfileUser(null);
          }}
        />
      )}
    </div>
  );
};

export default ChatHeader;