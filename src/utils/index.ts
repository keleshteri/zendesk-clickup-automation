export type ZendeskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ZendeskStatus = 'new' | 'open' | 'pending' | 'solved' | 'closed';
export type ClickUpPriority = 1 | 2 | 3 | 4;
export type ClickUpStatus = 'Open' | 'in progress' | 'review' | 'Complete' | 'Closed';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: boolean;
  context?: string;
  timestamp: string;
}

export interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  priority: ZendeskPriority;
  status: ZendeskStatus;
  requester_id: number;
  assignee_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: {
    status: string;
    color: string;
  };
  priority?: {
    priority: string;
    color: string;
  };
  url: string;
  date_created: string;
  date_updated: string;
}

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
 * Map ClickUp status to Zendesk status
 */
export function mapClickUpToZendeskStatus(clickupStatus: string): ZendeskStatus {
  const mapping: Record<string, ZendeskStatus> = {
    'Open': 'open',
    'in progress': 'pending', 
    'review': 'pending',
    'Complete': 'solved',
    'Closed': 'closed'
  };
  return mapping[clickupStatus] || 'open';
}

/**
 * Map Zendesk status to ClickUp status
 */
export function mapZendeskToClickUpStatus(zendeskStatus: ZendeskStatus): string {
  const mapping: Record<ZendeskStatus, string> = {
    'new': 'Open',
    'open': 'Open', 
    'pending': 'in progress',
    'solved': 'Complete',
    'closed': 'Closed'
  };
  return mapping[zendeskStatus] || 'Open';
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
 * Validate required environment variables
 */
export function validateEnvironment(env: Record<string, any>, required: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing: missing
  };
}

/**
 * Generate task mapping key for KV storage
 */
export function createMappingKey(type: 'zendesk' | 'clickup', id: string | number): string {
  return `${type}_${id}`;
}

/**
 * Parse Zendesk ticket URL to get domain and ID
 */
export function parseZendeskUrl(url: string): { domain: string; ticketId: string } | null {
  const match = url.match(/https:\/\/([^.]+)\.zendesk\.com\/.*\/tickets\/(\d+)/);
  if (match) {
    return {
      domain: match[1],
      ticketId: match[2]
    };
  }
  return null;
}

/**
 * Create standard CORS headers
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
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