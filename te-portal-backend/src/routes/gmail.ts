import { Router, Request, Response } from 'express';
import authenticateToken from '../../middleware/authMiddleware';
import gmailService from '../services/gmailService';
import db from '../../models';
import UserAppConnection from '../../models/UserAppConnection';

const gmailRouter = Router();
const { User } = db;

// Test endpoint to verify routes are working
gmailRouter.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Gmail routes are working!' });
});

// ============================================================================
// STEP 1: Get Gmail OAuth URL
// ============================================================================
gmailRouter.get('/auth-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { workspaceId } = req.query;
    
    console.log('📧 [Gmail Auth] Generating auth URL for user:', userId, 'workspace:', workspaceId);
    
    // Encode userId and workspaceId in state parameter
    const stateData = {
      userId: userId.toString(),
      workspaceId: workspaceId || null,
      timestamp: Date.now() // Add timestamp for security
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
    
    const authUrl = gmailService.getAuthUrl(state);
    console.log('✅ [Gmail Auth] Auth URL generated successfully');
    
    res.json({ authUrl });
  } catch (error: any) {
    console.error('❌ [Gmail Auth] Error generating auth URL:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate auth URL',
      error: error.message 
    });
  }
});

// ============================================================================
// STEP 2: Gmail OAuth Callback Handler
// ============================================================================
gmailRouter.get('/callback', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('\n🔔 [Gmail Callback] ========== OAuth Callback Received ==========');
  console.log('📥 [Gmail Callback] Query params:', JSON.stringify(req.query, null, 2));
  
  try {
    const { code, state, error: oauthError } = req.query;
    
    // Handle OAuth errors from Google
    if (oauthError) {
      console.error('❌ [Gmail Callback] OAuth error from Google:', oauthError);
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=oauth_denied`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ [Gmail Callback] Missing required parameters:', {
        hasCode: !!code,
        hasState: !!state
      });
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=missing_params`);
    }

    // Decode and parse state parameter
    console.log('🔍 [Gmail Callback] Decoding state parameter...');
    let stateData: any;
    let userId: number;
    let workspaceId: string | null = null;
    
    try {
      const decodedState = Buffer.from(state as string, 'base64url').toString('utf-8');
      stateData = JSON.parse(decodedState);
      userId = parseInt(stateData.userId);
      workspaceId = stateData.workspaceId;
      
      console.log('✅ [Gmail Callback] State decoded:', {
        userId,
        workspaceId,
        timestamp: stateData.timestamp
      });
    } catch (e) {
      console.error('❌ [Gmail Callback] Failed to decode state:', e);
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=invalid_state`);
    }
    
    // Validate userId
    if (isNaN(userId) || userId <= 0) {
      console.error('❌ [Gmail Callback] Invalid user ID:', userId);
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=invalid_user`);
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('❌ [Gmail Callback] User not found:', userId);
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=user_not_found`);
    }
    
    console.log('✅ [Gmail Callback] User verified:', user.email);
    
    // Exchange authorization code for tokens
    console.log('🔄 [Gmail Callback] Exchanging code for tokens...');
    let tokens;
    try {
      tokens = await gmailService.getTokensFromCode(code as string);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }
      
      console.log('✅ [Gmail Callback] Tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'
      });
    } catch (tokenError: any) {
      console.error('❌ [Gmail Callback] Token exchange failed:', {
        message: tokenError.message,
        code: tokenError.code,
        status: tokenError.status,
        details: tokenError.response?.data
      });
      return res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=token_exchange_failed`);
    }

    // Get Gmail user profile
    console.log('👤 [Gmail Callback] Fetching Gmail profile...');
    let gmailEmail = 'unknown@gmail.com';
    let profileData: any = {};
    
    try {
      const userInfo = await gmailService.getUserProfile(tokens.access_token);
      gmailEmail = userInfo.emailAddress || gmailEmail;
      profileData = {
        messagesTotal: userInfo.messagesTotal || 0,
        threadsTotal: userInfo.threadsTotal || 0,
        historyId: userInfo.historyId || ''
      };
      console.log('✅ [Gmail Callback] Gmail profile fetched:', gmailEmail);
    } catch (profileError: any) {
      console.warn('⚠️ [Gmail Callback] Failed to fetch profile (continuing anyway):', profileError.message);
    }

    // Save tokens to User table (backward compatibility)
    console.log('💾 [Gmail Callback] Saving to User table...');
    try {
      await User.update({
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token || null,
        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmailConnected: true
      }, {
        where: { id: userId }
      });
      console.log('✅ [Gmail Callback] User table updated');
    } catch (dbError: any) {
      console.error('❌ [Gmail Callback] Failed to update User table:', dbError.message);
      // Continue anyway - not critical
    }

    // Save to user_app_connections table
    console.log('💾 [Gmail Callback] Saving to user_app_connections...');
    try {
      await UserAppConnection.upsert({
        userId: userId,
        appType: 'gmail',
        email: gmailEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scopes: JSON.stringify(tokens.scope?.split(' ') || []),
        isActive: true,
        metadata: JSON.stringify(profileData)
      });
      console.log('✅ [Gmail Callback] user_app_connections updated');
    } catch (dbError: any) {
      console.error('❌ [Gmail Callback] Failed to update user_app_connections:', dbError.message);
      // Continue anyway
    }

    // Build redirect URL
    const redirectPath = workspaceId ? `/workspace/${workspaceId}/gmail` : '/';
    const redirectUrl = `${process.env.FRONTEND_URL}${redirectPath}?gmail=connected&email=${encodeURIComponent(gmailEmail)}`;
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Gmail Callback] Success! Redirecting to: ${redirectUrl}`);
    console.log(`⏱️ [Gmail Callback] Total time: ${duration}ms`);
    console.log('🔔 [Gmail Callback] ========== Callback Complete ==========\n');
    
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Gmail Callback] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.log('🔔 [Gmail Callback] ========== Callback Failed ==========\n');
    res.redirect(`${process.env.FRONTEND_URL}/?gmail=error&reason=unexpected_error`);
  }
});

// ============================================================================
// Check Gmail connection status
// ============================================================================
gmailRouter.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId, {
      attributes: ['gmailConnected']
    });

    res.json({ connected: user?.gmailConnected || false });
  } catch (error: any) {
    console.error('❌ [Gmail Status] Error:', error.message);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

// ============================================================================
// Disconnect Gmail
// ============================================================================
gmailRouter.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await User.update({
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailTokenExpiry: null,
      gmailConnected: false
    }, {
      where: { id: userId }
    });

    await UserAppConnection.update({
      isActive: false
    }, {
      where: { userId, appType: 'gmail' }
    });

    console.log('✅ [Gmail Disconnect] User', userId, 'disconnected');
    res.json({ message: 'Gmail disconnected successfully' });
  } catch (error: any) {
    console.error('❌ [Gmail Disconnect] Error:', error.message);
    res.status(500).json({ message: 'Failed to disconnect Gmail' });
  }
});

// ============================================================================
// Helper: Get valid access token (refresh if needed)
// ============================================================================
async function getValidAccessToken(userId: number): Promise<string> {
  const user = await User.findByPk(userId);
  
  if (!user || !user.gmailRefreshToken) {
    throw new Error('Gmail not connected');
  }

  // Check if token is expired
  const now = new Date();
  const expiry = user.gmailTokenExpiry ? new Date(user.gmailTokenExpiry) : null;
  
  if (!expiry || now >= expiry) {
    // Refresh token
    console.log('🔄 [Gmail Token] Refreshing expired token for user', userId);
    const tokens = await gmailService.refreshAccessToken(user.gmailRefreshToken);
    
    await User.update({
      gmailAccessToken: tokens.access_token,
      gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    }, {
      where: { id: userId }
    });
    
    return tokens.access_token!;
  }
  
  return user.gmailAccessToken!;
}

// ============================================================================
// Gmail API Endpoints
// ============================================================================

gmailRouter.get('/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { maxResults = 20, pageToken } = req.query;
    
    const accessToken = await getValidAccessToken(userId);
    const messages = await gmailService.listMessages(
      accessToken,
      Number(maxResults),
      pageToken as string
    );

    res.json(messages);
  } catch (error: any) {
    console.error('❌ [Gmail Messages] Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

gmailRouter.get('/messages/:messageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    
    const accessToken = await getValidAccessToken(userId);
    const message = await gmailService.getMessage(accessToken, messageId);
    
    const body = gmailService.parseEmailBody(message);
    const from = gmailService.getHeader(message, 'From');
    const to = gmailService.getHeader(message, 'To');
    const subject = gmailService.getHeader(message, 'Subject');
    const date = gmailService.getHeader(message, 'Date');
    
    res.json({
      id: message.id,
      threadId: message.threadId,
      labelIds: message.labelIds,
      snippet: message.snippet,
      from,
      to,
      subject,
      date,
      body
    });
  } catch (error: any) {
    console.error('❌ [Gmail Message] Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch message' });
  }
});

gmailRouter.post('/messages/send', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const accessToken = await getValidAccessToken(userId);
    const result = await gmailService.sendMessage(accessToken, to, subject, body);
    
    res.json({ message: 'Email sent successfully', id: result.id });
  } catch (error: any) {
    console.error('❌ [Gmail Send] Error:', error.message);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

gmailRouter.post('/messages/:messageId/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    
    const accessToken = await getValidAccessToken(userId);
    await gmailService.markAsRead(accessToken, messageId);
    
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    console.error('❌ [Gmail Mark Read] Error:', error.message);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

gmailRouter.post('/messages/:messageId/unread', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    
    const accessToken = await getValidAccessToken(userId);
    await gmailService.markAsUnread(accessToken, messageId);
    
    res.json({ message: 'Marked as unread' });
  } catch (error: any) {
    console.error('❌ [Gmail Mark Unread] Error:', error.message);
    res.status(500).json({ message: 'Failed to mark as unread' });
  }
});

gmailRouter.delete('/messages/:messageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    
    const accessToken = await getValidAccessToken(userId);
    await gmailService.deleteMessage(accessToken, messageId);
    
    res.json({ message: 'Message deleted' });
  } catch (error: any) {
    console.error('❌ [Gmail Delete] Error:', error.message);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// ============================================================================
// Share email to channel
// ============================================================================
gmailRouter.post('/share-to-channel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { emailId, channelId, workspaceId } = req.body;
    
    if (!emailId || !channelId || !workspaceId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    console.log('📧 [Gmail Share] Sharing email to channel:', { emailId, channelId, workspaceId, userId });
    
    // Get email details
    const accessToken = await getValidAccessToken(userId);
    const message = await gmailService.getMessage(accessToken, emailId);
    
    const body = gmailService.parseEmailBody(message);
    const from = gmailService.getHeader(message, 'From');
    const to = gmailService.getHeader(message, 'To');
    const subject = gmailService.getHeader(message, 'Subject');
    const date = gmailService.getHeader(message, 'Date');
    
    // Create channel message with email metadata
    const { ChannelMessage, User } = db;
    const channelMessage = await ChannelMessage.create({
      channelId: Number(channelId),
      senderId: userId,
      content: `📧 Shared email: ${subject}`,
      messageType: 'email',
      emailMetadata: {
        emailId: message.id,
        threadId: message.threadId,
        from,
        to,
        subject,
        date,
        body,
        snippet: message.snippet
      }
    });
    
    // Get user info for socket emission
    const user = await User.findByPk(userId);
    
    // Emit to channel via socket
    const io = (req as any).app.get('io');
    if (io) {
      const messageData = {
        id: channelMessage.id,
        channelId: Number(channelId),
        content: channelMessage.content,
        senderId: userId,
        senderName: user?.name || `User ${userId}`,
        senderImage: user?.image || null,
        createdAt: channelMessage.createdAt,
        messageType: 'email',
        emailMetadata: channelMessage.emailMetadata,
        isEdited: false,
        isPinned: false,
        replyCount: 0, // Initialize with 0 replies
      };
      
      io.to(`channel:${channelId}`).emit('new_message', messageData);
      console.log('✅ [Gmail Share] Email message emitted to channel via socket');
    }
    
    console.log('✅ [Gmail Share] Email shared to channel:', channelMessage.id);
    
    res.json({ 
      success: true, 
      message: 'Email shared to channel',
      channelMessage 
    });
  } catch (error: any) {
    console.error('❌ [Gmail Share] Error:', error.message);
    res.status(500).json({ message: 'Failed to share email' });
  }
});

// ============================================================================
// Reply to email from channel
// ============================================================================
gmailRouter.post('/reply-from-channel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { emailId, threadId, to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    console.log('📧 [Gmail Reply] Replying to email:', { emailId, threadId, to, subject });
    
    const accessToken = await getValidAccessToken(userId);
    const result = await gmailService.sendMessage(accessToken, to, subject, body, threadId);
    
    console.log('✅ [Gmail Reply] Reply sent:', result.id);
    
    res.json({ 
      success: true, 
      message: 'Reply sent successfully',
      id: result.id 
    });
  } catch (error: any) {
    console.error('❌ [Gmail Reply] Error:', error.message);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

export default gmailRouter;
