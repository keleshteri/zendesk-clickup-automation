/**
 * @type: test
 * @domain: workflow
 * @purpose: Unit tests for ClickUpWebhookHandler
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickUpWebhookHandler } from '../clickup-webhook-handler.service';
import type { WebhookEvent } from '../../types/webhook.types';
import type { WorkflowResult } from '../../types/workflow.types';

describe('ClickUpWebhookHandler', () => {
  let handler: ClickUpWebhookHandler;

  beforeEach(() => {
    handler = new ClickUpWebhookHandler();
  });

  describe('handleWebhook', () => {
    it('should handle task created event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-123',
        source: 'clickup',
        eventType: 'taskCreated',
        timestamp: 1705316400000, // 2024-01-15T10:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
            description: 'This is a test task',
            status: {
              status: 'to do',
              color: '#d3d3d3',
              type: 'open',
            },
            priority: {
              priority: 'normal',
              color: '#ffcc00',
            },
            assignees: [
              {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
              },
            ],
          },
          list_id: 'list-456',
          space_id: 'space-789',
          webhook_id: 'webhook-abc',
          event: 'taskCreated',
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_created');
      expect(result.execution_id).toMatch(/clickup_clickup-event-123_\d+/);
      expect(result.step_results).toHaveLength(2);
      expect(result.step_results[0].step_id).toBe('extract_task_data');
      expect(result.step_results[1].step_id).toBe('mock_zendesk_ticket_creation');
      expect((result.final_output as any).taskId).toBe('task-123');
    });

    it('should handle task updated event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-456',
        source: 'clickup',
        eventType: 'taskUpdated',
        timestamp: 1705320000000, // 2024-01-15T11:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Updated Test Task',
            description: 'This task has been updated',
          },
          history_items: [
            {
              id: 'history-1',
              type: 1,
              date: '1705316400000',
              field: 'name',
              parent: null,
              data: {
                name_old: 'Test Task',
                name_new: 'Updated Test Task',
              },
            },
          ],
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_updated');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('analyze_task_changes');
      expect((result.final_output as any).taskId).toBe('task-123');
      expect((result.final_output as any).changesDetected).toBe(1);
    });

    it('should handle task status updated event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-789',
        source: 'clickup',
        eventType: 'taskStatusUpdated',
        timestamp: 1705323600000, // 2024-01-15T12:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
            status: {
              status: 'in progress',
              color: '#4194f6',
              type: 'custom',
            },
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_status_changed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('sync_status_to_zendesk');
      expect((result.final_output as any).taskId).toBe('task-123');
      expect((result.final_output as any).newStatus).toBe('in progress');
    });

    it('should handle task priority updated event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-101',
        source: 'clickup',
        eventType: 'taskPriorityUpdated',
        timestamp: 1705327200000, // 2024-01-15T13:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
            priority: {
              priority: 'high',
              color: '#f50000',
            },
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_priority_changed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('sync_priority_to_zendesk');
      expect((result.final_output as any).taskId).toBe('task-123');
      expect((result.final_output as any).newPriority).toBe('high');
    });

    it('should handle task assignee updated event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-202',
        source: 'clickup',
        eventType: 'taskAssigneeUpdated',
        timestamp: 1705330800000, // 2024-01-15T14:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
            assignees: [
              {
                id: 'user-123',
                username: 'testuser1',
                email: 'test1@example.com',
              },
              {
                id: 'user-456',
                username: 'testuser2',
                email: 'test2@example.com',
              },
            ],
          },
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_assignee_changed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('sync_assignees_to_zendesk');
      expect((result.final_output as any).taskId).toBe('task-123');
      expect((result.final_output as any).assigneeCount).toBe(2);
    });

    it('should handle task comment posted event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-303',
        source: 'clickup',
        eventType: 'taskCommentPosted',
        timestamp: 1705334400000, // 2024-01-15T15:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
          },
          history_items: [
            {
              id: 'comment-1',
              type: 2,
              date: '1705323600000',
              field: 'comment',
              data: {
                comment_text: 'This is a test comment',
              },
            },
          ],
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_comment_posted');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('sync_comment_to_zendesk');
      expect((result.final_output as any).taskId).toBe('task-123');
    });

    it('should handle task deleted event successfully', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-404',
        source: 'clickup',
        eventType: 'taskDeleted',
        timestamp: 1705338000000, // 2024-01-15T16:00:00Z
        data: {
          task_id: 'task-123',
          list_id: 'list-456',
          space_id: 'space-789',
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_task_deleted');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('handle_task_deletion');
      expect((result.final_output as any).taskId).toBe('task-123');
    });

    it('should handle structural change events (list/space)', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-505',
        source: 'clickup',
        eventType: 'listCreated',
        timestamp: 1705341600000, // 2024-01-15T17:00:00Z
        data: {
          list_id: 'list-456',
          space_id: 'space-789',
          team_id: 'team-101',
        },
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_listCreated');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('handle_structural_change');
      expect((result.final_output as any).eventType).toBe('listCreated');
    });

    it('should handle unsupported event types', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-999',
        source: 'clickup',
        eventType: 'unsupportedEvent',
        timestamp: 1705345200000, // 2024-01-15T18:00:00Z
        data: {},
      };

      const result = await handler.handleWebhook(mockEvent);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('clickup_unsupported_event');
      expect(result.step_results).toHaveLength(0);
      expect((result.final_output as any).message).toContain('Unsupported ClickUp event type');
      expect((result.final_output as any).eventType).toBe('unsupportedEvent');
    });

    it('should handle invalid event data gracefully', async () => {
      const invalidEvent = {
        id: 'invalid-event',
        source: 'clickup',
        // Missing required fields
      } as WebhookEvent;

      const result = await handler.handleWebhook(invalidEvent);

      expect(result.status).toBe('failed');
      expect(result.workflow_id).toBe('clickup_webhook_error');
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

      expect(supportedEvents).toContain('taskCreated');
      expect(supportedEvents).toContain('taskUpdated');
      expect(supportedEvents).toContain('taskDeleted');
      expect(supportedEvents).toContain('taskStatusUpdated');
      expect(supportedEvents).toContain('taskPriorityUpdated');
      expect(supportedEvents).toContain('taskAssigneeUpdated');
      expect(supportedEvents).toContain('taskCommentPosted');
      expect(supportedEvents).toContain('listCreated');
      expect(supportedEvents).toContain('listUpdated');
      expect(supportedEvents).toContain('spaceCreated');
      expect(supportedEvents).toContain('spaceUpdated');
      expect(supportedEvents).toHaveLength(11);
    });
  });

  describe('handleTaskCreated', () => {
    it('should process task creation with proper step execution', async () => {
      const taskData = {
        task: {
          id: 'task-123',
          name: 'Test Task',
          description: 'Test description',
          status: {
            status: 'to do',
            color: '#d3d3d3',
            type: 'open',
          },
          priority: {
            priority: 'normal',
            color: '#ffcc00',
          },
          assignees: [
            {
              id: 'user-123',
              username: 'testuser',
              email: 'test@example.com',
            },
          ],
        },
        list_id: 'list-456',
        space_id: 'space-789',
        webhook_id: 'webhook-abc',
        event: 'taskCreated',
      };

      const result = await handler.handleTaskCreated(taskData);

      expect(result.workflow_id).toBe('clickup_task_created');
      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(2);
      
      // Check first step - extract task data
      const extractStep = result.step_results[0];
      expect(extractStep.step_id).toBe('extract_task_data');
      expect(extractStep.status).toBe('completed');
      expect((extractStep.output as any).taskId).toBe('task-123');
      expect((extractStep.output as any).taskName).toBe('Test Task');
      
      // Check second step - mock Zendesk ticket creation
      const createStep = result.step_results[1];
      expect(createStep.step_id).toBe('mock_zendesk_ticket_creation');
      expect(createStep.status).toBe('completed');
      expect((createStep.output as any).mockTicketId).toBe('mock_ticket_task-123');
    });
  });

  describe('handleTaskUpdated', () => {
    it('should process task updates with change analysis', async () => {
      const taskData = {
        task: {
          id: 'task-123',
          name: 'Updated Task',
        },
        history_items: [
          {
            id: 'history-1',
            type: 1,
            date: '1705316400000',
            field: 'name',
          },
          {
            id: 'history-2',
            type: 1,
            date: '1705316500000',
            field: 'status',
          },
        ],
      };

      const result = await handler.handleTaskUpdated(taskData);

      expect(result.workflow_id).toBe('clickup_task_updated');
      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(1);
      
      const analyzeStep = result.step_results[0];
      expect(analyzeStep.step_id).toBe('analyze_task_changes');
      expect((analyzeStep.output as any).changesDetected).toBe(2);
    });
  });
});