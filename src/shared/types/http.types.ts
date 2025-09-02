/**
 * @type: types
 * @domain: shared
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// HTTP Methods
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// HTTP Headers
export const HttpHeadersSchema = z.record(z.string());
export type HttpHeaders = z.infer<typeof HttpHeadersSchema>;

// HTTP Status Codes
export const HttpStatusCodeSchema = z.number().min(100).max(599);
export type HttpStatusCode = z.infer<typeof HttpStatusCodeSchema>;

// HTTP Response
export const HttpResponseSchema = z.object({
  status: HttpStatusCodeSchema,
  statusText: z.string(),
  headers: HttpHeadersSchema,
  data: z.unknown().optional(),
  url: z.string().optional(),
});

export type HttpResponse<T = unknown> = {
  readonly status: HttpStatusCode;
  readonly statusText: string;
  readonly headers: HttpHeaders;
  readonly data?: T;
  readonly url?: string;
};

// HTTP Request Config
export const HttpRequestConfigSchema = z.object({
  method: HttpMethodSchema.default('GET'),
  url: z.string().url(),
  headers: HttpHeadersSchema.optional(),
  body: z.unknown().optional(),
  timeout: z.number().positive().optional(),
  retries: z.number().min(0).max(10).default(0),
  retryDelay: z.number().positive().default(1000),
});

export type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>;

// HTTP Error
export const HttpErrorSchema = z.object({
  message: z.string(),
  status: HttpStatusCodeSchema.optional(),
  statusText: z.string().optional(),
  url: z.string().optional(),
  headers: HttpHeadersSchema.optional(),
  data: z.unknown().optional(),
});

export type HttpError = z.infer<typeof HttpErrorSchema>;

// Common HTTP Status Code Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusConstant = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];