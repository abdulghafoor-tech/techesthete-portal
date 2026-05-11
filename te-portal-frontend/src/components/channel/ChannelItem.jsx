import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Hash, Lock, MoreVertical, Edit2, Trash2, UserPlus, LogOut } from 'lucide-react';
import { setCurrentChannel, deleteChannel, updateChannel } from '../../redux/slices/channelSlice';
import { fetchChannelMessages, markChannelAsRead } from '../../redux/slices/messageSlice';
import socketService from '../../services/socketService';
import AddMemberToChannelModal from './AddMemberToChannelModal';
import { removeMemberFromChannel } from '../../api/channelApi';

const ChannelItem = ({ channel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { currentChannel } = useSelector((state) => state.channel);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { unreadCounts } = useSelector((state) => state.message);
  const { user, token } = useSelector((state) => state.auth);

  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newName, setNewName] = useState(channel.name);
  const menuRef = useRef(null);

  const isActive = currentChannel?.id === channel.id;
  const unreadCount = unreadCounts[channel.id] || 0;
  
  // Check if user is admin or manager (can manage channels)
  const isAdmin = user?.roleId === 1; // Admin
  const isManager = user?.roleId === 2; // Manager
  const canManageChannel = isAdmin || isManager;
  const isMember = user?.roleId === 3; // Regular member

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleSelectChannel = () => {
    // Navigate to channel page
    const wsId = workspaceId || currentWorkspace?.id;
    if (wsId) {
      navigate(`/workspace/${wsId}/channel/${channel.id}`);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleRename = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowRenameModal(true);
  };

  const handleAddMembers = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowAddMemberModal(true);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (window.confirm(`Are you sure you want to delete #${channel.name}? This action cannot be undone.`)) {
      await dispatch(deleteChannel({
        workspaceId: currentWorkspace.id,
        channelId: channel.id
      }));
    }
  };

  const handleLeaveChannel = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (window.confirm(`Are you sure you want to leave #${channel.name}?`)) {
      try {
        await removeMemberFromChannel(token, currentWorkspace.id, channel.id, user.id);
        
        // Navigate away if currently viewing this channel
        if (isActive) {
          navigate(`/workspace/${currentWorkspace.id}`);
        }
        
        // Refresh channels list
        window.location.reload();
      } catch (error) {
        console.error('Error leaving channel:', error);
        alert('Failed to leave channel. Please try again.');
      }
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== channel.name) {
      await dispatch(updateChannel({
        workspaceId: currentWorkspace.id,
        channelId: channel.id,
        name: newName.trim()
      }));
    }
    setShowRenameModal(false);
  };

  return (
    <>
      <div className="relative group">
        <div
          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left transition-colors text-sm cursor-pointer ${
            isActive
              ? 'bg-purple-700 text-white font-semibold'
              : 'hover:bg-purple-700/50 text-purple-100'
          }`}
        >
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={handleSelectChannel}
          >
            {channel.type === 'private' ? (
              <Lock size={16} className="flex-shrink-0" />
            ) : (
              <Hash size={16} className="flex-shrink-0" />
            )}
            <span className="truncate">{channel.name}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Unread Badge */}
            {unreadCount > 0 && !isActive && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center flex-shrink-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {/* More Menu - Show for all users but with different options */}
            <button
              onClick={handleMenuClick}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                isActive ? 'hover:bg-purple-600' : 'hover:bg-purple-700'
              }`}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl z-50 py-1 min-w-[160px] border border-gray-200"
          >
            {/* Admin/Manager Menu Options */}
            {canManageChannel && (
              <>
                <button
                  onClick={handleAddMembers}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition text-sm text-gray-700"
                >
                  <UserPlus size={16} />
                  <span>Add members</span>
                </button>
                <button
                  onClick={handleRename}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition text-sm text-gray-700"
                >
                  <Edit2 size={16} />
                  <span>Rename channel</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition text-sm text-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete channel</span>
                </button>
              </>
            )}

            {/* Member Menu Options */}
            {isMember && (
              <>
                <button
                  onClick={handleAddMembers}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition text-sm text-gray-700"
                >
                  <UserPlus size={16} />
                  <span>Add members</span>
                </button>
                <button
                  onClick={handleLeaveChannel}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition text-sm text-red-600"
                >
                  <LogOut size={16} />
                  <span>Leave channel</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Rename Channel</h3>
            <form onSubmit={handleRenameSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g. project-updates"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newName.trim() || newName === channel.name}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameModal(false);
                    setNewName(channel.name);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberToChannelModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          channelId={channel.id}
          workspaceId={workspaceId || currentWorkspace?.id}
          onMemberAdded={() => {
            // Optionally refresh channel data or show success message
            console.log('Member added successfully');
          }}
        />
      )}
    </>
  );
};

export default ChannelItem;