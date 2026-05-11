/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format date separator (e.g., "Friday, 30 January")
 */
export const formatDateSeparator = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to midnight for accurate comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const msgDate = new Date(messageDate);
  msgDate.setHours(0, 0, 0, 0);

  if (msgDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "Friday, 30 January" or "Friday, 30 January 2025" if different year
    const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    
    // Add year if message is from a different year
    if (messageDate.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    
    return messageDate.toLocaleDateString('en-US', options);
  }
};

/**
 * Check if two dates are on different days
 */
export const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getDate() !== d2.getDate() ||
         d1.getMonth() !== d2.getMonth() ||
         d1.getFullYear() !== d2.getFullYear();
};

/**
 * Get message time format based on date
 */
export const getMessageTimeFormat = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    // Today - show time only
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    // Yesterday
    return `Yesterday ${messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else if ((today - messageDate) < 7 * 24 * 60 * 60 * 1000) {
    // Within last week - show day name
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    // Older - show full date
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
};