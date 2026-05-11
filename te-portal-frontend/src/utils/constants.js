export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

export const ROLE_IDS = {
  ADMIN: 1,
  MANAGER: 2,
  MEMBER: 3,
};

export const CHANNEL_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

export const MESSAGE_MAX_LENGTH = 5000;
export const TOAST_DURATION = 3000;
export const FILE_UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  WORKSPACE: '/workspace/:workspaceId',
  CHANNEL: '/workspace/:workspaceId/channel/:channelId',
  DIRECT_MESSAGE: '/workspace/:workspaceId/dm/:conversationId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};
