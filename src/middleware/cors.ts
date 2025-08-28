/**
 * @ai-metadata
 * @component: CORSMiddleware
 * @description: CORS configuration middleware using Hono's built-in CORS support
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/cors-middleware.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono/cors"]
 * @tests: ["./tests/middleware/cors.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "CORS configuration for Zendesk-ClickUp automation API endpoints"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

import { CORSConfig } from '../interfaces';

/**
 * Get CORS configuration based on environment
 */
function getCORSConfig(env: Env): CORSConfig {
  // Default allowed origins
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:8787',
    'https://localhost:3000',
    'https://localhost:8787'
  ];

  // Add environment-specific origins
  const allowedOrigins = [...defaultOrigins];
  
  // Add production domains if specified
  if (env.ALLOWED_ORIGINS) {
    const envOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    allowedOrigins.push(...envOrigins);
  }

  // Add Slack domains for webhook callbacks
  if (env.SLACK_BOT_TOKEN) {
    allowedOrigins.push(
      'https://hooks.slack.com',
      'https://slack.com',
      'https://*.slack.com'
    );
  }

  // Add Zendesk domains for webhook callbacks
  if (env.ZENDESK_SUBDOMAIN) {
    allowedOrigins.push(
      `https://${env.ZENDESK_SUBDOMAIN}.zendesk.com`,
      'https://*.zendesk.com'
    );
  }

  // Add ClickUp domains for OAuth callbacks
  if (env.CLICKUP_CLIENT_ID) {
    allowedOrigins.push(
      'https://app.clickup.com',
      'https://api.clickup.com',
      'https://*.clickup.com'
    );
  }

  return {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    allowMethods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS',
      'HEAD'
    ],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'User-Agent',
      'DNT',
      'Cache-Control',
      'X-Mx-ReqToken',
      'Keep-Alive',
      'X-Requested-With',
      'If-Modified-Since',
      // Slack-specific headers
      'X-Slack-Signature',
      'X-Slack-Request-Timestamp',
      // Zendesk-specific headers
      'X-Zendesk-Webhook-Signature',
      'X-Zendesk-Webhook-Signature-Timestamp',
      // ClickUp-specific headers
      'X-Signature',
      // Custom headers
      'X-API-Key',
      'X-Client-Version'
    ],
    exposeHeaders: [
      'Content-Length',
      'X-Request-Id',
      'X-Response-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    maxAge: 86400, // 24 hours
    credentials: true
  };
}

/**
 * Create CORS middleware with environment-specific configuration
 */
export function createCORSMiddleware(env: Env): MiddlewareHandler {
  const config = getCORSConfig(env);
  return cors(config);
}

/**
 * Default CORS middleware (uses environment from context)
 */
export const corsMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const config = getCORSConfig(c.env);
  const corsHandler = cors(config);
  return corsHandler(c, next);
};

/**
 * Strict CORS middleware for sensitive endpoints
 */
export const strictCORSMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const config = getCORSConfig(c.env);
  
  // Override with stricter settings
  const strictConfig = {
    ...config,
    origin: [
      `https://${c.env.ZENDESK_SUBDOMAIN}.zendesk.com`,
      'https://hooks.slack.com',
      'https://api.clickup.com'
    ].filter(Boolean),
    credentials: true,
    maxAge: 300 // 5 minutes for sensitive endpoints
  };
  
  const corsHandler = cors(strictConfig);
  return corsHandler(c, next);
};

/**
 * Public CORS middleware for public endpoints (health checks, etc.)
 */
export const publicCORSMiddleware: MiddlewareHandler = cors({
  origin: '*',
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  maxAge: 3600, // 1 hour
  credentials: false
});

/**
 * Webhook CORS middleware for webhook endpoints
 */
export const webhookCORSMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const config = getCORSConfig(c.env);
  
  // Override with webhook-specific settings
  const webhookConfig = {
    ...config,
    origin: [
      `https://${c.env.ZENDESK_SUBDOMAIN}.zendesk.com`,
      'https://hooks.slack.com',
      'https://api.clickup.com'
    ].filter(Boolean),
    allowMethods: ['POST', 'OPTIONS'],
    credentials: false, // Webhooks typically don't need credentials
    maxAge: 86400 // 24 hours
  };
  
  const corsHandler = cors(webhookConfig);
  return corsHandler(c, next);
};

/**
 * Helper function to validate origin against allowed list
 */
export function isOriginAllowed(origin: string, env: Env): boolean {
  const config = getCORSConfig(env);
  
  if (typeof config.origin === 'function') {
    const result = (config.origin as (origin: string, c?: any) => string)(origin);
    return result === origin || result === '*';
  }
  
  if (Array.isArray(config.origin)) {
    return config.origin.includes(origin);
  }
  
  if (typeof config.origin === 'string') {
    return config.origin === '*' || config.origin === origin;
  }
  
  return false;
}

/**
 * Get CORS headers for manual CORS handling (if needed)
 */
export function getCORSHeaders(origin: string, env: Env): Record<string, string> {
  const config = getCORSConfig(env);
  const headers: Record<string, string> = {};
  
  if (isOriginAllowed(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  headers['Access-Control-Allow-Methods'] = config.allowMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.allowHeaders.join(', ');
  
  if (config.exposeHeaders) {
    headers['Access-Control-Expose-Headers'] = config.exposeHeaders.join(', ');
  }
  
  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
  }
  
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}