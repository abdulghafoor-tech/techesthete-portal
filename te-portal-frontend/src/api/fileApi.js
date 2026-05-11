import apiClient from './index';

const fileApi = {
  uploadFile: async (file, isPublic = false) => {
    const formData = new FormData();
    formData.append('file', file);

    // Use public endpoint if no authentication required (e.g., invitation signup)
    const endpoint = isPublic ? '/upload/public' : '/upload';

    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error) {
      // More specific error message
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check if backend is running on port 4000.');
      } else if (error.response?.status === 404) {
        throw new Error('Upload endpoint not found. Please check if backend is running.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 10MB.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Bad request - please check file format.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Upload failed');
      }
    }
  },
};

export default fileApi;
