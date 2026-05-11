import api from './index';

export const createMeeting = (token, workspaceId, meetingData) => {
  return api.post(`/workspaces/${workspaceId}/meetings`, meetingData, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getMeetings = (token, workspaceId) => {
  return api.get(`/workspaces/${workspaceId}/meetings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateMeetingResponse = (token, workspaceId, meetingId, responseStatus) => {
  return api.patch(`/workspaces/${workspaceId}/meetings/${meetingId}/response`, 
    { responseStatus },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteMeeting = (token, workspaceId, meetingId) => {
  return api.delete(`/workspaces/${workspaceId}/meetings/${meetingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
