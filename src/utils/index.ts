// Import types from centralized types/index.ts
import type { ApiResponse } from '../types/index';

export type ZendeskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ClickUpPriority = 1 | 2 | 3 | 4;

/**
 * Map Zendesk priority to ClickUp priority
 * Zendesk: low, normal, high, urgent
 * ClickUp: 4=low, 3=normal, 2=high, 1=urgent  
 */
export function mapZendeskToClickUpPriority(zendeskPriority: ZendeskPriority): ClickUpPriority {
  const mapping: Record<ZendeskPriority, ClickUpPriority> = {
    'low': 4,
    'normal': 3,
    'high': 2,
    'urgent': 1
  };
  return mapping[zendeskPriority] || 3;
}



/**
 * Create Zendesk API authorization header
 */
export function createZendeskAuth(email: string, token: string): string {
  const credentials = `${email}/token:${token}`;
  return `Basic ${btoa(credentials)}`;
}

/**
 * Format error response
 */
export function formatErrorResponse(error: Error | string, context = ''): ApiResponse {
  const message = error instanceof Error ? error.message : error;
  return {
    success: false,
    error: true,
    message: message || 'Unknown error',
    context: context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format success response  
 */
export function formatSuccessResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
}



/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}