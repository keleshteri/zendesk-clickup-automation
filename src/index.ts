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
        clickup_api: 'available'
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

// API routes overview
app.get('/api', (c: DIContext) => {
  return c.json({
    message: 'ClickUp Integration API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      oauth: {
        authorize: '/api/clickup/auth',
        callback: '/api/clickup/auth/callback',
      },
      api: {
        // Task Management
        get_task: 'GET /api/clickup/tasks/:taskId',
        get_tasks: 'GET /api/clickup/lists/:listId/tasks',
        create_task: 'POST /api/clickup/lists/:listId/tasks',
        update_task: 'PUT /api/clickup/tasks/:taskId',
        delete_task: 'DELETE /api/clickup/tasks/:taskId',
        
        // Workspace Management
        get_spaces: 'GET /api/clickup/spaces',
        get_space: 'GET /api/clickup/spaces/:spaceId',
        create_space: 'POST /api/clickup/teams/:teamId/spaces',
        get_folders: 'GET /api/clickup/spaces/:spaceId/folders',
        create_folder: 'POST /api/clickup/spaces/:spaceId/folders',
        get_lists: 'GET /api/clickup/folders/:folderId/lists',
        get_folderless_lists: 'GET /api/clickup/spaces/:spaceId/lists',
        create_list: 'POST /api/clickup/folders/:folderId/lists',
        
        // User & Team Management
        get_user: 'GET /api/clickup/user',
        get_teams: 'GET /api/clickup/teams',
        
        // Webhook Management
        get_webhooks: 'GET /api/clickup/teams/:teamId/webhooks',
        create_webhook: 'POST /api/clickup/teams/:teamId/webhooks',
      },
      authentication: {
        note: 'All /api/clickup/* endpoints require Bearer token in Authorization header',
        example: 'Authorization: Bearer your_clickup_access_token',
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
        oauth: ['/api/clickup/auth', '/api/clickup/auth/callback'],
        clickup_api: [
          '/api/clickup/tasks/:taskId',
          '/api/clickup/lists/:listId/tasks',
          '/api/clickup/spaces',
          '/api/clickup/teams',
          '/api/clickup/user',
        ],
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
