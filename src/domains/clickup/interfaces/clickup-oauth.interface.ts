/**
 * @type: interface
 * @domain: clickup
 * @purpose: OAuth service contract for ClickUp authentication
 * @solid-principle: ISP
 */

import type {
  OAuthConfig,
  OAuthState,
  OAuthTokenResponse,
  AuthorizationUrlParams,
  TokenExchangeRequest,
} from '../types/oauth.types';

/**
 * Interface for ClickUp OAuth service operations
 * Follows ISP - focused only on OAuth-specific operations
 */
export interface IClickUpOAuthService {
  /**
   * Generate authorization URL for OAuth flow
   * @param state - CSRF protection state parameter
   * @param redirectTo - Optional redirect destination after auth
   * @returns Authorization URL for user redirection
   */
  generateAuthorizationUrl(state: string, redirectTo?: string): Promise<string>;

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from callback
   * @param state - State parameter for validation
   * @returns OAuth token response
   */
  exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<OAuthTokenResponse>;

  /**
   * Validate OAuth state parameter
   * @param state - State parameter to validate
   * @returns True if state is valid
   */
  validateState(state: string): Promise<boolean>;

  /**
   * Store OAuth state for validation
   * @param state - State data to store
   * @returns Promise that resolves when stored
   */
  storeState(state: OAuthState): Promise<void>;

  /**
   * Retrieve stored OAuth state
   * @param stateKey - State key to retrieve
   * @returns Stored state data or null if not found
   */
  getStoredState(stateKey: string): Promise<OAuthState | null>;

  /**
   * Clean up expired OAuth states
   * @returns Promise that resolves when cleanup is complete
   */
  cleanupExpiredStates(): Promise<void>;

  /**
   * Get authorized teams/workspaces for the token
   * @param accessToken - Access token
   * @returns Array of authorized team information
   */
  getAuthorizedTeams(
    accessToken: string
  ): Promise<{ teams: Array<{ id: string; name: string }> }>;

  /**
   * Store OAuth token for a user
   * @param userId - Unique identifier for the user
   * @param tokenResponse - OAuth token response data
   * @returns Promise that resolves when token is stored
   */
  storeUserToken(userId: string, tokenResponse: OAuthTokenResponse): Promise<void>;

  /**
   * Get stored OAuth token for a user
   * @param userId - Unique identifier for the user
   * @returns OAuth token data or null if not found/expired
   */
  getUserToken(userId: string): Promise<OAuthTokenResponse | null>;

  /**
   * Remove OAuth token for a user
   * @param userId - Unique identifier for the user
   * @returns Promise that resolves when token is removed
   */
  removeUserToken(userId: string): Promise<void>;
}