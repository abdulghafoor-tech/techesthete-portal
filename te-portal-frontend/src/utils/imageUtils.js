/**
 * Get the full image URL from a relative path
 * @param {string} imagePath - The relative image path (e.g., /uploads/image.jpg)
 * @returns {string|null} - The full image URL or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If the path already includes http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use the API base URL without /api suffix
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  const baseUrl = apiBaseUrl.replace('/api', '');
  
  return `${baseUrl}${imagePath}`;
};
