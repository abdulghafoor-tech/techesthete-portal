import apiClient from './index';

export const getUsers = (token) => {
  return apiClient.get('/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getUserProfile = (token, userId) => {
  return apiClient.get(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getWorkspaceUsers = (token, workspaceId) => {
  return apiClient.get(`/users/workspace/${workspaceId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateUserProfile = (token, data) => {
  return apiClient.put('/users/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
