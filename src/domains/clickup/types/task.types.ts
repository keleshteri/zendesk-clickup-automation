/**
 * @type: types
 * @domain: clickup
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Task Priority
export const TaskPrioritySchema = z.enum(['urgent', 'high', 'normal', 'low']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Task Status (simple enum for use in interfaces)
export const TaskStatusEnumSchema = z.enum(['open', 'in_progress', 'review', 'closed', 'cancelled']);
export type TaskStatusEnum = z.infer<typeof TaskStatusEnumSchema>;

// Task Status (full object from ClickUp API)
export const TaskStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  color: z.string(),
  orderindex: z.number(),
  type: z.string(),
});
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Task Assignee
export const TaskAssigneeSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  color: z.string(),
  initials: z.string(),
  profilePicture: z.string().nullable(),
});
export type TaskAssignee = z.infer<typeof TaskAssigneeSchema>;

// Custom Field Value
export const CustomFieldValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).nullable(),
});
export type CustomFieldValue = z.infer<typeof CustomFieldValueSchema>;

// ClickUp Task
export const ClickUpTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  orderindex: z.string(),
  date_created: z.string(),
  date_updated: z.string(),
  date_closed: z.string().nullable(),
  date_done: z.string().nullable(),
  archived: z.boolean(),
  creator: TaskAssigneeSchema,
  assignees: z.array(TaskAssigneeSchema),
  watchers: z.array(TaskAssigneeSchema),
  checklists: z.array(z.any()).optional(),
  tags: z.array(z.object({
    name: z.string(),
    tag_fg: z.string(),
    tag_bg: z.string(),
  })),
  parent: z.string().nullable(),
  priority: z.object({
    id: z.string(),
    priority: TaskPrioritySchema,
    color: z.string(),
  }).nullable(),
  due_date: z.string().nullable(),
  start_date: z.string().nullable(),
  points: z.number().nullable(),
  time_estimate: z.number().nullable(),
  time_spent: z.number().nullable(),
  custom_fields: z.array(CustomFieldValueSchema),
  dependencies: z.array(z.object({
    task_id: z.string(),
    depends_on: z.string(),
    type: z.number(),
  })),
  linked_tasks: z.array(z.any()).optional(),
  team_id: z.string(),
  url: z.string(),
  permission_level: z.string(),
  list: z.object({
    id: z.string(),
    name: z.string(),
    access: z.boolean(),
  }),
  project: z.object({
    id: z.string(),
    name: z.string(),
    hidden: z.boolean(),
    access: z.boolean(),
  }),
  folder: z.object({
    id: z.string(),
    name: z.string(),
    hidden: z.boolean(),
    access: z.boolean(),
  }),
  space: z.object({
    id: z.string(),
  }),
});

export type ClickUpTask = z.infer<typeof ClickUpTaskSchema>;

// Create Task Request
export const CreateTaskRequestSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  assignees: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  priority: TaskPrioritySchema.optional(),
  due_date: z.number().optional(), // Unix timestamp
  due_date_time: z.boolean().optional(),
  time_estimate: z.number().optional(), // milliseconds
  start_date: z.number().optional(), // Unix timestamp
  start_date_time: z.boolean().optional(),
  notify_all: z.boolean().optional(),
  parent: z.string().optional(),
  links_to: z.string().optional(),
  check_required_custom_fields: z.boolean().optional(),
  custom_fields: z.array(z.object({
    id: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  })).optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

// Update Task Request
export const UpdateTaskRequestSchema = CreateTaskRequestSchema.partial();
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

// Task Query Parameters
export const TaskQueryParamsSchema = z.object({
  archived: z.boolean().optional(),
  page: z.number().min(0).optional(),
  order_by: z.enum(['created', 'updated', 'due_date']).optional(),
  reverse: z.boolean().optional(),
  subtasks: z.boolean().optional(),
  statuses: z.array(z.string()).optional(),
  include_closed: z.boolean().optional(),
  assignees: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
  due_date_gt: z.number().optional(),
  due_date_lt: z.number().optional(),
  date_created_gt: z.number().optional(),
  date_created_lt: z.number().optional(),
  date_updated_gt: z.number().optional(),
  date_updated_lt: z.number().optional(),
  custom_fields: z.array(z.object({
    field_id: z.string(),
    operator: z.enum(['=', '!=', '>', '<', 'IS NULL', 'IS NOT NULL']),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })).optional(),
});

export type TaskQueryParams = z.infer<typeof TaskQueryParamsSchema>;

// Task Validation Result
export const TaskValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
});
export type TaskValidationResult = z.infer<typeof TaskValidationResultSchema>;

// Task Search Filters
export const TaskSearchFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  assignees: z.array(z.number()).optional(),
  priority: z.array(TaskPrioritySchema).optional(),
  tags: z.array(z.string()).optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  createdFrom: z.date().optional(),
  createdTo: z.date().optional(),
});
export type TaskSearchFilters = z.infer<typeof TaskSearchFiltersSchema>;

// Task Bulk Operation
export const TaskBulkOperationSchema = z.object({
  taskId: z.string(),
  operation: z.enum(['update', 'delete', 'move']),
  data: z.record(z.any()).optional(),
});
export type TaskBulkOperation = z.infer<typeof TaskBulkOperationSchema>;

// Task Bulk Result
export const TaskBulkResultSchema = z.object({
  successful: z.array(z.string()),
  failed: z.array(z.object({
    taskId: z.string(),
    error: z.string(),
  })),
  totalProcessed: z.number(),
});
export type TaskBulkResult = z.infer<typeof TaskBulkResultSchema>;

// Task Analytics
export const TaskAnalyticsSchema = z.object({
  totalTasks: z.number(),
  completedTasks: z.number(),
  overdueTasks: z.number(),
  averageCompletionTime: z.number(), // in hours
  tasksByStatus: z.record(z.number()),
  tasksByPriority: z.record(z.number()),
  tasksByAssignee: z.record(z.number()),
  completionRate: z.number().optional(), // percentage
});
export type TaskAnalytics = z.infer<typeof TaskAnalyticsSchema>;