/**
 * @ai-metadata
 * @component: HonoApp
 * @description: Main Hono application instance with middleware and route configuration
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/app.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "./middleware/di.ts", "./middleware/cors.ts", "./middleware/error.ts"]
 * @tests: ["./tests/app.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Central Hono application configuration for Zendesk-ClickUp automation"
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

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

// Middleware imports
import { diMiddleware } from './middleware/di';
import { corsMiddleware } from './middleware/cors';
import { errorMiddleware } from './middleware/error';

// Route imports
import { healthRoutes } from './routes/health';
// Webhook routes have been moved to service-specific modules (zendesk.ts, clickup.ts)
import { slackRoutes } from './routes/slack';
// Auth routes have been moved to /routes/clickup.ts for better organization
import { clickupRoutes } from './routes/clickup';
import { zendeskRoutes } from './routes/zendesk';


// Types
import type { Env } from './types/env';

/**
 * Create and configure the main Hono application
 * @returns Configured Hono application instance
 */
export function createApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  // Global middleware
  app.use('*', logger());
  app.use('*', timing());
  app.use('*', prettyJSON());
  
  // Custom middleware
  app.use('*', errorMiddleware);
  app.use('*', corsMiddleware);
  app.use('*', diMiddleware);

  // Route registration
  app.route('/health', healthRoutes);
  // Webhook routes have been moved to service-specific endpoints
  app.route('/slack', slackRoutes);
  // Auth routes have been moved to /clickup/oauth/* endpoints
  app.route('/clickup', clickupRoutes);
  app.route('/zendesk', zendeskRoutes);
  

  // Test routes (from original index.ts)
  app.route('/test', createTestRoutes());

  // 404 handler with available endpoints
  app.notFound((c) => {
    const availableEndpoints = [
      'GET /health',
      'GET /health/detailed',
      'POST /slack/events',
      'POST /slack/commands',
      'GET /slack/socket/status',
      'POST /slack/socket/reconnect',
      'POST /slack/socket/shutdown',
      'GET /slack/manifest/templates',
      'POST /slack/manifest/deploy',
      'PUT /slack/manifest/:appId',
      'GET /slack/manifest/:appId/validate',
      'GET /slack/manifest/permissions',
      'GET /slack/security/metrics',
      'GET /slack/security/audit',
      'GET /slack/security/tokens',
      'GET /slack/security/rotation/status',
      'POST /slack/security/rotation/force',
      'PUT /slack/security/rotation/config',
      'POST /slack/security/verify',
      '--- ClickUp Integration ---',
      'GET /clickup/auth',
      'GET /clickup/auth/callback',
      'GET /clickup/auth/status',
      'POST /clickup/auth/refresh',
      'DELETE /clickup/auth/revoke',
      'GET /clickup/oauth/test',
      'GET /clickup/oauth/debug',
      'GET /clickup/oauth/connections',
      'GET /clickup/user',
      'GET /clickup/test',
      'POST /clickup/task',
      'GET /clickup/task/:taskId',
      'PUT /clickup/task/:taskId',
      'POST /clickup/webhook',
      '--- Zendesk Integration ---',
      'POST /zendesk/webhook',
      'GET /zendesk/test',
      'GET /zendesk/user',
      'GET /zendesk/ticket/:ticketId',
      'PUT /zendesk/ticket/:ticketId',
      'GET /zendesk/tickets/search',
   
       'POST /test-ai',
      'POST /test-zendesk-ai',
      'POST /test-clickup',
      'POST /test-slack',
      'GET /test',
      'POST /test/slack-service-status',
      'POST /test/bot-welcome'
    ];

    return c.json({
      error: 'Not Found',
      message: `The requested endpoint '${c.req.path}' was not found.`,
      availableEndpoints,
      timestamp: new Date().toISOString()
    }, 404);
  });

  return app;
}

/**
 * Create test routes (extracted from original index.ts)
 */
function createTestRoutes(): Hono<{ Bindings: Env }> {
  const testApp = new Hono<{ Bindings: Env }>();

  // Environment test endpoint
  testApp.get('/', async (c) => {
    const services = c.get('services');
    
    const serviceStatus = {
      slack: !!services.slack,
      zendesk: !!services.zendesk,
      clickup: !!services.clickup,
      ai: !!services.ai,
      oauth: !!services.oauth,
      
    };

    const envVars = {
      SLACK_BOT_TOKEN: !!c.env.SLACK_BOT_TOKEN,
      SLACK_SIGNING_SECRET: !!c.env.SLACK_SIGNING_SECRET,
      ZENDESK_SUBDOMAIN: !!c.env.ZENDESK_SUBDOMAIN,
      ZENDESK_EMAIL: !!c.env.ZENDESK_EMAIL,
      ZENDESK_API_TOKEN: !!c.env.ZENDESK_API_TOKEN,
      CLICKUP_API_TOKEN: !!c.env.CLICKUP_API_TOKEN,
      OPENAI_API_KEY: !!c.env.OPENAI_API_KEY
    };

    return c.json({
      message: 'Environment test successful',
      services: serviceStatus,
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  });

  // AI test endpoint
  testApp.post('/ai', async (c) => {
    const services = c.get('services');
    
    if (!services.ai) {
      return c.json({ error: 'AI service not available' }, 503);
    }

    try {
      const { text } = await c.req.json();
      const summary = await services.ai.summarizeTicket(text);
      return c.json({ summary, timestamp: new Date().toISOString() });
    } catch (error) {
      return c.json({ 
        error: 'AI test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // Zendesk AI test endpoint
  testApp.post('/zendesk-ai', async (c) => {
    const services = c.get('services');
    
    if (!services.zendesk || !services.ai) {
      return c.json({ error: 'Zendesk or AI service not available' }, 503);
    }

    try {
      const { ticketId } = await c.req.json();
      const ticket = await services.zendesk.getTicket(ticketId);
      const summary = await services.ai.summarizeTicket(ticket.description);
      
      return c.json({ 
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          description: ticket.description
        },
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return c.json({ 
        error: 'Zendesk AI test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // ClickUp test endpoint
  testApp.post('/clickup', async (c) => {
    const services = c.get('services');
    
    if (!services.clickup) {
      return c.json({ error: 'ClickUp service not available' }, 503);
    }

    try {
      const { action, ...params } = await c.req.json();
      // Suppress unused variable warning
      void params;
      
      switch (action) {
        case 'test_auth':
          const user = await services.clickup.getCurrentUser();
          return c.json({ user, timestamp: new Date().toISOString() });
          
        case 'create_test_task':
          // Implementation would go here
          return c.json({ message: 'Test task creation not implemented yet' });
          
        case 'list_spaces':
          // Placeholder for spaces - method not implemented
          const spaces = [];
          return c.json({ spaces, timestamp: new Date().toISOString() });
          
        default:
          return c.json({ error: 'Unknown action' }, 400);
      }
    } catch (error) {
      return c.json({ 
        error: 'ClickUp test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // Slack test endpoint
  testApp.post('/slack', async (c) => {
    const services = c.get('services');
    
    if (!services.slack) {
      return c.json({ error: 'Slack service not available' }, 503);
    }

    try {
      const { action, ...params } = await c.req.json();
      // Suppress unused variable warning
      void params;
      
      switch (action) {
        case 'send_message':
          // Implementation would go here
          return c.json({ message: 'Message sending not implemented yet' });
          
        case 'test_auth':
          // Placeholder for auth test - method not implemented
          const authTest = { ok: true, user: 'bot' };
          return c.json({ authTest, timestamp: new Date().toISOString() });
          
        case 'verify_webhook':
          // Implementation would go here
          return c.json({ message: 'Webhook verification not implemented yet' });
          
        default:
          return c.json({ error: 'Unknown action' }, 400);
      }
    } catch (error) {
      return c.json({ 
        error: 'Slack test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // Slack service status test
  testApp.post('/slack-service-status', async (c) => {
    const services = c.get('services');
    
    if (!services.slack) {
      return c.json({ error: 'Slack service not available' }, 503);
    }

    try {
      const status = await services.slack.getHealthStatus();
      return c.json({ status, timestamp: new Date().toISOString() });
    } catch (error) {
      return c.json({ 
        error: 'Slack service status test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // Bot welcome test
  testApp.post('/bot-welcome', async (c) => {
    const services = c.get('services');
    
    if (!services.slack) {
      return c.json({ error: 'Slack service not available' }, 503);
    }

    try {
      const { channel: _channel } = await c.req.json();
      // Placeholder for welcome message - method not implemented
      const result = { success: true, message: 'Welcome message functionality not implemented' };
      return c.json({ result, timestamp: new Date().toISOString() });
    } catch (error) {
      return c.json({ 
        error: 'Bot welcome test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  return testApp;
}

// Export the app instance
export const app = createApp();
export default app;