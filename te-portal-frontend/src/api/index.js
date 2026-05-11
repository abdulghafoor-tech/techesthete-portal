import axios from 'axios';

// ✅ Use import.meta.env for Vite (NOT process.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// Add token to requests automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle Auth Errors (401/403)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      store.dispatch(logout());
      // window.location.href = '/login'; // Redux state change should handle redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;