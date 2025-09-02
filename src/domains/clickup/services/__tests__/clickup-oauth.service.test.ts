/**
 * @type: test
 * @domain: clickup
 * @purpose: Unit tests for ClickUpOAuthService
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickUpOAuthService } from '../clickup-oauth.service';
import type { IClickUpAuthClient } from '../../interfaces/clickup-auth-client.interface';
import type { ITokenStorageService } from '../../interfaces/token-storage.interface';
import type { OAuthConfig } from '../../types/oauth.types';

// Mock the auth client
class MockClickUpAuthClient implements IClickUpAuthClient {
  exchangeToken = vi.fn();
  validateToken = vi.fn();
  getAuthorizedTeams = vi.fn();
  refreshToken = vi.fn();
  revokeToken = vi.fn();
}

// Mock implementation of TokenStorageService
class MockTokenStorageService implements ITokenStorageService {
  storeToken = vi.fn();
  getToken = vi.fn();
  removeToken = vi.fn();
  storeState = vi.fn();
  getState = vi.fn();
  removeState = vi.fn();
  hasValidToken = vi.fn();
  listTokenKeys = vi.fn();
  cleanupExpired = vi.fn();
  getStorageStats = vi.fn();
}

describe('ClickUpOAuthService', () => {
  let service: ClickUpOAuthService;
  let mockAuthClient: MockClickUpAuthClient;
  let mockTokenStorage: MockTokenStorageService;
  let config: OAuthConfig;

  beforeEach(() => {
    mockAuthClient = new MockClickUpAuthClient();
    mockTokenStorage = new MockTokenStorageService();
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:8787/auth/callback',
      scopes: ['read', 'write'],
      authorizationUrl: 'https://app.clickup.com/api',
      tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
    };
    service = new ClickUpOAuthService(config, mockAuthClient, mockTokenStorage);
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with correct parameters', async () => {
      const params = {
        state: 'test-state',
        scopes: ['read', 'write'] as const,
      };

      const authUrl = await service.generateAuthorizationUrl(params.state);
      const url = new URL(authUrl);

      expect(url.origin + url.pathname).toBe(config.authorizationUrl);
      expect(url.searchParams.get('client_id')).toBe(config.clientId);
      expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri);
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('state')).toBe(params.state);
      expect(url.searchParams.get('scope')).toBe('read write');
    });

    it('should use default scopes when none provided', async () => {
      const params = { state: 'test-state' };
      const authUrl = await service.generateAuthorizationUrl(params.state);
      const url = new URL(authUrl);

      expect(url.searchParams.get('scope')).toBe('read write');
    });

    it('should throw error for invalid state parameter', async () => {
      const params = { state: '' };

      await expect(service.generateAuthorizationUrl(params.state))
        .rejects
        .toThrow('State parameter is required and cannot be empty');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'read write',
        user: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          color: '#ff0000',
          profilePicture: null,
          initials: 'TU',
        },
        team: {
          id: '456',
          name: 'Test Team',
          color: '#00ff00',
          avatar: null,
          members: [],
        },
      };

      // Store a valid state first
      await service.storeState({
        state: 'test-state',
        timestamp: Date.now(),
      });

      mockAuthClient.exchangeToken.mockResolvedValue(mockTokenResponse);

      const result = await service.exchangeCodeForToken('test-code', 'test-state');

      expect(mockAuthClient.exchangeToken).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: 'test-code',
        grant_type: 'authorization_code',
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error for invalid authorization code', async () => {
      // Store a valid state first
      await service.storeState({
        state: 'test-state',
        timestamp: Date.now(),
      });

      mockAuthClient.exchangeToken.mockRejectedValue(
        new Error('Invalid authorization code')
      );

      await expect(service.exchangeCodeForToken('invalid-code', 'test-state'))
        .rejects
        .toThrow('Invalid authorization code');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
        scope: 'read write',
      };

      mockAuthClient.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await service.refreshToken('test-refresh-token');

      expect(mockAuthClient.refreshToken).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        refresh_token: 'test-refresh-token',
        grant_type: 'refresh_token',
      });
      expect(result).toEqual(mockRefreshResponse);
    });

    it('should throw error for invalid refresh token', async () => {
      mockAuthClient.refreshToken.mockRejectedValue(
        new Error('Invalid refresh token')
      );

      await expect(service.refreshToken('invalid-token'))
        .rejects
        .toThrow('Invalid refresh token');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockAuthClient.revokeToken.mockResolvedValue(undefined);

      await service.revokeToken('test-token');

      expect(mockAuthClient.revokeToken).toHaveBeenCalledWith('test-token');
    });

    it('should handle revocation errors gracefully', async () => {
      mockAuthClient.revokeToken.mockRejectedValue(
        new Error('Token revocation failed')
      );

      await expect(service.revokeToken('test-token'))
        .rejects
        .toThrow('Token revocation failed');
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      mockAuthClient.validateToken.mockResolvedValue(true);

      const result = await service.validateToken('valid-token');

      expect(mockAuthClient.validateToken).toHaveBeenCalledWith('valid-token');
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      mockAuthClient.validateToken.mockResolvedValue(false);

      const result = await service.validateToken('invalid-token');

      expect(result).toBe(false);
    });
  });
});