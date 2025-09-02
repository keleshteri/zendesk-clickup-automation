/**
 * @type: interface
 * @domain: clickup
 * @purpose: Token storage contract for OAuth tokens and state management
 * @solid-principle: ISP
 */

import type { OAuthTokenResponse, OAuthState } from '../types/oauth.types';

/**
 * Interface for token storage operations using Cloudflare KV
 * Follows ISP - focused only on token storage operations
 */
export interface ITokenStorageService {
  /**
   * Store OAuth access token with optional expiration
   * @param userId - Unique identifier for the user
   * @param tokenData - OAuth token response data
   * @param expirationTtl - Optional TTL in seconds
   * @returns Promise that resolves when token is stored
   */
  storeToken(
    userId: string,
    tokenData: OAuthTokenResponse,
    expirationTtl?: number
  ): Promise<void>;

  /**
   * Retrieve OAuth access token for a user
   * @param userId - Unique identifier for the user
   * @returns OAuth token data or null if not found/expired
   */
  getToken(userId: string): Promise<OAuthTokenResponse | null>;

  /**
   * Remove OAuth access token for a user
   * @param userId - Unique identifier for the user
   * @returns Promise that resolves when token is removed
   */
  removeToken(userId: string): Promise<void>;

  /**
   * Store OAuth state for CSRF protection
   * @param stateKey - Unique state identifier
   * @param stateData - OAuth state data
   * @param expirationTtl - TTL in seconds (default: 600 = 10 minutes)
   * @returns Promise that resolves when state is stored
   */
  storeState(
    stateKey: string,
    stateData: OAuthState,
    expirationTtl?: number
  ): Promise<void>;

  /**
   * Retrieve OAuth state for validation
   * @param stateKey - Unique state identifier
   * @returns OAuth state data or null if not found/expired
   */
  getState(stateKey: string): Promise<OAuthState | null>;

  /**
   * Remove OAuth state after use
   * @param stateKey - Unique state identifier
   * @returns Promise that resolves when state is removed
   */
  removeState(stateKey: string): Promise<void>;

  /**
   * Check if a token exists for a user
   * @param userId - Unique identifier for the user
   * @returns True if token exists and is valid
   */
  hasValidToken(userId: string): Promise<boolean>;

  /**
   * Get all stored token keys (for admin/debugging purposes)
   * @param prefix - Optional prefix to filter keys
   * @returns Array of token keys
   */
  listTokenKeys(prefix?: string): Promise<string[]>;

  /**
   * Clean up expired tokens and states
   * @returns Number of items cleaned up
   */
  cleanupExpired(): Promise<number>;

  /**
   * Gets storage statistics
   * @returns Promise resolving to storage statistics
   */
  getStorageStats(): Promise<{
    totalTokens: number;
    totalStates: number;
    expiredTokens: number;
    expiredStates: number;
  }>;
}

/**
 * Token storage configuration
 */
export interface TokenStorageConfig {
  readonly tokenTtl: number; // Default TTL for tokens in seconds
  readonly stateTtl: number; // Default TTL for states in seconds
  readonly keyPrefix: string; // Prefix for KV keys
  readonly enableCleanup: boolean; // Enable automatic cleanup
}

/**
 * Token metadata for storage
 */
export interface StoredTokenMetadata {
  readonly userId: string;
  readonly tokenData: OAuthTokenResponse;
  readonly storedAt: number; // Unix timestamp
  readonly expiresAt?: number; // Unix timestamp
  readonly lastUsed?: number; // Unix timestamp
}

/**
 * State metadata for storage
 */
export interface StoredStateMetadata {
  readonly stateKey: string;
  readonly stateData: OAuthState;
  readonly storedAt: number; // Unix timestamp
  readonly expiresAt: number; // Unix timestamp
}