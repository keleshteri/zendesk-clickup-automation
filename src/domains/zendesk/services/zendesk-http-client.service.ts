/**
 * @type: service
 * @domain: zendesk
 * @purpose: HTTP client implementation for Zendesk API communication
 * @implements: IZendeskHttpClient
 * @dependencies: [ZendeskAPIError]
 * @tested: no
 */

import type { 
  IZendeskHttpClient, 
  ZendeskAPIResponse
} from '../interfaces/http-client.interface';
import type { HTTPHeaders } from '../types/http.types';
import type { 
  ZendeskHttpClientConfig, 
  RequestConfig,
} from '../types/http.types';
import type { 
  ZendeskRateLimitInfo, 
  ZendeskAPIError as ZendeskAPIErrorType 
} from '../types/api.types';

export class ZendeskAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ZendeskAPIError';
  }
}

export class ZendeskHttpClient implements IZendeskHttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly defaultHeaders: HTTPHeaders;

  constructor(private readonly config: ZendeskHttpClientConfig) {
    this.baseUrl = config.baseUrl || `https://${config.subdomain}.zendesk.com/api/v2`;
    this.authHeader = this.createAuthHeader(config.email, config.apiToken);
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': config.userAgent,
      'Authorization': this.authHeader,
    };
  }

  async get<T>(url: string, headers?: HTTPHeaders): Promise<ZendeskAPIResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      headers,
    });
  }

  async post<T>(url: string, data: unknown, headers?: HTTPHeaders): Promise<ZendeskAPIResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      headers,
      body: data,
    });
  }

  async put<T>(url: string, data: unknown, headers?: HTTPHeaders): Promise<ZendeskAPIResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      headers,
      body: data,
    });
  }

  async patch<T>(url: string, data: unknown, headers?: HTTPHeaders): Promise<ZendeskAPIResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      headers,
      body: data,
    });
  }

  async delete<T>(url: string, headers?: HTTPHeaders): Promise<ZendeskAPIResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      headers,
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.get('/users/me.json');
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      return false;
    }
  }

  async getRateLimitInfo(): Promise<ZendeskRateLimitInfo | null> {
    try {
      // Make a lightweight request to get rate limit headers
      const response = await this.get('/users/me.json');
      return this.extractRateLimitInfo(response.headers);
    } catch (error) {
      return null;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return { status: 'unhealthy', details: 'Authentication failed' };
      }

      const rateLimitInfo = await this.getRateLimitInfo();
      if (rateLimitInfo && rateLimitInfo.remaining === 0) {
        return { status: 'unhealthy', details: 'Rate limit exceeded' };
      }

      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async request<T>(config: RequestConfig): Promise<ZendeskAPIResponse<T>> {
    const url = this.buildUrl(config.url);
    const headers = this.mergeHeaders(config.headers);
    const body = config.body ? JSON.stringify(config.body) : undefined;

    let attempt = 0;
    const maxAttempts = config.retries ?? this.config.retryAttempts;

    while (attempt <= maxAttempts) {
      try {
        const response = await this.executeRequest(url, {
          method: config.method,
          headers,
          body,
          signal: this.createTimeoutSignal(config.timeout ?? this.config.timeout),
        });

        const responseData = await this.parseResponse<T>(response);
        const rateLimitInfo = this.extractRateLimitInfo(this.headersToRecord(response.headers));

        return {
          data: responseData,
          status: response.status,
          headers: this.headersToRecord(response.headers),
          rateLimitInfo,
        };
      } catch (error) {
        if (attempt === maxAttempts || !this.isRetryableError(error)) {
          throw this.createAPIError(error);
        }

        attempt++;
        await this.delay(this.config.retryDelay * attempt);
      }
    }

    throw new ZendeskAPIError('Max retry attempts exceeded', 0);
  }

  private createAuthHeader(email: string, apiToken: string): string {
    const credentials = btoa(`${email}/token:${apiToken}`);
    return `Basic ${credentials}`;
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  private mergeHeaders(additionalHeaders?: HTTPHeaders): HTTPHeaders {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };
  }

  private createTimeoutSignal(timeout: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  private async executeRequest(url: string, init: RequestInit): Promise<Response> {
    const response = await fetch(url, init);
    
    if (!response.ok) {
      throw new ZendeskAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return response;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  private extractRateLimitInfo(headers: HTTPHeaders): ZendeskRateLimitInfo | null {
    const limit = headers['x-rate-limit-limit'];
    const remaining = headers['x-rate-limit-remaining'];
    const reset = headers['x-rate-limit-reset'];

    if (!limit || !remaining) {
      return null;
    }

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      retry_after: reset ? parseInt(reset, 10) : undefined,
    };
  }

  private headersToRecord(headers: Headers): HTTPHeaders {
    const record: HTTPHeaders = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof ZendeskAPIError) {
      // Retry on server errors and rate limits
      return error.status >= 500 || error.status === 429;
    }
    
    // Retry on network errors
    return error instanceof TypeError;
  }

  private createAPIError(error: unknown): ZendeskAPIError {
    if (error instanceof ZendeskAPIError) {
      return error;
    }

    if (error instanceof Error) {
      return new ZendeskAPIError(error.message, 0);
    }

    return new ZendeskAPIError('Unknown error occurred', 0);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}