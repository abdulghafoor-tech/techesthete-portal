import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Clock, Users, MapPin, Video, Trash2, Edit2, Check, X, User } from 'lucide-react';
import { updateMeetingResponse, deleteMeeting } from '../../api/meetingsApi';
import { getImageUrl } from '../../utils/imageUtils';

const MeetingCard = ({ meeting, onUpdate }) => {
  const { workspaceId } = useParams();
  const { token, user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);

  const isOrganizer = meeting.organizerId === user.id;
  const userParticipant = meeting.participants?.find(p => p.userId === user.id);
  const responseStatus = userParticipant?.responseStatus || 'pending';

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleResponse = async (status) => {
    try {
      setLoading(true);
      await updateMeetingResponse(token, workspaceId, meeting.id, status);
      onUpdate();
    } catch (error) {
      console.error('Error updating response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteMeeting(token, workspaceId, meeting.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Open edit modal
    alert('Edit functionality coming soon!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Accepted</span>;
      case 'declined':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Declined</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>;
    }
  };

  const acceptedCount = meeting.participants?.filter(p => p.responseStatus === 'accepted').length || 0;
  const totalCount = meeting.participants?.length || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Header with Title and Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-lg text-gray-900">{meeting.title}</h3>
          {isOrganizer && (
            <div className="flex gap-1">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="p-1.5 hover:bg-blue-100 rounded transition text-blue-600"
                title="Edit meeting"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-1.5 hover:bg-red-100 rounded transition text-red-600"
                title="Delete meeting"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        {meeting.description && (
          <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
        )}
      </div>

      {/* Meeting Details */}
      <div className="px-4 py-3 space-y-3">
        {/* Time Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-blue-600" />
            <span className="font-semibold text-gray-700">Start Time:</span>
            <span className="text-gray-900">{formatTime(meeting.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-blue-600" />
            <span className="font-semibold text-gray-700">End Time:</span>
            <span className="text-gray-900">{formatTime(meeting.endTime)}</span>
          </div>
        </div>

        {/* Location & Link */}
        {(meeting.location || meeting.meetingLink) && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {meeting.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-700">{meeting.location}</span>
              </div>
            )}
            {meeting.meetingLink && (
              <div className="flex items-center gap-2 text-sm">
                <Video size={16} className="text-gray-400" />
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Join Meeting Link
                </a>
              </div>
            )}
          </div>
        )}

        {/* Organizer Section */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-purple-600" />
            <span className="font-semibold text-sm text-gray-700">Organized by:</span>
          </div>
          <div className="flex items-center gap-3 ml-6">
            <img
              src={getImageUrl(meeting.organizer?.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.organizer?.name || 'User')}`}
              alt={meeting.organizer?.name}
              className="w-8 h-8 rounded-full border-2 border-purple-200"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.organizer?.name || 'User')}`;
              }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{meeting.organizer?.name}</p>
              <p className="text-xs text-gray-500">{meeting.organizer?.email}</p>
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-green-600" />
              <span className="font-semibold text-sm text-gray-700">Participants:</span>
            </div>
            <span className="text-xs text-gray-500">{acceptedCount}/{totalCount} accepted</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {meeting.participants?.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img
                    src={getImageUrl(participant.user?.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user?.name || 'User')}`}
                    alt={participant.user?.name}
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user?.name || 'User')}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.user?.name}
                      {participant.userId === user.id && <span className="text-xs text-gray-500 ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{participant.user?.email}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(participant.responseStatus)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Actions for Non-Organizers */}
        {!isOrganizer && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Response:</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={loading || responseStatus === 'accepted'}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  responseStatus === 'accepted'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <Check size={16} />
                Accept
              </button>
              <button
                onClick={() => handleResponse('declined')}
                disabled={loading || responseStatus === 'declined'}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  responseStatus === 'declined'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <X size={16} />
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
