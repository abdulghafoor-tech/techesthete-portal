import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Mail, Reply, MessageSquare, ExternalLink, Calendar, User } from 'lucide-react';
import Avatar from '../common/Avatar';
import { replyToEmailFromChannel } from '../../api/gmailApi';

const EmailMessage = ({ message, onReply, compact = false }) => {
  const { user, token } = useSelector((state) => state.auth);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const emailData = message.emailMetadata || {};
  const senderName = message.User?.name || message.senderName || 'Unknown User';
  const senderImage = message.User?.image || message.senderImage;

  // Debug: Log message data to see reply count
  console.log('📧 EmailMessage render:', {
    messageId: message.id,
    replyCount: message.replyCount,
    threadReplyCount: message.threadReplyCount,
    messageType: message.messageType
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEmailDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleReplyViaGmail = async () => {
    if (!replyBody.trim()) {
      setError('Reply body cannot be empty');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await replyToEmailFromChannel(
        token,
        emailData.emailId,
        emailData.threadId,
        emailData.from,
        `Re: ${emailData.subject}`,
        replyBody
      );

      setReplyBody('');
      setShowReplyForm(false);
      alert('Reply sent successfully via Gmail!');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDiscussInThread = () => {
    if (onReply) {
      onReply(message);
    }
  };

  // Extract email address from "Name <email@domain.com>" format
  const extractEmail = (emailString) => {
    const match = emailString?.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  };

  // Extract name from "Name <email@domain.com>" format
  const extractName = (emailString) => {
    const match = emailString?.match(/^(.+?)\s*</);
    return match ? match[1].trim() : emailString?.split('@')[0] || 'Unknown';
  };

  return (
    <div className="flex gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group">
      {/* Avatar */}
      <div className="mt-0.5">
        <Avatar
          src={senderImage}
          name={senderName}
          size="sm"
          online={false}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Sender name and time */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-[15px] text-slate-900">
            {senderName}
          </span>
          <span className="text-[12px] text-slate-500 font-medium">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Email Card - Compact or Full */}
        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm ${
          compact ? 'p-3' : 'p-4'
        }`}>
          {/* Email Header */}
          <div className={`flex items-start gap-3 pb-3 border-b border-blue-200 ${
            compact ? 'mb-2' : 'mb-3'
          }`}>
            <div className={`bg-blue-100 rounded-lg ${compact ? 'p-1.5' : 'p-2'}`}>
              <Mail size={compact ? 16 : 20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-slate-900 ${compact ? 'text-sm mb-0.5' : 'text-base mb-1'}`}>
                {emailData.subject || 'No Subject'}
              </h3>
              <div className={`flex flex-col gap-0.5 ${compact ? 'text-xs' : 'text-sm'} text-slate-600`}>
                <div className="flex items-center gap-2">
                  <User size={compact ? 12 : 14} />
                  <span className="font-medium">From:</span>
                  <span className="truncate">{extractName(emailData.from)}</span>
                </div>
                {!compact && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="font-medium">Date:</span>
                    <span>{formatEmailDate(emailData.date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Body Preview - Shorter in compact mode */}
          {!compact && (
            <div className="mb-3">
              <div className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 max-h-[200px] overflow-y-auto">
                {emailData.body?.text ? (
                  <pre className="whitespace-pre-wrap font-sans">
                    {emailData.body.text.substring(0, 500)}
                    {emailData.body.text.length > 500 && '...'}
                  </pre>
                ) : emailData.snippet ? (
                  <p>{emailData.snippet}</p>
                ) : (
                  <p className="text-slate-400 italic">No content available</p>
                )}
              </div>
            </div>
          )}

          {/* Compact snippet */}
          {compact && emailData.snippet && (
            <div className="mb-2">
              <p className="text-xs text-slate-600 line-clamp-2">{emailData.snippet}</p>
            </div>
          )}

          {/* Action Buttons - Hide in compact mode */}
          {!compact && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Reply size={16} />
                  Reply via Gmail
                </button>
                <button
                  onClick={handleDiscussInThread}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare size={16} />
                  Discuss in Thread
                </button>
                {emailData.emailId && (
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${emailData.emailId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open in Gmail
                  </a>
                )}
              </div>

              {/* Thread Replies Count - Clickable */}
              {(message.replyCount > 0 || message.threadReplyCount > 0) && (
                <button
                  onClick={handleDiscussInThread}
                  className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                  <MessageSquare size={16} />
                  {message.replyCount || message.threadReplyCount} {(message.replyCount || message.threadReplyCount) === 1 ? 'reply' : 'replies'}
                </button>
              )}

              {/* Reply Form */}
              {showReplyForm && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reply to {extractName(emailData.from)}
                  </label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    rows={4}
                    disabled={sending}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleReplyViaGmail}
                      disabled={sending || !replyBody.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyBody('');
                        setError(null);
                      }}
                      disabled={sending}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailMessage;
