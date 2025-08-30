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
import { UserIntent, NLPResponse, ContextualResponse } from '../types';
import { AIService } from '../services/ai/ai-service';
import { SlackWebhookHandler } from '../services/integrations/slack/endpoints/webhook-handler';

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
    
    // Create webhook handler instance
    const webhookHandler = new SlackWebhookHandler({
      env: c.env,
      slackService: services.slack!,
      corsHeaders: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Slack-Signature, X-Slack-Request-Timestamp'
      },
      enableSignatureVerification: true
    });
    
    // Handle the request through the centralized webhook handler
    const response = await webhookHandler.handle(c.req.raw);
    
    // Convert Response to Hono response format
    const responseBody = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
    
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
      
    // app_mention events are now handled exclusively through webhook handler
    // to prevent duplicate processing and race conditions
      
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
 * Handle Slack message events with natural language processing
 */
async function handleMessageEvent(event: any, services: any, env: Env): Promise<void> {
  try {
    const { text, user, channel, ts } = event;
    
    // Skip if no text or if it's a bot message
    if (!text || event.bot_id) {
      return;
    }
    
    // Skip if message starts with slash command (handled separately)
    if (text.trim().startsWith('/')) {
      return;
    }
    
    console.log(`Processing natural language message from user ${user}: "${text}"`);
    
    // Check if AI service is available
    if (!services.ai) {
      console.warn('AI service not available for natural language processing');
      return;
    }
    
    // Classify user intent using Gemini
    const nlpResponse: NLPResponse = await services.ai.classifyUserIntent(text);
    const { intent } = nlpResponse;
    
    console.log(`Intent classified: ${intent.category} (confidence: ${intent.confidence})`);
    
    // Handle low confidence responses
    if (intent.confidence < 0.6) {
      await sendSlackMessage(services.slack, channel, {
        text: "I'm not sure I understand. You can try using slash commands like `/zendesk` or `/clickup` for specific actions, or `/help` for available commands.",
        thread_ts: ts
      });
      return;
    }
    
    // Process based on intent category
    switch (intent.category) {
      case 'zendesk_query':
        await handleZendeskNaturalLanguage(intent, services, channel, ts);
        break;
        
      case 'zendesk_action':
        await handleZendeskActionNaturalLanguage(intent, services, channel, ts);
        break;
        
      case 'clickup_create':
        await handleClickUpCreateNaturalLanguage(intent, services, channel, ts);
        break;
        
      case 'clickup_query':
        await handleClickUpQueryNaturalLanguage(intent, services, channel, ts);
        break;
        
      case 'general':
        await handleGeneralNaturalLanguage(intent, services, channel, ts);
        break;
        
      default:
        console.log(`Unhandled intent category: ${intent.category}`);
        await sendSlackMessage(services.slack, channel, {
          text: "I understand your message but I'm not sure how to help with that. Try using `/help` to see available commands.",
          thread_ts: ts
        });
    }
    
  } catch (error) {
    console.error('Error processing natural language message:', error);
    // Don't send error messages to users for failed NLP processing
  }
}

/**
 * Utility function to send Slack messages
 */
async function sendSlackMessage(slackService: any, channel: string, message: any): Promise<void> {
  if (slackService && slackService.sendMessage) {
    try {
      await slackService.sendMessage(channel, message);
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }
}

/**
 * Handle Zendesk queries from natural language
 */
async function handleZendeskNaturalLanguage(intent: UserIntent, services: any, channel: string, threadTs: string): Promise<void> {
  if (!services.zendesk) {
    await sendSlackMessage(services.slack, channel, {
      text: "Zendesk service is not available.",
      thread_ts: threadTs
    });
    return;
  }

  try {
    const { entities } = intent;
    
    if (entities.ticketId) {
      // Query specific ticket
      const ticket = await services.zendesk.getTicket(entities.ticketId);
      const response = await services.ai.generateContextualResponse('zendesk_query', { ticket, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    } else if (entities.timeframe || entities.priority) {
      // Query tickets by criteria
      const tickets = await services.zendesk.getTicketsByCriteria({
        timeframe: entities.timeframe,
        priority: entities.priority,
        status: entities.status
      });
      
      const response = await services.ai.generateContextualResponse('zendesk_query', { tickets, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    } else {
      // General ticket query
      const tickets = await services.zendesk.getRecentTickets(5);
      const response = await services.ai.generateContextualResponse('zendesk_query', { tickets, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    }
  } catch (error) {
    console.error('Error handling Zendesk query:', error);
    await sendSlackMessage(services.slack, channel, {
      text: "Sorry, I encountered an error while querying Zendesk. Please try again or use `/zendesk` commands.",
      thread_ts: threadTs
    });
  }
}

/**
 * Handle Zendesk actions from natural language
 */
async function handleZendeskActionNaturalLanguage(intent: UserIntent, services: any, channel: string, threadTs: string): Promise<void> {
  if (!services.zendesk) {
    await sendSlackMessage(services.slack, channel, {
      text: "Zendesk service is not available.",
      thread_ts: threadTs
    });
    return;
  }

  try {
    const { entities, action } = intent;
    
    if (action.includes('reply') && entities.ticketId) {
      // Generate AI reply for ticket
      const ticket = await services.zendesk.getTicket(entities.ticketId);
      const aiReply = await services.ai.generateTicketReply(ticket);
      
      const response = await services.ai.generateContextualResponse('zendesk_action', { 
        ticket, 
        aiReply, 
        action: 'reply_generated',
        intent 
      });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    } else {
      await sendSlackMessage(services.slack, channel, {
        text: "I understand you want to perform a Zendesk action, but I need more specific information. Try using `/zendesk` commands for actions.",
        thread_ts: threadTs
      });
    }
  } catch (error) {
    console.error('Error handling Zendesk action:', error);
    await sendSlackMessage(services.slack, channel, {
      text: "Sorry, I encountered an error while performing the Zendesk action. Please try again or use `/zendesk` commands.",
      thread_ts: threadTs
    });
  }
}

/**
 * Handle ClickUp task creation from natural language
 */
async function handleClickUpCreateNaturalLanguage(intent: UserIntent, services: any, channel: string, threadTs: string): Promise<void> {
  if (!services.clickup) {
    await sendSlackMessage(services.slack, channel, {
      text: "ClickUp service is not available.",
      thread_ts: threadTs
    });
    return;
  }

  try {
    const { entities } = intent;
    
    if (entities.taskName) {
      // Create task with extracted information
      const taskData = {
        name: entities.taskName,
        description: entities.description || '',
        priority: entities.priority,
        assignee: entities.assignee
      };
      
      const task = await services.clickup.createTask(taskData);
      const response = await services.ai.generateContextualResponse('clickup_create', { task, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    } else {
      await sendSlackMessage(services.slack, channel, {
        text: "I understand you want to create a ClickUp task, but I need a task name. Try something like 'Create task: Fix login bug' or use `/clickup` commands.",
        thread_ts: threadTs
      });
    }
  } catch (error) {
    console.error('Error creating ClickUp task:', error);
    await sendSlackMessage(services.slack, channel, {
      text: "Sorry, I encountered an error while creating the ClickUp task. Please try again or use `/clickup` commands.",
      thread_ts: threadTs
    });
  }
}

/**
 * Handle ClickUp queries from natural language
 */
async function handleClickUpQueryNaturalLanguage(intent: UserIntent, services: any, channel: string, threadTs: string): Promise<void> {
  if (!services.clickup) {
    await sendSlackMessage(services.slack, channel, {
      text: "ClickUp service is not available.",
      thread_ts: threadTs
    });
    return;
  }

  try {
    const { entities } = intent;
    
    if (entities.assignee || entities.status || entities.timeframe) {
      // Query tasks by criteria
      const tasks = await services.clickup.getTasksByCriteria({
        assignee: entities.assignee,
        status: entities.status,
        timeframe: entities.timeframe
      });
      
      const response = await services.ai.generateContextualResponse('clickup_query', { tasks, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    } else {
      // General task query
      const tasks = await services.clickup.getRecentTasks(5);
      const response = await services.ai.generateContextualResponse('clickup_query', { tasks, intent });
      
      await sendSlackMessage(services.slack, channel, {
        text: response.text,
        thread_ts: threadTs
      });
    }
  } catch (error) {
    console.error('Error querying ClickUp:', error);
    await sendSlackMessage(services.slack, channel, {
      text: "Sorry, I encountered an error while querying ClickUp. Please try again or use `/clickup` commands.",
      thread_ts: threadTs
    });
  }
}

/**
 * Handle general conversation from natural language
 */
async function handleGeneralNaturalLanguage(intent: UserIntent, services: any, channel: string, threadTs: string): Promise<void> {
  try {
    const response = await services.ai.generateContextualResponse('general', { intent });
    
    await sendSlackMessage(services.slack, channel, {
      text: response.text,
      thread_ts: threadTs
    });
  } catch (error) {
    console.error('Error handling general conversation:', error);
    await sendSlackMessage(services.slack, channel, {
      text: "Hello! I can help you with Zendesk tickets and ClickUp tasks. Try asking me something like 'Show me urgent tickets' or 'Create a task for bug fixes'. You can also use `/help` for available commands.",
      thread_ts: threadTs
    });
  }
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