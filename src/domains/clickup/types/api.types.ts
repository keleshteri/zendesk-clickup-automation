/**
 * @type: types
 * @domain: clickup
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

// ClickUp API Error Response
export const ApiErrorSchema = z.object({
  err: z.string(),
  ECODE: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Paginated Response
export const PaginatedResponseSchema = z.object({
  tasks: z.array(z.unknown()).optional(),
  spaces: z.array(z.unknown()).optional(),
  folders: z.array(z.unknown()).optional(),
  lists: z.array(z.unknown()).optional(),
  last_page: z.boolean().optional(),
  page: z.number().optional(),
});

export type PaginatedResponse<T> = {
  readonly items: readonly T[];
  readonly last_page?: boolean;
  readonly page?: number;
};

// Rate Limit Info
export const RateLimitInfoSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(), // Unix timestamp
});

export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>;

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
export const ApiClientConfigSchema = z.object({
  baseUrl: z.string().url().default('https://api.clickup.com/api/v2'),
  accessToken: z.string().min(1, 'Access token is required'),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    maxRequests: z.number().positive().default(100),
    windowMs: z.number().positive().default(60000), // 1 minute
  }).optional(),
});

export type ApiClientConfig = z.infer<typeof ApiClientConfigSchema>;

// Webhook signature validation
export const WebhookSignatureSchema = z.object({
  signature: z.string(),
  body: z.string(),
  secret: z.string(),
});

export type WebhookSignature = z.infer<typeof WebhookSignatureSchema>;

// Common query parameters
export const CommonQueryParamsSchema = z.object({
  page: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  order_by: z.string().optional(),
  reverse: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export type CommonQueryParams = z.infer<typeof CommonQueryParamsSchema>;

// ClickUp API Error (for error responses)
export const ClickUpAPIErrorSchema = z.object({
  err: z.string(),
  ECODE: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

export type ClickUpAPIError = z.infer<typeof ClickUpAPIErrorSchema>;

// ClickUp Rate Limit Info (from response headers)
export const ClickUpRateLimitInfoSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(), // Unix timestamp
  retryAfter: z.number().optional(), // Seconds to wait before retry
});

export type ClickUpRateLimitInfo = z.infer<typeof ClickUpRateLimitInfoSchema>;