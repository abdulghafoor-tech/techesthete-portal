import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingCard from './MeetingCard';
import { getMeetings } from '../../api/meetingsApi';
import socketService from '../../services/socketService';

const Calendar = () => {
  const { workspaceId } = useParams();
  const { token } = useSelector(state => state.auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId && token) {
      fetchMeetings();
    }
  }, [workspaceId, token]);

  // Socket listener for real-time meeting response updates
  // Requirements: 5.4, 5.5
  useEffect(() => {
    const handleMeetingResponseUpdate = (data) => {
      console.log('📅 Meeting response updated:', data);
      
      // Update the meetings state with the new response status
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => {
          if (meeting.id === data.meetingId) {
            return {
              ...meeting,
              participants: meeting.participants.map(participant => {
                if (participant.userId === data.participantId) {
                  return {
                    ...participant,
                    responseStatus: data.responseStatus
                  };
                }
                return participant;
              })
            };
          }
          return meeting;
        })
      );
    };

    const handleMeetingStatusChanged = (data) => {
      console.log('📅 Meeting status changed (from DM):', data);
      
      // Update the meetings state with the new response status
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => {
          if (meeting.id === data.meetingId) {
            return {
              ...meeting,
              participants: meeting.participants.map(participant => {
                if (participant.userId === data.participantId) {
                  return {
                    ...participant,
                    responseStatus: data.responseStatus
                  };
                }
                return participant;
              })
            };
          }
          return meeting;
        })
      );
    };

    // Add socket listeners
    if (socketService.socket) {
      socketService.socket.on('meeting_response_updated', handleMeetingResponseUpdate);
      socketService.socket.on('meeting_status_changed', handleMeetingStatusChanged);
    }

    // Cleanup listeners on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('meeting_response_updated', handleMeetingResponseUpdate);
        socketService.socket.off('meeting_status_changed', handleMeetingStatusChanged);
      }
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings(token, workspaceId);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getMeetingsForDate = (day) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return (
        meetingDate.getDate() === dateToCheck.getDate() &&
        meetingDate.getMonth() === dateToCheck.getMonth() &&
        meetingDate.getFullYear() === dateToCheck.getFullYear()
      );
    });
  };

  const selectedDateMeetings = getMeetingsForDate(selectedDate.getDate());

  return (
    <div className="flex h-full bg-white">
      {/* Calendar View */}
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Schedule Meeting
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Day Names */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-fr" style={{ gridTemplateRows: 'repeat(6, minmax(80px, 1fr))' }}>
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="border-r border-b border-gray-200 bg-gray-50"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayMeetings = getMeetingsForDate(day);
              
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-blue-50 transition ${
                    isSelectedDate(day) ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(day) 
                      ? 'w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full' 
                      : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  {dayMeetings.length > 0 && (
                    <div className="space-y-1">
                      {dayMeetings.slice(0, 2).map(meeting => (
                        <div
                          key={meeting.id}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded truncate"
                        >
                          {new Date(meeting.startTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })} {meeting.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayMeetings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meetings Sidebar */}
      <div className="w-96 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading meetings...</div>
        ) : selectedDateMeetings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No meetings scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDateMeetings.map(meeting => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting}
                onUpdate={fetchMeetings}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMeetings}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};

export default Calendar;
