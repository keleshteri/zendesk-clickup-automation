/**
 * @ai-metadata
 * @component: SlackWorkflowTypes
 * @description: Comprehensive type definitions for Slack workflow automation and management
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-workflow-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-message-types.ts", "./slack-event-types.ts"]
 * @tests: ["./tests/slack-workflow-types.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Workflow automation type definitions for Slack integration - critical for automation features"
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
 *   - require-dev-approval-for: ["breaking-changes", "workflow-structure-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Type definitions for Slack workflow-related interfaces
 * Provides comprehensive typing for workflow automation and management
 */

import { SlackMessage, SlackBlock, SlackElement } from './slack-message-types';
import { SlackUser, SlackChannel } from './slack-event-types';

/**
 * Workflow execution status
 */
export type WorkflowStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'timeout';

/**
 * Workflow trigger types
 */
export type WorkflowTrigger = 
  | 'manual'
  | 'scheduled'
  | 'event'
  | 'webhook'
  | 'api'
  | 'message'
  | 'reaction'
  | 'mention';

/**
 * Workflow action types
 */
export type WorkflowAction = 
  | 'send_message'
  | 'update_message'
  | 'delete_message'
  | 'add_reaction'
  | 'remove_reaction'
  | 'create_channel'
  | 'invite_user'
  | 'kick_user'
  | 'archive_channel'
  | 'unarchive_channel'
  | 'set_topic'
  | 'set_purpose'
  | 'upload_file'
  | 'create_reminder'
  | 'send_dm'
  | 'create_thread'
  | 'escalate_ticket'
  | 'assign_agent'
  | 'update_status'
  | 'log_activity'
  | 'trigger_webhook'
  | 'call_api'
  | 'wait'
  | 'conditional'
  | 'loop'
  | 'parallel';

/**
 * Workflow priority levels
 */
export type WorkflowPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

/**
 * Base workflow step interface
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  action: WorkflowAction;
  parameters: Record<string, any>;
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  onTimeout?: string; // Next step ID
  enabled: boolean;
  order: number;
}

/**
 * Workflow condition interface
 */
export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists' | 'regex';
  value: any;
  logicalOperator?: 'and' | 'or';
}

/**
 * Workflow trigger configuration
 */
export interface WorkflowTriggerConfig {
  type: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  schedule?: {
    cron?: string;
    timezone?: string;
    startDate?: Date;
    endDate?: Date;
  };
  event?: {
    type: string;
    filters?: Record<string, any>;
  };
  webhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api_key';
      credentials?: Record<string, string>;
    };
  };
}

/**
 * Main workflow definition
 */
export interface SlackWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  trigger: WorkflowTriggerConfig;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  metadata?: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    tags?: string[];
    category?: string;
  };
  settings?: {
    maxExecutionTime?: number;
    maxRetries?: number;
    enableLogging?: boolean;
    enableNotifications?: boolean;
    parallelExecution?: boolean;
    errorHandling?: 'stop' | 'continue' | 'retry';
  };
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  variables: Record<string, any>;
  stepResults: Record<string, any>;
  errors: WorkflowError[];
  logs: WorkflowLog[];
  triggeredBy: {
    type: 'user' | 'system' | 'api' | 'webhook';
    id?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  success: boolean;
  executionId: string;
  status: WorkflowStatus;
  duration: number;
  stepsExecuted: number;
  stepsSkipped: number;
  stepsFailed: number;
  result?: any;
  error?: WorkflowError;
  logs: WorkflowLog[];
}

/**
 * Workflow error interface
 */
export interface WorkflowError {
  stepId?: string;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Workflow log entry
 */
export interface WorkflowLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Workflow template interface
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: Omit<SlackWorkflow, 'id' | 'status' | 'metadata'>;
  preview?: {
    image?: string;
    description?: string;
    useCases?: string[];
  };
}

/**
 * Workflow statistics
 */
export interface WorkflowStatistics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
  mostCommonErrors: Array<{
    error: string;
    count: number;
  }>;
  performanceMetrics: {
    stepPerformance: Record<string, {
      averageTime: number;
      successRate: number;
      errorRate: number;
    }>;
  };
}

/**
 * Workflow scheduler interface
 */
export interface WorkflowScheduler {
  schedule(workflow: SlackWorkflow, trigger: WorkflowTriggerConfig): Promise<string>;
  unschedule(scheduleId: string): Promise<void>;
  reschedule(scheduleId: string, trigger: WorkflowTriggerConfig): Promise<void>;
  getScheduledWorkflows(): Promise<Array<{
    scheduleId: string;
    workflowId: string;
    nextRun: Date;
    trigger: WorkflowTriggerConfig;
  }>>;
}

/**
 * Workflow executor interface
 */
export interface WorkflowExecutor {
  execute(workflow: SlackWorkflow, context?: Partial<WorkflowExecutionContext>): Promise<WorkflowExecutionResult>;
  pause(executionId: string): Promise<void>;
  resume(executionId: string): Promise<void>;
  cancel(executionId: string): Promise<void>;
  getExecution(executionId: string): Promise<WorkflowExecutionContext | null>;
  getActiveExecutions(): Promise<WorkflowExecutionContext[]>;
}

/**
 * Workflow manager interface
 */
export interface WorkflowManager {
  create(workflow: Omit<SlackWorkflow, 'id' | 'status' | 'metadata'>): Promise<SlackWorkflow>;
  update(id: string, updates: Partial<SlackWorkflow>): Promise<SlackWorkflow>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<SlackWorkflow | null>;
  list(filters?: {
    status?: WorkflowStatus;
    priority?: WorkflowPriority;
    category?: string;
    tags?: string[];
  }): Promise<SlackWorkflow[]>;
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  validate(workflow: SlackWorkflow): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

/**
 * Workflow event types
 */
export interface WorkflowEvents {
  'workflow.created': { workflow: SlackWorkflow };
  'workflow.updated': { workflow: SlackWorkflow; changes: Partial<SlackWorkflow> };
  'workflow.deleted': { workflowId: string };
  'workflow.enabled': { workflowId: string };
  'workflow.disabled': { workflowId: string };
  'execution.started': { execution: WorkflowExecutionContext };
  'execution.completed': { execution: WorkflowExecutionContext; result: WorkflowExecutionResult };
  'execution.failed': { execution: WorkflowExecutionContext; error: WorkflowError };
  'execution.paused': { executionId: string };
  'execution.resumed': { executionId: string };
  'execution.cancelled': { executionId: string };
  'step.started': { executionId: string; step: WorkflowStep };
  'step.completed': { executionId: string; step: WorkflowStep; result: any };
  'step.failed': { executionId: string; step: WorkflowStep; error: WorkflowError };
}