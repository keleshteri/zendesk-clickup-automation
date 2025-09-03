/**
 * @type: routes
 * @domain: workflow
 * @purpose: Webhook endpoint routes for Zendesk and ClickUp integrations
 * @framework: Hono
 * @validation: Zod
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { DIContext } from '../di/container';
import type { Env } from '../di/dependencies';
import { 
  WebhookEventSchema, 
  ZendeskWebhookEventSchema, 
  ClickUpWebhookEventSchema 
} from '../../domains/workflow/types/webhook.types';

// Create webhook routes app
const webhookRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// WEBHOOK ENDPOINT ROUTES
// ============================================================================

/**
 * Zendesk webhook endpoint
 * POST /webhooks/zendesk
 * 
 * Receives webhook events from Zendesk when tickets are created, updated, etc.
 * Example payload from your message:
 * {
 *   "account_id": 22129848,
 *   "detail": {
 *     "id": "5158",
 *     "subject": "ticketinfo_2294a6e9ece2",
 *     "status": "OPEN",
 *     "priority": "LOW",
 *     "created_at": "2025-01-08T10:12:07Z",
 *     ...
 *   },
 *   "event": {},
 *   "id": "cbe4028c-7239-495d-b020-f22348516046",
 *   "subject": "zen:ticket:5158",
 *   "time": "2025-01-08T10:12:07.672717030Z",
 *   "type": "zen:event-type:ticket.created",
 *   "zendesk_event_version": "2022-11-06"
 * }
 */
webhookRoutes.post('/zendesk', async (c: DIContext) => {
  try {
    const { workflowOrchestrator } = c.get('deps');
    
    // Get raw body for signature validation
    const rawBody = await c.req.text();
    const signature = c.req.header('x-zendesk-webhook-signature');
    
    // Parse the webhook payload
    let zendeskPayload;
    try {
      zendeskPayload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse Zendesk webhook payload:', parseError);
      return c.json(
        {
          error: 'Invalid JSON',
          message: 'Webhook payload must be valid JSON',
        },
        400
      );
    }
    
    // Transform Zendesk webhook to our standard format
    const webhookEvent = {
      id: zendeskPayload.id || `zendesk_${Date.now()}`,
      source: 'zendesk' as const,
      eventType: transformZendeskEventType(zendeskPayload.type),
      timestamp: zendeskPayload.time ? new Date(zendeskPayload.time).getTime() : Date.now(),
      data: {
        ticket: {
          id: parseInt(zendeskPayload.detail?.id || '0'),
          external_id: zendeskPayload.detail?.external_id || null,
          subject: zendeskPayload.detail?.subject || '',
          description: zendeskPayload.detail?.description || '',
          status: zendeskPayload.detail?.status?.toLowerCase() || 'unknown',
          priority: zendeskPayload.detail?.priority?.toLowerCase() || null,
          type: zendeskPayload.detail?.type || null,
          requester_id: parseInt(zendeskPayload.detail?.requester_id || '0'),
          assignee_id: zendeskPayload.detail?.assignee_id ? parseInt(zendeskPayload.detail.assignee_id) : null,
          organization_id: zendeskPayload.detail?.organization_id ? parseInt(zendeskPayload.detail.organization_id) : null,
          group_id: zendeskPayload.detail?.group_id ? parseInt(zendeskPayload.detail.group_id) : null,
          created_at: zendeskPayload.detail?.created_at || new Date().toISOString(),
          updated_at: zendeskPayload.detail?.updated_at || new Date().toISOString(),
          tags: zendeskPayload.detail?.tags || [],
          custom_fields: zendeskPayload.detail?.custom_fields || [],
        },
        account_id: zendeskPayload.account_id,
        brand_id: zendeskPayload.detail?.brand_id,
        organization_id: zendeskPayload.detail?.organization_id,
        zendesk_event_version: zendeskPayload.zendesk_event_version,
      },
    };
    
    // Validate the transformed event
    const validatedEvent = ZendeskWebhookEventSchema.parse(webhookEvent);
    
    // Process the webhook through our orchestrator
    const result = await workflowOrchestrator.processWebhookEvent(validatedEvent);
    
    // Log the processing result
    console.log('Zendesk webhook processed:', {
      event_id: validatedEvent.id,
      event_type: validatedEvent.eventType,
      workflow_id: result.workflow_id,
      execution_id: result.execution_id,
      status: result.status,
    });
    
    // Return success response
    return c.json({
      success: true,
      message: 'Webhook processed successfully',
      execution_id: result.execution_id,
      workflow_id: result.workflow_id,
      status: result.status,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Zendesk webhook processing error:', error);
    
    // Return error response but with 200 status to prevent Zendesk retries
    // (unless it's a validation error)
    const isValidationError = error instanceof z.ZodError;
    const statusCode = isValidationError ? 400 : 200;
    
    return c.json(
      {
        success: false,
        error: 'Webhook Processing Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        ...(isValidationError && {
          validation_errors: error.errors,
        }),
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
});

/**
 * ClickUp webhook endpoint
 * POST /webhooks/clickup
 * 
 * Receives webhook events from ClickUp when tasks are created, updated, etc.
 */
webhookRoutes.post('/clickup', async (c: DIContext) => {
  try {
    const { workflowOrchestrator } = c.get('deps');
    
    // Get raw body for signature validation
    const rawBody = await c.req.text();
    const signature = c.req.header('x-signature');
    
    // Parse the webhook payload
    let clickupPayload;
    try {
      clickupPayload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse ClickUp webhook payload:', parseError);
      return c.json(
        {
          error: 'Invalid JSON',
          message: 'Webhook payload must be valid JSON',
        },
        400
      );
    }
    
    // Transform ClickUp webhook to our standard format
    const webhookEvent = {
      id: clickupPayload.webhook_id || `clickup_${Date.now()}`,
      source: 'clickup' as const,
      eventType: transformClickUpEventType(clickupPayload.event),
      timestamp: new Date().toISOString(),
      data: clickupPayload,
    };
    
    // Validate the transformed event
    const validatedEvent = ClickUpWebhookEventSchema.parse(webhookEvent);
    
    // Process the webhook through our orchestrator
    const result = await workflowOrchestrator.processWebhookEvent(validatedEvent);
    
    // Log the processing result
    console.log('ClickUp webhook processed:', {
      event_id: validatedEvent.id,
      event_type: validatedEvent.eventType,
      workflow_id: result.workflow_id,
      execution_id: result.execution_id,
      status: result.status,
    });
    
    // Return success response
    return c.json({
      success: true,
      message: 'Webhook processed successfully',
      execution_id: result.execution_id,
      workflow_id: result.workflow_id,
      status: result.status,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('ClickUp webhook processing error:', error);
    
    // Return error response but with 200 status to prevent ClickUp retries
    // (unless it's a validation error)
    const isValidationError = error instanceof z.ZodError;
    const statusCode = isValidationError ? 400 : 200;
    
    return c.json(
      {
        success: false,
        error: 'Webhook Processing Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        ...(isValidationError && {
          validation_errors: error.errors,
        }),
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
});

/**
 * Generic webhook status endpoint
 * GET /webhooks/status
 * 
 * Returns the status of webhook processing capabilities
 */
webhookRoutes.get('/status', async (c: DIContext) => {
  try {
    const { workflowOrchestrator } = c.get('deps');
    
    // Get workflow metrics
    const metricsArray = await workflowOrchestrator.getWorkflowMetrics();
    const activeWorkflows = await workflowOrchestrator.getActiveWorkflows();
    
    // Aggregate metrics from all sources
    const totalMetrics = metricsArray.reduce(
      (acc, metrics) => ({
        total_executions: acc.total_executions + metrics.total_executions,
        successful_executions: acc.successful_executions + metrics.successful_executions,
        failed_executions: acc.failed_executions + metrics.failed_executions,
        average_execution_time_ms: 
           metricsArray.length > 0 
             ? metricsArray.reduce((sum, m) => sum + m.average_duration_ms, 0) / metricsArray.length
             : 0,
      }),
      { total_executions: 0, successful_executions: 0, failed_executions: 0, average_execution_time_ms: 0 }
    );
    
    return c.json({
      status: 'ok',
      message: 'Webhook processing is operational',
      endpoints: {
        zendesk: '/webhooks/zendesk',
        clickup: '/webhooks/clickup',
        status: '/webhooks/status',
      },
      metrics: {
        total_executions: totalMetrics.total_executions,
        successful_executions: totalMetrics.successful_executions,
        failed_executions: totalMetrics.failed_executions,
        average_execution_time_ms: totalMetrics.average_execution_time_ms,
        active_workflows_count: activeWorkflows.length,
      },
      active_workflows: activeWorkflows.map(workflow => ({
        execution_id: workflow.execution_id,
        workflow_id: workflow.workflow_id,
        started_at: workflow.started_at,
        updated_at: workflow.updated_at,
        trigger_data: workflow.trigger_data,
        variables: workflow.variables,
      })),
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Webhook status check error:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to retrieve webhook status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transforms Zendesk event types to our standard format
 */
function transformZendeskEventType(zendeskType: string): string {
  const typeMap: Record<string, string> = {
    'zen:event-type:ticket.created': 'ticket.created',
    'zen:event-type:ticket.updated': 'ticket.updated',
    'zen:event-type:ticket.status_changed': 'ticket.status_changed',
    'zen:event-type:ticket.priority_changed': 'ticket.priority_changed',
    'zen:event-type:ticket.assignee_changed': 'ticket.assigned',
    'zen:event-type:ticket.comment_created': 'ticket.comment_added',
  };
  
  return typeMap[zendeskType] || 'ticket.updated';
}

/**
 * Transforms ClickUp event types to our standard format
 */
function transformClickUpEventType(clickupEvent: string): string {
  const typeMap: Record<string, string> = {
    'taskCreated': 'taskCreated',
    'taskUpdated': 'taskUpdated',
    'taskDeleted': 'taskDeleted',
    'taskStatusUpdated': 'taskStatusUpdated',
    'taskPriorityUpdated': 'taskPriorityUpdated',
    'taskAssigneeUpdated': 'taskAssigneeUpdated',
    'taskCommentPosted': 'taskCommentPosted',
    'listCreated': 'listCreated',
    'listUpdated': 'listUpdated',
    'spaceCreated': 'spaceCreated',
    'spaceUpdated': 'spaceUpdated',
  };
  
  return typeMap[clickupEvent] || 'taskUpdated';
}

export { webhookRoutes };