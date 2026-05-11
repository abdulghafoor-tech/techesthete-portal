import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Search } from 'lucide-react';
import { createChannel } from '../../redux/slices/channelSlice';
import { getWorkspaceUsers } from '../../api/userApi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { SOCKET_URL } from '../../utils/constants';

const CreateChannelModal = ({ onClose }) => {
  console.log('🎨 CreateChannelModal rendered');
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { loading } = useSelector((state) => state.channel);
  const { token, user } = useSelector((state) => state.auth);

  console.log('👤 Current user:', user);
  console.log('🏢 Current workspace:', currentWorkspace);

  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    members: []
  });
  
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (formData.type === 'private' && currentWorkspace) {
      fetchWorkspaceMembers();
    }
  }, [formData.type, currentWorkspace]);

  const fetchWorkspaceMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await getWorkspaceUsers(token, currentWorkspace.id);
      // Backend returns { data: users, success: true }
      const userData = response.data?.data || response.data || [];
      setWorkspaceMembers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setWorkspaceMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const filteredMembers = Array.isArray(workspaceMembers) 
    ? workspaceMembers.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSubmit = async () => {
    if (!formData.name.trim() || !currentWorkspace) {
      console.log('❌ Validation failed:', { 
        name: formData.name.trim(), 
        workspace: currentWorkspace 
      });
      return;
    }

    console.log('🚀 Creating channel with data:', {
      workspaceId: currentWorkspace.id,
      name: formData.name,
      type: formData.type,
      members: formData.members,
      membersCount: formData.members.length,
      token: token ? 'exists' : 'missing'
    });

    try {
      const result = await dispatch(createChannel({
        workspaceId: currentWorkspace.id,
        name: formData.name,
        type: formData.type,
        members: formData.type === 'private' ? formData.members : []
      }));

      console.log('📊 Channel creation result:', result);
      console.log('📊 Result type:', result.type);
      console.log('📊 Result payload:', result.payload);
      console.log('📊 Result error:', result.error);

      if (result.type === 'channel/create/fulfilled') {
        console.log('✅ Channel created successfully');
        onClose();
      } else {
        console.error('❌ Channel creation failed:', result);
        alert(`Failed to create channel: ${result.payload || result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Exception during channel creation:', error);
      alert(`Error creating channel: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Create Channel</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. project-updates"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Channels are where conversations happen around a topic.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  value="public"
                  checked={formData.type === 'public'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, members: [] })}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="font-medium text-gray-800">Public</p>
                  <p className="text-xs text-gray-500">Anyone in the workspace can join</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  value="private"
                  checked={formData.type === 'private'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="font-medium text-gray-800">Private</p>
                  <p className="text-xs text-gray-500">Only invited members can join</p>
                </div>
              </label>
            </div>
          </div>

          {/* Member Selection for Private Channels */}
          {formData.type === 'private' && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Members (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                You will be automatically added as a member. Select additional members to invite.
              </p>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Member List */}
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {loadingMembers ? (
                  <div className="p-4 text-center text-gray-500">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No members found</div>
                ) : (
                  <div className="divide-y">
                    {filteredMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.members.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {member.image ? (
                            <img
                            src={`${SOCKET_URL}${member.image}`}
                              alt={member.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {member.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.members.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {formData.members.length} member{formData.members.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || loading}
            className="flex-1"
            variant="primary"
          >
            {loading ? 'Creating...' : 'Create Channel'}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateChannelModal;