import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Mail, Link as LinkIcon, Unlink } from 'lucide-react';
import * as gmailApi from '../../api/gmailApi';

const GmailConnect = ({ onConnected }) => {
  const { token } = useSelector(state => state.auth);
  const { workspaceId } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await gmailApi.getGmailStatus(token);
      setIsConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await gmailApi.getGmailAuthUrl(token, workspaceId);
      // Open Gmail OAuth in new window
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Failed to connect Gmail');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return;
    
    try {
      await gmailApi.disconnectGmail(token);
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      alert('Failed to disconnect Gmail');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isConnected) {
    if (onConnected) {
      onConnected();
      return null;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md text-center">
          <Mail size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gmail Connected</h2>
          <p className="text-gray-600 mb-6">Your Gmail account is successfully connected.</p>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Unlink size={20} />
            Disconnect Gmail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md text-center shadow-lg">
        <Mail size={64} className="mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Gmail</h2>
        <p className="text-gray-600 mb-6">
          Connect your Gmail account to read and send emails directly from this app.
        </p>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <LinkIcon size={20} />
          Connect Gmail Account
        </button>
        <p className="text-xs text-gray-500 mt-4">
          You'll be redirected to Google to authorize access
        </p>
      </div>
    </div>
  );
};

export default GmailConnect;
