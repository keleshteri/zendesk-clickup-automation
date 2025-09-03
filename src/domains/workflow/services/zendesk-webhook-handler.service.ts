/**
 * @type: service
 * @domain: workflow
 * @purpose: Zendesk webhook handler implementation
 * @implements: IZendeskWebhookHandler
 * @dependencies: []
 * @tested: no
 */

import type {
  IZendeskWebhookHandler,
} from '../interfaces/webhook-handler.interface';
import type {
  WebhookEvent,
  ZendeskWebhookEvent,
  ZendeskWebhookPayload,
  ZendeskTicketDetail,
  LegacyZendeskEventType,
} from '../types/webhook.types';
import type {
  WorkflowResult,
  WorkflowStatus,
} from '../types/workflow.types';
import {
  ZendeskWebhookEventSchema,
  ZendeskEventTypeSchema,
  mapZendeskEventType,
} from '../types/webhook.types';

/**
 * Handles Zendesk webhook events for workflow automation
 */
export class ZendeskWebhookHandler implements IZendeskWebhookHandler {
  private readonly supportedEvents = [
    'zen:event-type:ticket.created',
    'zen:event-type:ticket.agent_assignment_changed',
    'zen:event-type:ticket.comment_added',
    'zen:event-type:ticket.status_changed',
    'zen:event-type:ticket.priority_changed',
    'zen:event-type:ticket.subject_changed',
    'zen:event-type:ticket.description_changed',
    'zen:event-type:ticket.tags_changed',
    'zen:event-type:ticket.custom_field_changed',
  ] as const;

  /**
   * Handles incoming Zendesk webhook events
   */
  async handleWebhook(event: WebhookEvent): Promise<WorkflowResult> {
    const executionId = `zendesk_${event.id}_${Date.now()}`;
    const startTime = new Date().toISOString();

    try {
      // For direct Zendesk webhook payloads, convert to our internal format
      let validatedEvent: ZendeskWebhookEvent;
      
      if (this.isDirectZendeskWebhook(event.data)) {
        // Direct Zendesk webhook - convert to our internal format
        validatedEvent = {
          id: event.data.id,
          source: 'zendesk' as const,
          eventType: event.data.type,
          timestamp: new Date(event.data.time).getTime(),
          data: event.data,
          signature: event.signature,
          headers: event.headers,
        };
      } else {
        // Already in our internal format
        validatedEvent = ZendeskWebhookEventSchema.parse(event);
      }
      
      // Map official event type to legacy type for routing
      const legacyEventType = mapZendeskEventType(validatedEvent.eventType);
      
      if (!legacyEventType) {
        return this.createUnsupportedEventResult(executionId, validatedEvent.eventType);
      }
      
      // Route to specific handler based on legacy event type
      let result: WorkflowResult;
      
      switch (legacyEventType) {
        case 'ticket.created':
          result = await this.handleTicketCreated(validatedEvent.data);
          break;
        case 'ticket.updated':
          result = await this.handleTicketUpdated(validatedEvent.data);
          break;
        case 'ticket.status_changed':
          result = await this.handleTicketStatusChanged(validatedEvent.data);
          break;
        case 'ticket.priority_changed':
          result = await this.handleTicketPriorityChanged(validatedEvent.data);
          break;
        case 'ticket.assigned':
          result = await this.handleTicketAssigned(validatedEvent.data);
          break;
        case 'ticket.comment_added':
          result = await this.handleTicketCommentAdded(validatedEvent.data);
          break;
        default:
          result = this.createUnsupportedEventResult(executionId, legacyEventType);
      }

      return {
        ...result,
        execution_id: executionId,
        started_at: startTime,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(startTime).getTime(),
      };
    } catch (error) {
      return this.createErrorResult(executionId, startTime, error);
    }
  }

  /**
   * Checks if the event data is a direct Zendesk webhook payload
   */
  private isDirectZendeskWebhook(data: any): data is ZendeskWebhookPayload {
    return data && 
           typeof data.type === 'string' && 
           data.type.startsWith('zen:event-type:') &&
           typeof data.account_id === 'number' &&
           typeof data.id === 'string' &&
           typeof data.time === 'string' &&
           data.detail !== undefined;
  }

  /**
   * Validates Zendesk webhook signature
   */
  async validateWebhook(payload: string, signature: string): Promise<boolean> {
    // TODO: Implement Zendesk webhook signature validation
    // This would typically involve HMAC verification with Zendesk's secret
    console.log('Zendesk webhook validation - payload length:', payload.length, 'signature:', signature);
    
    // For now, return true for development
    // In production, implement proper signature validation
    return true;
  }

  /**
   * Gets supported Zendesk event types
   */
  getSupportedEvents(): readonly string[] {
    return this.supportedEvents;
  }

  /**
   * Handles Zendesk ticket creation events
   */
  async handleTicketCreated(ticketData: unknown): Promise<WorkflowResult> {
    const payload = ticketData as ZendeskWebhookPayload;
    const ticketDetail = payload.detail as ZendeskTicketDetail;
    
    // Mock implementation - in future phases this would:
    // 1. Extract ticket information
    // 2. Create corresponding ClickUp task
    // 3. Set up bidirectional sync
    
    return {
      workflow_id: 'zendesk_ticket_created',
      execution_id: '', // Will be set by caller
      status: 'completed' as WorkflowStatus,
      started_at: '', // Will be set by caller
      trigger_data: { 
        ticket: ticketDetail,
        account_id: payload.account_id,
        event_id: payload.id,
        event_time: payload.time,
      },
      step_results: [
        {
          step_id: 'extract_ticket_data',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 10,
          input: payload,
          output: {
            ticketId: ticketDetail.id,
            subject: ticketDetail.subject,
            description: ticketDetail.description,
            priority: ticketDetail.priority,
            status: ticketDetail.status,
            requester: ticketDetail.requester_id,
          },
          retry_count: 0,
        },
        {
          step_id: 'mock_clickup_task_creation',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 50,
          input: { ticketId: ticketDetail.id },
          output: {
            message: 'Mock: ClickUp task would be created here',
            mockTaskId: `mock_task_${ticketDetail.id}`,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Zendesk ticket processed successfully',
        ticketId: ticketDetail.id,
        mockTaskId: `mock_task_${ticketDetail.id}`,
      },
    };
  }

  /**
   * Handles Zendesk ticket update events
   */
  async handleTicketUpdated(ticketData: unknown): Promise<WorkflowResult> {
    const payload = ticketData as ZendeskWebhookPayload;
    const ticketDetail = payload.detail as ZendeskTicketDetail;
    
    return {
      workflow_id: 'zendesk_ticket_updated',
      execution_id: '',
      status: 'completed' as WorkflowStatus,
      started_at: '',
      trigger_data: { 
        ticket: ticketDetail,
        account_id: payload.account_id,
        event_id: payload.id,
        event_time: payload.time,
        changes: payload.event,
      },
      step_results: [
        {
          step_id: 'process_ticket_update',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 25,
          input: payload,
          output: {
            message: 'Mock: Ticket update would sync to ClickUp here',
            ticketId: ticketDetail.id,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Zendesk ticket update processed',
        ticketId: ticketDetail.id,
      },
    };
  }

  /**
   * Handles ticket status change events
   */
  private async handleTicketStatusChanged(ticketData: ZendeskWebhookPayload): Promise<WorkflowResult> {
    const ticketDetail = ticketData.detail as ZendeskTicketDetail;
    
    return {
      workflow_id: 'zendesk_ticket_status_changed',
      execution_id: '',
      status: 'completed' as WorkflowStatus,
      started_at: '',
      trigger_data: { 
        ticket: ticketDetail,
        account_id: ticketData.account_id,
        event_id: ticketData.id,
        event_time: ticketData.time,
        changes: ticketData.event,
      },
      step_results: [
        {
          step_id: 'sync_status_to_clickup',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 30,
          input: { newStatus: ticketDetail.status },
          output: {
            message: 'Mock: Status change would sync to ClickUp',
            ticketId: ticketDetail.id,
            newStatus: ticketDetail.status,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Ticket status change processed',
        ticketId: ticketDetail.id,
        newStatus: ticketDetail.status,
      },
    };
  }

  /**
   * Handles ticket priority change events
   */
  private async handleTicketPriorityChanged(ticketData: ZendeskWebhookPayload): Promise<WorkflowResult> {
    const ticketDetail = ticketData.detail as ZendeskTicketDetail;
    
    return {
      workflow_id: 'zendesk_ticket_priority_changed',
      execution_id: '',
      status: 'completed' as WorkflowStatus,
      started_at: '',
      trigger_data: { 
        ticket: ticketDetail,
        account_id: ticketData.account_id,
        event_id: ticketData.id,
        event_time: ticketData.time,
        changes: ticketData.event,
      },
      step_results: [
        {
          step_id: 'sync_priority_to_clickup',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 25,
          input: { newPriority: ticketDetail.priority },
          output: {
            message: 'Mock: Priority change would sync to ClickUp',
            ticketId: ticketDetail.id,
            newPriority: ticketDetail.priority,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Ticket priority change processed',
        ticketId: ticketDetail.id,
        newPriority: ticketDetail.priority,
      },
    };
  }

  /**
   * Handles ticket assignment events
   */
  private async handleTicketAssigned(ticketData: ZendeskWebhookPayload): Promise<WorkflowResult> {
    const ticketDetail = ticketData.detail as ZendeskTicketDetail;
    
    return {
      workflow_id: 'zendesk_ticket_assigned',
      execution_id: '',
      status: 'completed' as WorkflowStatus,
      started_at: '',
      trigger_data: { 
        ticket: ticketDetail,
        account_id: ticketData.account_id,
        event_id: ticketData.id,
        event_time: ticketData.time,
        changes: ticketData.event,
      },
      step_results: [
        {
          step_id: 'sync_assignee_to_clickup',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 35,
          input: { assignee: ticketDetail.assignee_id },
          output: {
            message: 'Mock: Assignee change would sync to ClickUp',
            ticketId: ticketDetail.id,
            assignee: ticketDetail.assignee_id,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Ticket assignment processed',
        ticketId: ticketDetail.id,
        assignee: ticketDetail.assignee_id,
      },
    };
  }

  /**
   * Handles ticket comment events
   */
  private async handleTicketCommentAdded(ticketData: ZendeskWebhookPayload): Promise<WorkflowResult> {
    const ticketDetail = ticketData.detail as ZendeskTicketDetail;
    
    return {
      workflow_id: 'zendesk_ticket_comment_added',
      execution_id: '',
      status: 'completed' as WorkflowStatus,
      started_at: '',
      trigger_data: { 
        ticket: ticketDetail,
        account_id: ticketData.account_id,
        event_id: ticketData.id,
        event_time: ticketData.time,
        changes: ticketData.event,
      },
      step_results: [
        {
          step_id: 'sync_comment_to_clickup',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 40,
          input: { ticketId: ticketDetail.id },
          output: {
            message: 'Mock: Comment would sync to ClickUp',
            ticketId: ticketDetail.id,
          },
          retry_count: 0,
        },
      ],
      final_output: {
        message: 'Ticket comment processed',
        ticketId: ticketDetail.id,
      },
    };
  }

  /**
   * Creates result for unsupported event types
   */
  private createUnsupportedEventResult(executionId: string, eventType: string): WorkflowResult {
    return {
      workflow_id: 'zendesk_unsupported_event',
      execution_id: executionId,
      status: 'completed' as WorkflowStatus,
      started_at: new Date().toISOString(),
      trigger_data: { eventType },
      step_results: [],
      final_output: {
        message: `Unsupported Zendesk event type: ${eventType}`,
        eventType,
      },
    };
  }

  /**
   * Creates error result for failed webhook processing
   */
  private createErrorResult(executionId: string, startTime: string, error: unknown): WorkflowResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      workflow_id: 'zendesk_webhook_error',
      execution_id: executionId,
      status: 'failed' as WorkflowStatus,
      started_at: startTime,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - new Date(startTime).getTime(),
      trigger_data: {},
      step_results: [],
      error: {
        message: errorMessage,
        code: 'WEBHOOK_PROCESSING_ERROR',
        details: { error: String(error) },
      },
    };
  }
}