/**
 * @type: types
 * @domain: clickup
 * @purpose: HTTP-related data structures
 * @exports: [HTTPConfig, HTTPHeaders, ClickUpHttpClientConfig]
 */

/**
 * HTTP request configuration
 */
export interface HTTPConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * HTTP headers type
 */
export type HTTPHeaders = Record<string, string>;

/**
 * ClickUp HTTP client configuration
 */
export interface ClickUpHttpClientConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
  readonly userAgent?: string;
}