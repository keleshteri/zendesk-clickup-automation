/**
 * @type: application
 * @domain: main
 * @purpose: Cloudflare Workers entry point with DI integration
 * @framework: Hono
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import type { Env } from './infrastructure/di/dependencies';
import { createDIMiddleware, type DIContext } from './infrastructure/di/container';
import { getEnvironmentConfig } from './infrastructure/di/dependencies';
import { clickupRoutes } from './infrastructure/routes/clickup.routes';
import { zendeskRoutes } from './infrastructure/routes/zendesk.routes';
import { webhookRoutes } from './infrastructure/routes/webhook.routes';
import { slackRoutes } from './infrastructure/routes/slack.routes';

// Create Hono app with proper typing
const app = new Hono<{ Bindings: Env }>();

// Global middleware setup
app.use('*', logger());
app.use('*', prettyJSON());

// CORS middleware with environment-specific configuration
app.use('*', async (c, next) => {
  const envConfig = getEnvironmentConfig(c.env);
  
  return cors({
    origin: envConfig.corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })(c, next);
});

// Dependency injection middleware
app.use('*', createDIMiddleware());

// Simple test endpoint without DI
app.get('/test', (c) => {
  return c.json({ message: 'Test endpoint working' });
});

// Health check endpoint
app.get('/health', (c: DIContext) => {
  try {
    const envConfig = getEnvironmentConfig(c.env);
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: c.env.APP_ENVIRONMENT || 'unknown',
      version: '1.0.0',
      services: {
        clickup_oauth: 'available',
        clickup_api: 'available',
        zendesk_api: 'available'
      },
      ...(envConfig.isDevelopment && {
        debug: {
          dependencies_initialized: true,
          base_url: c.env.APP_BASE_URL,
        },
      }),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
       status: 'error',
       message: 'Health check failed',
       error: error instanceof Error ? error.message : 'Unknown error'
     }, 500);
   }
 });

// Mount ClickUp API routes
app.route('/api/clickup', clickupRoutes);

// Mount Zendesk API routes
app.route('/api/zendesk', zendeskRoutes);

// Mount Webhook API routes
app.route('/api/webhooks', webhookRoutes);

// Mount Slack API routes
app.route('/api/slack', slackRoutes);

// API routes overview
app.get('/api', (c: DIContext) => {
  return c.json({
    message: 'Zendesk-ClickUp Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      clickup: {
        oauth: {
          authorize: '/api/clickup/auth',
          callback: '/api/clickup/auth/callback',
        },
        status: {
          connectivity: 'GET /api/clickup/status',
          authentication: 'GET /api/clickup/status/auth',
          automation_config: 'GET /api/clickup/automation/config',
        },
        authentication: {
          note: 'Status endpoints require Bearer token in Authorization header (except /status)',
          example: 'Authorization: Bearer your_clickup_access_token',
        },
      },
      zendesk: {
        status: {
          connectivity: 'GET /api/zendesk/status',
        },
        note: 'Zendesk endpoints use API token authentication configured in environment variables',
      },
      webhooks: {
        zendesk: 'POST /api/webhooks/zendesk',
        clickup: 'POST /api/webhooks/clickup',
        status: 'GET /api/webhooks/status',
      },
    },
  });
});



// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      available_endpoints: {
        general: ['/health', '/api'],
        clickup: ['/api/clickup/auth', '/api/clickup/auth/callback', '/api/clickup/status'],
        zendesk: ['/api/zendesk/status'],
        note: 'See /api for complete endpoint documentation',
      },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Application Error:', err);
  
  const envConfig = getEnvironmentConfig(c.env);
  
  return c.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      ...(envConfig.enableDetailedErrors && {
        details: err.message,
        stack: err.stack,
      }),
    },
    500
  );
});

export default app;
