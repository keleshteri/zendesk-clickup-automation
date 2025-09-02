/**
 * @type: service
 * @domain: clickup
 * @implements: ITokenStorageService
 * @dependencies: [KVNamespace]
 * @tested: no
 */

import type {
  ITokenStorageService,
  TokenStorageConfig,
  StoredTokenMetadata,
  StoredStateMetadata,
} from '../interfaces/token-storage.interface';
import type { OAuthTokenResponse, OAuthState } from '../types/oauth.types';

/**
 * Cloudflare KV-based token storage service
 * Handles persistent storage of OAuth tokens and states
 * Follows SRP by focusing only on storage operations
 */
export class TokenStorageService implements ITokenStorageService {
  private readonly config: TokenStorageConfig;

  constructor(
    private readonly tokenKV: KVNamespace,
    private readonly stateKV: KVNamespace,
    config?: Partial<TokenStorageConfig>
  ) {
    this.config = {
      tokenTtl: 86400 * 30, // 30 days default
      stateTtl: 600, // 10 minutes default
      keyPrefix: 'clickup',
      enableCleanup: true,
      ...config,
    };
  }

  /**
   * Store OAuth access token with metadata
   */
  async storeToken(
    userId: string,
    tokenData: OAuthTokenResponse,
    expirationTtl?: number
  ): Promise<void> {
    const key = this.getTokenKey(userId);
    const ttl = expirationTtl || this.config.tokenTtl;
    const now = Date.now();
    
    const metadata: StoredTokenMetadata = {
      userId,
      tokenData,
      storedAt: now,
      expiresAt: now + (ttl * 1000),
    };

    try {
      await this.tokenKV.put(key, JSON.stringify(metadata), {
        expirationTtl: ttl,
      });
      console.log(`[TokenStorage] Token stored for user: ${userId}`);
    } catch (error) {
      console.error(`[TokenStorage] Failed to store token for user ${userId}:`, error);
      throw new Error(`Failed to store token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve OAuth access token for a user
   */
  async getToken(userId: string): Promise<OAuthTokenResponse | null> {
    const key = this.getTokenKey(userId);
    
    try {
      const stored = await this.tokenKV.get(key, 'text');
      
      if (!stored) {
        return null;
      }

      const metadata: StoredTokenMetadata = JSON.parse(stored);
      
      // Check if token has expired (additional safety check)
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        await this.removeToken(userId);
        return null;
      }

      // Update last used timestamp
      const updatedMetadata = {
        ...metadata,
        lastUsed: Date.now()
      };
      await this.tokenKV.put(key, JSON.stringify(updatedMetadata), {
        expirationTtl: this.config.tokenTtl,
      });

      return metadata.tokenData;
    } catch (error) {
      console.error(`[TokenStorage] Failed to get token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Remove OAuth access token for a user
   */
  async removeToken(userId: string): Promise<void> {
    const key = this.getTokenKey(userId);
    
    try {
      await this.tokenKV.delete(key);
      console.log(`[TokenStorage] Token removed for user: ${userId}`);
    } catch (error) {
      console.error(`[TokenStorage] Failed to remove token for user ${userId}:`, error);
      throw new Error(`Failed to remove token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store OAuth state for CSRF protection
   */
  async storeState(
    stateKey: string,
    stateData: OAuthState,
    expirationTtl?: number
  ): Promise<void> {
    const key = this.getStateKey(stateKey);
    const ttl = expirationTtl || this.config.stateTtl;
    const now = Date.now();
    
    const metadata: StoredStateMetadata = {
      stateKey,
      stateData,
      storedAt: now,
      expiresAt: now + (ttl * 1000),
    };

    try {
      await this.stateKV.put(key, JSON.stringify(metadata), {
        expirationTtl: ttl,
      });
      console.log(`[TokenStorage] State stored: ${stateKey}`);
    } catch (error) {
      console.error(`[TokenStorage] Failed to store state ${stateKey}:`, error);
      throw new Error(`Failed to store state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve OAuth state for validation
   */
  async getState(stateKey: string): Promise<OAuthState | null> {
    const key = this.getStateKey(stateKey);
    
    try {
      const stored = await this.stateKV.get(key, 'text');
      
      if (!stored) {
        return null;
      }

      const metadata: StoredStateMetadata = JSON.parse(stored);
      
      // Check if state has expired (additional safety check)
      if (Date.now() > metadata.expiresAt) {
        await this.removeState(stateKey);
        return null;
      }

      return metadata.stateData;
    } catch (error) {
      console.error(`[TokenStorage] Failed to get state ${stateKey}:`, error);
      return null;
    }
  }

  /**
   * Remove OAuth state after use
   */
  async removeState(stateKey: string): Promise<void> {
    const key = this.getStateKey(stateKey);
    
    try {
      await this.stateKV.delete(key);
      console.log(`[TokenStorage] State removed: ${stateKey}`);
    } catch (error) {
      console.error(`[TokenStorage] Failed to remove state ${stateKey}:`, error);
      throw new Error(`Failed to remove state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a token exists for a user
   */
  async hasValidToken(userId: string): Promise<boolean> {
    const token = await this.getToken(userId);
    return token !== null;
  }

  /**
   * Get all stored token keys (for admin/debugging purposes)
   */
  async listTokenKeys(prefix?: string): Promise<string[]> {
    const searchPrefix = prefix ? `${this.config.keyPrefix}:token:${prefix}` : `${this.config.keyPrefix}:token:`;
    
    try {
      const list = await this.tokenKV.list({ prefix: searchPrefix });
      return list.keys.map(key => key.name.replace(`${this.config.keyPrefix}:token:`, ''));
    } catch (error) {
      console.error('[TokenStorage] Failed to list token keys:', error);
      return [];
    }
  }

  /**
   * Clean up expired tokens and states
   */
  async cleanupExpired(): Promise<number> {
    if (!this.config.enableCleanup) {
      return 0;
    }

    let cleanedCount = 0;
    const now = Date.now();

    try {
      // Clean up expired tokens
      const tokenList = await this.tokenKV.list({ prefix: `${this.config.keyPrefix}:token:` });
      
      for (const key of tokenList.keys) {
        try {
          const stored = await this.tokenKV.get(key.name, 'text');
          if (stored) {
            const metadata: StoredTokenMetadata = JSON.parse(stored);
            if (metadata.expiresAt && now > metadata.expiresAt) {
              await this.tokenKV.delete(key.name);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.error(`[TokenStorage] Error cleaning token ${key.name}:`, error);
        }
      }

      // Clean up expired states
      const stateList = await this.stateKV.list({ prefix: `${this.config.keyPrefix}:state:` });
      
      for (const key of stateList.keys) {
        try {
          const stored = await this.stateKV.get(key.name, 'text');
          if (stored) {
            const metadata: StoredStateMetadata = JSON.parse(stored);
            if (now > metadata.expiresAt) {
              await this.stateKV.delete(key.name);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.error(`[TokenStorage] Error cleaning state ${key.name}:`, error);
        }
      }

      console.log(`[TokenStorage] Cleanup completed: ${cleanedCount} items removed`);
      return cleanedCount;
    } catch (error) {
      console.error('[TokenStorage] Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Generate token storage key
   */
  private getTokenKey(userId: string): string {
    return `${this.config.keyPrefix}:token:${userId}`;
  }

  /**
   * Generate state storage key
   */
  private getStateKey(stateKey: string): string {
    return `${this.config.keyPrefix}:state:${stateKey}`;
  }

  /**
   * Gets storage statistics
   * @returns Promise resolving to storage statistics
   */
  async getStorageStats(): Promise<{
    totalTokens: number;
    totalStates: number;
    expiredTokens: number;
    expiredStates: number;
  }> {
    try {
      // Note: KV doesn't provide direct count operations
      // This is a simplified implementation
      // In production, you might want to maintain counters separately
      
      return {
        totalTokens: 0, // Would need to be tracked separately
        totalStates: 0, // Would need to be tracked separately
        expiredTokens: 0, // Would need to be tracked separately
        expiredStates: 0, // Would need to be tracked separately
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error('Failed to get storage statistics');
    }
  }
}