import React, { useState } from 'react';
import { MessageSquare, Smile, Pin, Edit, Trash2, MoreHorizontal, Copy, Share } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageActions = ({ message, isOwnMessage, onReply, onReact, onEdit, onDelete, onPin }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleEmojiSelect = (emojiData) => {
    onReact(emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="absolute -top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-lg p-1">
        {/* Quick Reactions */}
        <button
          onClick={() => onReact('👍')}
          className="p-1.5 hover:bg-slate-100 rounded text-lg transition-colors"
          title="Thumbs up"
        >
          👍
        </button>
        <button
          onClick={() => onReact('❤️')}
          className="p-1.5 hover:bg-slate-100 rounded text-lg transition-colors"
          title="Heart"
        >
          ❤️
        </button>
        <button
          onClick={() => onReact('😂')}
          className="p-1.5 hover:bg-slate-100 rounded text-lg transition-colors"
          title="Laugh"
        >
          😂
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1"></div>

        {/* Reply */}
        <button
          onClick={onReply}
          className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          title="Reply in thread"
        >
          <MessageSquare size={16} className="text-slate-600" />
        </button>

        {/* More Emoji */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="Add reaction"
          >
            <Smile size={16} className="text-slate-600" />
          </button>
          <EmojiPicker
            isOpen={showEmoji}
            onClose={() => setShowEmoji(false)}
            onEmojiClick={handleEmojiSelect}
          />
        </div>

        {/* More Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="More actions"
          >
            <MoreHorizontal size={16} className="text-slate-600" />
          </button>

          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}></div>
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => { onEdit(); setShowMore(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit size={14} />
                      Edit message
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowMore(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete message
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                  </>
                )}
                <button
                  onClick={() => { onPin(); setShowMore(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Pin size={14} />
                  {message.isPinned ? 'Unpin' : 'Pin'} message
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(message.content); setShowMore(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy text
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Share size={14} />
                  Share message
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageActions;
