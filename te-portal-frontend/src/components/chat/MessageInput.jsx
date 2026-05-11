import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Paperclip, Smile, X, AtSign, Mic } from 'lucide-react';
import socketService from '../../services/socketService';
import EmojiPicker from './EmojiPicker';
import FilePreview from './FilePreview';
import VoiceRecorder from './VoiceRecorder';
import fileApi from '../../api/fileApi';
import { clearEditingMessage } from '../../redux/slices/messageSlice';
import MentionPicker from './MentionPicker';

const MessageInput = ({ isChannel = true, id, threadMessage = null }) => {
  const dispatch = useDispatch();
  const { currentChannel } = useSelector((state) => state.channel);
  const { editingMessage } = useSelector((state) => state.message);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const typingTimeoutRef = useRef(null);

  // Detect @ mentions while typing
  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    handleTyping();

    // Check if user typed @ to trigger mention picker
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only show mention picker if @ is at start or after a space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionSearchQuery(textAfterAt);
        setShowMentionPicker(true);
      } else {
        setShowMentionPicker(false);
      }
    } else {
      setShowMentionPicker(false);
    }
  };

  // Load message content when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || '');
      // Focus the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [editingMessage]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!id) return;

    // Emit typing start
    if (isChannel) {
      socketService.emitTypingStart(id);
    } else {
      socketService.emitDMTypingStart(id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isChannel) {
        socketService.emitTypingStop(id);
      } else {
        socketService.emitDMTypingStop(id);
      }
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Emit typing stop when component unmounts
      if (id) {
        if (isChannel) {
          socketService.emitTypingStop(id);
        } else {
          socketService.emitDMTypingStop(id);
        }
      }
    };
  }, [id, isChannel]);

  const handleSend = async () => {
    // If editing, save the edit
    if (editingMessage) {
      if (message.trim() && message.trim() !== editingMessage.content) {
        // Check if it's a direct message or channel message
        if (editingMessage.conversationId) {
          socketService.editDirectMessage(editingMessage.id, message.trim());
        } else if (editingMessage.channelId) {
          socketService.editMessage(editingMessage.id, message.trim());
        }
      }
      // Clear edit mode
      dispatch(clearEditingMessage());
      setMessage('');
      return;
    }

    // Allow sending if there's either text content or files
    if ((!message.trim() && files.length === 0) || !id) return;

    let attachments = [];

    // Upload files first
    if (files.length > 0) {
      try {
        const uploadPromises = files.map(async (file, index) => {
          try {
            const result = await fileApi.uploadFile(file);
            return result;
          } catch (error) {
            console.error(`File upload failed for ${file.name}:`, error.message);
            throw error;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        attachments = results.map(res => res.file);
      } catch (error) {
        console.error('File upload failed:', error.message);
        const errorMessage = error.message || 'Unknown error';
        alert(`File upload failed: ${errorMessage}`);
        return;
      }
    }

    // If replying to a thread, send as thread reply
    if (threadMessage) {
      socketService.sendThreadReply(
        id,
        threadMessage.id,
        message.trim() || '',
        attachments,
        isChannel
      );
    } else {
      // Normal message send
      if (isChannel) {
        socketService.sendMessage(id, message.trim() || '', attachments);
      } else {
        socketService.sendDirectMessage(id, message.trim() || '', attachments);
      }
    }

    setMessage('');
    setFiles([]);
    setShowEmoji(false);
  };

  const handleCancel = () => {
    dispatch(clearEditingMessage());
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      if (editingMessage) {
        handleCancel();
      }
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleMentionSelect = (member) => {
    // Find the last @ in the message
    const lastAtIndex = message.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Replace from @ to cursor with the mention
      const beforeAt = message.substring(0, lastAtIndex);
      const afterCursor = message.substring(inputRef.current?.selectionStart || message.length);
      const mentionText = `@${member.name?.replace(/\s+/g, '')} `;
      setMessage(beforeAt + mentionText + afterCursor);
    } else {
      // Fallback: just append the mention
      const mentionText = `@${member.name?.replace(/\s+/g, '')} `;
      setMessage((prev) => prev + mentionText);
    }
    
    setShowMentionPicker(false);
    setMentionSearchQuery('');
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="px-5 pb-5 bg-white relative">
      {/* Thread Reply Banner */}
      {threadMessage && (
        <div className="mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              Replying to thread: {threadMessage.messageType === 'email' ? threadMessage.emailMetadata?.subject : threadMessage.content?.substring(0, 50)}
            </span>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {editingMessage && (
        <div className="mb-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-yellow-800">Editing message</span>
            <span className="text-xs text-yellow-600">Press Escape to cancel</span>
          </div>
          <button
            onClick={handleCancel}
            className="text-yellow-600 hover:text-yellow-800 transition"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="border-2 border-slate-200 rounded-xl shadow-sm bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200 overflow-hidden">
        {/* File Previews */}
        {files.length > 0 && !editingMessage && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-gray-100">
            {files.map((file, index) => (
              <FilePreview key={index} file={file} onRemove={() => removeFile(index)} />
            ))}
          </div>
        )}

        {/* Toolbar Top (Formatting) */}
        <div className="flex items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50/50">
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><b className="font-bold">B</b></button>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><i className="italic">I</i></button>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><span className="underline italic">U</span></button>
          <div className="w-px h-5 bg-slate-200 mx-1.5"></div>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <span className="line-through font-medium">S</span>
          </button>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <span className="font-mono text-xs">{'</>'}</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={
              editingMessage 
                ? 'Edit your message...' 
                : threadMessage 
                  ? `Reply to thread...` 
                  : `Message ${isChannel ? `#${currentChannel?.name || 'channel'}` : 'Direct Message'}`
            }
            className="w-full px-4 py-2 min-h-[50px] outline-none max-h-[150px] overflow-y-auto text-sm resize-none bg-transparent"
            autoComplete="off"
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-50">
          <div className="flex items-center gap-1">
            {!editingMessage && (
              <>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors relative" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-[10px] font-bold">+</div>
                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                </button>
                <div className="w-px h-5 bg-slate-100 mx-1"></div>
              </>
            )}
            <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors relative">
              <Smile size={20} />
              <EmojiPicker isOpen={showEmoji} onClose={() => setShowEmoji(false)} onEmojiClick={onEmojiClick} />
            </button>
            <button 
              onClick={() => {
                console.log('@ button clicked, current state:', showMentionPicker);
                setShowMentionPicker(!showMentionPicker);
              }} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors relative"
              title="Mention someone"
            >
              <AtSign size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {editingMessage && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg transition-all bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!message.trim() && (!editingMessage && files.length === 0)}
              className={`px-4 py-2 rounded-lg transition-all transform active:scale-95 flex items-center gap-2 ${
                message.trim() || (!editingMessage && files.length > 0)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {editingMessage ? 'Save' : <Send size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-gray-400 mt-1 flex justify-end">
        {editingMessage ? (
          <>
            <strong>Return</strong> to save <span className="mx-1">•</span> <strong>Escape</strong> to cancel
          </>
        ) : (
          <>
            <strong>Return</strong> to send <span className="mx-1">•</span> <strong>Shift + Return</strong> to add a new line
          </>
        )}
      </div>

      {/* Mention Picker */}
      <MentionPicker
        isOpen={showMentionPicker}
        onClose={() => {
          setShowMentionPicker(false);
          setMentionSearchQuery('');
        }}
        onSelectMention={handleMentionSelect}
        isChannel={isChannel}
        initialSearchQuery={mentionSearchQuery}
      />
    </div>
  );
};

export default MessageInput;
