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
export const ZendeskApiErrorSchema = z.object({
  error: z.string(),
  description: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ZendeskApiError = z.infer<typeof ZendeskApiErrorSchema>;

// Paginated Response
export const PaginatedResponseSchema = z.object({
  next_page: z.string().nullable().optional(),
  previous_page: z.string().nullable().optional(),
  count: z.number().optional(),
});

export type PaginatedResponse<T> = {
  readonly items: readonly T[];
  readonly next_page?: string | null;
  readonly previous_page?: string | null;
  readonly count?: number;
};

// Zendesk specific paginated responses
export type ZendeskTicketsPaginatedResponse = {
  readonly tickets: readonly any[];
  readonly next_page?: string | null;
  readonly previous_page?: string | null;
  readonly count?: number;
};

export type ZendeskCommentsPaginatedResponse = {
  readonly comments: readonly any[];
  readonly next_page?: string | null;
  readonly previous_page?: string | null;
  readonly count?: number;
};

export type ZendeskUsersPaginatedResponse = {
  readonly users: readonly any[];
  readonly next_page?: string | null;
  readonly previous_page?: string | null;
  readonly count?: number;
};

// Rate Limit Info
export const ZendeskRateLimitInfoSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  retry_after: z.number().optional(), // Seconds to wait before retry
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
    maxRequests: z.number().positive().default(700), // Zendesk limit
    windowMs: z.number().positive().default(60000), // 1 minute
  }).optional(),
});

export type ZendeskApiClientConfig = z.infer<typeof ZendeskApiClientConfigSchema>;

// Common query parameters
export const CommonQueryParamsSchema = z.object({
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  include: z.string().optional(),
});

export type CommonQueryParams = z.infer<typeof CommonQueryParamsSchema>;

// Zendesk API Error with details
export const ZendeskAPIErrorSchema = z.object({
  error: z.string(),
  description: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  code: z.string().optional(),
});

export type ZendeskAPIError = z.infer<typeof ZendeskAPIErrorSchema>;