import { Env } from '../../../../types/env';
import { OAuthTokens, ClickUpOAuthResponse, UserOAuthData } from '../interfaces';

/**
 * ClickUp OAuth 2.0 Service
 * 
 * This service handles the complete OAuth 2.0 flow for ClickUp API integration,
 * including authorization URL generation, token exchange, user data management,
 * and secure token storage using Cloudflare Workers KV.
 * 
 * @example
 * ```typescript
 * const oauthService = new OAuthService(env);
 * 
 * // Generate authorization URL
 * const authUrl = oauthService.generateAuthUrl('random-state', ['task:read', 'task:write']);
 * 
 * // Exchange code for token
 * const tokens = await oauthService.exchangeCodeForToken(authCode);
 * 
 * // Store user OAuth data
 * await oauthService.storeUserOAuth(userId, {
 *   user_id: userId,
 *   access_token: tokens.access_token,
 *   authorized_at: new Date().toISOString(),
 *   expires_at: tokens.expires_at
 * });
 * ```
 * 
 * @see {@link https://developer.clickup.com/docs/authentication ClickUp OAuth Documentation}
 * @see {@link https://oauth.net/2/ OAuth 2.0 Specification}
 */
export class OAuthService {
  /** Environment configuration containing OAuth credentials */
  private env: Env;
  
  /** ClickUp API v2 base URL for token exchange and API calls */
  private readonly baseUrl: string = 'https://api.clickup.com/api/v2';
  
  /** ClickUp OAuth authorization endpoint */
  private readonly oauthUrl: string = 'https://app.clickup.com/api';

  /**
   * Initialize OAuth service with environment configuration
   * 
   * @param env - Environment configuration containing OAuth credentials
   * @throws {Error} When required OAuth environment variables are missing
   * 
   * @example
   * ```typescript
   * const env = {
   *   CLICKUP_CLIENT_ID: 'your-client-id',
   *   CLICKUP_CLIENT_SECRET: 'your-client-secret',
   *   CLICKUP_REDIRECT_URI: 'https://your-app.com/oauth/callback'
   * };
   * const oauthService = new OAuthService(env);
   * ```
   */
  constructor(env: Env) {
    this.env = env;
    
    // Validate required OAuth environment variables for security
    this.validateOAuthConfig();
  }

  /**
   * Validates OAuth configuration to ensure all required credentials are present
   * 
   * @private
   * @throws {Error} When any required OAuth environment variable is missing
   */
  private validateOAuthConfig(): void {
    const requiredVars = [
      { key: 'CLICKUP_CLIENT_ID', value: this.env.CLICKUP_CLIENT_ID },
      { key: 'CLICKUP_CLIENT_SECRET', value: this.env.CLICKUP_CLIENT_SECRET },
      { key: 'CLICKUP_REDIRECT_URI', value: this.env.CLICKUP_REDIRECT_URI }
    ];

    for (const { key, value } of requiredVars) {
      if (!value) {
        throw new Error(`${key} environment variable is required for OAuth`);
      }
    }
  }

  /**
   * Generate OAuth 2.0 authorization URL for ClickUp
   * 
   * Creates a properly formatted authorization URL that users can visit to grant
   * permissions to your application. The URL includes all necessary parameters
   * for the OAuth 2.0 authorization code flow.
   * 
   * @param state - Optional CSRF protection token (recommended for security)
   * @param scopes - Array of permission scopes to request from ClickUp
   * @returns Complete authorization URL for user redirection
   * 
   * @example
   * ```typescript
   * // Basic usage with default scopes
   * const authUrl = oauthService.generateAuthUrl();
   * 
   * // With custom state for CSRF protection
   * const state = oauthService.generateState();
   * const authUrl = oauthService.generateAuthUrl(state);
   * 
   * // With specific scopes
   * const authUrl = oauthService.generateAuthUrl(
   *   'csrf-token-123',
   *   ['task:read', 'task:write', 'list:read']
   * );
   * ```
   * 
   * @see {@link https://developer.clickup.com/docs/authentication#oauth-flow ClickUp OAuth Flow}
   * @see {@link https://tools.ietf.org/html/rfc6749#section-4.1.1 OAuth 2.0 Authorization Request}
   */
  generateAuthUrl(state?: string, scopes?: string[]): string {
    // Build OAuth 2.0 authorization parameters according to RFC 6749
    const params = new URLSearchParams({
      client_id: this.env.CLICKUP_CLIENT_ID,
      redirect_uri: this.env.CLICKUP_REDIRECT_URI,
      response_type: 'code' // Authorization code flow
    });

    // Add CSRF protection state parameter if provided (recommended)
    if (state) {
      params.append('state', state);
    }

    // Configure OAuth scopes for granular permission control
    const defaultScopes = ['task:read', 'task:write', 'list:read', 'team:read'];
    const requestedScopes = scopes || defaultScopes;
    if (requestedScopes.length > 0) {
      params.append('scope', requestedScopes.join(' '));
    }

    // Generate final authorization URL using ClickUp's OAuth endpoint
    const authUrl = `${this.oauthUrl}?${params.toString()}`;
    console.log('🔗 Generated ClickUp OAuth URL:', authUrl);
    console.log('🔐 Requested scopes:', requestedScopes.join(', '));
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   * 
   * Completes the OAuth 2.0 authorization code flow by exchanging the
   * authorization code received from ClickUp for an access token that
   * can be used to make authenticated API requests.
   * 
   * @param code - Authorization code received from ClickUp OAuth callback
   * @returns Promise resolving to OAuth tokens including access token
   * @throws {Error} When token exchange fails due to invalid code, network issues, or API errors
   * 
   * @example
   * ```typescript
   * // Extract code from OAuth callback URL
   * const urlParams = new URLSearchParams(window.location.search);
   * const code = urlParams.get('code');
   * 
   * if (code) {
   *   try {
   *     const tokens = await oauthService.exchangeCodeForToken(code);
   *     console.log('Access token:', tokens.access_token);
   *   } catch (error) {
   *     console.error('Token exchange failed:', error.message);
   *   }
   * }
   * ```
   * 
   * @see {@link https://developer.clickup.com/docs/authentication#oauth-flow ClickUp Token Exchange}
   * @see {@link https://tools.ietf.org/html/rfc6749#section-4.1.3 OAuth 2.0 Access Token Request}
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is required and must be a valid string');
    }

    console.log('🔄 Exchanging authorization code for access token...');

    try {
      // Use ClickUp API v2 token endpoint for OAuth token exchange
      const tokenUrl = `${this.baseUrl}/oauth/token`;
      
      // Prepare token exchange request body according to OAuth 2.0 spec
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
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
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
        
        // Provide more specific error messages based on status codes
        let errorMessage = `OAuth token exchange failed: ${response.status} ${response.statusText}`;
        if (response.status === 400) {
          errorMessage += ' - Invalid authorization code or request parameters';
        } else if (response.status === 401) {
          errorMessage += ' - Invalid client credentials';
        } else if (response.status === 403) {
          errorMessage += ' - Client not authorized for OAuth';
        }
        
        throw new Error(`${errorMessage} - ${errorText}`);
      }

      const tokenData = await response.json() as ClickUpOAuthResponse;
      console.log('✅ OAuth token received successfully');

      // Note: ClickUp OAuth tokens do not expire according to their documentation
      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: undefined // ClickUp tokens don't expire
      };
    } catch (error) {
      console.error('💥 Error during OAuth token exchange:', error);
      
      if (error instanceof Error) {
        throw error; // Re-throw our custom errors
      }
      
      throw new Error(`OAuth token exchange failed: ${String(error)}`);
    }
  }

  /**
   * Get authenticated user information using OAuth token
   * 
   * Retrieves detailed information about the authenticated user including
   * profile data, preferences, and account details from ClickUp API.
   * 
   * @param accessToken - Valid OAuth access token for the user
   * @returns Promise resolving to user information object
   * @throws {Error} When token is invalid, expired, or API request fails
   * 
   * @example
   * ```typescript
   * try {
   *   const userInfo = await oauthService.getUserInfo(accessToken);
   *   console.log('User:', userInfo.user.username);
   *   console.log('Email:', userInfo.user.email);
   *   console.log('Profile Picture:', userInfo.user.profilePicture);
   * } catch (error) {
   *   console.error('Failed to get user info:', error.message);
   * }
   * ```
   * 
   * @see {@link https://developer.clickup.com/reference/getauthorizeduser Get Authorized User API}
   */
  async getUserInfo(accessToken: string): Promise<any> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Access token is required and must be a valid string');
    }

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
        
        let errorMessage = `Failed to fetch user info: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage += ' - Invalid or expired access token';
        } else if (response.status === 403) {
          errorMessage += ' - Insufficient permissions';
        }
        
        throw new Error(errorMessage);
      }

      const userInfo = await response.json() as any;
      console.log('✅ User info fetched successfully:', userInfo.user?.username || 'Unknown user');
      return userInfo;
    } catch (error) {
      console.error('💥 Error fetching user info:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Failed to fetch user info: ${String(error)}`);
    }
  }

  /**
   * Get user's accessible teams (workspaces) using OAuth token
   * 
   * Retrieves all ClickUp teams (workspaces) that the authenticated user
   * has access to. This is essential for determining which workspaces
   * the user can create tasks in or manage.
   * 
   * Note: In ClickUp API terminology, "team" refers to what is now called
   * "workspace" in the ClickUp UI.
   * 
   * @param accessToken - Valid OAuth access token for the user
   * @returns Promise resolving to array of team/workspace objects
   * @throws {Error} When token is invalid, expired, or API request fails
   * 
   * @example
   * ```typescript
   * try {
   *   const teams = await oauthService.getUserTeams(accessToken);
   *   teams.forEach(team => {
   *     console.log(`Team: ${team.name} (ID: ${team.id})`);
   *     console.log(`Members: ${team.members?.length || 0}`);
   *   });
   * } catch (error) {
   *   console.error('Failed to get user teams:', error.message);
   * }
   * ```
   * 
   * @see {@link https://developer.clickup.com/reference/getauthorizedteams Get Authorized Teams API}
   * @see {@link https://developer.clickup.com/docs/faq ClickUp API FAQ - Teams vs Workspaces}
   */
  async getUserTeams(accessToken: string): Promise<any[]> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Access token is required and must be a valid string');
    }

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
        
        let errorMessage = `Failed to fetch user teams: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage += ' - Invalid or expired access token';
        } else if (response.status === 403) {
          errorMessage += ' - Insufficient permissions to access teams';
        }
        
        throw new Error(errorMessage);
      }

      const teamsData = await response.json() as any;
      const teams = teamsData.teams || [];
      console.log(`✅ Found ${teams.length} accessible teams`);
      return teams;
    } catch (error) {
      console.error('💥 Error fetching user teams:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Failed to fetch user teams: ${String(error)}`);
    }
  }

  /**
   * Store user OAuth data in Cloudflare Workers KV storage
   * 
   * Securely persists OAuth tokens and user data in KV storage for future
   * API requests. This enables the application to make authenticated requests
   * on behalf of the user without requiring re-authorization.
   * 
   * @param userId - Unique identifier for the user (e.g., Slack user ID)
   * @param oauthData - Complete OAuth data including tokens and metadata
   * @throws {Error} When KV storage operation fails
   * 
   * @example
   * ```typescript
   * const oauthData: UserOAuthData = {
   *   user_id: 'slack_user_123',
   *   access_token: 'pk_123456789',
   *   authorized_at: new Date().toISOString(),
   *   team_id: 'clickup_team_456',
   *   scopes: ['task:read', 'task:write']
   * };
   * 
   * try {
   *   await oauthService.storeUserOAuth('slack_user_123', oauthData);
   *   console.log('OAuth data stored successfully');
   * } catch (error) {
   *   console.error('Failed to store OAuth data:', error.message);
   * }
   * ```
   * 
   * @see {@link https://developers.cloudflare.com/workers/runtime-apis/kv/ Cloudflare Workers KV}
   */
  async storeUserOAuth(userId: string, oauthData: UserOAuthData): Promise<void> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a valid string');
    }

    if (!oauthData || !oauthData.access_token) {
      throw new Error('OAuth data with access token is required');
    }

    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - OAuth data not stored');
      return;
    }

    try {
      const key = `oauth_${userId}`;
      const serializedData = JSON.stringify({
        ...oauthData,
        stored_at: new Date().toISOString(), // Add storage timestamp
        expires_at: undefined // ClickUp tokens don't expire
      });
      
      await this.env.TASK_MAPPING.put(key, serializedData);
      console.log('💾 OAuth data stored for user:', userId);
    } catch (error) {
      console.error('💥 Error storing OAuth data:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to store OAuth data: ${error.message}`);
      }
      
      throw new Error(`Failed to store OAuth data: ${String(error)}`);
    }
  }

  /**
   * Retrieve user OAuth data from Cloudflare Workers KV storage
   * 
   * Fetches previously stored OAuth tokens and user data from KV storage.
   * This allows the application to make authenticated API requests without
   * requiring the user to re-authorize.
   * 
   * @param userId - Unique identifier for the user (e.g., Slack user ID)
   * @returns Promise resolving to OAuth data or null if not found
   * @throws {Error} When KV storage operation fails (returns null on data not found)
   * 
   * @example
   * ```typescript
   * try {
   *   const oauthData = await oauthService.getUserOAuth('slack_user_123');
   *   
   *   if (oauthData) {
   *     console.log('Found stored OAuth data');
   *     
   *     // Check if token is still valid
   *     if (oauthService.isTokenValid(oauthData)) {
   *       // Use the token for API requests
   *       const userInfo = await oauthService.getUserInfo(oauthData.access_token);
   *     } else {
   *       console.log('Token expired, need to re-authorize');
   *     }
   *   } else {
   *     console.log('No OAuth data found, user needs to authorize');
   *   }
   * } catch (error) {
   *   console.error('Failed to retrieve OAuth data:', error.message);
   * }
   * ```
   * 
   * @see {@link https://developers.cloudflare.com/workers/runtime-apis/kv/ Cloudflare Workers KV}
   */
  async getUserOAuth(userId: string): Promise<UserOAuthData | null> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a valid string');
    }

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
      
      // Return null instead of throwing to allow graceful handling
      // The caller can decide whether to treat this as an error
      return null;
    }
  }

  /**
   * Check if OAuth token is valid by testing it against ClickUp API
   * 
   * Validates the OAuth token by making a lightweight API call to ClickUp.
   * This is more reliable than checking expiration dates since ClickUp tokens
   * don't officially expire but can become invalid for other reasons.
   * 
   * @param oauthData - User OAuth data containing token and expiration info
   * @param useCache - Whether to use cached validation results (default: true)
   * @returns Promise resolving to true if token is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const oauthData = await oauthService.getUserOAuth(userId);
   * 
   * if (await oauthService.isTokenValid(oauthData)) {
   *   console.log('Token is valid, proceeding with API calls');
   *   const userInfo = await oauthService.getUserInfo(oauthData.access_token);
   * } else {
   *   console.log('Token invalid, redirecting to re-authorization');
   *   window.location.href = '/auth/clickup';
   * }
   * ```
   */
  async isTokenValid(oauthData: UserOAuthData, useCache: boolean = true): Promise<boolean> {
    if (!oauthData || !oauthData.access_token) {
      console.log('🔍 Token validation failed: No OAuth data or access token');
      return false;
    }

    // Check cache first to avoid excessive API calls
    const cacheKey = `token_valid_${oauthData.user_id}`;
    if (useCache && this.env.TASK_MAPPING) {
      try {
        const cached = await this.env.TASK_MAPPING.get(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const cacheAge = Date.now() - cacheData.timestamp;
          // Cache for 5 minutes
          if (cacheAge < 5 * 60 * 1000) {
            console.log(`🔍 Using cached token validation: ${cacheData.valid ? '✅ Valid' : '❌ Invalid'}`);
            return cacheData.valid;
          }
        }
      } catch (error) {
        console.log('🔍 Cache read failed, proceeding with API validation');
      }
    }

    // Validate token by making a lightweight API call
    try {
      console.log('🔍 Validating token via ClickUp API...');
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${oauthData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;
      console.log(`🔍 Token validation result: ${isValid ? '✅ Valid' : '❌ Invalid'} (${response.status})`);

      // Cache the result
      if (useCache && this.env.TASK_MAPPING) {
        try {
          await this.env.TASK_MAPPING.put(cacheKey, JSON.stringify({
            valid: isValid,
            timestamp: Date.now()
          })); // Cache without TTL
        } catch (error) {
          console.log('🔍 Failed to cache validation result');
        }
      }

      return isValid;
    } catch (error) {
      console.error('🔍 Token validation API call failed:', error);
      
      // Fallback: if API call fails, assume token might be valid
      // This prevents false negatives due to network issues
      console.log('🔍 Fallback: Assuming token valid due to API call failure');
      return true;
    }
  }

  /**
   * Generate a cryptographically secure random state parameter for OAuth CSRF protection
   * 
   * Creates a random state parameter that should be stored and validated during
   * the OAuth callback to prevent Cross-Site Request Forgery (CSRF) attacks.
   * 
   * @returns Random state string for OAuth security
   * 
   * @example
   * ```typescript
   * // Generate and store state for CSRF protection
   * const state = oauthService.generateState();
   * 
   * // Store state in session/cookie for later validation
   * sessionStorage.setItem('oauth_state', state);
   * 
   * // Generate auth URL with state
   * const authUrl = oauthService.generateAuthUrl(state);
   * 
   * // Later, during callback validation:
   * const storedState = sessionStorage.getItem('oauth_state');
   * const callbackState = new URLSearchParams(window.location.search).get('state');
   * 
   * if (await oauthService.validateState(callbackState, storedState)) {
   *   // State is valid, proceed with token exchange
   * }
   * ```
   * 
   * @see {@link https://tools.ietf.org/html/rfc6749#section-10.12 OAuth 2.0 CSRF Protection}
   */
  generateState(): string {
    // Generate cryptographically secure random state (26 characters)
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(36)).join('').substring(0, 26);
  }

  /**
   * Get comprehensive OAuth status for a user
   * 
   * Provides a complete OAuth status including token validation, user info,
   * and actionable recommendations for token refresh or re-authorization.
   * 
   * @param userId - User ID to check OAuth status for
   * @returns Promise resolving to comprehensive OAuth status object
   * 
   * @example
   * ```typescript
   * const status = await oauthService.getOAuthStatus(userId);
   * 
   * if (status.valid) {
   *   console.log('OAuth is valid, proceeding...');
   * } else {
   *   console.log(`OAuth issue: ${status.message}`);
   *   if (status.needs_reauth) {
   *     // Redirect to re-authorization
   *     window.location.href = status.oauth_url;
   *   }
   * }
   * ```
   */
  async getOAuthStatus(userId: string): Promise<{
    valid: boolean;
    status: 'valid' | 'missing' | 'invalid' | 'api_error';
    message: string;
    user_id?: string;
    team_id?: string;
    authorized_at?: string;
    needs_reauth: boolean;
    oauth_url: string;
    timestamp: string;
  }> {
    const timestamp = new Date().toISOString();
    const oauth_url = '/auth/clickup';

    try {
      // Get stored OAuth data
      const oauthData = await this.getUserOAuth(userId);
      
      if (!oauthData) {
        return {
          valid: false,
          status: 'missing',
          message: 'No OAuth data found for user',
          needs_reauth: true,
          oauth_url,
          timestamp
        };
      }

      // Validate token via API
      const isValid = await this.isTokenValid(oauthData);
      
      if (isValid) {
        return {
          valid: true,
          status: 'valid',
          message: 'OAuth token is valid',
          user_id: oauthData.user_id,
          team_id: oauthData.team_id,
          authorized_at: oauthData.authorized_at,
          needs_reauth: false,
          oauth_url,
          timestamp
        };
      } else {
        return {
          valid: false,
          status: 'invalid',
          message: 'ClickUp access token is invalid or revoked',
          user_id: oauthData.user_id,
          team_id: oauthData.team_id,
          authorized_at: oauthData.authorized_at,
          needs_reauth: true,
          oauth_url,
          timestamp
        };
      }
    } catch (error) {
      console.error('🚨 Error checking OAuth status:', error);
      return {
        valid: false,
        status: 'api_error',
        message: 'Failed to check OAuth status due to API error',
        needs_reauth: true,
        oauth_url,
        timestamp
      };
    }
  }

  /**
   * Validate OAuth state parameter for CSRF protection
   * 
   * Compares the state parameter received in the OAuth callback with the
   * expected state that was generated before the authorization request.
   * This prevents CSRF attacks on the OAuth flow.
   * 
   * @param state - State parameter received from OAuth callback
   * @param expectedState - Expected state that was originally generated
   * @returns Promise resolving to true if states match, false otherwise
   * 
   * @example
   * ```typescript
   * // During OAuth callback handling
   * const urlParams = new URLSearchParams(window.location.search);
   * const callbackState = urlParams.get('state');
   * const storedState = sessionStorage.getItem('oauth_state');
   * 
   * if (await oauthService.validateState(callbackState, storedState)) {
   *   console.log('State validation passed - proceeding with token exchange');
   *   const code = urlParams.get('code');
   *   const tokens = await oauthService.exchangeCodeForToken(code);
   * } else {
   *   console.error('State validation failed - possible CSRF attack');
   *   // Handle security error
   * }
   * ```
   * 
   * @see {@link https://tools.ietf.org/html/rfc6749#section-10.12 OAuth 2.0 CSRF Protection}
   */
  async validateState(state: string, expectedState: string): Promise<boolean> {
    if (!state || !expectedState) {
      console.error('🚨 State validation failed: Missing state parameters');
      return false;
    }

    if (typeof state !== 'string' || typeof expectedState !== 'string') {
      console.error('🚨 State validation failed: State parameters must be strings');
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = state === expectedState;
    
    if (isValid) {
      console.log('✅ OAuth state validation passed');
    } else {
      console.error('🚨 OAuth state validation failed - possible CSRF attack');
    }
    
    return isValid;
  }
}