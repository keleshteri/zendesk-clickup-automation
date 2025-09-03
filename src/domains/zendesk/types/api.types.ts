/**
 * @type: types
 * @domain: zendesk
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Generic API Response wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  statusCode: z.number(),
  headers: z.record(z.string()).optional(),
});

export type ApiResponse<T = unknown> = {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly statusCode: number;
  readonly headers?: Record<string, string>;
};

// Zendesk API Error Response
// Zendesk Support API error format (business-level errors)
export const ZendeskApiErrorSchema = z.object({
  error: z.string(), // Error type (e.g., "RecordInvalid")
  description: z.string(), // Human-readable error description
  details: z.record(z.array(z.object({
    type: z.string(), // Error type (e.g., "blank", "invalid")
    description: z.string(), // Specific field error description
  }))).optional(), // Field-specific validation errors
});

export type ZendeskApiError = z.infer<typeof ZendeskApiErrorSchema>;

// Zendesk Offset-based Pagination Response (Legacy)
export const ZendeskOffsetPaginationSchema = z.object({
  next_page: z.string().nullable(),
  previous_page: z.string().nullable(),
  count: z.number(),
});

// Zendesk Cursor-based Pagination Meta (Recommended)
export const ZendeskCursorMetaSchema = z.object({
  has_more: z.boolean(),
  after_cursor: z.string().nullable(),
  before_cursor: z.string().nullable(),
});

// Zendesk Cursor-based Pagination Links
export const ZendeskCursorLinksSchema = z.object({
  next: z.string().nullable(),
  prev: z.string().nullable(),
});

// Generic Paginated Response for Offset-based pagination
export type ZendeskOffsetPaginatedResponse<T> = {
  readonly next_page: string | null;
  readonly previous_page: string | null;
  readonly count: number;
} & T;

// Generic Paginated Response for Cursor-based pagination
export type ZendeskCursorPaginatedResponse<T> = {
  readonly meta: {
    readonly has_more: boolean;
    readonly after_cursor: string | null;
    readonly before_cursor: string | null;
  };
  readonly links: {
    readonly next: string | null;
    readonly prev: string | null;
  };
} & T;

// Zendesk specific paginated responses (Offset-based)
export type ZendeskTicketsOffsetResponse = ZendeskOffsetPaginatedResponse<{
  readonly tickets: readonly any[];
}>;

export type ZendeskCommentsOffsetResponse = ZendeskOffsetPaginatedResponse<{
  readonly comments: readonly any[];
}>;

export type ZendeskUsersOffsetResponse = ZendeskOffsetPaginatedResponse<{
  readonly users: readonly any[];
}>;

// Zendesk specific paginated responses (Cursor-based - Recommended)
export type ZendeskTicketsCursorResponse = ZendeskCursorPaginatedResponse<{
  readonly tickets: readonly any[];
}>;

export type ZendeskCommentsCursorResponse = ZendeskCursorPaginatedResponse<{
  readonly comments: readonly any[];
}>;

export type ZendeskUsersCursorResponse = ZendeskCursorPaginatedResponse<{
  readonly users: readonly any[];
}>;

// Legacy aliases for backward compatibility
export type ZendeskTicketsPaginatedResponse = ZendeskTicketsOffsetResponse;
export type ZendeskCommentsPaginatedResponse = ZendeskCommentsOffsetResponse;
export type ZendeskUsersPaginatedResponse = ZendeskUsersOffsetResponse;

// Generic Paginated Response (for backward compatibility with existing services)
export type PaginatedResponse<T> = {
  readonly items: readonly T[];
  readonly next_page: string | null;
  readonly previous_page: string | null;
  readonly count: number;
};

// Zendesk Rate Limit Info (from response headers)
export const ZendeskRateLimitInfoSchema = z.object({
  limit: z.number(), // X-Rate-Limit: Total requests allowed per minute
  remaining: z.number(), // X-Rate-Limit-Remaining: Requests remaining in current window
  retry_after: z.number().optional(), // Retry-After: Seconds to wait before retry (when rate limited)
  reset_time: z.number().optional(), // Unix timestamp when rate limit resets
  window_ms: z.number().default(60000), // Rate limit window in milliseconds (1 minute)
});

export type ZendeskRateLimitInfo = z.infer<typeof ZendeskRateLimitInfoSchema>;

// HTTP Request Configuration
export const HttpRequestConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().optional(),
  retries: z.number().min(0).max(5).optional(),
});

export type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>;

// API Client Configuration
export const ZendeskApiClientConfigSchema = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
  email: z.string().email('Valid email is required'),
  apiToken: z.string().min(1, 'API token is required'),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    maxRequests: z.number().positive().default(700), // Zendesk Enterprise plan: 700 requests per minute
    windowMs: z.number().positive().default(60000), // 1 minute window
    retryAfterHeader: z.string().default('Retry-After'), // Standard retry header
    rateLimitHeader: z.string().default('X-Rate-Limit'), // Primary rate limit header
    rateLimitRemainingHeader: z.string().default('X-Rate-Limit-Remaining'), // Primary remaining header
    // Alternative headers for compatibility
    altRateLimitHeader: z.string().default('ratelimit-limit'),
    altRateLimitRemainingHeader: z.string().default('ratelimit-remaining'),
    rateLimitResetHeader: z.string().default('ratelimit-reset'),
  }).optional(),
});

export type ZendeskApiClientConfig = z.infer<typeof ZendeskApiClientConfigSchema>;

// Zendesk Offset-based Query Parameters (Legacy)
export const ZendeskOffsetQueryParamsSchema = z.object({
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  include: z.string().optional(),
});

// Zendesk Cursor-based Query Parameters (Recommended)
export const ZendeskCursorQueryParamsSchema = z.object({
  'page[size]': z.number().min(1).max(100).optional(),
  'page[after]': z.string().optional(),
  'page[before]': z.string().optional(),
  sort: z.string().optional(), // e.g., 'created_at', '-updated_at'
  include: z.string().optional(),
});

// Common Query Parameters (Legacy alias)
export const CommonQueryParamsSchema = ZendeskOffsetQueryParamsSchema;

export type ZendeskOffsetQueryParams = z.infer<typeof ZendeskOffsetQueryParamsSchema>;
export type ZendeskCursorQueryParams = z.infer<typeof ZendeskCursorQueryParamsSchema>;
export type CommonQueryParams = ZendeskOffsetQueryParams; // Legacy alias

// Zendesk API Error with details
// Alternative Zendesk API error format for HTTP-level errors
export const ZendeskAPIErrorSchema = z.object({
  error: z.string(), // Error type
  description: z.string(), // Error description
  details: z.string().optional(), // Additional error details
  code: z.string().optional(), // HTTP status code
});

export type ZendeskAPIError = z.infer<typeof ZendeskAPIErrorSchema>;