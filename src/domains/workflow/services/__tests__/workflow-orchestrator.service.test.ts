/**
 * @type: test
 * @domain: workflow
 * @purpose: Unit tests for WorkflowOrchestrator
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowOrchestrator } from '../workflow-orchestrator.service';
import { ZendeskWebhookHandler } from '../zendesk-webhook-handler.service';
import { ClickUpWebhookHandler } from '../clickup-webhook-handler.service';
import type { WebhookEvent, WorkflowConfig } from '../../types';
import type { WorkflowResult, WorkflowExecutionContext } from '../../types/workflow.types';

// Mock the webhook handlers
vi.mock('../zendesk-webhook-handler.service');
vi.mock('../clickup-webhook-handler.service');

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockZendeskHandler: any;
  let mockClickUpHandler: any;

  beforeEach(() => {
    // Create mocked instances
    mockZendeskHandler = {
      handleWebhook: vi.fn(),
    };

    mockClickUpHandler = {
      handleWebhook: vi.fn(),
    };

    // Mock the constructors
    vi.mocked(ZendeskWebhookHandler).mockImplementation(() => mockZendeskHandler);
    vi.mocked(ClickUpWebhookHandler).mockImplementation(() => mockClickUpHandler);

    orchestrator = new WorkflowOrchestrator(mockZendeskHandler, mockClickUpHandler);
  });

  describe('processWebhookEvent', () => {
    it('should route Zendesk webhook to ZendeskWebhookHandler', async () => {
      const mockEvent: WebhookEvent = {
        id: 'zendesk-event-123',
        source: 'zendesk',
        eventType: 'ticketCreated',
        timestamp: 1705316400000, // 2024-01-15T10:00:00Z
        data: {
          ticket: {
            id: 123,
            subject: 'Test Ticket',
            description: 'Test description',
            status: 'new',
            priority: 'normal',
            requester_id: 456,
            assignee_id: 789,
          },
        },
      };

      const expectedResult: WorkflowResult = {
        workflow_id: 'zendesk_ticket_created',
        execution_id: 'zendesk_zendesk-event-123_1705316400000',
        status: 'completed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:00:05Z',
        trigger_data: { ticketId: 123 },
        step_results: [],
        final_output: { ticketId: 123 },
      };

      mockZendeskHandler.handleWebhook.mockResolvedValue(expectedResult);

      const result = await orchestrator.processWebhookEvent(mockEvent);

      expect(mockZendeskHandler.handleWebhook).toHaveBeenCalledWith(mockEvent);
      expect(mockClickUpHandler.handleWebhook).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should route ClickUp webhook to ClickUpWebhookHandler', async () => {
      const mockEvent: WebhookEvent = {
        id: 'clickup-event-456',
        source: 'clickup',
        eventType: 'taskCreated',
        timestamp: 1705320000000, // 2024-01-15T11:00:00Z
        data: {
          task: {
            id: 'task-123',
            name: 'Test Task',
            description: 'Test description',
          },
          list_id: 'list-456',
          space_id: 'space-789',
        },
      };

      const expectedResult: WorkflowResult = {
        workflow_id: 'clickup_task_created',
        execution_id: 'clickup_task-456_1705317000000',
        status: 'completed',
        started_at: '2024-01-15T11:00:00Z',
        completed_at: '2024-01-15T11:00:03Z',
        trigger_data: { taskId: 'task-456' },
        step_results: [],
        final_output: { taskId: 'task-123' },
      };

      mockClickUpHandler.handleWebhook.mockResolvedValue(expectedResult);

      const result = await orchestrator.processWebhookEvent(mockEvent);

      expect(mockClickUpHandler.handleWebhook).toHaveBeenCalledWith(mockEvent);
      expect(mockZendeskHandler.handleWebhook).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should handle unsupported webhook sources', async () => {
      const mockEvent: WebhookEvent = {
        id: 'unknown-event-789',
        source: 'unknown' as any,
        eventType: 'someEvent',
        timestamp: 1705323600000, // 2024-01-15T12:00:00Z
        data: {},
      };

      const result = await orchestrator.processWebhookEvent(mockEvent);

      expect(result.status).toBe('failed');
      expect(result.workflow_id).toBe('unsupported_webhook_source');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_WEBHOOK_SOURCE');
      expect(result.error?.message).toContain('Unsupported webhook source: unknown');
      expect(mockZendeskHandler.handleWebhook).not.toHaveBeenCalled();
      expect(mockClickUpHandler.handleWebhook).not.toHaveBeenCalled();
    });

    it('should handle webhook processing errors', async () => {
      const mockEvent: WebhookEvent = {
        id: 'error-event-101',
        source: 'zendesk',
        eventType: 'ticketCreated',
        timestamp: 1705327200000, // 2024-01-15T13:00:00Z
        data: {},
      };

      const error = new Error('Handler processing failed');
      mockZendeskHandler.handleWebhook.mockRejectedValue(error);

      const result = await orchestrator.processWebhookEvent(mockEvent);

      expect(result.status).toBe('failed');
      expect(result.workflow_id).toBe('webhook_processing_error');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('WEBHOOK_PROCESSING_ERROR');
      expect(result.error?.message).toContain('Handler processing failed');
    });

    it('should track active workflows', async () => {
      const mockEvent: WebhookEvent = {
        id: 'tracking-event-202',
        source: 'zendesk',
        eventType: 'ticketCreated',
        timestamp: 1705330800000, // 2024-01-15T14:00:00Z
        data: {
          ticket: {
            id: 123,
            subject: 'Test Ticket',
          },
        },
      };

      const expectedResult: WorkflowResult = {
        workflow_id: 'zendesk_ticket_created',
        execution_id: 'zendesk_tracking-event-202_1705330800000',
        status: 'completed',
        started_at: '2024-01-15T14:00:00Z',
        completed_at: '2024-01-15T14:00:02Z',
        trigger_data: { ticketId: 202 },
        step_results: [],
        final_output: { ticketId: 123 },
      };

      mockZendeskHandler.handleWebhook.mockResolvedValue(expectedResult);

      // Check that workflow is tracked during execution
      const processPromise = orchestrator.processWebhookEvent(mockEvent);
      
      // Workflow should be active during processing
      const activeWorkflows = await orchestrator.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(1);
      expect(activeWorkflows[0].execution_id).toBe('zendesk_tracking-event-202_1705330800000');

      const result = await processPromise;

      // Workflow should be removed from active list after completion
      const activeWorkflowsAfter = await orchestrator.getActiveWorkflows();
      expect(activeWorkflowsAfter).toHaveLength(0);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow with valid configuration', async () => {
      const config: WorkflowConfig = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'A test workflow',
        enabled: true,
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          source: 'zendesk',
          events: ['ticketCreated'],
        },
        steps: [
          {
            id: 'step-1',
            type: 'webhook_trigger',
            name: 'Process Ticket',
            config: {
              url: 'https://api.example.com/webhook',
              method: 'POST',
              headers: {},
            },
          },
        ],
      };

      const context: WorkflowExecutionContext = {
        workflow_id: 'test-workflow',
        execution_id: 'exec-123',
        trigger_data: {
          id: 'event-123',
          source: 'zendesk',
          eventType: 'ticketCreated',
          timestamp: 1705316400000, // 2024-01-15T10:00:00Z
          data: {},
        },
        variables: {},
        step_results: {},
        started_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = await orchestrator.executeWorkflow('test-workflow', context);

      expect(result.status).toBe('completed');
      expect(result.workflow_id).toBe('test-workflow');
      expect(result.execution_id).toBe('exec-123');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0].step_id).toBe('step-1');
      expect(result.step_results[0].status).toBe('completed');
    });

    it('should handle workflow execution timeout', async () => {
      const config: WorkflowConfig = {
        id: 'timeout-workflow',
        name: 'Timeout Workflow',
        description: 'A workflow that times out',
        enabled: true,
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          source: 'zendesk',
          events: ['ticketCreated'],
        },
        steps: [
          {
            id: 'slow-step',
            type: 'webhook_trigger',
            name: 'Slow Step',
            config: {
              url: 'https://slow.api.example.com/webhook',
              method: 'POST',
              headers: {},
            },
          },
        ],
      };

      const context: WorkflowExecutionContext = {
        workflow_id: 'timeout-workflow',
        execution_id: 'exec-timeout',
        trigger_data: {
          id: 'event-timeout',
          source: 'zendesk',
          eventType: 'ticketCreated',
          timestamp: 1705316400000, // 2024-01-15T10:00:00Z
          data: {},
        },
        variables: {},
        step_results: {},
        started_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = await orchestrator.executeWorkflow('timeout-workflow', context);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('WORKFLOW_TIMEOUT');
    });
  });

  describe('validateWorkflowConfig', () => {
    it('should validate correct workflow configuration', async () => {
      const validConfig: WorkflowConfig = {
        id: 'valid-workflow',
        name: 'Valid Workflow',
        description: 'A valid workflow configuration',
        enabled: true,
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          source: 'zendesk',
          events: ['ticketCreated'],
        },
        steps: [
          {
            id: 'step-1',
            type: 'webhook_trigger',
            name: 'Valid Step',
            config: {
              url: 'https://api.example.com/webhook',
              method: 'POST',
              headers: {},
            },
          },
        ],
      };

      const result = await orchestrator.validateWorkflowConfig(validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid workflow configuration', async () => {
      const invalidConfig = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        enabled: true,
        version: '1.0.0',
        trigger: {
          type: 'webhook' as const,
          source: 'test',
        },
        steps: [],
      } as WorkflowConfig;

      const result = await orchestrator.validateWorkflowConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error: string) => error.includes('id'))).toBe(true);
    });

    it('should validate step configurations', async () => {
      const configWithInvalidStep: WorkflowConfig = {
        id: 'invalid-step-workflow',
        name: 'Invalid Step Workflow',
        description: 'Workflow with invalid step',
        enabled: true,
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          source: 'zendesk',
          events: ['ticketCreated'],
        },
        steps: [
          {
            id: 'invalid-step',
            type: 'webhook_trigger',
            name: 'Invalid Step',
            config: {
              // Missing required URL
              method: 'POST',
              headers: {},
            },
          },
        ],
      };

      const result = await orchestrator.validateWorkflowConfig(configWithInvalidStep);

      expect(result.valid).toBe(false);
      expect(result.errors.some((error: string) => error.includes('url'))).toBe(true);
    });
  });

  describe('getActiveWorkflows', () => {
    it('should return empty array when no workflows are active', async () => {
      const activeWorkflows = await orchestrator.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(0);
    });
  });

  describe('getWorkflowMetrics', () => {
    it('should return workflow execution metrics', async () => {
      const metrics = await orchestrator.getWorkflowMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      // Since metrics is an array, we'll check the first item if it exists
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(metric).toHaveProperty('total_executions');
        expect(metric).toHaveProperty('successful_executions');
        expect(metric).toHaveProperty('failed_executions');
        expect(typeof metric.total_executions).toBe('number');
        expect(typeof metric.successful_executions).toBe('number');
        expect(typeof metric.failed_executions).toBe('number');
      }
    });
  });
});