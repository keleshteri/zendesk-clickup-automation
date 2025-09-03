/**
 * @type: test
 * @domain: workflow
 * @purpose: Unit tests for ZendeskWebhookHandler
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZendeskWebhookHandler } from '../zendesk-webhook-handler.service';
import type { WebhookEvent } from '../../types/webhook.types';
import type { WorkflowResult } from '../../types/workflow.types';
import type { IClickUpTaskService } from '../../../clickup/interfaces/clickup-task-service.interface';

describe('ZendeskWebhookHandler', () => {
  let handler: ZendeskWebhookHandler;
  let mockClickUpTaskService: IClickUpTaskService;

  beforeEach(() => {
    // Create mock ClickUp task service
    mockClickUpTaskService = {
      createTask: vi.fn().mockResolvedValue({
        id: 'mock-task-id',
        name: 'Mock Task',
        priority: { name: 'normal' },
        url: 'https://app.clickup.com/t/mock-task-id'
      }),
      getTaskById: vi.fn(),
      getTasksByList: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      getTasksByStatus: vi.fn(),
      updateTaskPriority: vi.fn(),
      getTasksByPriority: vi.fn(),
      assignTask: vi.fn(),
      unassignTask: vi.fn(),
      getTasksByAssignee: vi.fn(),
      searchTasks: vi.fn(),
      getOverdueTasks: vi.fn(),
      getTasksDueToday: vi.fn(),
      getTasksDueSoon: vi.fn(),
      validateTaskData: vi.fn(),
      canUserModifyTask: vi.fn(),
      createMultipleTasks: vi.fn(),
      updateMultipleTasks: vi.fn(),
      deleteMultipleTasks: vi.fn(),
      getTaskCompletionRate: vi.fn(),
      getAverageTaskCompletionTime: vi.fn(),
      getTaskCountByStatus: vi.fn()
    } as IClickUpTaskService;

    // Create handler with mock dependencies
    handler = new ZendeskWebhookHandler(mockClickUpTaskService, {
      CLICKUP_API_KEY: 'test-api-key',
      CLICKUP_DEFAULT_LIST_ID: 'test-list-id'
    });
  });

  describe('handleWebhook', () => {
    it('should handle ticket created event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'test-event-123',
        source: 'zendesk',
        eventType: 'ticket.created',
        timestamp: 1705316400000, // 2024-01-15T10:00:00Z
        data: {
          ticket: {
            id: 12345,
            subject: 'Test ticket',
            description: 'This is a test ticket',
            status: 'new',
            priority: 'normal',
            requester_id: 67890,
            assignee_id: null,
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('zendesk_ticket_created');
      expect(result.execution_id).toMatch(/zendesk_test-event-123_\d+/);
      expect(result.step_results).toHaveLength(2);
      expect(result.step_results[0].step_id).toBe('extract_ticket_data');
      expect(result.step_results[1].step_id).toBe('mock_clickup_task_creation');
      expect((result.final_output as any).ticketId).toBe(12345);
    });

    it('should handle ticket updated event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'test-event-456',
        source: 'zendesk',
        eventType: 'ticket.updated',
        timestamp: 1705320000000, // 2024-01-15T11:00:00Z
        data: {
          ticket: {
            id: 12345,
            subject: 'Updated test ticket',
            description: 'This ticket has been updated',
            status: 'open',
            priority: 'high',
            requester_id: 67890,
            assignee_id: 11111,
          },
          changes: {
            status: { previous: 'new', current: 'open' },
            priority: { previous: 'normal', current: 'high' },
            assignee_id: { previous: null, current: 11111 },
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('zendesk_ticket_updated');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('analyze_ticket_changes');
      expect((result.final_output as any).ticketId).toBe(12345);
      expect((result.final_output as any).changesDetected).toBe(3);
    });

    it('should handle ticket status changed event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'test-event-789',
        source: 'zendesk',
        eventType: 'ticket.status_changed',
        timestamp: 1705323600000, // 2024-01-15T12:00:00Z
        data: {
          ticket: {
            id: 12345,
            status: 'solved',
          },
          changes: {
            status: { previous: 'open', current: 'solved' },
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('zendesk_ticket_status_changed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('sync_status_to_clickup');
      expect((result.final_output as any).ticketId).toBe(12345);
      expect((result.final_output as any).newStatus).toBe('solved');
    });

    it('should handle unsupported event types', async () => {
      const mockEvent: WebhookEvent = {
        id: 'test-event-999',
        source: 'zendesk',
        eventType: 'ticket.unsupported_event',
        timestamp: 1705327200000, // 2024-01-15T13:00:00Z
        data: {},
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('zendesk_unsupported_event');
      expect(result.step_results).toHaveLength(0);
      expect((result.final_output as any).message).toContain('Unsupported Zendesk event type');
      expect((result.final_output as any).eventType).toBe('ticket.unsupported_event');
    });

    it('should handle invalid event data gracefully', async () => {
      const invalidEvent = {
        id: 'invalid-event',
        source: 'zendesk',
        // Missing required fields
      } as WebhookEvent;

      const result = await handler.handleWebhook(invalidEvent);

      expect(result.status).toBe('failed');
      expect(result.workflow_id).toBe('zendesk_webhook_error');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('WEBHOOK_PROCESSING_ERROR');
    });
  });

  describe('validateWebhook', () => {
    it('should validate webhook signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'test-signature';

      const isValid = await handler.validateWebhook(payload, signature);

      // Currently returns true for development - in production would validate HMAC
      expect(isValid).toBe(true);
    });
  });

  describe('getSupportedEvents', () => {
    it('should return list of supported event types', () => {
      const supportedEvents = handler.getSupportedEvents();

      expect(supportedEvents).toContain('ticket.created');
      expect(supportedEvents).toContain('ticket.updated');
      expect(supportedEvents).toContain('ticket.status_changed');
      expect(supportedEvents).toContain('ticket.priority_changed');
      expect(supportedEvents).toContain('ticket.assignee_changed');
      expect(supportedEvents).toContain('ticket.comment_added');
      expect(supportedEvents).toContain('ticket.deleted');
      expect(supportedEvents).toHaveLength(7);
    });
  });

  describe('handleTicketCreated', () => {
    it('should process ticket creation with proper step execution', async () => {
      const ticketData = {
        ticket: {
          id: 12345,
          subject: 'Test ticket',
          description: 'Test description',
          status: 'new',
          priority: 'normal',
          requester_id: 67890,
        },
      };

      const result = await handler.handleTicketCreated(ticketData);

      expect(result.workflow_id).toBe('zendesk_ticket_created');
      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(2);
      
      // Check first step - extract ticket data
      const extractStep = result.step_results[0];
      expect(extractStep.step_id).toBe('extract_ticket_data');
      expect(extractStep.status).toBe('completed');
      expect((extractStep.output as any).ticketId).toBe(12345);
      expect((extractStep.output as any).subject).toBe('Test ticket');
      
      // Check second step - mock ClickUp task creation
      const createStep = result.step_results[1];
      expect(createStep.step_id).toBe('mock_clickup_task_creation');
      expect(createStep.status).toBe('completed');
      expect((createStep.output as any).mockTaskId).toBe('mock_task_12345');
    });
  });

  describe('handleTicketUpdated', () => {
    it('should process ticket updates with change analysis', async () => {
      const ticketData = {
        ticket: {
          id: 12345,
          subject: 'Updated ticket',
        },
        changes: {
          status: { previous: 'new', current: 'open' },
          priority: { previous: 'normal', current: 'high' },
        },
      };

      const result = await handler.handleTicketUpdated(ticketData);

      expect(result.workflow_id).toBe('zendesk_ticket_updated');
      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(1);
      
      const analyzeStep = result.step_results[0];
      expect(analyzeStep.step_id).toBe('analyze_ticket_changes');
      expect((analyzeStep.output as any).changesDetected).toBe(2);
    });
  });
});