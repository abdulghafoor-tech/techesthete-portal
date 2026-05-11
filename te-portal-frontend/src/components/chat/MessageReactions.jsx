import React from 'react';
import { Plus } from 'lucide-react';

const MessageReactions = ({ reactions = [], currentUserId, onAddReaction, onRemoveReaction }) => {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        userReacted: false,
        reactionId: null,
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.userId);
    
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].userReacted = true;
      acc[reaction.emoji].reactionId = reaction.id;
    }
    
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactionGroups.map((group, index) => (
        <button
          key={index}
          onClick={() => {
            if (group.userReacted) {
              onRemoveReaction(group.reactionId);
            } else {
              onAddReaction(group.emoji);
            }
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
            group.userReacted
              ? 'bg-blue-100 border border-blue-300 text-blue-700'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={`${group.count} reaction${group.count > 1 ? 's' : ''}`}
        >
          <span className="text-sm">{group.emoji}</span>
          <span className="text-xs font-semibold">{group.count}</span>
        </button>
      ))}
      
      <button
        onClick={() => onAddReaction()}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
        title="Add reaction"
      >
        <Plus size={12} className="text-slate-500" />
      </button>
    </div>
  );
};

export default MessageReactions;
