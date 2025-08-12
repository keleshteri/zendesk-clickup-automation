import { Env, OAuthTokens, ClickUpOAuthResponse, UserOAuthData } from '../../types/index.js';

export class OAuthService {
  private env: Env;
  private baseUrl: string = 'https://api.clickup.com/api/v2';
  private oauthUrl: string = 'https://app.clickup.com/api';

  constructor(env: Env) {
    this.env = env;
    
    // Validate required OAuth environment variables
    if (!env.CLICKUP_CLIENT_ID) {
      throw new Error('CLICKUP_CLIENT_ID environment variable is required for OAuth');
    }
    if (!env.CLICKUP_CLIENT_SECRET) {
      throw new Error('CLICKUP_CLIENT_SECRET environment variable is required for OAuth');
    }
    if (!env.CLICKUP_REDIRECT_URI) {
      throw new Error('CLICKUP_REDIRECT_URI environment variable is required for OAuth');
    }
  }

  /**
   * Generate OAuth authorization URL for ClickUp
   */
  generateAuthUrl(state?: string, scopes?: string[]): string {
    const params = new URLSearchParams({
      client_id: this.env.CLICKUP_CLIENT_ID,
      redirect_uri: this.env.CLICKUP_REDIRECT_URI,
      response_type: 'code'
    });

    if (state) {
      params.append('state', state);
    }

    // ✅ Add OAuth scopes for proper permissions
    const defaultScopes = ['task:read', 'task:write', 'list:read', 'team:read'];
    const requestedScopes = scopes || defaultScopes;
    if (requestedScopes.length > 0) {
      params.append('scope', requestedScopes.join(' '));
    }

    // ✅ Fixed: Use correct ClickUp OAuth authorization URL (no /oauth/authorize suffix)
    const authUrl = `${this.oauthUrl}?${params.toString()}`;
    console.log('🔗 Generated ClickUp OAuth URL:', authUrl);
    console.log('🔐 Requested scopes:', requestedScopes.join(', '));
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    console.log('🔄 Exchanging authorization code for access token...');

    try {
      // ✅ Fixed: Use correct ClickUp API v2 token endpoint
      const tokenUrl = `${this.baseUrl}/oauth/token`;
      const body = new URLSearchParams({
        client_id: this.env.CLICKUP_CLIENT_ID,
        client_secret: this.env.CLICKUP_CLIENT_SECRET,
        redirect_uri: this.env.CLICKUP_REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code
      });

      console.log('📡 Making token exchange request to:', tokenUrl);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OAuth token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`OAuth token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json() as ClickUpOAuthResponse;
      console.log('✅ OAuth token received successfully');

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: Date.now() + (3600 * 1000) // Default 1 hour expiration
      };
    } catch (error) {
      console.error('💥 Error during OAuth token exchange:', error);
      throw new Error(`OAuth token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user information using OAuth token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      console.log('👤 Fetching user information...');
      
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch user info:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json() as any;
      console.log('✅ User info fetched successfully:', userInfo.user?.username || 'Unknown user');
      return userInfo;
    } catch (error) {
      console.error('💥 Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Get user's accessible teams using OAuth token
   */
  async getUserTeams(accessToken: string): Promise<any[]> {
    try {
      console.log('🏢 Fetching user teams...');
      
      const response = await fetch(`${this.baseUrl}/team`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch user teams:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch user teams: ${response.status} ${response.statusText}`);
      }

      const teamsData = await response.json() as any;
      const teams = teamsData.teams || [];
      console.log(`✅ Found ${teams.length} accessible teams`);
      return teams;
    } catch (error) {
      console.error('💥 Error fetching user teams:', error);
      throw error;
    }
  }

  /**
   * Store user OAuth data in KV storage
   */
  async storeUserOAuth(userId: string, oauthData: UserOAuthData): Promise<void> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - OAuth data not stored');
      return;
    }

    try {
      const key = `oauth_${userId}`;
      await this.env.TASK_MAPPING.put(key, JSON.stringify(oauthData));
      console.log('💾 OAuth data stored for user:', userId);
    } catch (error) {
      console.error('💥 Error storing OAuth data:', error);
      throw error;
    }
  }

  /**
   * Retrieve user OAuth data from KV storage
   */
  async getUserOAuth(userId: string): Promise<UserOAuthData | null> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - cannot retrieve OAuth data');
      return null;
    }

    try {
      const key = `oauth_${userId}`;
      const data = await this.env.TASK_MAPPING.get(key);
      
      if (!data) {
        console.log('📭 No OAuth data found for user:', userId);
        return null;
      }

      const oauthData = JSON.parse(data) as UserOAuthData;
      console.log('✅ OAuth data retrieved for user:', userId);
      return oauthData;
    } catch (error) {
      console.error('💥 Error retrieving OAuth data:', error);
      return null;
    }
  }

  /**
   * Check if OAuth token is still valid
   */
  isTokenValid(oauthData: UserOAuthData): boolean {
    if (!oauthData.expires_at) {
      return true; // Assume valid if no expiration set
    }
    
    const isValid = Date.now() < oauthData.expires_at;
    console.log(`🔍 Token valid check for user: ${isValid ? '✅ Valid' : '❌ Expired'}`);
    return isValid;
  }

  /**
   * Generate a random state parameter for OAuth security
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate OAuth state parameter
   */
  async validateState(state: string, expectedState: string): Promise<boolean> {
    return state === expectedState;
  }
}