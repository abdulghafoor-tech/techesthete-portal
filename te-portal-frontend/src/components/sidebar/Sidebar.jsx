import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import ChannelSection from './ChannelSection';
import DirectMessageSection from './DirectMessageSection';
import InviteUserModal from '../workspace/InviteUserModal';
import UserProfile from './UserProfile';
import { MessageSquare, AtSign, Bookmark, UserPlus, Hash, Star, Mail, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-1.5 transition-colors text-sm font-medium ${
      active 
        ? 'bg-purple-700 text-white' 
        : 'text-purple-100 hover:bg-purple-700/50'
    }`}
  >
    <Icon size={18} className={active ? 'text-white' : 'text-purple-200'} />
    <span>{label}</span>
  </button>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [appsExpanded, setAppsExpanded] = useState(true);

  const activeWorkspaceId = workspaceId || currentWorkspace?.id;

  const handleGmailClick = () => {
    if (activeWorkspaceId) {
      navigate(`/workspace/${activeWorkspaceId}/gmail`);
    }
  };

  const handleCalendarClick = () => {
    if (activeWorkspaceId) {
      navigate(`/workspace/${activeWorkspaceId}/calendar`);
    }
  };

  return (
    <>
      <div
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-0'
        } bg-[#3f0e40] text-white flex flex-col transition-all duration-300 overflow-hidden shrink-0`}
      >
        {/* Workspace Header with Logo */}
        <SidebarHeader />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Quick Links */}
          <div className="py-2 border-b border-purple-800/30 mb-2">
            <SidebarItem icon={MessageSquare} label="Threads" />
            <SidebarItem icon={Hash} label="All DMs" />
            <SidebarItem icon={AtSign} label="Mentions & reactions" />
            <SidebarItem icon={Star} label="Saved items" />
            <SidebarItem 
              icon={UserPlus} 
              label="Invite People" 
              onClick={() => setShowInviteModal(true)}
            />
          </div>

          {/* Apps Section */}
          <div className="py-2 border-b border-purple-800/30 mb-2">
            <button
              onClick={() => setAppsExpanded(!appsExpanded)}
              className="w-full flex items-center gap-2 px-4 py-1.5 text-purple-100 hover:bg-purple-700/50 transition-colors text-sm font-medium"
            >
              {appsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Apps</span>
            </button>
            {appsExpanded && (
              <div className="mt-1">
                <SidebarItem icon={Mail} label="Gmail" onClick={handleGmailClick} />
                <SidebarItem icon={Calendar} label="Calendar" onClick={handleCalendarClick} />
              </div>
            )}
          </div>

          {/* Channels Section */}
          <ChannelSection />

          {/* Direct Messages Section */}
          <DirectMessageSection />
        </div>

        {/* User Profile at Bottom */}
        <UserProfile />
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
    </>
  );
};

export default Sidebar;