/**
 * @ai-metadata
 * @component: SlackRoutes
 * @description: Slack integration endpoints for events, commands, socket mode, and security
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-routes.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "../middleware/error.ts", "../middleware/cors.ts"]
 * @tests: ["./tests/routes/slack.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Slack API integration endpoints and webhook handling"
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
import type { Env } from '../types/env';
import { webhookCORSMiddleware, strictCORSMiddleware } from '../middleware/cors';
import { 
  handleAsync, 
  requireService, 
  validateRequired, 
  AuthenticationError,
  ValidationError
} from '../middleware/error';

import { SlackEventPayload, SlackCommandPayload } from '../interfaces';

/**
 * Create Slack routes
 */
export const slackRoutes = new Hono<{ Bindings: Env }>();

/**
 * Slack Events API endpoint
 * POST /slack/events
 */
slackRoutes.post('/events', webhookCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    // Get request body
    const body = await c.req.text();
    
    // Verify Slack signature
    const signature = c.req.header('X-Slack-Signature');
    const timestamp = c.req.header('X-Slack-Request-Timestamp');
    
    if (!signature || !timestamp) {
      throw new AuthenticationError('Missing Slack signature headers');
    }
    
    const isValidSignature = await services.slack!.verifyRequest(
      signature,
      body,
      timestamp
    );
    
    if (!isValidSignature) {
      throw new AuthenticationError('Invalid Slack signature');
    }
    
    // Parse payload
    let payload: SlackEventPayload | { type: string; challenge?: string };
    try {
      payload = JSON.parse(body);
    } catch (error) {
      throw new ValidationError('Invalid JSON payload');
    }
    
    // Handle URL verification challenge
    if (payload.type === 'url_verification' && 'challenge' in payload) {
      return c.text(payload.challenge!);
    }
    
    // Handle event callbacks
    if (payload.type === 'event_callback') {
      const eventPayload = payload as SlackEventPayload;
      await handleSlackEvent(eventPayload, services, c.env);
    }
    
    return c.json({ ok: true });
    
  }, 'Slack events processing failed');
});

/**
 * Slack Slash Commands endpoint
 * POST /slack/commands
 */
slackRoutes.post('/commands', webhookCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    // Parse form data
    const formData = await c.req.formData();
    const payload: SlackCommandPayload = {
      token: formData.get('token') as string,
      team_id: formData.get('team_id') as string,
      team_domain: formData.get('team_domain') as string,
      channel_id: formData.get('channel_id') as string,
      channel_name: formData.get('channel_name') as string,
      user_id: formData.get('user_id') as string,
      user_name: formData.get('user_name') as string,
      command: formData.get('command') as string,
      text: formData.get('text') as string || '',
      response_url: formData.get('response_url') as string,
      trigger_id: formData.get('trigger_id') as string,
      api_app_id: formData.get('api_app_id') as string
    };
    
    // Validate required fields
    validateRequired(payload, ['token', 'team_id', 'user_id', 'command']);
    
    // Verify token
    if (payload.token !== c.env.SLACK_VERIFICATION_TOKEN) {
      throw new AuthenticationError('Invalid verification token');
    }
    
    console.log(`Processing Slack command: ${payload.command} from user ${payload.user_name}`);
    
    // Handle different commands
    const response = await handleSlackCommand(payload, services, c.env);
    
    return c.json(response);
    
  }, 'Slack command processing failed');
});

/**
 * Slack Socket Mode status endpoint
 * GET /slack/socket/status
 */
slackRoutes.get('/socket/status', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const status = await services.slack!.getSocketModeStatus();
    
    return c.json({
      socketMode: {
        connected: status.connected,
        lastConnected: status.lastConnected,
        connectionCount: status.connectionCount,
        errors: status.errors
      },
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get socket mode status');
});

/**
 * Slack Socket Mode reconnect endpoint
 * POST /slack/socket/reconnect
 */
slackRoutes.post('/socket/reconnect', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const healthStatus = await services.slack!.getHealthStatus();

    return c.json({
      success: true,
      message: 'Socket mode reconnect completed',
      healthStatus,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to reconnect socket mode');
});

/**
 * Slack Socket Mode shutdown endpoint
 * POST /slack/socket/shutdown
 */
slackRoutes.post('/socket/shutdown', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    await services.slack!.shutdownSocketMode();

    return c.json({
      success: true,
      message: 'Socket mode shutdown completed',
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to shutdown socket mode');
});

/**
 * Slack App Manifest templates endpoint
 * GET /slack/manifest/templates
 */
slackRoutes.get('/manifest/templates', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const templates = { templates: [] }; // Placeholder implementation
    
    return c.json({
      templates,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get manifest templates');
});

/**
 * Deploy Slack app from template endpoint
 * POST /slack/manifest/deploy
 */
slackRoutes.post('/manifest/deploy', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const { templateName, config } = await c.req.json();
    validateRequired({ templateName }, ['templateName']);
    
    const result = await services.slack!.deployAppFromTemplate(templateName, config);
    
    return c.json({
      success: result.success,
      appId: result.appId,
      manifest: result.manifest,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to deploy app from template');
});

/**
 * Update Slack app configuration endpoint
 * PUT /slack/manifest/:appId
 */
slackRoutes.put('/manifest/:appId', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const appId = c.req.param('appId');
    const { manifest } = await c.req.json();
    
    validateRequired({ appId, manifest }, ['appId', 'manifest']);
    
    const result = await services.slack!.updateAppConfiguration(appId, manifest);
    
    return c.json({
      success: result.success,
      appId,
      updatedManifest: result.manifest,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to update app manifest');
});

/**
 * Validate Slack app configuration endpoint
 * GET /slack/manifest/:appId/validate
 */
slackRoutes.get('/manifest/:appId/validate', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const appId = c.req.param('appId');
    validateRequired({ appId }, ['appId']);
    
    const validation = await services.slack!.validateAppConfiguration(appId);
    
    return c.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      appId,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to validate app manifest');
});

/**
 * Check Slack manifest permissions endpoint
 * GET /slack/manifest/permissions
 */
slackRoutes.get('/manifest/permissions', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const permissions = services.slack!.checkManifestPermissions();
    
    return c.json({
      permissions,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get manifest permissions');
});

/**
 * Slack security metrics endpoint
 * GET /slack/security/metrics
 */
slackRoutes.get('/security/metrics', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const metrics = await services.slack!.getSecurityMetrics();
    
    return c.json({
      metrics,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get security metrics');
});

/**
 * Slack security audit logs endpoint
 * GET /slack/security/audit
 */
slackRoutes.get('/security/audit', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const limit = parseInt(c.req.query('limit') || '100');
    const severity = c.req.query('severity');
    
    const auditLogs = await services.slack!.getSecurityAuditLog();
    
    return c.json({
      auditLogs,
      limit,
      severity,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get security audit logs');
});

/**
 * Slack token metadata endpoint
 * GET /slack/security/tokens
 */
slackRoutes.get('/security/tokens', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const tokenMetadata = await services.slack!.getTokenMetadata();
    
    return c.json({
      tokens: tokenMetadata,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get token metadata');
});

/**
 * Slack token rotation status endpoint
 * GET /slack/security/rotation/status
 */
slackRoutes.get('/security/rotation/status', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const rotationStatus = await services.slack!.checkTokenRotationStatus();
    
    return c.json({
      rotation: rotationStatus,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get token rotation status');
});

/**
 * Force Slack token rotation endpoint
 * POST /slack/security/rotation/force
 */
slackRoutes.post('/security/rotation/force', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    await services.slack!.forceTokenRotation();

    return c.json({
      success: true,
      message: 'Token rotation forced successfully',
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to force token rotation');
});

/**
 * Update Slack token rotation configuration endpoint
 * PUT /slack/security/rotation/config
 */
slackRoutes.put('/security/rotation/config', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const config = await c.req.json();
    validateRequired(config, ['rotationInterval', 'autoRotate']);
    
    await services.slack!.updateTokenRotationConfig(config);

    return c.json({
      success: true,
      message: 'Token rotation config updated successfully',
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to update token rotation config');
});

/**
 * Verify Slack request with security audit endpoint
 * POST /slack/security/verify
 */
slackRoutes.post('/security/verify', strictCORSMiddleware, async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.slack, 'Slack');
    
    const { signature, timestamp, body } = await c.req.json();
    validateRequired({ signature, timestamp, body }, ['signature', 'timestamp', 'body']);
    
    const verification = await services.slack!.verifyRequestWithAudit(signature, body, timestamp);

    return c.json({
      verified: verification,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to verify request with audit');
});

/**
 * Handle Slack events
 */
async function handleSlackEvent(payload: SlackEventPayload, _services: any, _env: Env): Promise<void> {
  const { event } = payload;
  
  console.log(`Processing Slack event: ${event.type}`);
  
  switch (event.type) {
    case 'message':
      if (event.text && !event.bot_id) {
        await handleMessageEvent(event, _services, _env);
      }
      break;
      
    case 'app_mention':
      await handleAppMentionEvent(event, _services, _env);
      break;
      
    case 'team_join':
      await handleTeamJoinEvent(event, _services, _env);
      break;
      
    case 'member_joined_channel':
      await handleMemberJoinedChannelEvent(event, _services, _env);
      break;
      
    default:
      console.log(`Unhandled Slack event type: ${event.type}`);
  }
}

/**
 * Handle Slack message events
 */
async function handleMessageEvent(_event: any, _services: any, _env: Env): Promise<void> {
  
}

/**
 * Handle Slack app mention events
 */
async function handleAppMentionEvent(event: any, _services: any, _env: Env): Promise<void> {
  if (_services.slack && event.text) {
    try {
      await _services.slack.handleMention({
        text: event.text,
        user: event.user,
        channel: event.channel,
        ts: event.ts
      });
    } catch (error) {
      console.warn('App mention handling failed:', error);
    }
  }
}

/**
 * Handle Slack team join events
 */
async function handleTeamJoinEvent(event: any, _services: any, _env: Env): Promise<void> {
  console.log('Team join event:', event);
  if (_services.slack) {
    try {
      // For team join, we can send a DM or use a default channel
      // Using the user ID as channel for DM
      await _services.slack.sendUserWelcomeMessage(event.user.id, event.user.id);
    } catch (error) {
      console.warn('Welcome message failed:', error);
    }
  }
}

/**
 * Handle Slack member joined channel events
 */
async function handleMemberJoinedChannelEvent(event: any, _services: any, _env: Env): Promise<void> {
  console.log('Member joined channel event:', event);
  if (_services.slack && event.user) {
    try {
      // Send welcome message when someone joins a channel
      await _services.slack.sendUserWelcomeMessage(event.channel, event.user);
    } catch (error) {
      console.warn('Channel welcome message failed:', error);
    }
  }
}

/**
 * Handle Slack slash commands
 */
async function handleSlackCommand(payload: SlackCommandPayload, services: any, _env: Env): Promise<any> {
  const { command, text, user_id, channel_id } = payload;
  
  switch (command) {
    case '/zendesk':
      return await handleZendeskCommand(text, services, { user_id, channel_id });
      
    case '/clickup':
      return await handleClickUpCommand(text, services, { user_id, channel_id });
      

      
    case '/help':
      return {
        text: 'Available commands:\n' +
              '• `/zendesk` - Zendesk integration commands\n' +
              '• `/clickup` - ClickUp integration commands\n' +
          
              '• `/help` - Show this help message'
      };
      
    default:
      return {
        text: `Unknown command: ${command}. Type \`/help\` for available commands.`
      };
  }
}

/**
 * Handle Zendesk slash command
 */
async function handleZendeskCommand(text: string, services: any, _context: any): Promise<any> {
  if (!services.zendesk) {
    return { text: 'Zendesk service is not available.' };
  }
  
  const args = text.trim().split(' ');
  const action = args[0];
  
  switch (action) {
    case 'status':
      const status = await services.zendesk.getServiceStatus();
      return { text: `Zendesk Status: ${status.connected ? 'Connected' : 'Disconnected'}` };
      
    case 'tickets':
      const tickets = await services.zendesk.getRecentTickets(5);
      return {
        text: `Recent tickets:\n${tickets.map(t => `• #${t.id}: ${t.subject}`).join('\n')}`
      };
      
    default:
      return {
        text: 'Available Zendesk commands:\n• `status` - Check connection status\n• `tickets` - Show recent tickets'
      };
  }
}

/**
 * Handle ClickUp slash command
 */
async function handleClickUpCommand(text: string, services: any, _context: any): Promise<any> {
  if (!services.clickup) {
    return { text: 'ClickUp service is not available.' };
  }
  
  const args = text.trim().split(' ');
  const action = args[0];
  
  switch (action) {
    case 'status':
      const user = await services.clickup.getCurrentUser();
      return { text: `ClickUp Status: Connected as ${user.username}` };
      
    case 'tasks':
      const tasks = await services.clickup.getRecentTasks(5);
      return {
        text: `Recent tasks:\n${tasks.map(t => `• ${t.name} (${t.status.status})`).join('\n')}`
      };
      
    default:
      return {
        text: 'Available ClickUp commands:\n• `status` - Check connection status\n• `tasks` - Show recent tasks'
      };
  }
}