import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Camera } from 'lucide-react';
import { logout, updateUser } from '../../redux/slices/authSlice';
import socketService from '../../services/socketService';
import fileApi from '../../api/fileApi';
import UserProfileModal from '../common/UserProfileModal';
import { SOCKET_URL } from '../../utils/constants';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const userFileInputRef = useRef(null);

  const handleLogout = () => {
    socketService.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    setShowProfileModal(true);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadResponse = await fileApi.uploadFile(file);
      if (uploadResponse.file && uploadResponse.file.url) {
        await dispatch(updateUser({ image: uploadResponse.file.url })).unwrap();
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    } finally {
      setUploadingImage(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="p-3 border-t border-purple-800/30 relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-3 hover:bg-purple-700/50 p-2 rounded-lg transition group"
      >
        <div className="relative">
          {user?.image ? (
            <img
              src={`${SOCKET_URL}${user.image}`}
              alt={user.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#3f0e40] rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold truncate text-white text-sm">{user?.name || 'User'}</p>
          <p className="text-xs text-purple-200 truncate">Active</p>
        </div>
      </button>

      {}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-lg shadow-2xl z-20 py-2 text-gray-800 border border-gray-200">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user?.image ? (
                    <img
                      src={`${SOCKET_URL}${user.image}`}
                      alt={user.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {}
            <div className="py-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700"
                onClick={() => userFileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <Camera size={18} />
                <span>{uploadingImage ? 'Uploading...' : 'Change Profile Picture'}</span>
              </button>
              <input
                type="file"
                ref={userFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureUpload}
              />
              
              <button
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700"
                onClick={handleViewProfile}
              >
                <User size={18} />
                <span>View Profile</span>
              </button>
              
              <button
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700"
                onClick={() => setShowMenu(false)}
              >
                <Settings size={18} />
                <span>Preferences</span>
              </button>
            </div>

            <div className="border-t border-gray-100 my-1" />
            
            <button
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 transition text-sm font-medium"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}

      {}
      {showProfileModal && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;