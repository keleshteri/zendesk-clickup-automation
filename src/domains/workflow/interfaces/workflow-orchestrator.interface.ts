/**
 * @type: interface
 * @domain: workflow
 * @purpose: Workflow orchestration contract for coordinating automation flows
 * @solid-principle: SRP - Single responsibility for workflow coordination
 */

import type { WorkflowConfig, WorkflowResult, WorkflowStatus } from '../types/workflow.types';
import type { WebhookEvent } from '../types/webhook.types';

/**
 * Contract for orchestrating workflow automation between services
 */
export interface IWorkflowOrchestrator {
  /**
   * Processes incoming webhook events and triggers appropriate workflows
   * @param event - The webhook event to process
   * @returns Promise resolving to workflow execution result
   */
  processWebhookEvent(event: WebhookEvent): Promise<WorkflowResult>;

  /**
   * Executes a specific workflow by ID
   * @param workflowId - Unique identifier for the workflow
   * @param context - Execution context data
   * @returns Promise resolving to workflow result
   */
  executeWorkflow(workflowId: string, context: Record<string, unknown>): Promise<WorkflowResult>;

  /**
   * Gets the status of a running workflow
   * @param workflowId - Unique identifier for the workflow
   * @returns Promise resolving to workflow status
   */
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null>;

  /**
   * Registers a new workflow configuration
   * @param config - Workflow configuration to register
   * @returns Promise resolving to registration success
   */
  registerWorkflow(config: WorkflowConfig): Promise<boolean>;

  /**
   * Gets all registered workflow configurations
   * @returns Promise resolving to array of workflow configs
   */
  getRegisteredWorkflows(): Promise<readonly WorkflowConfig[]>;

  /**
   * Gets workflow execution metrics
   * @param source - Optional webhook source to filter metrics
   * @returns Promise resolving to workflow metrics
   */
  getWorkflowMetrics(source?: string): Promise<import('../types/workflow.types').WorkflowMetrics[]>;

  /**
   * Gets currently active workflow executions
   * @returns Promise resolving to active workflow contexts
   */
  getActiveWorkflows(): Promise<import('../types/workflow.types').WorkflowExecutionContext[]>;
}

/**
 * Contract for workflow execution engine
 */
export interface IWorkflowExecutor {
  /**
   * Executes a workflow step
   * @param stepId - Unique identifier for the step
   * @param input - Input data for the step
   * @returns Promise resolving to step execution result
   */
  executeStep(stepId: string, input: unknown): Promise<unknown>;

  /**
   * Validates workflow configuration
   * @param config - Workflow configuration to validate
   * @returns Promise resolving to validation result
   */
  validateWorkflow(config: WorkflowConfig): Promise<boolean>;

  /**
   * Gets available workflow steps
   * @returns Array of available step definitions
   */
  getAvailableSteps(): readonly string[];
}