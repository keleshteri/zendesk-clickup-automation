/**
 * @type: types
 * @domain: workflow
 * @purpose: Workflow orchestration and execution types
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';
import type { WebhookSource } from './webhook.types';

// Workflow status enumeration
export const WorkflowStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'paused',
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

// Workflow step types
export const WorkflowStepTypeSchema = z.enum([
  'webhook_trigger',
  'data_transform',
  'api_call',
  'condition',
  'delay',
  'notification',
  'custom',
]);

export type WorkflowStepType = z.infer<typeof WorkflowStepTypeSchema>;

// Workflow step definition
export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: WorkflowStepTypeSchema,
  description: z.string().optional(),
  config: z.record(z.unknown()),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists']),
    value: z.unknown(),
  })).optional(),
  retry: z.object({
    enabled: z.boolean().default(false),
    max_attempts: z.number().default(3),
    delay_ms: z.number().default(1000),
    backoff_multiplier: z.number().default(2),
  }).optional(),
  timeout_ms: z.number().optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// Workflow configuration
export const WorkflowConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  enabled: z.boolean().default(true),
  trigger: z.object({
    type: z.enum(['webhook', 'schedule', 'manual']),
    source: z.string().optional(), // webhook source
    events: z.array(z.string()).optional(), // webhook events
    schedule: z.string().optional(), // cron expression
    config: z.record(z.unknown()).optional(),
  }),
  steps: z.array(WorkflowStepSchema),
  error_handling: z.object({
    on_failure: z.enum(['stop', 'continue', 'retry', 'rollback']).default('stop'),
    max_retries: z.number().default(3),
    retry_delay_ms: z.number().default(5000),
    notification: z.object({
      enabled: z.boolean().default(false),
      channels: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;

// Workflow execution context
export const WorkflowExecutionContextSchema = z.object({
  workflow_id: z.string(),
  execution_id: z.string(),
  trigger_data: z.record(z.unknown()),
  variables: z.record(z.unknown()).default({}),
  step_results: z.record(z.unknown()).default({}),
  started_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type WorkflowExecutionContext = z.infer<typeof WorkflowExecutionContextSchema>;

// Workflow step result
export const WorkflowStepResultSchema = z.object({
  step_id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  duration_ms: z.number().optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }).optional(),
  retry_count: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});

export type WorkflowStepResult = z.infer<typeof WorkflowStepResultSchema>;

// Workflow execution result
export const WorkflowResultSchema = z.object({
  workflow_id: z.string(),
  execution_id: z.string(),
  status: WorkflowStatusSchema,
  started_at: z.string(),
  completed_at: z.string().optional(),
  duration_ms: z.number().optional(),
  trigger_data: z.record(z.unknown()),
  step_results: z.array(WorkflowStepResultSchema),
  final_output: z.unknown().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    step_id: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;

// Predefined workflow templates
export const WorkflowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  config: WorkflowConfigSchema,
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    required: z.boolean().default(false),
    default_value: z.unknown().optional(),
  })).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;

// Automation mapping types
export const AutomationMappingSchema = z.object({
  id: z.string(),
  name: z.string(),
  source_type: z.enum(['zendesk', 'clickup']),
  target_type: z.enum(['zendesk', 'clickup']),
  field_mappings: z.array(z.object({
    source_field: z.string(),
    target_field: z.string(),
    transform: z.object({
      type: z.enum(['direct', 'lookup', 'formula', 'conditional']),
      config: z.record(z.unknown()).optional(),
    }).optional(),
    required: z.boolean().default(false),
  })),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists']),
    value: z.unknown(),
  })).optional(),
  enabled: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AutomationMapping = z.infer<typeof AutomationMappingSchema>;

// Workflow metrics and monitoring
export const WorkflowMetricsSchema = z.object({
  workflow_id: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  total_executions: z.number(),
  successful_executions: z.number(),
  failed_executions: z.number(),
  average_duration_ms: z.number(),
  min_duration_ms: z.number(),
  max_duration_ms: z.number(),
  error_rate: z.number(), // percentage
  throughput: z.number(), // executions per hour
  step_metrics: z.array(z.object({
    step_id: z.string(),
    executions: z.number(),
    failures: z.number(),
    average_duration_ms: z.number(),
  })),
});

export type WorkflowMetrics = z.infer<typeof WorkflowMetricsSchema>;