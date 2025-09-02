/**
 * @type: service
 * @domain: clickup
 * @implements: IClickUpAuthClient
 * @dependencies: []
 * @tested: no
 */

import type { IClickUpAuthClient } from '../interfaces/clickup-auth-client.interface';
import type {
  OAuthTokenResponse,
  TokenExchangeRequest,
  RefreshTokenRequest,
} from '../types/oauth.types';
import type { ApiResponse } from '../types/api.types';

/**
 * ClickUp authentication client implementation
 * Handles HTTP communication with ClickUp OAuth endpoints
 * Follows SRP by focusing only on OAuth HTTP operations
 */
export class ClickUpAuthClient implements IClickUpAuthClient {
  private readonly baseUrl = 'https://api.clickup.com/api/v2';
  private readonly oauthUrl = 'https://app.clickup.com/api';
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(request: TokenExchangeRequest): Promise<OAuthTokenResponse> {
    const response = await this.makeRequest<OAuthTokenResponse>(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: request.client_id,
        client_secret: request.client_secret,
        code: request.code,
        grant_type: request.grant_type,
      }),
    });
    
    if (!response.success || !response.data) {
      throw new Error(`Token exchange failed: ${response.error || 'Unknown error'}`);
    }
    
    return response.data;
  }
  

  
  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ user: { id: number; username: string } }>(
        `${this.baseUrl}/user`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.success;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get authorized teams for the access token
   */
  async getAuthorizedTeams(accessToken: string): Promise<string[]> {
    const response = await this.makeRequest<{ teams: Array<{ id: string; name: string }> }>(
      `${this.baseUrl}/team`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.success || !response.data) {
      throw new Error(`Failed to get authorized teams: ${response.error || 'Unknown error'}`);
    }
    
    return response.data.teams.map(team => team.id);
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<OAuthTokenResponse> {
    const response = await this.makeRequest<OAuthTokenResponse>(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: request.client_id,
        client_secret: request.client_secret,
        refresh_token: request.refresh_token,
        grant_type: request.grant_type,
      }),
    });

    if (!response.success || !response.data) {
      throw new Error(`Token refresh failed: ${response.error || 'Unknown error'}`);
    }

    return response.data;
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    const response = await this.makeRequest<void>(`${this.baseUrl}/oauth/token/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.success) {
      throw new Error(`Token revocation failed: ${response.error || 'Unknown error'}`);
    }
  }
  
  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        const responseData = await this.parseResponse<T>(response);
        
        return {
          success: response.ok,
          data: response.ok ? responseData : undefined,
          error: response.ok ? undefined : this.getErrorMessage(responseData),
          statusCode: response.status,
          headers: this.getResponseHeaders(response),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Request failed after retries',
      statusCode: 500,
    };
  }
  
  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    
    const text = await response.text();
    
    // Try to parse as JSON if it looks like JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text) as T;
      } catch {
        // Fall through to return as text
      }
    }
    
    return text as unknown as T;
  }
  
  /**
   * Extract error message from response data
   */
  private getErrorMessage(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const errorObj = data as Record<string, unknown>;
      
      // ClickUp error format
      if (typeof errorObj.err === 'string') {
        return errorObj.err;
      }
      
      // Standard error format
      if (typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      
      // Message format
      if (typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }
    
    return 'Unknown error occurred';
  }
  
  /**
   * Get response headers as record
   */
  private getResponseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    return headers;
  }
  
  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}