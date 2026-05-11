import apiClient from './index';

export const getChannels = (token, workspaceId) => {
  return apiClient.get(`/workspaces/${workspaceId}/channels`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getChannelMembers = (token, workspaceId, channelId) => {
  return apiClient.get(`/workspaces/${workspaceId}/channels/${channelId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createChannel = (token, workspaceId, name, type = 'public', members = []) => {
  return apiClient.post(`/workspaces/${workspaceId}/channels`, 
    { name, type, members },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteChannel = (token, workspaceId, channelId) => {
  return apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateChannel = (token, workspaceId, channelId, name) => {
  return apiClient.patch(`/workspaces/${workspaceId}/channels/${channelId}/edit-channel`,
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const addMemberToChannel = (token, workspaceId, channelId, userId) => {
  return apiClient.post(`/workspaces/${workspaceId}/channels/${channelId}/add-member`,
    { userId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const removeMemberFromChannel = (token, workspaceId, channelId, userId) => {
  return apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}/remove-member`,
    { data: { userId }, headers: { Authorization: `Bearer ${token}` } }
  );
};
