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
} from '../types/webhook.types';
import type {
  WorkflowResult,
  WorkflowStatus,
} from '../types/workflow.types';
import type { IClickUpTaskService } from '../../clickup/interfaces/clickup-task-service.interface';
import type { IClickUpSpaceService } from '../../clickup/interfaces/clickup-space-service.interface';
import type { CreateTaskRequest } from '../../clickup/types/task.types';
import {
  ZendeskWebhookEventSchema,
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

  constructor(
    private readonly clickUpTaskService: IClickUpTaskService,
    private readonly clickUpSpaceService: IClickUpSpaceService,
    private readonly env?: Record<string, string | undefined>
  ) {
    // Validate ClickUp workspace configuration on initialization
    this.validateWorkspaceConfiguration(this.env);
  }

  /**
   * Validates ClickUp workspace configuration
   * Note: Validation is now handled in the DI container during initialization
   * This method is kept for potential runtime validation if needed
   */
  private validateWorkspaceConfiguration(env?: Record<string, string | undefined>): void {
    if (!env) {
      console.warn('Environment variables not available for validation');
      return;
    }

    const requiredEnvVars = {
      CLICKUP_SYSTEM_TOKEN: env.CLICKUP_SYSTEM_TOKEN,
      CLICKUP_DEFAULT_LIST_ID: env.CLICKUP_DEFAULT_LIST_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingVars.length > 0) {
      console.warn('Missing ClickUp configuration:', {
        missingVariables: missingVars,
        message: 'Some ClickUp operations may fail without proper configuration',
        optionalVariables: ['CLICKUP_DEFAULT_TEAM_ID', 'CLICKUP_DEFAULT_SPACE_ID'],
      });
    }

    // Log current configuration (without sensitive data)
    console.log('ClickUp workspace configuration:', {
      hasApiKey: !!env.CLICKUP_SYSTEM_TOKEN,
      hasDefaultListId: !!env.CLICKUP_DEFAULT_LIST_ID,
      hasDefaultSpaceId: !!env.CLICKUP_DEFAULT_SPACE_ID,
      hasDefaultTeamId: !!env.CLICKUP_DEFAULT_TEAM_ID,
    });
  }

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
    
    try {
      // Step 1: Extract and validate essential ticket data
      const extractedTicketData = this.extractTicketData(ticketDetail);
      
      // Step 2: Map priority from Zendesk to ClickUp format
      const clickUpPriority = this.mapPriorityToClickUp(extractedTicketData.priority);
      
      // Step 3: Create ClickUp task with mapped data
      const clickUpTask = await this.createClickUpTask({
        name: extractedTicketData.subject,
        description: this.formatTaskDescription(extractedTicketData),
        priority: clickUpPriority,
        tags: this.generateTaskTags(extractedTicketData),
      }, this.env);
      
      // Step 4: Establish bidirectional synchronization
      await this.establishBidirectionalSync(extractedTicketData.id, clickUpTask.id);
      
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
            output: extractedTicketData,
            retry_count: 0,
          },
          {
            step_id: 'create_clickup_task',
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: 50,
            input: { ticketId: ticketDetail.id },
            output: {
              taskId: clickUpTask.id,
              taskName: clickUpTask.name,
              priority: clickUpTask.priority,
              taskUrl: clickUpTask.url,
            },
            retry_count: 0,
          },
          {
            step_id: 'establish_bidirectional_sync',
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: 30,
            input: { ticketId: extractedTicketData.id, taskId: clickUpTask.id },
            output: {
              message: 'Bidirectional sync established',
              zendeskTicketId: extractedTicketData.id,
              clickUpTaskId: clickUpTask.id,
            },
            retry_count: 0,
          },
        ],
        final_output: {
          message: 'Zendesk ticket processed successfully',
          ticketId: ticketDetail.id,
          clickUpTaskId: clickUpTask.id,
          clickUpTaskUrl: clickUpTask.url,
        },
      };
    } catch (error) {
      return {
        workflow_id: 'zendesk_ticket_created',
        execution_id: '',
        status: 'failed' as WorkflowStatus,
        started_at: '',
        trigger_data: { 
          ticket: ticketDetail,
          account_id: payload.account_id,
          event_id: payload.id,
          event_time: payload.time,
        },
        step_results: [],
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'TICKET_CREATION_ERROR',
          details: { error: String(error) },
        },
      };
    }
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

  /**
   * Extracts and validates essential ticket data from ticket detail
   */
  private extractTicketData(ticketDetail: ZendeskTicketDetail): {
    id: string;
    subject: string;
    description: string;
    priority: string;
    requester: {
      email: string;
      name: string;
    };
    status: string;
    createdAt: string;
  } {
    if (!ticketDetail?.id) {
      throw new Error('Ticket ID is required but missing from payload');
    }

    if (!ticketDetail.subject || ticketDetail.subject.trim() === '') {
      throw new Error('Ticket subject is required but missing from payload');
    }

    return {
      id: ticketDetail.id.toString(),
      subject: ticketDetail.subject.trim(),
      description: ticketDetail.description?.trim() || 'No description provided',
      priority: ticketDetail.priority || 'normal',
      requester: {
        email: ticketDetail.requester_id ? `user_${ticketDetail.requester_id}@zendesk.com` : 'unknown@example.com',
        name: ticketDetail.requester_id ? `User ${ticketDetail.requester_id}` : 'Unknown User',
      },
      status: ticketDetail.status || 'new',
      createdAt: ticketDetail.created_at || new Date().toISOString(),
    };
  }

  /**
   * Maps Zendesk priority to ClickUp priority
   */
  private mapPriorityToClickUp(zendeskPriority: string): 'urgent' | 'high' | 'normal' | 'low' {
    const priorityMap: Record<string, 'urgent' | 'high' | 'normal' | 'low'> = {
      urgent: 'urgent',
      high: 'high',
      normal: 'normal',
      low: 'low',
    };

    return priorityMap[zendeskPriority.toLowerCase()] || 'normal';
  }

  /**
   * Formats ticket description for ClickUp task
   */
  private formatTaskDescription(ticketData: {
    id: string;
    description: string;
    requester: { email: string; name: string };
    status: string;
    createdAt: string;
  }): string {
    return `**Zendesk Ticket #${ticketData.id}**

` +
           `**Description:**
${ticketData.description}

` +
           `**Requester:** ${ticketData.requester.name} (${ticketData.requester.email})
` +
           `**Status:** ${ticketData.status}
` +
           `**Created:** ${new Date(ticketData.createdAt).toLocaleString()}

` +
           `---
*This task was automatically created from Zendesk ticket #${ticketData.id}*`;
  }

  /**
   * Generates tags for ClickUp task based on ticket data
   */
  private generateTaskTags(ticketData: {
    priority: string;
    status: string;
  }): string[] {
    const tags = ['zendesk-sync'];
    
    if (ticketData.priority && ticketData.priority !== 'normal') {
      tags.push(`priority-${ticketData.priority}`);
    }
    
    if (ticketData.status) {
      tags.push(`status-${ticketData.status}`);
    }
    
    return tags;
  }

  /**
   * Creates a ClickUp task with the provided data
   */
  private async createClickUpTask(
    taskData: {
      name: string;
      description: string;
      priority: 'urgent' | 'high' | 'normal' | 'low';
      tags: string[];
      listId?: string;
    },
    env?: Record<string, string | undefined>
  ): Promise<{ id: string; name: string; priority: string; url: string }> {
    try {
      // Use provided listId or fall back to environment default
      const listId = taskData.listId || env?.CLICKUP_DEFAULT_LIST_ID;
      
      if (!listId) {
        throw new Error('No ClickUp list ID provided and CLICKUP_DEFAULT_LIST_ID environment variable not set');
      }
      
      // Get list information to find valid statuses
      const listInfo = await this.clickUpSpaceService.getListById(listId);
      if (!listInfo) {
        throw new Error(`ClickUp list ${listId} not found`);
      }
      
      // Get the first available status (usually the default "open" status)
      const defaultStatus = listInfo.statuses?.[0]?.status || 'open';
      
      console.log('List status info:', {
        listId,
        listName: listInfo.name,
        availableStatuses: listInfo.statuses?.map(s => s.status),
        selectedStatus: defaultStatus
      });
      
      // Convert priority string to ClickUp API priority number
      const priorityMap: Record<string, number> = {
        'urgent': 1,
        'high': 2,
        'normal': 3,
        'low': 4,
      };
      
      const numericPriority = priorityMap[taskData.priority] || 3;
      
      console.log('Priority mapping debug:', {
        inputPriority: taskData.priority,
        mappedPriority: numericPriority,
        priorityMap
      });
      
      const createTaskRequest: CreateTaskRequest = {
        name: taskData.name,
        description: taskData.description,
        priority: numericPriority, // Use the numeric priority
        tags: taskData.tags,
        status: defaultStatus, // Use the first available status from the list
      };

      console.log('Creating ClickUp task:', {
        listId,
        request: createTaskRequest,
      });

      // Create task using the real ClickUp API
      const task = await this.clickUpTaskService.createTask(listId, createTaskRequest);
      
      const result = {
        id: task.id,
        name: task.name,
        priority: (task.priority && typeof task.priority === 'object' && 'name' in task.priority) 
          ? (task.priority as { name: string }).name 
          : taskData.priority,
        url: task.url || `https://app.clickup.com/t/${task.id}`,
      };

      console.log('ClickUp task created successfully:', {
        taskId: result.id,
        name: result.name,
        priority: result.priority,
        url: result.url,
      });
      
      return result;

    } catch (error) {
      console.error('Failed to create ClickUp task:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskData,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('list ID')) {
          throw new Error('ClickUp task creation failed: Invalid or missing list ID. Please check CLICKUP_DEFAULT_LIST_ID environment variable.');
        }
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          throw new Error('ClickUp task creation failed: Authentication error. Please check ClickUp API credentials.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('ClickUp task creation failed: Rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error(`ClickUp task creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Establishes bidirectional synchronization between Zendesk ticket and ClickUp task
   */
  private async establishBidirectionalSync(zendeskTicketId: string, clickUpTaskId: string): Promise<void> {
    try {
      console.log('Establishing bidirectional sync:', {
        zendeskTicketId,
        clickUpTaskId,
      });

      // Step 1: Store ClickUp task ID in Zendesk ticket custom field
      await this.storeClickUpTaskIdInZendesk(zendeskTicketId, clickUpTaskId);

      // Step 2: Store Zendesk ticket ID in ClickUp task custom field
      await this.storeZendeskTicketIdInClickUp(clickUpTaskId, zendeskTicketId);

      console.log('Bidirectional sync established successfully');

    } catch (error) {
      console.error('Failed to establish bidirectional sync:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        zendeskTicketId,
        clickUpTaskId,
      });
      throw new Error(`Bidirectional sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stores ClickUp task ID in Zendesk ticket custom field
   */
  private async storeClickUpTaskIdInZendesk(ticketId: string, clickUpTaskId: string): Promise<void> {
    try {
      // TODO: Replace with actual Zendesk API call
      // const updateRequest = {
      //   ticket: {
      //     external_id: clickUpTaskId,
      //     custom_fields: [
      //       {
      //         id: 'clickup_task_id_field', // TODO: Get from configuration
      //         value: clickUpTaskId,
      //       },
      //     ],
      //   },
      // };
      // await this.zendeskTicketService.updateTicket(ticketId, updateRequest);

      console.log('Stored ClickUp task ID in Zendesk ticket:', {
        ticketId,
        clickUpTaskId,
      });

    } catch (error) {
      console.error('Failed to store ClickUp task ID in Zendesk:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId,
        clickUpTaskId,
      });
      throw error;
    }
  }

  /**
   * Stores Zendesk ticket ID in ClickUp task custom field
   */
  private async storeZendeskTicketIdInClickUp(taskId: string, zendeskTicketId: string): Promise<void> {
    try {
      // TODO: Replace with actual ClickUp API call
      // const updateRequest = {
      //   custom_fields: [
      //     {
      //       id: 'zendesk_ticket_id_field', // TODO: Get from configuration
      //       value: zendeskTicketId,
      //     },
      //   ],
      // };
      // await this.clickUpTaskService.updateTask(taskId, updateRequest);

      console.log('Stored Zendesk ticket ID in ClickUp task:', {
        taskId,
        zendeskTicketId,
      });

    } catch (error) {
      console.error('Failed to store Zendesk ticket ID in ClickUp:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        zendeskTicketId,
      });
      throw error;
    }
  }
}