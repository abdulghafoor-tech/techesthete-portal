import React, { useState, useEffect } from 'react';
import { Search, X, Hash, User, File, Clock } from 'lucide-react';
import Modal from './Modal';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    messages: [],
    channels: [],
    users: [],
    files: [],
  });
  const [activeTab, setActiveTab] = useState('all');

  console.log('🔥 SearchModal rendered, isOpen:', isOpen);

  if (!isOpen) {
    console.log('🔥 SearchModal not open, returning null');
    return null;
  }

  useEffect(() => {
    if (query.length > 2) {
      // Simulate search - in real app, call API
      const mockResults = {
        messages: [
          { id: 1, content: 'Sample message matching query', channel: 'general', sender: 'John Doe', timestamp: new Date() },
        ],
        channels: [
          { id: 1, name: 'general', type: 'public', memberCount: 15 },
        ],
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'online' },
        ],
        files: [
          { id: 1, name: 'document.pdf', size: '2.5 MB', uploadedBy: 'Jane Smith', timestamp: new Date() },
        ],
      };
      setResults(mockResults);
    } else {
      setResults({ messages: [], channels: [], users: [], files: [] });
    }
  }, [query]);

  const tabs = [
    { id: 'all', label: 'All', count: Object.values(results).flat().length },
    { id: 'messages', label: 'Messages', count: results.messages.length },
    { id: 'channels', label: 'Channels', count: results.channels.length },
    { id: 'users', label: 'People', count: results.users.length },
    { id: 'files', label: 'Files', count: results.files.length },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[600px]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, channels, people, and files..."
              className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {query.length === 0 ? (
            <div className="text-center text-slate-500 mt-20">
              <Search size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">Search your workspace</p>
              <p className="text-sm">Find messages, channels, people, and files</p>
            </div>
          ) : query.length < 3 ? (
            <div className="text-center text-slate-500 mt-20">
              <p className="text-sm">Type at least 3 characters to search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Messages */}
              {(activeTab === 'all' || activeTab === 'messages') && results.messages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Hash size={16} />
                    Messages
                  </h3>
                  <div className="space-y-2">
                    {results.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-medium">#{msg.channel}</span>
                          <span>•</span>
                          <span>{msg.sender}</span>
                          <span>•</span>
                          <span>{msg.timestamp.toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-800">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Channels */}
              {(activeTab === 'all' || activeTab === 'channels') && results.channels.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Hash size={16} />
                    Channels
                  </h3>
                  <div className="space-y-2">
                    {results.channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Hash size={20} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">#{channel.name}</p>
                            <p className="text-xs text-slate-500">{channel.memberCount} members</p>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <User size={16} />
                    People
                  </h3>
                  <div className="space-y-2">
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200">
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {(activeTab === 'all' || activeTab === 'files') && results.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <File size={16} />
                    Files
                  </h3>
                  <div className="space-y-2">
                    {results.files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <File size={20} className="text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>Uploaded by {file.uploadedBy}</span>
                              <span>•</span>
                              <span>{file.timestamp.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SearchModal;
