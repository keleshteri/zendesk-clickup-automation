/**
 * @type: interface
 * @domain: clickup
 * @purpose: HTTP client contract for ClickUp OAuth API communication
 * @solid-principle: ISP
 */

import type {
  OAuthTokenResponse,
  TokenExchangeRequest,
  RefreshTokenRequest,
  OAuthError,
} from '../types/oauth.types';

/**
 * Interface for ClickUp OAuth HTTP client
 * Follows ISP - focused only on OAuth HTTP operations
 */
export interface IClickUpAuthClient {
  /**
   * Exchange authorization code for access token via HTTP
   * @param request - Token exchange request parameters
   * @returns OAuth token response or throws on error
   */
  exchangeToken(request: TokenExchangeRequest): Promise<OAuthTokenResponse>;

  /**
   * Validate access token with ClickUp API
   * @param accessToken - Access token to validate
   * @returns True if token is valid
   */
  validateToken(accessToken: string): Promise<boolean>;

  /**
   * Get authorized teams/workspaces for the token
   * @param accessToken - Access token
   * @returns Array of authorized team IDs
   */
  getAuthorizedTeams(accessToken: string): Promise<string[]>;

  /**
   * Refresh access token using refresh token
   * @param request - Refresh token request parameters
   * @returns New OAuth token response
   */
  refreshToken(request: RefreshTokenRequest): Promise<OAuthTokenResponse>;

  /**
   * Revoke access token
   * @param accessToken - Access token to revoke
   * @returns Promise that resolves when token is revoked
   */
  revokeToken(accessToken: string): Promise<void>;
}

/**
 * OAuth HTTP response wrapper
 */
export interface OAuthHttpResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: OAuthError;
  readonly statusCode: number;
}