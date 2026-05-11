import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Search, Crown, Shield, User as UserIcon } from 'lucide-react';
import Modal from '../common/Modal';
import { getChannelMembers } from '../../api/channelApi';
import { SOCKET_URL } from '../../utils/constants';

const ChannelMembersModal = ({ isOpen, onClose, channelId, workspaceId, channelName }) => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && channelId && workspaceId) {
      fetchMembers();
    }
  }, [isOpen, channelId, workspaceId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = members.filter(member =>
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await getChannelMembers(token, workspaceId, channelId);
      setMembers(response.data.members || []);
      setFilteredMembers(response.data.members || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching channel members:', error);
      setLoading(false);
    }
  };

  const getRoleIcon = (member) => {
    // You can enhance this by fetching role info from workspace members
    if (currentWorkspace?.ownerId === member.id) {
      return <Crown size={14} className="text-yellow-500" title="Owner" />;
    }
    // Add more role checks if needed
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Members - ${channelName || 'Channel'}`}>
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

        {/* Member Count */}
        <div className="text-sm text-gray-600">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
        </div>

        {/* Members List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No members found' : 'No members in this channel'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Avatar */}
                <div className="relative">
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
                  {/* Online indicator - you can enhance this with real online status */}
                  {member.id === currentUser?.id && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full bg-green-500"></div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {member.name}
                      {member.id === currentUser?.id && (
                        <span className="text-gray-500 text-sm ml-1">(you)</span>
                      )}
                    </p>
                    {getRoleIcon(member)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChannelMembersModal;
