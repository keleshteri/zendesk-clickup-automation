/**
 * @type: service
 * @domain: workflow
 * @purpose: Workflow orchestration and coordination
 * @implements: IWorkflowOrchestrator
 * @dependencies: [IZendeskWebhookHandler, IClickUpWebhookHandler]
 * @tested: no
 */

import type {
  IWorkflowOrchestrator,
} from '../interfaces/workflow-orchestrator.interface';
import type {
  IZendeskWebhookHandler,
  IClickUpWebhookHandler,
} from '../interfaces/webhook-handler.interface';
import type {
  WebhookEvent,
  WebhookSource,
} from '../types/webhook.types';
import type {
  WorkflowResult,
  WorkflowConfig,
  WorkflowStatus,
  WorkflowExecutionContext,
  WorkflowMetrics,
} from '../types/workflow.types';
import {
  WebhookEventSchema,
  WebhookSourceSchema,
} from '../types/webhook.types';

/**
 * Orchestrates workflow execution across different webhook sources
 */
export class WorkflowOrchestrator implements IWorkflowOrchestrator {
  private readonly metrics: Map<string, WorkflowMetrics> = new Map();
  private readonly activeWorkflows: Map<string, WorkflowExecutionContext> = new Map();

  constructor(
    private readonly zendeskHandler: IZendeskWebhookHandler,
    private readonly clickupHandler: IClickUpWebhookHandler
  ) {}

  /**
   * Processes incoming webhook events and routes to appropriate handlers
   */
  async processWebhookEvent(event: WebhookEvent): Promise<WorkflowResult> {
    const executionId = `workflow_${event.id}_${Date.now()}`;
    const startTime = new Date();

    try {
      // Validate event structure
      const validatedEvent = WebhookEventSchema.parse(event);
      
      // Create execution context
      const context: WorkflowExecutionContext = {
        execution_id: executionId,
        workflow_id: `${validatedEvent.source}_webhook_processing`,
        trigger_data: {
          source: validatedEvent.source,
          event_type: validatedEvent.eventType,
          data: validatedEvent.data
        },
        variables: {},
        step_results: {},
        started_at: startTime.toISOString(),
        updated_at: startTime.toISOString(),
        metadata: {
          source_event_id: validatedEvent.id,
          timestamp: validatedEvent.timestamp,
        },
      };

      // Track active workflow
      this.activeWorkflows.set(executionId, context);

      // Route to appropriate handler
      let result: WorkflowResult;
      
      switch (validatedEvent.source) {
        case 'zendesk':
          result = await this.zendeskHandler.handleWebhook(validatedEvent);
          break;
        case 'clickup':
          result = await this.clickupHandler.handleWebhook(validatedEvent);
          break;
        default:
          result = this.createUnsupportedSourceResult(executionId, validatedEvent.source, startTime);
      }

      // Update execution context
      context.updated_at = new Date().toISOString();
      
      // Update metrics
      this.updateMetrics(validatedEvent.source, result);
      
      // Clean up active workflow tracking
      this.activeWorkflows.delete(executionId);

      return {
        ...result,
        execution_id: executionId,
      };
    } catch (error) {
      // Clean up on error
      this.activeWorkflows.delete(executionId);
      
      return this.createErrorResult(executionId, startTime, error);
    }
  }

  /**
   * Executes a specific workflow by ID
   */
  async executeWorkflow(workflowId: string, context: Record<string, unknown>): Promise<WorkflowResult> {
    const startTime = new Date();
    const executionId = `exec_${workflowId}_${Date.now()}`;
    
    try {
      // Mock implementation for workflow execution
      // In future phases, this would:
      // 1. Load workflow configuration by ID
      // 2. Validate workflow configuration
      // 3. Execute workflow steps in sequence
      // 4. Handle step failures and retries
      // 5. Manage workflow state
      
      const result: WorkflowResult = {
        workflow_id: workflowId,
        execution_id: executionId,
        status: 'completed' as WorkflowStatus,
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime.getTime(),
        trigger_data: context,
        step_results: [],
        final_output: {
          message: `Workflow '${workflowId}' executed successfully`,
          workflowId: workflowId,
          context: context,
        },
      };

      return result;
    } catch (error) {
      return this.createErrorResult(executionId, startTime, error);
    }
  }

  /**
   * Gets the status of a running workflow
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null> {
    // Mock implementation - in future phases would check actual workflow status
    const activeWorkflow = Array.from(this.activeWorkflows.values())
      .find(workflow => workflow.workflow_id === workflowId);
    
    if (activeWorkflow) {
      return 'running';
    }
    
    // Check if workflow exists in metrics (completed workflows)
    const metrics = this.metrics.get(workflowId);
    if (metrics && metrics.total_executions > 0) {
      return 'completed';
    }
    
    return null;
  }

  /**
   * Registers a new workflow configuration
   */
  async registerWorkflow(config: WorkflowConfig): Promise<boolean> {
    try {
      // Mock implementation - in future phases would persist workflow config
      console.log(`Registering workflow: ${config.id} - ${config.name}`);
      
      // Validate the configuration
      const validation = await this.validateWorkflowConfig(config);
      if (!validation.valid) {
        console.error('Workflow registration failed:', validation.errors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error registering workflow:', error);
      return false;
    }
  }

  /**
   * Gets all registered workflow configurations
   */
  async getRegisteredWorkflows(): Promise<readonly WorkflowConfig[]> {
    // Mock implementation - in future phases would load from storage
    return [];
  }

  /**
   * Validates workflow configuration
   */
  async validateWorkflowConfig(config: WorkflowConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!config.id || config.id.trim() === '') {
      errors.push('Workflow ID is required');
    }

    if (!config.name || config.name.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (!config.steps || config.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Validate steps
    config.steps?.forEach((step, index) => {
      if (!step.id || step.id.trim() === '') {
        errors.push(`Step ${index + 1}: ID is required`);
      }

      if (!step.name || step.name.trim() === '') {
        errors.push(`Step ${index + 1}: Name is required`);
      }

      if (!step.type) {
        errors.push(`Step ${index + 1}: Type is required`);
      }
    });

    // Validate trigger configuration
    if (!config.trigger) {
      errors.push('Workflow trigger configuration is required');
    } else {
      if (!config.trigger.source) {
        errors.push('Trigger source is required');
      }

      if (!config.trigger.events || config.trigger.events.length === 0) {
        errors.push('Trigger must specify at least one event type');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets current workflow metrics
   */
  async getWorkflowMetrics(source?: WebhookSource): Promise<WorkflowMetrics[]> {
    if (source) {
      const metrics = this.metrics.get(source);
      return metrics ? [metrics] : [];
    }

    return Array.from(this.metrics.values());
  }

  /**
   * Gets currently active workflow executions
   */
  async getActiveWorkflows(): Promise<WorkflowExecutionContext[]> {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cancels a running workflow execution
   */
  async cancelWorkflow(executionId: string): Promise<boolean> {
    const context = this.activeWorkflows.get(executionId);
    
    if (!context) {
      return false;
    }

    // Update context timestamp
    context.updated_at = new Date().toISOString();

    // Remove from active workflows
    this.activeWorkflows.delete(executionId);

    return true;
  }

  /**
   * Updates metrics for a workflow source
   */
  private updateMetrics(source: WebhookSource, result: WorkflowResult): void {
    const now = new Date().toISOString();
    const existing = this.metrics.get(source) || {
      workflow_id: `${source}_workflow`,
      period_start: now,
      period_end: now,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      average_duration_ms: 0,
      min_duration_ms: 0,
      max_duration_ms: 0,
      error_rate: 0,
      throughput: 0,
      step_metrics: [],
    };

    existing.total_executions += 1;
    existing.period_end = now;

    if (result.status === 'completed') {
      existing.successful_executions += 1;
    } else if (result.status === 'failed') {
      existing.failed_executions += 1;
    }

    // Update duration metrics
    if (result.duration_ms) {
      const totalDuration = existing.average_duration_ms * (existing.total_executions - 1) + result.duration_ms;
      existing.average_duration_ms = Math.round(totalDuration / existing.total_executions);
      
      if (existing.min_duration_ms === 0 || result.duration_ms < existing.min_duration_ms) {
        existing.min_duration_ms = result.duration_ms;
      }
      if (result.duration_ms > existing.max_duration_ms) {
        existing.max_duration_ms = result.duration_ms;
      }
    }

    // Update error rate
    existing.error_rate = existing.total_executions > 0 ? existing.failed_executions / existing.total_executions : 0;

    // Calculate throughput (executions per hour)
    const periodStart = new Date(existing.period_start);
    const periodEnd = new Date(existing.period_end);
    const hoursDiff = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    existing.throughput = hoursDiff > 0 ? existing.total_executions / hoursDiff : 0;

    this.metrics.set(source, existing);
  }

  /**
   * Creates result for unsupported webhook sources
   */
  private createUnsupportedSourceResult(
    executionId: string,
    source: string,
    startTime: Date
  ): WorkflowResult {
    return {
      workflow_id: 'unsupported_source',
      execution_id: executionId,
      status: 'failed' as WorkflowStatus,
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime.getTime(),
      trigger_data: { source },
      step_results: [],
      error: {
        message: `Unsupported webhook source: ${source}`,
        code: 'UNSUPPORTED_SOURCE',
        details: { source },
      },
    };
  }

  /**
   * Creates error result for failed workflow processing
   */
  private createErrorResult(executionId: string, startTime: Date, error: unknown): WorkflowResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      workflow_id: 'workflow_error',
      execution_id: executionId,
      status: 'failed' as WorkflowStatus,
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime.getTime(),
      trigger_data: {},
      step_results: [],
      error: {
        message: errorMessage,
        code: 'WORKFLOW_PROCESSING_ERROR',
        details: { error: String(error) },
      },
    };
  }
}