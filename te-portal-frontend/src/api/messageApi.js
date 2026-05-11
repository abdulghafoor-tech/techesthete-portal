import apiClient from './index';

export const getChannelMessages = (token, workspaceId, channelId) => {
  return apiClient.get(`/workspaces/${workspaceId}/channels/${channelId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createDirectConversation = (token, workspaceId, userTwoId) => {
  return apiClient.post(`/workspaces/${workspaceId}/direct-conversations`,
    { userTwoId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getConversationMessages = (token, workspaceId, conversationId) => {
  return apiClient.get(`/workspaces/${workspaceId}/direct-conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getDirectConversations = (token, workspaceId) => {
    return apiClient.get(`/workspaces/${workspaceId}/direct-conversations`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};