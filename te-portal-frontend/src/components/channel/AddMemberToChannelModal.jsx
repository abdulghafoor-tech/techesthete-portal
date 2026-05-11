import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, UserPlus, Search } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { getWorkspaceMembers } from '../../api/workspaceApi';
import { getChannelMembers, addMemberToChannel } from '../../api/channelApi';
import { SOCKET_URL } from '../../utils/constants';

const AddMemberToChannelModal = ({ isOpen, onClose, channelId, workspaceId, onMemberAdded }) => {
  const { token } = useSelector((state) => state.auth);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [channelMembers, setChannelMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && channelId && workspaceId) {
      fetchMembers();
    }
  }, [isOpen, channelId, workspaceId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch workspace members
      const workspaceResponse = await getWorkspaceMembers(token, workspaceId);
      const allMembers = workspaceResponse.data.members || [];
      setWorkspaceMembers(allMembers);

      // Fetch channel members
      const channelResponse = await getChannelMembers(token, workspaceId, channelId);
      const currentMembers = channelResponse.data.members || [];
      setChannelMembers(currentMembers);

      // Filter out members already in channel
      const currentMemberIds = new Set(currentMembers.map(m => m.id));
      const available = allMembers.filter(m => !currentMemberIds.has(m.id));
      setAvailableMembers(available);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setError('');
      setSuccess('');
      
      await addMemberToChannel(token, workspaceId, channelId, userId);
      
      setSuccess('Member added successfully!');
      
      // Refresh the available members list
      await fetchMembers();
      
      // Notify parent component
      if (onMemberAdded) {
        onMemberAdded();
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Members to Channel">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Members List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No members found' : 'All workspace members are already in this channel'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
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
                  
                  {/* Member Info */}
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  onClick={() => handleAddMember(member.id)}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <UserPlus size={16} />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddMemberToChannelModal;
