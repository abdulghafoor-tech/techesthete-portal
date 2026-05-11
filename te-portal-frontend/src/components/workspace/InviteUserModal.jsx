import React, { useState } from 'react';
import { X, Mail, UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';
import apiClient from '../../api/index';

const InviteUserModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(2); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  
  const { token } = useSelector(state => state.auth);
  const { currentWorkspace } = useSelector(state => state.workspace);
  const workspaceId = currentWorkspace?.id;

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!workspaceId) {
      setError('No workspace selected');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiClient.post(
        `/workspaces/${workspaceId}/invite`,
        { email, roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setInviteLink(response.data.previewUrl);
      setEmail('');
      
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center gap-2 text-white">
            <UserPlus size={24} />
            <h2 className="text-lg font-semibold">Invite People</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {}
        <form onSubmit={handleInvite} className="p-6">
          {}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
            >
              <option value={1}>Admin</option>
              <option value={2}>Member</option>
              <option value={3}>Guest</option>
            </select>
          </div>

          {}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                 Invitation sent successfully!
              </p>
              {inviteLink && (
                <div className="mt-2">
                  <p className="text-xs text-green-700 mb-1">Preview the email:</p>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {inviteLink}
                  </a>
                </div>
              )}
            </div>
          )}

          {}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
               An invitation email will be sent with a link to join this workspace. 
              The link expires in 24 hours.
            </p>
          </div>

          {}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
