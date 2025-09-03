/**
 * @type: interface
 * @domain: zendesk
 * @purpose: HTTP client contract for Zendesk API communication
 * @solid-principle: SRP, ISP
 */

import type { ZendeskRateLimitInfo } from '../types/api.types';

/**
 * Zendesk API response wrapper
 */
export interface ZendeskAPIResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: HTTPHeaders;
  readonly rateLimitInfo: ZendeskRateLimitInfo | null;
}

/**
 * HTTP client interface for Zendesk API operations
 * Handles low-level HTTP communication with Zendesk API
 * Follows SRP by focusing only on HTTP operations
 */
export interface IZendeskHttpClient {
  get<T>(url: string): Promise<ZendeskAPIResponse<T>>;
  post<T>(url: string, data: any): Promise<ZendeskAPIResponse<T>>;
  put<T>(url: string, data: any): Promise<ZendeskAPIResponse<T>>;
  patch<T>(url: string, data: any): Promise<ZendeskAPIResponse<T>>;
  delete<T>(url: string): Promise<ZendeskAPIResponse<T>>;
  
  // Configuration and utilities
  authenticate(): Promise<boolean>;
  getRateLimitInfo(): Promise<ZendeskRateLimitInfo | null>;
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }>;
}

import type { HTTPHeaders } from '../types/http.types';