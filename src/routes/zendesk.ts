/**
 * @ai-metadata
 * @component: ZendeskRoutes
 * @description: Zendesk integration routes including webhook handling and API operations
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-routes.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "../middleware/error.ts", "../middleware/cors.ts"]
 * @tests: ["./tests/routes/zendesk.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Zendesk integration endpoints for webhook processing and API operations"
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
import type { ZendeskTicket } from '../types';
import { webhookCORSMiddleware } from '../middleware/cors';
import { 
  handleAsync, 
  requireService,
  validateRequired, 
  AuthenticationError,
  ValidationError
} from '../middleware/error';

/**
 * Zendesk webhook payload interface
 */
interface ZendeskWebhookPayload {
  ticket_id: number;
  ticket: {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string;
    requester_id: number;
    assignee_id?: number;
    group_id?: number;
    tags: string[];
    custom_fields: Array<{
      id: number;
      value: any;
    }>;
    created_at: string;
    updated_at: string;
  };
  current_user?: {
    id: number;
    name: string;
    email: string;
  };
  satisfaction_rating?: {
    score: string;
    comment?: string;
  };
}

/**
 * Create Zendesk routes
 */
export const zendeskRoutes = new Hono<{ Bindings: Env }>();

// Apply CORS middleware to all endpoints
zendeskRoutes.use('*', webhookCORSMiddleware);

/**
 * Zendesk webhook endpoint
 * POST /zendesk/webhook
 * 
 * Processes incoming Zendesk webhooks and creates corresponding ClickUp tasks
 * with AI analysis and intelligent routing.
 */
zendeskRoutes.post('/webhook', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    
    // Verify required services
    requireService(services.zendesk, 'Zendesk');
    requireService(services.ai, 'AI');
    requireService(services.clickup, 'ClickUp');
    
    // Verify webhook signature
    const signature = c.req.header('X-Zendesk-Webhook-Signature');
    const timestamp = c.req.header('X-Zendesk-Webhook-Signature-Timestamp');
    
    if (!signature || !timestamp) {
      throw new AuthenticationError('Missing webhook signature headers');
    }
    
    // Get request body
    const body = await c.req.text();
    
    // Verify signature
    const isValidSignature = await services.zendesk!.verifyWebhookSignature(
      body,
      signature,
      timestamp,
      c.env.ZENDESK_WEBHOOK_SECRET
    );
    
    if (!isValidSignature) {
      throw new AuthenticationError('Invalid webhook signature');
    }
    
    // Parse payload
    let payload: ZendeskWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      throw new ValidationError('Invalid JSON payload');
    }
    
    // Validate required fields
    validateRequired(payload, ['ticket_id', 'ticket']);
    validateRequired(payload.ticket, ['id', 'subject', 'description']);
    
    console.log(`Processing Zendesk webhook for ticket ${payload.ticket_id}`);
    
    // Normalize ticket data to match ZendeskTicket interface
    const normalizedTicket: ZendeskTicket = {
      id: payload.ticket.id,
      url: `https://${c.env.ZENDESK_DOMAIN}/agent/tickets/${payload.ticket.id}`,
      subject: payload.ticket.subject,
      description: payload.ticket.description,
      raw_subject: payload.ticket.subject,
      status: payload.ticket.status as 'new' | 'open' | 'pending' | 'solved' | 'closed',
      priority: payload.ticket.priority as 'low' | 'normal' | 'high' | 'urgent',
      tags: payload.ticket.tags || [],
      created_at: payload.ticket.created_at,
      updated_at: payload.ticket.updated_at,
      requester_id: payload.ticket.requester_id,
      assignee_id: payload.ticket.assignee_id,
      group_id: payload.ticket.group_id
    };
    
    // Check if OAuth should be used for ClickUp
    let clickupService = services.clickup;
    if (services.oauth && payload.current_user?.email) {
      try {
        const userOAuth = await services.oauth.getUserOAuth(payload.current_user.email);
        if (userOAuth && userOAuth.access_token) {
          // Set OAuth data on the existing service
          services.clickup!.setOAuthData(userOAuth);
          console.log(`Using OAuth token for user: ${payload.current_user.email}`);
        }
      } catch (error) {
        console.warn('Failed to get OAuth token, using default ClickUp service:', error);
      }
    }
    
    // AI analysis of the ticket
    const ticketContent = `Subject: ${normalizedTicket.subject}\nDescription: ${normalizedTicket.description}\nPriority: ${normalizedTicket.priority}\nTags: ${normalizedTicket.tags?.join(', ') || 'None'}`;
    const aiAnalysis = await services.ai!.analyzeTicket(ticketContent);
    
    console.log('AI Analysis completed:', {
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      urgency: aiAnalysis.urgency
    });
    
    // Create ClickUp task based on AI analysis
    const clickupTask = await clickupService!.createTaskFromTicket(
      normalizedTicket,
      aiAnalysis
    );
    
    console.log(`Created ClickUp task: ${clickupTask.id}`);
    
    // Log task mapping for simplified automation
    console.log('Task mapping created:', {
      zendeskTicketId: normalizedTicket.id,
      clickupTaskId: clickupTask.id,
      aiCategory: aiAnalysis.category,
      aiPriority: aiAnalysis.priority || 'medium',
      timestamp: new Date().toISOString()
    });
    
    // Send Slack notification if available
    if (services.slack) {
      try {
        await services.slack.sendIntelligentNotification(
          c.env.SLACK_NOTIFICATION_CHANNEL || '#general',
          normalizedTicket
        );
        console.log('Slack notification sent');
      } catch (error) {
        console.warn('Failed to send Slack notification:', error);
      }
    }
    

    console.log('Basic workflow completed:', {
      ticket: normalizedTicket,
      clickupTask,
      aiAnalysis,
      context: {
        source: 'zendesk_webhook',
        timestamp: new Date().toISOString(),
        user: payload.current_user
      }
    });
    
    return c.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        ticketId: normalizedTicket.id,
        clickupTaskId: clickupTask.id,
        aiCategory: aiAnalysis.category,
        aiPriority: aiAnalysis.priority || 'medium'
      },
      timestamp: new Date().toISOString()
    });
    
  }, 'Zendesk webhook processing failed');
});

/**
 * Get Zendesk ticket by ID
 * GET /zendesk/ticket/:id
 */
zendeskRoutes.get('/ticket/:id', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.zendesk, 'Zendesk');
    
    const ticketId = c.req.param('id');
    if (!ticketId) {
      throw new ValidationError('Ticket ID is required');
    }
    
    const ticket = await services.zendesk!.getTicket(parseInt(ticketId));
    
    return c.json({
      success: true,
      ticket,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to get Zendesk ticket');
});

/**
 * Update Zendesk ticket
 * PUT /zendesk/ticket/:id
 */
zendeskRoutes.put('/ticket/:id', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.zendesk, 'Zendesk');
    
    const ticketId = c.req.param('id');
    if (!ticketId) {
      throw new ValidationError('Ticket ID is required');
    }
    
    const updateData = await c.req.json();
    const success = await services.zendesk!.updateTicket(parseInt(ticketId), updateData);
    
    return c.json({
      success,
      message: success ? 'Ticket updated successfully' : 'Failed to update ticket',
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to update Zendesk ticket');
});

/**
 * Test Zendesk connection
 * GET /zendesk/test
 */
zendeskRoutes.get('/test', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.zendesk, 'Zendesk');
    
    const result = await services.zendesk!.testConnection();
    
    return c.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to test Zendesk connection');
});

/**
 * Get Zendesk user information
 * GET /zendesk/user/:id
 * Note: This endpoint is currently not implemented as the ZendeskService doesn't have a getUser method
 */
zendeskRoutes.get('/user/:id', async (c) => {
  return c.json({
    success: false,
    error: 'User information endpoint not implemented',
    message: 'The ZendeskService does not currently support user information retrieval',
    timestamp: new Date().toISOString()
  }, 501);
});

/**
 * Search Zendesk tickets
 * GET /zendesk/tickets/search
 */
zendeskRoutes.get('/tickets/search', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    requireService(services.zendesk, 'Zendesk');
    
    const status = c.req.query('status') || 'open';
    const limit = parseInt(c.req.query('limit') || '25');
    
    // Use the available getOpenTickets method instead of searchTickets
    const results = await services.zendesk!.getOpenTickets(limit, status);
    
    return c.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  }, 'Failed to search Zendesk tickets');
});