import apiClient from './index';

export const getGmailAuthUrl = (token, workspaceId = null) => {
  return apiClient.get('/gmail/auth-url', {
    params: { workspaceId },
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getGmailStatus = (token) => {
  return apiClient.get('/gmail/status', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const disconnectGmail = (token) => {
  return apiClient.post('/gmail/disconnect', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getGmailMessages = (token, maxResults = 20, pageToken = null) => {
  return apiClient.get('/gmail/messages', {
    params: { maxResults, pageToken },
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getGmailMessage = (token, messageId) => {
  return apiClient.get(`/gmail/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const sendGmailMessage = (token, to, subject, body) => {
  return apiClient.post('/gmail/messages/send', 
    { to, subject, body },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const markGmailAsRead = (token, messageId) => {
  return apiClient.post(`/gmail/messages/${messageId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const markGmailAsUnread = (token, messageId) => {
  return apiClient.post(`/gmail/messages/${messageId}/unread`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteGmailMessage = (token, messageId) => {
  return apiClient.delete(`/gmail/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Share email to channel
export const shareEmailToChannel = (token, emailId, channelId, workspaceId) => {
  return apiClient.post('/gmail/share-to-channel', 
    { emailId, channelId, workspaceId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Reply to email from channel
export const replyToEmailFromChannel = (token, emailId, threadId, to, subject, body) => {
  return apiClient.post('/gmail/reply-from-channel',
    { emailId, threadId, to, subject, body },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
