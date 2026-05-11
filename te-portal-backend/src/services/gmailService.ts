import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REDIRECT_URI) {
      throw new Error('Gmail OAuth credentials not configured in environment variables');
    }

    console.log('🔵 Initializing Gmail Service with credentials:', {
      clientId: process.env.GMAIL_CLIENT_ID?.substring(0, 20) + '...',
      hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
      redirectUri: process.env.GMAIL_REDIRECT_URI
    });
    
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth authorization URL
   * @param state - Stringified JSON containing userId and workspaceId
   */
  getAuthUrl(state: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent',  
      include_granted_scopes: true
    });
    console.log('🔵 Generated auth URL with state:', state);
    return authUrl;
  }

  
  async getTokensFromCode(code: string) {
    try {
      console.log('🔵 Exchanging authorization code for tokens...');
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('✅ Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date
      });
      return tokens;
    } catch (error: any) {
      console.error('❌ Token exchange failed:', {
        message: error.message,
        code: error.code,
        details: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get Gmail user profile
   */
  async getUserProfile(accessToken: string) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const response = await gmail.users.getProfile({
        userId: 'me'
      });

      console.log('✅ Gmail profile fetched:', response.data.emailAddress);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch Gmail profile:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      console.log('✅ Access token refreshed');
      return credentials;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.message);
      throw error;
    }
  }

  async listMessages(accessToken: string, maxResults: number = 20, pageToken?: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q: 'in:inbox'
    });

    return response.data;
  }

  async getMessage(accessToken: string, messageId: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return response.data;
  }

  async sendMessage(accessToken: string, to: string, subject: string, body: string, threadId?: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody: any = {
      raw: encodedMessage
    };

    // Add threadId if provided (for replies)
    if (threadId) {
      requestBody.threadId = threadId;
    }

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody
    });

    return response.data;
  }

  async markAsRead(accessToken: string, messageId: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }

  async markAsUnread(accessToken: string, messageId: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['UNREAD']
      }
    });
  }

  async deleteMessage(accessToken: string, messageId: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId
    });
  }

  parseEmailBody(message: any): { text: string; html: string } {
    let text = '';
    let html = '';

    const getBody = (parts: any[]) => {
      parts.forEach(part => {
        if (part.mimeType === 'text/plain' && part.body.data) {
          text = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          getBody(part.parts);
        }
      });
    };

    if (message.payload.parts) {
      getBody(message.payload.parts);
    } else if (message.payload.body.data) {
      text = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    return { text, html };
  }

  getHeader(message: any, headerName: string): string {
    const header = message.payload.headers.find(
      (h: any) => h.name.toLowerCase() === headerName.toLowerCase()
    );
    return header ? header.value : '';
  }
}

export default new GmailService();
