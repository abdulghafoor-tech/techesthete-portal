// Quick test script to debug channel creation
// Run with: node test-channel-creation.js

const axios = require('axios');

const API_URL = 'http://192.168.4.128:4000';

async function testChannelCreation() {
  try {
    console.log('🧪 Testing channel creation...\n');
    
    // You'll need to replace these with actual values
    const TOKEN = 'YOUR_AUTH_TOKEN_HERE';
    const WORKSPACE_ID = 'YOUR_WORKSPACE_ID_HERE';
    
    console.log('📝 Creating public channel...');
    const response = await axios.post(
      `${API_URL}/workspaces/${WORKSPACE_ID}/channels`,
      {
        name: 'test-public-channel',
        type: 'public',
        members: []
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Full error:', error);
  }
}

testChannelCreation();
