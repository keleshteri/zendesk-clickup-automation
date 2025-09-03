/**
 * @type: types
 * @domain: workflow
 * @purpose: Webhook event types and data structures for workflow automation
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Generic webhook event types
export const WebhookSourceSchema = z.enum([
  'zendesk',
  'clickup',
  'external',
]);

export type WebhookSource = z.infer<typeof WebhookSourceSchema>;

// Generic webhook event structure
export const WebhookEventSchema = z.object({
  id: z.string(),
  source: WebhookSourceSchema,
  eventType: z.string(),
  timestamp: z.number(),
  data: z.record(z.unknown()),
  signature: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Zendesk webhook event types
export const ZendeskEventTypeSchema = z.enum([
  'ticket.created',
  'ticket.updated',
  'ticket.status_changed',
  'ticket.priority_changed',
  'ticket.assigned',
  'ticket.comment_added',
]);

export type ZendeskEventType = z.infer<typeof ZendeskEventTypeSchema>;

// Zendesk webhook payload structure
export const ZendeskWebhookPayloadSchema = z.object({
  ticket: z.object({
    id: z.number(),
    external_id: z.string().nullable(),
    subject: z.string(),
    description: z.string(),
    status: z.string(),
    priority: z.string().nullable(),
    type: z.string().nullable(),
    tags: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
    assignee_id: z.number().nullable(),
    requester_id: z.number(),
    organization_id: z.number().nullable(),
    group_id: z.number().nullable(),
    custom_fields: z.array(z.object({
      id: z.number(),
      value: z.unknown(),
    })).optional(),
  }),
  requester: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  assignee: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  current_user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).optional(),
});

export type ZendeskWebhookPayload = z.infer<typeof ZendeskWebhookPayloadSchema>;

// Zendesk webhook event
export const ZendeskWebhookEventSchema = WebhookEventSchema.extend({
  source: z.literal('zendesk'),
  eventType: ZendeskEventTypeSchema,
  data: ZendeskWebhookPayloadSchema,
});

export type ZendeskWebhookEvent = z.infer<typeof ZendeskWebhookEventSchema>;

// ClickUp webhook event types (extending existing)
export const ClickUpEventTypeSchema = z.enum([
  'taskCreated',
  'taskUpdated',
  'taskDeleted',
  'taskStatusUpdated',
  'taskPriorityUpdated',
  'taskAssigneeUpdated',
  'taskCommentPosted',
  'listCreated',
  'listUpdated',
  'spaceCreated',
  'spaceUpdated',
]);

export type ClickUpEventType = z.infer<typeof ClickUpEventTypeSchema>;

// ClickUp webhook payload structure
export const ClickUpWebhookPayloadSchema = z.object({
  webhook_id: z.string(),
  event: ClickUpEventTypeSchema,
  task_id: z.string().optional(),
  list_id: z.string().optional(),
  folder_id: z.string().optional(),
  space_id: z.string().optional(),
  team_id: z.string().optional(),
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
  task: z.object({
    id: z.string(),
    name: z.string(),
    text_content: z.string().optional(),
    description: z.string().optional(),
    status: z.object({
      id: z.string(),
      status: z.string(),
      color: z.string(),
      type: z.string(),
      orderindex: z.number(),
    }),
    creator: z.object({
      id: z.number(),
      username: z.string(),
      color: z.string(),
      email: z.string(),
      profilePicture: z.string().nullable(),
    }),
    assignees: z.array(z.object({
      id: z.number(),
      username: z.string(),
      color: z.string(),
      email: z.string(),
      profilePicture: z.string().nullable(),
    })),
    watchers: z.array(z.object({
      id: z.number(),
      username: z.string(),
      color: z.string(),
      email: z.string(),
      profilePicture: z.string().nullable(),
    })),
    checklists: z.array(z.unknown()),
    tags: z.array(z.object({
      name: z.string(),
      tag_fg: z.string(),
      tag_bg: z.string(),
      creator: z.number(),
    })),
    parent: z.string().nullable(),
    priority: z.object({
      id: z.string(),
      priority: z.string(),
      color: z.string(),
      orderindex: z.string(),
    }).nullable(),
    due_date: z.string().nullable(),
    start_date: z.string().nullable(),
    points: z.number().nullable(),
    time_estimate: z.number().nullable(),
    custom_fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      type_config: z.record(z.unknown()),
      date_created: z.string(),
      hide_from_guests: z.boolean(),
      value: z.unknown(),
      required: z.boolean(),
    })),
    dependencies: z.array(z.unknown()),
    linked_tasks: z.array(z.unknown()),
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
  }).optional(),
});

export type ClickUpWebhookPayload = z.infer<typeof ClickUpWebhookPayloadSchema>;

// ClickUp webhook event
export const ClickUpWebhookEventSchema = WebhookEventSchema.extend({
  source: z.literal('clickup'),
  eventType: ClickUpEventTypeSchema,
  data: ClickUpWebhookPayloadSchema,
});

export type ClickUpWebhookEvent = z.infer<typeof ClickUpWebhookEventSchema>;

// Webhook configuration
export const WebhookConfigSchema = z.object({
  id: z.string().optional(),
  source: WebhookSourceSchema,
  endpoint: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
  active: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Webhook registration
export const WebhookRegistrationSchema = z.object({
  id: z.string(),
  source: WebhookSourceSchema,
  endpoint: z.string().url(),
  events: z.array(z.string()),
  secret: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.unknown()).optional(),
  health: z.object({
    status: z.enum(['healthy', 'unhealthy', 'unknown']),
    last_success: z.string().optional(),
    last_failure: z.string().optional(),
    failure_count: z.number().default(0),
  }).optional(),
});

export type WebhookRegistration = z.infer<typeof WebhookRegistrationSchema>;