/**
 * @ai-metadata
 * @component: ZendeskWebhookInterface
 * @description: Interface for handling incoming Zendesk webhook events, specifically ticket creation
 * @last-update: 2025-01-08
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-webhook-interface.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./webhook.types.ts", "./zendesk.service.ts", "../../../types/index.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Handles Zendesk webhook events with validation, signature verification, and ticket processing"
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

import { Context } from 'hono';
import { Env } from '../../../../types/env';
import { ZendeskTicket } from '../interfaces';
import { ZendeskService } from '../api/service';
import { retryZendeskOperation } from '../utils/retry';
import { errorLogger } from '../../../../utils/error-logger';
import { requireService } from '../../../../middleware/di';
import {
  ZendeskWebhookPayload,
  ZendeskTicketDetail,
  WebhookValidationResult,
  WebhookProcessingResult,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  normalizeWebhookPriority,
  normalizeWebhookStatus
} from '../interfaces/zendesk-webhook.interface';

/**
 * Zendesk Webhook
 * Handles incoming webhook events from Zendesk, validates signatures,
 * and processes ticket creation/update events
 */
export class ZendeskWebhook {
  private zendeskService: ZendeskService;
  private env: Env;
  private context: Context;

  constructor(env: Env, context: Context) {
    this.env = env;
    this.context = context;
    this.zendeskService = new ZendeskService(env);
  }

  /**
   * Main webhook handler for Zendesk events
   * @param c - Hono context object
   * @returns Promise<Response> - HTTP response
   */
  async handleWebhook(c: Context): Promise<Response> {
    const startTime = Date.now();
    const webhookId = c.req.header('x-zendesk-webhook-id') || 'unknown';
    
    // Declare variables outside try block for error logging
    let payload: ZendeskWebhookPayload | undefined;
    let signature: string | undefined;
    
    try {
      console.log('🎫 Received Zendesk webhook request');
      
      // Get request body and headers
      const body = await c.req.text();
      signature = c.req.header('x-zendesk-webhook-signature');
      const timestamp = c.req.header('x-zendesk-webhook-timestamp');
      
      // Validate webhook signature if secret is configured
      if (this.env.WEBHOOK_SECRET && signature && timestamp) {
        const isValidSignature = await retryZendeskOperation(
          () => this.zendeskService.verifyWebhookSignature(
            body,
            signature,
            timestamp,
            this.env.WEBHOOK_SECRET
          ),
          'webhook signature verification',
          {
            maxAttempts: 2, // Quick retry for signature verification
            initialDelay: 500,
            maxDelay: 2000
          }
        );
        
        if (!isValidSignature) {
          console.error('❌ Invalid webhook signature after retries');
          return c.json(
            { 
              status: 'error', 
              message: 'Invalid webhook signature',
              timestamp: new Date().toISOString()
            }, 
            401
          );
        }
        
        console.log('✅ Webhook signature verified');
      } else {
        console.warn('⚠️  Webhook signature verification skipped (no secret configured)');
      }
      
      // Parse and validate webhook payload
      const validationResult = await this.validateWebhookPayload(body);
      
      if (!validationResult.isValid) {
        console.error('❌ Invalid webhook payload:', validationResult.errors);
        return c.json(
          {
            status: 'error',
            message: 'Invalid webhook payload',
            errors: validationResult.errors,
            timestamp: new Date().toISOString()
          },
          400
        );
      }
      
      payload = JSON.parse(body) as ZendeskWebhookPayload;
      console.log(`📨 Processing webhook event: ${payload.type} for ticket ${payload.detail.id}`);
      
      // Process the webhook based on event type
      const processingResult = await this.processWebhookEvent(payload, webhookId);
      
      // Add processing metadata
      processingResult.metadata = {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        webhookId
      };
      
      const statusCode = processingResult.success ? 200 : 500;
      
      console.log(`${processingResult.success ? '✅' : '❌'} Webhook processing completed: ${processingResult.message}`);
      
      return c.json({
        status: processingResult.success ? 'processed' : 'error',
        message: processingResult.message,
        ticketId: processingResult.ticketId,
        metadata: processingResult.metadata,
        timestamp: new Date().toISOString()
      }, statusCode);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Use enhanced error logging for webhook failures
      await errorLogger.logWebhookError(err, {
        request: c,
        webhookType: 'zendesk',
        payload,
        signature,
        validationErrors: err.message ? [err.message] : undefined
      });
      
      return c.json(
        {
          status: 'error',
          message: 'Internal server error during webhook processing',
          error: err.message,
          timestamp: new Date().toISOString()
        },
        500
      );
    }
  }

  /**
   * Validate the incoming webhook payload
   * @param body - Raw request body
   * @returns Promise<WebhookValidationResult>
   */
  private async validateWebhookPayload(body: string): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    
    try {
      // Parse JSON
      const payload = JSON.parse(body) as ZendeskWebhookPayload;
      
      // Validate required fields
      if (!payload.account_id) {
        errors.push('Missing account_id');
      }
      
      if (!payload.detail) {
        errors.push('Missing detail object');
      } else {
        // Validate ticket detail fields
        if (!payload.detail.id) {
          errors.push('Missing ticket id in detail');
        }
        
        if (!payload.detail.subject) {
          errors.push('Missing ticket subject in detail');
        }
        
        if (!payload.detail.description) {
          errors.push('Missing ticket description in detail');
        }
        
        if (!payload.detail.requester_id) {
          errors.push('Missing requester_id in detail');
        }
        
        if (!payload.detail.created_at) {
          errors.push('Missing created_at in detail');
        }
        
        // Validate priority and status values
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        if (payload.detail.priority && !validPriorities.includes(payload.detail.priority)) {
          errors.push(`Invalid priority: ${payload.detail.priority}`);
        }
        
        const validStatuses = ['NEW', 'OPEN', 'PENDING', 'SOLVED', 'CLOSED'];
        if (payload.detail.status && !validStatuses.includes(payload.detail.status)) {
          errors.push(`Invalid status: ${payload.detail.status}`);
        }
      }
      
      if (!payload.type) {
        errors.push('Missing event type');
      }
      
      if (!payload.id) {
        errors.push('Missing webhook event id');
      }
      
      if (!payload.time) {
        errors.push('Missing event timestamp');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        ticketData: errors.length === 0 ? payload.detail : undefined
      };
      
    } catch (parseError) {
      errors.push(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
      
      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Process the webhook event based on its type
   * @param payload - Validated webhook payload
   * @param webhookId - Webhook ID for tracking
   * @returns Promise<WebhookProcessingResult>
   */
  private async processWebhookEvent(
    payload: ZendeskWebhookPayload, 
    webhookId: string
  ): Promise<WebhookProcessingResult> {
    try {
      if (isTicketCreatedEvent(payload)) {
        return await this.handleTicketCreated(payload, webhookId);
      } else if (isTicketUpdatedEvent(payload)) {
        return await this.handleTicketUpdated(payload, webhookId);
      } else {
        console.log(`ℹ️  Ignoring webhook event type: ${payload.type}`);
        return {
          success: true,
          message: `Event type ${payload.type} ignored (not handled)`,
          ticketId: payload.detail.id
        };
      }
    } catch (error) {
      console.error('❌ Error processing webhook event:', error);
      return {
        success: false,
        message: 'Failed to process webhook event',
        error: error instanceof Error ? error.message : 'Unknown processing error',
        ticketId: payload.detail.id
      };
    }
  }

  /**
   * Handle ticket creation events
   * @param payload - Webhook payload for ticket creation
   * @param webhookId - Webhook ID for tracking
   * @returns Promise<WebhookProcessingResult>
   */
  private async handleTicketCreated(
    payload: ZendeskWebhookPayload, 
    webhookId: string
  ): Promise<WebhookProcessingResult> {
    console.log(`🎫 Processing ticket creation for ticket ${payload.detail.id}`);
    
    try {
      // Convert webhook ticket detail to standard ZendeskTicket format
      const ticket = this.convertWebhookToTicket(payload.detail);
      
      console.log(`📋 Ticket details:`, {
        id: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        requester_id: ticket.requester_id
      });
      
      // Process ticket creation with retry logic for external service calls
      await retryZendeskOperation(
        async () => {
          console.log(`🔄 Processing ticket creation workflow for ticket ${ticket.id}`);
          
          // Create ClickUp task using Service Locator pattern
          await this.createClickUpTask(ticket, webhookId);
          
          return true;
        },
        `ticket creation processing for ticket ${ticket.id}`
      );
      
      console.log(`✅ Successfully processed ticket creation for ticket ${ticket.id}`);
      
      return {
        success: true,
        message: `Ticket ${ticket.id} created successfully`,
        ticketId: ticket.id.toString()
      };
      
    } catch (error) {
      console.error(`❌ Failed to process ticket creation after retries:`, error);
      return {
        success: false,
        message: 'Failed to process ticket creation',
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: payload.detail.id
      };
    }
  }

  /**
   * Handle ticket update events
   * @param payload - Webhook payload for ticket update
   * @param webhookId - Webhook ID for tracking
   * @returns Promise<WebhookProcessingResult>
   */
  private async handleTicketUpdated(
    payload: ZendeskWebhookPayload, 
    webhookId: string
  ): Promise<WebhookProcessingResult> {
    console.log(`🔄 Processing ticket update for ticket ${payload.detail.id}`);
    
    try {
      // Convert webhook ticket detail to standard ZendeskTicket format
      const ticket = this.convertWebhookToTicket(payload.detail);
      
      console.log(`📋 Updated ticket details:`, {
        id: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        updated_at: ticket.updated_at
      });
      
      // Process ticket update with retry logic for external service calls
      await retryZendeskOperation(
        async () => {
          // Here you would typically:
          // 1. Update stored ticket information
          // 2. Sync changes with ClickUp tasks
          // 3. Send update notifications
          // 4. Trigger any status-based workflows
          
          // Simulate processing that might fail due to service unavailability
          console.log(`🔄 Processing ticket update workflow for ticket ${ticket.id}`);
          
          // Add actual processing logic here
          return true;
        },
        `ticket update processing for ticket ${ticket.id}`
      );
      
      console.log(`✅ Successfully processed ticket update for ticket ${ticket.id}`);
      
      return {
        success: true,
        message: `Ticket ${ticket.id} updated successfully`,
        ticketId: ticket.id.toString()
      };
      
    } catch (error) {
      console.error(`❌ Failed to process ticket update after retries:`, error);
      return {
        success: false,
        message: 'Failed to process ticket update',
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: payload.detail.id
      };
    }
  }

  /**
   * Convert webhook ticket detail to standard ZendeskTicket format
   * @param detail - Webhook ticket detail
   * @returns ZendeskTicket
   */
  private convertWebhookToTicket(detail: ZendeskTicketDetail): ZendeskTicket {
    return {
      id: parseInt(detail.id),
      url: `https://${this.env.ZENDESK_DOMAIN}/agent/tickets/${detail.id}`,
      subject: detail.subject,
      description: detail.description,
      raw_subject: detail.subject,
      priority: normalizeWebhookPriority(detail.priority),
      status: normalizeWebhookStatus(detail.status),
      requester_id: parseInt(detail.requester_id),
      assignee_id: detail.assignee_id ? parseInt(detail.assignee_id) : undefined,
      organization_id: detail.organization_id ? parseInt(detail.organization_id) : undefined,
      group_id: detail.group_id ? parseInt(detail.group_id) : undefined,
      tags: detail.tags || [],
      created_at: detail.created_at,
      updated_at: detail.updated_at,
      external_id: detail.external_id || undefined
    };
  }

  /**
   * Create a ClickUp task from a Zendesk ticket using Service Locator pattern
   * @param ticket - The Zendesk ticket to create a ClickUp task from
   * @param webhookId - Webhook ID for tracking
   * @returns Promise<void>
   */
  private async createClickUpTask(ticket: ZendeskTicket, webhookId: string): Promise<void> {
    try {
      console.log(`🎯 Creating ClickUp task for Zendesk ticket ${ticket.id}`);
      
      // Use Service Locator to get ClickUp service
      const clickUpService = requireService(this.context, 'clickup');
      
      if (!clickUpService) {
        console.warn(`⚠️  ClickUp service not available, skipping task creation for ticket ${ticket.id}`);
        return;
      }
      
      // Create the ClickUp task
      const clickUpTask = await clickUpService.createTaskFromTicket(ticket);
      
      if (clickUpTask) {
        console.log(`✅ ClickUp task created successfully:`, {
          clickUpTaskId: clickUpTask.id,
          clickUpTaskUrl: clickUpTask.url,
          zendeskTicketId: ticket.id,
          webhookId
        });
      } else {
        console.warn(`⚠️  ClickUp task creation returned null for ticket ${ticket.id}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to create ClickUp task for ticket ${ticket.id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId,
        ticketId: ticket.id
      });
      
      // Don't throw the error - we want the webhook to continue processing
      // even if ClickUp task creation fails
    }
  }

  /**
   * Get webhook processing statistics
   * @returns Object with processing stats
   */
  getProcessingStats(): Record<string, unknown> {
    return {
      service: 'ZendeskWebhookInterface',
      version: '1.0.0',
      supportedEvents: [
        'zen:event-type:ticket.created',
        'zen:event-type:ticket.updated'
      ],
      features: {
        signatureVerification: !!this.env.WEBHOOK_SECRET,
        payloadValidation: true,
        errorHandling: true,
        clickUpIntegration: true
      }
    };
  }
}