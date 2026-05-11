import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FileText, Image, File, Download, ExternalLink } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

const FilesView = ({ isChannel = true }) => {
  const { channelId, conversationId } = useParams();
  const { messagesByChannel, messagesByConversation } = useSelector((state) => state.message);
  
  // Get messages based on context
  const currentMessages = isChannel 
    ? (messagesByChannel[channelId] || [])
    : (messagesByConversation[conversationId] || []);
  
  // Extract all attachments from messages
  const allAttachments = currentMessages
    .filter(msg => msg.attachments && msg.attachments.length > 0)
    .flatMap(msg => 
      msg.attachments.map(attachment => ({
        ...attachment,
        messageId: msg.id,
        senderName: msg.senderName || 'Unknown',
        senderImage: msg.senderImage,
        createdAt: msg.createdAt
      }))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

  // Get file icon based on mimetype
  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) {
      return <Image size={20} className="text-blue-500" />;
    } else if (mimetype?.includes('pdf')) {
      return <FileText size={20} className="text-red-500" />;
    } else {
      return <File size={20} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (allAttachments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <File size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No files yet</h3>
          <p className="text-sm text-gray-500">Files shared in this conversation will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          All Files ({allAttachments.length})
        </h2>
        
        <div className="space-y-2">
          {allAttachments.map((attachment, index) => (
            <div
              key={`${attachment.id}-${index}`}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* File Icon or Thumbnail */}
                <div className="flex-shrink-0">
                  {attachment.mimetype?.startsWith('image/') ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(attachment.url)}
                        alt={attachment.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getFileIcon(attachment.mimetype)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {attachment.filename}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>{formatDate(attachment.createdAt)}</span>
                  </div>
                  
                  {/* Sender Info */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {attachment.senderImage ? (
                        <img
                          src={getImageUrl(attachment.senderImage)}
                          alt={attachment.senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        attachment.senderName?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{attachment.senderName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={getImageUrl(attachment.url)}
                    download={attachment.filename}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-blue-600"
                    title="Download"
                  >
                    <Download size={18} />
                  </a>
                  <a
                    href={getImageUrl(attachment.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-blue-600"
                    title="Open in new tab"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilesView;
