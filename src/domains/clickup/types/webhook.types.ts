/**
 * @type: types
 * @domain: clickup
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Webhook Event Types
export const WebhookEventTypeSchema = z.enum([
  'taskCreated',
  'taskUpdated',
  'taskDeleted',
  'taskPriorityUpdated',
  'taskStatusUpdated',
  'taskAssigneeUpdated',
  'taskDueDateUpdated',
  'taskTagUpdated',
  'taskMoved',
  'taskCommentPosted',
  'taskCommentUpdated',
  'taskTimeEstimateUpdated',
  'taskTimeTrackedUpdated',
  'listCreated',
  'listUpdated',
  'listDeleted',
  'folderCreated',
  'folderUpdated',
  'folderDeleted',
  'spaceCreated',
  'spaceUpdated',
  'spaceDeleted',
  'goalCreated',
  'goalUpdated',
  'goalDeleted',
  'keyResultCreated',
  'keyResultUpdated',
  'keyResultDeleted',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

// Webhook Payload
export const WebhookPayloadSchema = z.object({
  webhook_id: z.string(),
  event: WebhookEventTypeSchema,
  task_id: z.string().optional(),
  list_id: z.string().optional(),
  folder_id: z.string().optional(),
  space_id: z.string().optional(),
  goal_id: z.string().optional(),
  key_result_id: z.string().optional(),
  history_items: z.array(z.object({
    id: z.string(),
    type: z.number(),
    date: z.string(),
    field: z.string(),
    parent_id: z.string(),
    data: z.record(z.unknown()),
    source: z.string().optional(),
    user: z.object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
      color: z.string(),
      initials: z.string(),
      profilePicture: z.string().nullable(),
    }),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
  })).optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// Webhook Event
export const WebhookEventSchema = z.object({
  webhook_id: z.string(),
  event: WebhookEventTypeSchema,
  task_id: z.string().optional(),
  list_id: z.string().optional(),
  folder_id: z.string().optional(),
  space_id: z.string().optional(),
  timestamp: z.number(),
  data: z.record(z.unknown()).optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Webhook Configuration
export const WebhookConfigSchema = z.object({
  endpoint: z.string().url(),
  events: z.array(WebhookEventTypeSchema),
  team_id: z.string().optional(),
  space_id: z.string().optional(),
  folder_id: z.string().optional(),
  list_id: z.string().optional(),
  task_id: z.string().optional(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Webhook Registration Response
export const WebhookRegistrationSchema = z.object({
  id: z.string(),
  webhook: z.object({
    id: z.string(),
    userid: z.number(),
    team_id: z.string(),
    endpoint: z.string(),
    client_id: z.string(),
    events: z.array(z.string()),
    task_id: z.string().optional(),
    list_id: z.string().optional(),
    folder_id: z.string().optional(),
    space_id: z.string().optional(),
    health: z.object({
      status: z.string(),
      fail_count: z.number(),
    }),
    secret: z.string(),
  }),
});

export type WebhookRegistration = z.infer<typeof WebhookRegistrationSchema>;

// ClickUp Webhook (for API responses)
export const ClickUpWebhookSchema = z.object({
  id: z.string(),
  userid: z.number(),
  team_id: z.string(),
  endpoint: z.string().url(),
  client_id: z.string(),
  events: z.array(z.string()),
  task_id: z.string().optional(),
  list_id: z.string().optional(),
  folder_id: z.string().optional(),
  space_id: z.string().optional(),
  health: z.object({
    status: z.string(),
    fail_count: z.number(),
  }),
  secret: z.string(),
});

export type ClickUpWebhook = z.infer<typeof ClickUpWebhookSchema>;

// Create Webhook Request
export const CreateWebhookRequestSchema = z.object({
  endpoint: z.string().url(),
  events: z.array(WebhookEventTypeSchema),
  team_id: z.string().optional(),
  space_id: z.string().optional(),
  folder_id: z.string().optional(),
  list_id: z.string().optional(),
  task_id: z.string().optional(),
});

export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;

// Update Webhook Request
export const UpdateWebhookRequestSchema = z.object({
  endpoint: z.string().url().optional(),
  events: z.array(WebhookEventTypeSchema).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;