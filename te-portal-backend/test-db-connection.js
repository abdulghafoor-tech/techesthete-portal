// Test database connection and models
// Run with: node test-db-connection.js

const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const env = "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

async function testConnection() {
  try {
    console.log('🔵 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    console.log('\n🔵 Testing queries...');
    
    // Test Workspaces table
    const [workspaces] = await sequelize.query('SELECT * FROM Workspaces LIMIT 5');
    console.log('✅ Workspaces found:', workspaces.length);
    
    // Test WorkspaceMembers table
    const [members] = await sequelize.query('SELECT * FROM WorkspaceMembers LIMIT 5');
    console.log('✅ WorkspaceMembers found:', members.length);
    
    // Test Channels table
    const [channels] = await sequelize.query('SELECT * FROM Channels LIMIT 5');
    console.log('✅ Channels found:', channels.length);
    
    // Test ChannelMembers table
    const [channelMembers] = await sequelize.query('SELECT * FROM ChannelMembers LIMIT 5');
    console.log('✅ ChannelMembers found:', channelMembers.length);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
