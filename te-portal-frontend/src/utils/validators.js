/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate channel name
 */
export const validateChannelName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Channel name is required');
  }
  
  if (name.length > 80) {
    errors.push('Channel name must be less than 80 characters');
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    errors.push('Channel name can only contain letters, numbers, hyphens, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate workspace name
 */
export const validateWorkspaceName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Workspace name is required');
  }
  
  if (name.length > 100) {
    errors.push('Workspace name must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate message content
 */
export const validateMessage = (content, maxLength = 5000) => {
  const errors = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (content.length > maxLength) {
    errors.push(`Message must be less than ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 */
export const validateFile = (file, maxSize = 10 * 1024 * 1024, allowedTypes = []) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};