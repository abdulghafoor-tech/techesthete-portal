import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, Link as LinkIcon, Check, X } from 'lucide-react';
import Avatar from '../common/Avatar';
import { getImageUrl } from '../../utils/imageUtils';
import axios from 'axios';
import socketService from '../../services/socketService';

const MeetingInvitationMessage = ({ message, compact = false }) => {
  const { user, token } = useSelector((state) => state.auth);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [responding, setResponding] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the participant's current response status when component mounts
  useEffect(() => {
    const fetchResponseStatus = async () => {
      if (!message.meetingId || !currentWorkspace?.id || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/workspaces/${currentWorkspace.id}/meetings/${message.meetingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        if (response.data.success && response.data.meeting) {
          const meeting = response.data.meeting;
          const participant = meeting.participants?.find(p => p.userId === user.id);
          if (participant) {
            setResponseStatus(participant.responseStatus === 'pending' ? null : participant.responseStatus);
          }
        }
      } catch (error) {
        console.error('Error fetching meeting status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponseStatus();
  }, [message.meetingId, currentWorkspace?.id, token, user?.id]);

  // Listen for real-time meeting status updates
  useEffect(() => {
    if (!socketService.socket || !message.meetingId) return;

    const handleMeetingStatusChanged = (data) => {
      console.log('📢 Meeting status changed:', data);
      if (data.meetingId === message.meetingId && data.participantId === user?.id) {
        setResponseStatus(data.responseStatus);
      }
    };

    socketService.socket.on('meeting_status_changed', handleMeetingStatusChanged);

    return () => {
      if (socketService.socket) {
        socketService.socket.off('meeting_status_changed', handleMeetingStatusChanged);
      }
    };
  }, [message.meetingId, user?.id]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleResponse = async (action) => {
    if (responding || !message.meetingId) {
      console.log('⚠️ Cannot respond:', { responding, meetingId: message.meetingId });
      return;
    }

    if (!currentWorkspace?.id) {
      console.error('❌ No workspace ID available');
      alert('Unable to respond: No workspace selected');
      return;
    }

    if (!token) {
      console.error('❌ No authentication token available');
      alert('Unable to respond: Not authenticated');
      return;
    }

    console.log('📝 Responding to meeting:', {
      meetingId: message.meetingId,
      action,
      workspaceId: currentWorkspace.id,
      apiUrl: import.meta.env.VITE_API_BASE_URL
    });

    setResponding(true);
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/workspaces/${currentWorkspace.id}/meetings/${message.meetingId}/response`;
      console.log('📡 Making request to:', url);
      
      const response = await axios.patch(
        url,
        { responseStatus: action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        setResponseStatus(action);
        console.log(`✅ Meeting ${action} successfully`);
      } else {
        console.error('❌ Response not successful:', response.data);
        const errorMsg = response.data.message || `Failed to ${action} meeting`;
        alert(`${errorMsg}. Please try again.`);
      }
    } catch (error) {
      console.error(`❌ Error responding to meeting:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = `Failed to ${action} meeting. `;
      if (error.response) {
        // Server responded with error
        errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request made but no response
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Error setting up request
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      alert(errorMessage);
    } finally {
      setResponding(false);
    }
  };

  // Parse meeting details from message content
  const lines = message.content.split('\n');
  const meetingTitle = lines.find(l => l.includes('Topic:'))?.replace('📋 Topic:', '').trim() || 'Meeting';
  const meetingDate = lines.find(l => l.includes('Date:'))?.replace('📅 Date:', '').trim();
  const meetingTime = lines.find(l => l.includes('Time:'))?.replace('🕐 Time:', '').trim();
  const meetingLink = lines.find(l => l.includes('Link:'))?.replace('🔗 Link:', '').trim();
  const meetingLocation = lines.find(l => l.includes('Location:'))?.replace('📍 Location:', '').trim();

  return (
    <div
      className={`group relative ${compact ? 'py-1' : 'py-3'} px-4 hover:bg-gray-50 transition-colors`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {!compact && (
          <div className="flex-shrink-0">
            <Avatar
              src={message.senderImage ? getImageUrl(message.senderImage) : null}
              alt={message.senderName}
              size="md"
            />
          </div>
        )}

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          {!compact && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900 hover:underline cursor-pointer">
                {message.senderName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </div>
          )}

          {/* Meeting Invitation Card */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 max-w-md">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-purple-600" size={24} />
              <h3 className="font-bold text-lg text-gray-900">Meeting Invitation</h3>
            </div>

            {/* Meeting Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-semibold text-gray-900">{meetingTitle}</p>
                  <p className="text-sm text-gray-600">Organized by {message.senderName}</p>
                </div>
              </div>

              {meetingDate && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={16} className="text-purple-600" />
                  <span className="text-sm">{meetingDate}</span>
                </div>
              )}

              {meetingTime && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock size={16} className="text-purple-600" />
                  <span className="text-sm">{meetingTime}</span>
                </div>
              )}

              {meetingLink && (
                <div className="flex items-center gap-2 text-gray-700">
                  <LinkIcon size={16} className="text-purple-600" />
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {meetingLink}
                  </a>
                </div>
              )}

              {meetingLocation && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin size={16} className="text-purple-600" />
                  <span className="text-sm">{meetingLocation}</span>
                </div>
              )}
            </div>

            {/* Response Buttons */}
            {loading ? (
              <div className="p-3 rounded-lg text-center text-gray-600">
                Loading status...
              </div>
            ) : responseStatus ? (
              <div className={`p-3 rounded-lg text-center font-medium ${
                responseStatus === 'accepted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {responseStatus === 'accepted' ? (
                  <>
                    <Check size={20} className="inline mr-2" />
                    You accepted this meeting
                  </>
                ) : (
                  <>
                    <X size={20} className="inline mr-2" />
                    You declined this meeting
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {responding ? 'Responding...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleResponse('declined')}
                  disabled={responding}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {responding ? 'Responding...' : 'Decline'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingInvitationMessage;
