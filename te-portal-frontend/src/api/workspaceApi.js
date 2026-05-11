import apiClient from './index';

export const getWorkspaces = (token) => {
  return apiClient.get('/workspaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createWorkspace = (token, name) => {
  return apiClient.post('/workspaces', { name }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateWorkspace = (token, workspaceId, data) => {
  return apiClient.put(`/workspaces/${workspaceId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteWorkspace = (token, workspaceId) => {
  return apiClient.delete(`/workspaces/${workspaceId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const inviteToWorkspace = (token, workspaceId, email, roleId) => {
  return apiClient.post(`/workspaces/${workspaceId}/invite`, 
    { email, roleId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const removeUserFromWorkspace = (token, workspaceId, userId) => {
  return apiClient.delete(`/workspaces/${workspaceId}/remove-user`, {
    data: { userId },
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const joinWorkspace = (token) => {
  return apiClient.get(`/workspaces/join-workspace?token=${token}`);
};

export const acceptInvite = (data) => {
  return apiClient.post('/workspaces/accept-invite', data);
};

export const getWorkspaceMembers = (token, workspaceId) => {
  return apiClient.get(`/workspaces/${workspaceId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
