import React from 'react';
import { X, Mail, Shield, Calendar, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { getImageUrl } from '../../utils/imageUtils';

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  // Get role title from roleId
  const getRoleTitle = (roleId) => {
    const roles = {
      1: 'Admin',
      2: 'Member',
      3: 'Guest'
    };
    return roles[roleId] || 'Member';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={20} />
          </button>
          
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {user.image ? (
                <img
                  src={getImageUrl(user.image)}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-purple-600 text-3xl font-bold border-4 border-white shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Online status */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            
            {/* Name */}
            <h2 className="text-2xl font-bold text-white mt-4">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/90 text-sm">Active</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Email</p>
              <p className="text-sm text-gray-900 font-medium truncate">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          {user.roleId && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield size={20} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase">Role</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900 font-medium">{getRoleTitle(user.roleId)}</p>
                  {user.roleId === 1 && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Member Since */}
          {user.createdAt && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase">Member Since</p>
                <p className="text-sm text-gray-900 font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          )}

          {/* Invited Status */}
          {user.isInvited && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle size={18} className="text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">Joined via invitation</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {user.id || '0'}
                </p>
                <p className="text-xs text-gray-600 font-medium mt-1">User ID</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  <CheckCircle size={24} className="inline" />
                </p>
                <p className="text-xs text-gray-600 font-medium mt-1">Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
          >
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
