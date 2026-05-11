import apiClient from './index';

export const login = (email, password) => {
  return apiClient.post('/users/login', { email, password });
};

export const register = (userData) => {
  return apiClient.post('/users', userData);
};

export const updateProfile = (token, userData) => {
  return apiClient.put('/users/profile', userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getUsers = (token) => {
  return apiClient.get('/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
};