/**
 * @type: service
 * @domain: clickup
 * @implements: IClickUpOAuthService
 * @dependencies: [IClickUpAuthClient]
 * @tested: no
 */

import type { IClickUpOAuthService } from '../interfaces/clickup-oauth.interface';
import type { IClickUpAuthClient } from '../interfaces/clickup-auth-client.interface';
import type { ITokenStorageService } from '../interfaces/token-storage.interface';
import type {
  OAuthConfig,
  OAuthState,
  OAuthTokenResponse,
  AuthorizationUrlParams,
  TokenExchangeRequest,
} from '../types/oauth.types';

/**
 * ClickUp OAuth service implementation
 * Handles authorization code flow and token management
 * Follows SRP by focusing only on OAuth operations
 */
export class ClickUpOAuthService implements IClickUpOAuthService {
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  
  constructor(
    private readonly config: OAuthConfig,
    private readonly authClient: IClickUpAuthClient,
    private readonly tokenStorage: ITokenStorageService
  ) {}
  
  /**
   * Generate authorization URL for ClickUp OAuth
   */
  async generateAuthorizationUrl(state: string, redirectTo?: string): Promise<string> {
    if (!state || state.trim() === '') {
      throw new Error('State parameter is required and cannot be empty');
    }
    
    // Store the state for later validation
    const oauthState = await this.generateState(redirectTo);
    oauthState.state = state; // Use the provided state
    await this.storeState(oauthState);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state: state,
      response_type: 'code',
    });
    
    // Add scopes if configured
    if (this.config.scopes && this.config.scopes.length > 0) {
      params.set('scope', this.config.scopes.join(' '));
    }
    
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<OAuthTokenResponse> {
    console.log('[exchangeCodeForToken]Exchange code for token request:', { code, state });
    // Validate state
    const isValidState = await this.validateState(state);
    if (!isValidState) {
      throw new Error('Invalid or expired OAuth state');
    }
    
    try {
      const tokenResponse = await this.authClient.exchangeToken({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
      });
      
      // Clean up used state
      await this.cleanupState(state);
      console.log('[exchangeCodeForToken]Token exchange successful:', tokenResponse);
      return tokenResponse;
    } catch (error) {
      // Clean up state on error
      await this.cleanupState(state);
      throw error;
    }
  }

  /**
   * Store OAuth token for a user
   */
  async storeUserToken(userId: string, tokenResponse: OAuthTokenResponse): Promise<void> {
    try {
      await this.tokenStorage.storeToken(userId, tokenResponse);
      console.log(`[OAuth] Token stored for user: ${userId}`);
    } catch (error) {
      console.error(`[OAuth] Failed to store token for user ${userId}:`, error);
      throw new Error(`Failed to store user token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get stored OAuth token for a user
   */
  async getUserToken(userId: string): Promise<OAuthTokenResponse | null> {
    try {
      return await this.tokenStorage.getToken(userId);
    } catch (error) {
      console.error(`[OAuth] Failed to get token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Remove OAuth token for a user
   */
  async removeUserToken(userId: string): Promise<void> {
    try {
      await this.tokenStorage.removeToken(userId);
      console.log(`[OAuth] Token removed for user: ${userId}`);
    } catch (error) {
      console.error(`[OAuth] Failed to remove token for user ${userId}:`, error);
      throw new Error(`Failed to remove user token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    return this.authClient.refreshToken({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  }
  
  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    await this.authClient.revokeToken(accessToken);
  }
  
  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      return await this.authClient.validateToken(accessToken);
    } catch {
      return false;
    }
  }
  
  /**
   * Get authorized teams for the access token
   */
  async getAuthorizedTeams(accessToken: string): Promise<{ teams: Array<{ id: string; name: string }> }> {
    const teamIds = await this.authClient.getAuthorizedTeams(accessToken);
    const teams = teamIds.map(id => ({ id, name: `Team ${id}` }));
    return { teams };
  }
  
  /**
   * Generate cryptographically secure state
   */
  private async generateState(redirectTo?: string): Promise<OAuthState> {
    // Generate random state value
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const stateValue = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const state: OAuthState = {
      state: stateValue,
      redirectTo,
      timestamp: Date.now(),
    };
    
    const expiresAt = Date.now() + this.STATE_EXPIRY_MS;
    
    // Store state with expiry
    const expirationTtl = Math.floor(this.STATE_EXPIRY_MS / 1000);
    await this.tokenStorage.storeState(stateValue, state, expirationTtl);
    
    return state;
  }
  
  /**
   * Validate OAuth state
   */
  async validateState(stateValue: string): Promise<boolean> {
    const storedState = await this.tokenStorage.getState(stateValue);
    return storedState !== null;
  }
  
  /**
   * Store OAuth state securely
   */
  async storeState(state: OAuthState): Promise<void> {
    const expirationTtl = Math.floor(this.STATE_EXPIRY_MS / 1000); // Convert to seconds
    await this.tokenStorage.storeState(state.state, state, expirationTtl);
  }

  /**
   * Get stored OAuth state
   */
  async getStoredState(stateKey: string): Promise<OAuthState | null> {
    return await this.tokenStorage.getState(stateKey);
  }
  
  /**
   * Clean up expired states
   */
  async cleanupExpiredStates(): Promise<void> {
    await this.tokenStorage.cleanupExpired();
  }
  
  /**
   * Clean up specific state
   */
  private async cleanupState(stateValue: string): Promise<void> {
    await this.tokenStorage.removeState(stateValue);
  }
  
  /**
   * Periodic cleanup of expired states
   * Should be called periodically by a background task
   */
  async performPeriodicCleanup(): Promise<void> {
    await this.cleanupExpiredStates();
  }
  
  /**
   * Get state statistics for monitoring
   */
  async getStateStatistics(): Promise<{ total: number; expired: number }> {
    const stats = await this.tokenStorage.getStorageStats();
    return {
      total: stats.totalStates, 
      expired: 0 // KV automatically handles expiration
    };
  }
}