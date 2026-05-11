import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Search, User } from 'lucide-react';
import { getWorkspaceUsers } from '../../api/userApi';
import { createDirectConversation } from "../../api/messageApi";
import { SOCKET_URL } from '../../utils/constants';

const CreateDirectMessageModal = ({ onClose, workspaceId: propWorkspaceId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { workspaceId: urlWorkspaceId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector(state => state.auth);
    const currentUser = useSelector(state => state.auth.user);
    const { currentWorkspace } = useSelector(state => state.workspace);

    // Use prop workspaceId first, then URL params, then Redux current workspace
    const workspaceId = propWorkspaceId || urlWorkspaceId || currentWorkspace?.id;

    useEffect(() => {
        const fetchUsers = async () => {
            if (!workspaceId || !token || !currentUser) {
                return;
            }

            try {
                setLoading(true);
                
                const response = await getWorkspaceUsers(token, workspaceId);
                
                const userData = response.data?.data || response.data || [];
                
                setUsers(userData.filter(u => u.id !== currentUser.id));
            } catch (error) {
                console.error("Failed to fetch users", error);
                console.error("Error details:", error.response?.data);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [workspaceId, token, currentUser, propWorkspaceId, urlWorkspaceId, currentWorkspace]);

    const handleStartConversation = async (userId) => {
        try {
            const response = await createDirectConversation(token, workspaceId, userId);
            
            const conversationId = response.data.conversationId;
            
            onClose();
            navigate(`/workspace/${workspaceId}/dm/${conversationId}`);
        } catch (error) {
            console.error("Failed to start conversation", error);
            console.error("Error details:", error.response?.data);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1a1d29] rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-600">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">New Message</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Find people..."
                                className="w-full pl-10 pr-4 py-2 bg-[#2d3142] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400">Loading users...</div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="space-y-1">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleStartConversation(user.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#3d4354] rounded-lg transition text-left"
                                    >
                                        {user.image ? (
                                            <img 
                                            src={`${SOCKET_URL}${user.image}`} 
                                                alt={user.name} 
                                                className="w-8 h-8 rounded-lg object-cover" 
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-semibold">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">{user.name}</div>
                                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-400 mb-2">No users found</div>
                                <div className="text-xs text-gray-500 mb-3">
                                    You need to invite other users to your workspace first.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDirectMessageModal;
