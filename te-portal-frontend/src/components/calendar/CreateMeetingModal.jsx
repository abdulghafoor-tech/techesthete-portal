import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { X, Clock, Users, MapPin, Video } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { createMeeting } from '../../api/meetingsApi';
import { getWorkspaceMembers } from '../../api/workspaceApi';
import { getImageUrl } from '../../utils/imageUtils';

const CreateMeetingModal = ({ isOpen, onClose, onSuccess, initialDate }) => {
  const { workspaceId } = useParams();
  const { token } = useSelector(state => state.auth);
  const { user } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    meetingLink: '',
    participantIds: []
  });
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspaceId && token) {
      fetchMembers();
    }
  }, [workspaceId, token]);

  const fetchMembers = async () => {
    try {
      const response = await getWorkspaceMembers(token, workspaceId);
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Meeting title is required');
      return;
    }

    if (!formData.participantIds.length) {
      setError('Please select at least one participant');
      return;
    }

    try {
      setLoading(true);
      
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const meetingData = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location,
        meetingLink: formData.meetingLink,
        participantIds: formData.participantIds // Don't add organizer here, backend will handle it
      };

      await createMeeting(token, workspaceId, meetingData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Meeting Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Team Standup"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Meeting agenda..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
          <Input
            label="Start Time"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
          <Input
            label="End Time"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-400" />
          <Input
            placeholder="Location (optional)"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <Video size={18} className="text-gray-400" />
          <Input
            placeholder="Meeting link (optional)"
            name="meetingLink"
            value={formData.meetingLink}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users size={18} className="inline mr-1" />
            Participants
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
            {members.map(member => (
              <label
                key={member.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.participantIds.includes(member.id)}
                  onChange={() => handleParticipantToggle(member.id)}
                  className="rounded text-blue-600"
                  disabled={member.id === user.id}
                />
                <img
                  src={getImageUrl(member.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                  alt={member.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`;
                  }}
                />
                <span className="text-sm">
                  {member.name}
                  {member.id === user.id && <span className="text-xs text-gray-500 ml-1">(You - Organizer)</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Schedule Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMeetingModal;
