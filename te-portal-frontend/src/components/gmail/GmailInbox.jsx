import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, Send, Trash2, X, Share2 } from 'lucide-react';
import * as gmailApi from '../../api/gmailApi';
import { getChannels } from '../../api/channelApi';

const GmailInbox = () => {
  const { token } = useSelector(state => state.auth);
  const { workspaceId } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sharing, setSharing] = useState(false);

  // Reload messages whenever the Gmail page is accessed
  useEffect(() => {
    if (location.pathname.includes('/gmail')) {
      console.log('📧 Gmail page accessed - reloading messages');
      setSelectedMessage(null); // Reset selected message
      fetchMessages();
      fetchChannels();
    }
  }, [location.pathname, workspaceId]); // Re-fetch when route changes or workspaceId changes

  const fetchChannels = async () => {
    if (!workspaceId) return;
    
    try {
      const response = await getChannels(token, workspaceId);
      setChannels(response.data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await gmailApi.getGmailMessages(token);
      
      if (response.data.messages) {
        // Fetch details for each message
        const messageDetails = await Promise.all(
          response.data.messages.slice(0, 20).map(async (msg) => {
            try {
              const detail = await gmailApi.getGmailMessage(token, msg.id);
              return detail.data;
            } catch (error) {
              console.error('Error fetching message:', error);
              return null;
            }
          })
        );
        
        setMessages(messageDetails.filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if unread
    if (message.labelIds?.includes('UNREAD')) {
      try {
        await gmailApi.markGmailAsRead(token, message.id);
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === message.id 
            ? { ...m, labelIds: m.labelIds.filter(l => l !== 'UNREAD') }
            : m
        ));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Move this email to trash?')) return;
    
    try {
      await gmailApi.deleteGmailMessage(token, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    try {
      await gmailApi.sendGmailMessage(token, composeData.to, composeData.subject, composeData.body);
      alert('Email sent successfully!');
      setShowCompose(false);
      setComposeData({ to: '', subject: '', body: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleShareToChannel = async () => {
    if (!selectedChannel || !selectedMessage) return;
    
    setSharing(true);
    try {
      await gmailApi.shareEmailToChannel(
        token,
        selectedMessage.id,
        selectedChannel,
        workspaceId
      );
      alert('Email shared to channel successfully!');
      setShowShareModal(false);
      setSelectedChannel(null);
    } catch (error) {
      console.error('Error sharing email:', error);
      alert('Failed to share email to channel');
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Email List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Mail size={24} className="text-blue-600" />
              Gmail
            </h2>
            <div className="flex gap-2">
              <button
                onClick={fetchMessages}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowCompose(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                title="Compose"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto">
          {loading && messages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No messages</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                } ${message.labelIds?.includes('UNREAD') ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-sm truncate flex-1 ${
                    message.labelIds?.includes('UNREAD') ? 'font-bold text-gray-900' : 'text-gray-700'
                  }`}>
                    {message.from}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">{formatDate(message.date)}</span>
                </div>
                <div className={`text-sm mb-1 truncate ${
                  message.labelIds?.includes('UNREAD') ? 'font-semibold text-gray-900' : 'text-gray-800'
                }`}>
                  {message.subject || '(no subject)'}
                </div>
                <div className="text-xs text-gray-500 truncate">{message.snippet}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            {/* Email Header */}
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedMessage.subject || '(no subject)'}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition flex items-center gap-2"
                    title="Share to Channel"
                  >
                    <Share2 size={20} />
                    <span className="text-sm font-medium">Share to Channel</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="text-gray-600">{selectedMessage.from}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">To:</span>
                  <span className="text-gray-600">{selectedMessage.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600">{new Date(selectedMessage.date).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {selectedMessage.body.html ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body.html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-800">
                  {selectedMessage.body.text}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Mail size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">New Message</h3>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-4 space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="To"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Message"
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-64 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share to Channel Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Share to Channel</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select a channel to share this email:
              </p>
              <p className="font-semibold text-gray-900 mb-4 truncate">
                {selectedMessage?.subject || '(no subject)'}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {channels.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No channels available</p>
                ) : (
                  channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        selectedChannel === channel.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#</span>
                        <span className="font-medium text-gray-900">{channel.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShareToChannel}
                  disabled={!selectedChannel || sharing}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? 'Sharing...' : 'Share'}
                </button>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedChannel(null);
                  }}
                  disabled={sharing}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailInbox;
