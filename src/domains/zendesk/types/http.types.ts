/**
 * @type: types
 * @domain: zendesk
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// HTTP Headers
export type HTTPHeaders = Record<string, string>;

// HTTP Methods
export const HTTPMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
export type HTTPMethod = z.infer<typeof HTTPMethodSchema>;

// HTTP Configuration
export const HTTPConfigSchema = z.object({
  method: HTTPMethodSchema,
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().positive().optional(),
});
export type HTTPConfig = z.infer<typeof HTTPConfigSchema>;

// Zendesk HTTP Client Configuration
export const ZendeskHttpClientConfigSchema = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
  email: z.string().email('Valid email is required'),
  apiToken: z.string().min(1, 'API token is required'),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().positive().default(1000),
  userAgent: z.string().default('Zendesk-ClickUp-Automation/1.0'),
});
export type ZendeskHttpClientConfig = z.infer<typeof ZendeskHttpClientConfigSchema>;

// Request Configuration
export const RequestConfigSchema = z.object({
  url: z.string(),
  method: HTTPMethodSchema,
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().positive().optional(),
  retries: z.number().min(0).max(5).optional(),
});
export type RequestConfig = z.infer<typeof RequestConfigSchema>;

// Response Configuration
export const ResponseConfigSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string()),
  data: z.unknown(),
});
export type ResponseConfig = z.infer<typeof ResponseConfigSchema>;

// Authentication Configuration
export const AuthConfigSchema = z.object({
  type: z.enum(['basic', 'bearer', 'api_token']),
  credentials: z.object({
    email: z.string().email().optional(),
    token: z.string().optional(),
    password: z.string().optional(),
  }),
});
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

// Rate Limiting Configuration
export const RateLimitConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxRequests: z.number().positive().default(700), // Zendesk API limit
  windowMs: z.number().positive().default(60000), // 1 minute window
  retryAfter: z.number().positive().optional(),
});
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;