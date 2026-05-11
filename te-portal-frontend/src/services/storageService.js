/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {string|null} - Stored value or null
 */
export const getFromStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return null;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Clear all localStorage
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Save object to localStorage
 * @param {string} key - Storage key
 * @param {object} obj - Object to store
 */
export const saveObjectToStorage = (key, obj) => {
  try {
    const jsonString = JSON.stringify(obj);
    localStorage.setItem(key, jsonString);
  } catch (error) {
    console.error('Error saving object to localStorage:', error);
  }
};

/**
 * Get object from localStorage
 * @param {string} key - Storage key
 * @returns {object|null} - Parsed object or null
 */
export const getObjectFromStorage = (key) => {
  try {
    const jsonString = localStorage.getItem(key);
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (error) {
    console.error('Error getting object from localStorage:', error);
    return null;
  }
};