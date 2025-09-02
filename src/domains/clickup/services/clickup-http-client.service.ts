/**
 * @type: service
 * @domain: clickup
 * @purpose: HTTP client for ClickUp API operations
 * @dependencies: [ClickUpAPIError]
 * @tested: no
 */

import { ClickUpAPIError } from '../errors/clickup-api.error';
import type { ClickUpRateLimitInfo } from '../types/api.types';
import type { IClickUpHttpClient, ClickUpAPIResponse } from '../interfaces/http-client.interface';
import type { HTTPConfig, HTTPHeaders, ClickUpHttpClientConfig } from '../types/http.types';

/**
 * HTTP client service for ClickUp API
 * Handles low-level HTTP operations, retries, and error handling
 */
export class ClickUpHttpClient implements IClickUpHttpClient {
  private readonly config: Required<ClickUpHttpClientConfig>;
  private rateLimitInfo: ClickUpRateLimitInfo | null = null;

  constructor(config: ClickUpHttpClientConfig) {
    this.config = {
      baseUrl: 'https://api.clickup.com/api/v2',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      userAgent: 'ClickUp-Client/1.0',
      ...config,
    };
  }

  /**
   * Make HTTP request to ClickUp API
   */
  async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ClickUpAPIResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const config: HTTPConfig = {
      method,
      headers: this.buildHeaders(),
      timeout: this.config.timeout,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    return this.executeRequest<T>(url, config);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    config: HTTPConfig,
    attempt = 0
  ): Promise<ClickUpAPIResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update rate limit info from response headers
      this.updateRateLimitInfo(response.headers);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const responseData = await response.json() as T;
      
      return {
        data: responseData,
        status: response.status,
        headers: this.extractHeaders(response.headers),
        rateLimitInfo: this.rateLimitInfo,
      };
    } catch (error) {
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * (attempt + 1));
        return this.executeRequest<T>(url, config, attempt + 1);
      }
      throw this.createAPIError(error, url, config.method);
    }
  }

  /**
   * Build HTTP headers for requests
   */
  private buildHeaders(): HTTPHeaders {
    return {
      'Authorization': this.config.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': this.config.userAgent,
    };
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  /**
   * Extract headers from Response object
   */
  private extractHeaders(headers: Headers): HTTPHeaders {
    const result: HTTPHeaders = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Handle error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new ClickUpAPIError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof ClickUpAPIError) {
      // Retry on rate limit or server errors
      return error.isRateLimitError() || error.isServerError();
    }
    // Retry on network errors
    return error.name === 'AbortError' || error.name === 'TypeError' || 
           (error instanceof Error && error.message.includes('Network error'));
  }

  /**
   * Create API error from caught error
   */
  private createAPIError(error: any, url: string, method?: string): ClickUpAPIError {
    if (error instanceof ClickUpAPIError) {
      return error;
    }

    const message = error.message || 'Unknown error occurred';
    const details = {
      url,
      method,
      originalError: error,
    };

    return new ClickUpAPIError(message, 0, details);
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): ClickUpRateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Check if currently rate limited
   */
  isRateLimited(): boolean {
    return this.rateLimitInfo?.remaining === 0 || false;
  }

  /**
   * Get time until rate limit reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    if (!this.rateLimitInfo?.reset) return 0;
    return Math.max(0, this.rateLimitInfo.reset * 1000 - Date.now());
  }
}