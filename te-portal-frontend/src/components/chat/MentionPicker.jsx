import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getChannelMembers } from '../../api/channelApi';
import { getWorkspaceMembers } from '../../api/workspaceApi';
import { SOCKET_URL } from '../../utils/constants';

const MentionPicker = ({ isOpen, onClose, onSelectMention, isChannel = true, initialSearchQuery = '' }) => {
  const { token } = useSelector((state) => state.auth);
  const { channelId, workspaceId } = useParams();
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pickerRef = useRef(null);

  // Update search query when initialSearchQuery changes
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, channelId, workspaceId, isChannel]);

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchMembers = async () => {
    try {
      if (isChannel && channelId && workspaceId) {
        const response = await getChannelMembers(token, workspaceId, channelId);
        setMembers(response.data.members || []);
      } else if (!isChannel && workspaceId) {
        // For DMs, get all workspace members
        const response = await getWorkspaceMembers(token, workspaceId);
        setMembers(response.data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members for mention:', error);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (member) => {
    onSelectMention(member);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMembers[selectedIndex]) {
        handleSelect(filteredMembers[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  console.log('MentionPicker rendering:', { isOpen, membersCount: members.length, filteredCount: filteredMembers.length });

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-[9999]"
      onKeyDown={handleKeyDown}
      style={{ maxHeight: '400px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search members to mention..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          autoFocus
        />
      </div>

      {/* Members List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No members found
          </div>
        ) : (
          filteredMembers.map((member, index) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                {member.image ? (
                  <img
                    src={`${SOCKET_URL}${member.image}`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{member.name?.toLowerCase().replace(/\s+/g, '')}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        Use ↑↓ to navigate, Enter to select, Esc to close
      </div>
    </div>
  );
};

export default MentionPicker;
