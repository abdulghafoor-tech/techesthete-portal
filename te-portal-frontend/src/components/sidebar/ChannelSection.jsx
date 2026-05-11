import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import ChannelItem from '../channel/ChannelItem';
import CreateChannelModal from '../channel/CreateChannelModal';

const ChannelSection = () => {
  const dispatch = useDispatch();
  const { channels } = useSelector((state) => state.channel);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  console.log('📺 ChannelSection render - showChannelModal:', showChannelModal);

  return (
    <>
      <div className="px-3 py-2">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2 group">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[13px] font-semibold text-purple-200 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Channels</span>
          </button>
          <button
            onClick={() => {
              console.log('➕ Create channel button clicked');
              setShowChannelModal(true);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-purple-700 p-1 rounded transition text-purple-200"
            title="Create Channel"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Channel List */}
        {isExpanded && (
          <div className="space-y-0.5">
            {channels.length === 0 ? (
              <p className="text-sm text-purple-300 px-2 py-2 italic">No channels yet</p>
            ) : (
              channels.map((channel) => (
                <ChannelItem key={channel.id} channel={channel} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showChannelModal && (
        <CreateChannelModal onClose={() => setShowChannelModal(false)} />
      )}
    </>
  );
};

export default ChannelSection;