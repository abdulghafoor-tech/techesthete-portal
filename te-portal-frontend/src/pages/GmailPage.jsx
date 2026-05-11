import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import GmailView from '../components/gmail/GmailView';

const GmailPage = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <GmailView />
      </div>
    </div>
  );
};

export default GmailPage;
