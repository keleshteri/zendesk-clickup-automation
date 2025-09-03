/**
 * @type: interface
 * @domain: clickup
 * @purpose: HTTP client contract for ClickUp API
 * @exports: [IClickUpHttpClient, ClickUpAPIResponse]
 */

import type { ClickUpRateLimitInfo } from '../types/api.types';
import type { HTTPHeaders } from '../types/http.types';

/**
 * ClickUp API response structure
 */
export interface ClickUpAPIResponse<T = any> {
  data: T;
  status: number;
  headers: HTTPHeaders;
  rateLimitInfo: ClickUpRateLimitInfo | null;
}

/**
 * HTTP client interface for ClickUp API operations
 */
export interface IClickUpHttpClient {
  /**
   * Make HTTP request to ClickUp API
   */
  makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    accessToken?: string
  ): Promise<ClickUpAPIResponse<T>>;

  /**
   * Build query string from parameters
   */
  buildQueryString(params: Record<string, any>): string;

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): ClickUpRateLimitInfo | null;

  /**
   * Check if currently rate limited
   */
  isRateLimited(): boolean;

  /**
   * Get time until rate limit reset
   */
  getTimeUntilReset(): number;
}