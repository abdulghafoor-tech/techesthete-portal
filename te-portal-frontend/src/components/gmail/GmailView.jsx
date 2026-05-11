import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import GmailConnect from './GmailConnect';
import GmailInbox from './GmailInbox';
import * as gmailApi from '../../api/gmailApi';

const GmailView = () => {
  const { token, user } = useSelector(state => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    // Check for OAuth callback status
    const gmailStatus = searchParams.get('gmail');
    const reason = searchParams.get('reason');
    const email = searchParams.get('email');
    
    if (gmailStatus === 'connected') {
      console.log('✅ Gmail connected successfully!', {
        user: user?.name,
        email: email
      });
      
      // Show success message
      alert(`Gmail connected successfully!\n\nAccount: ${email || 'Gmail account'}\nUser: ${user?.name || 'Unknown'}`);
      
      // Clean up URL
      searchParams.delete('gmail');
      searchParams.delete('reason');
      searchParams.delete('email');
      setSearchParams(searchParams, { replace: true });
      
      // Force recheck connection
      await checkConnection();
      
    } else if (gmailStatus === 'error') {
      console.error('❌ Gmail connection failed:', reason);
      
      // Map error reasons to user-friendly messages
      const errorMessages = {
        'oauth_denied': 'You denied access to Gmail. Please try again and grant permissions.',
        'token_exchange_failed': 'Failed to exchange OAuth token. Please check your Google Cloud Console settings.',
        'invalid_user': 'Invalid user session. Please log in again.',
        'user_not_found': 'User account not found. Please log in again.',
        'missing_params': 'OAuth callback missing required parameters.',
        'invalid_state': 'Invalid OAuth state parameter.',
        'unexpected_error': 'An unexpected error occurred. Please try again.'
      };
      
      const errorMessage = errorMessages[reason] || 'Failed to connect Gmail. Please try again.';
      alert(`Gmail Connection Failed\n\n${errorMessage}`);
      
      // Clean up URL
      searchParams.delete('gmail');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
      
      await checkConnection();
    } else {
      await checkConnection();
    }
  };

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await gmailApi.getGmailStatus(token);
      setIsConnected(response.data.connected);
      console.log('📧 Gmail connection status:', response.data.connected);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading Gmail...</div>
      </div>
    );
  }

  return isConnected ? <GmailInbox /> : <GmailConnect onConnected={() => setIsConnected(true)} />;
};

export default GmailView;
