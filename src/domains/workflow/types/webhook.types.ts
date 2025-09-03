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

// Zendesk webhook event types (official format: zen:event-type:domain.action)
export const ZendeskEventTypeSchema = z.enum([
  'zen:event-type:ticket.created',
  'zen:event-type:ticket.agent_assignment_changed',
  'zen:event-type:ticket.comment_added',
  'zen:event-type:ticket.status_changed',
  'zen:event-type:ticket.priority_changed',
  'zen:event-type:ticket.subject_changed',
  'zen:event-type:ticket.description_changed',
  'zen:event-type:ticket.tags_changed',
  'zen:event-type:ticket.custom_field_changed',
  'zen:event-type:ticket.group_assignment_changed',
  'zen:event-type:ticket.organization_changed',
  'zen:event-type:ticket.requester_changed',
  'zen:event-type:ticket.type_changed',
  'zen:event-type:ticket.form_changed',
  'zen:event-type:ticket.merged',
  'zen:event-type:ticket.soft_deleted',
  'zen:event-type:ticket.permanently_deleted',
  'zen:event-type:ticket.undeleted',
  'zen:event-type:user.created',
  'zen:event-type:user.active_changed',
  'zen:event-type:organization.created',
  'zen:event-type:organization.name_changed',
]);

export type ZendeskEventType = z.infer<typeof ZendeskEventTypeSchema>;

// Zendesk webhook detail object (varies by domain)
export const ZendeskTicketDetailSchema = z.object({
  actor_id: z.string().optional(),
  assignee_id: z.string().nullable(),
  brand_id: z.string(),
  created_at: z.string(),
  custom_status: z.string().nullable(),
  description: z.string(),
  external_id: z.string().nullable(),
  form_id: z.string().optional(),
  group_id: z.string().optional(),
  id: z.string(),
  is_public: z.boolean(),
  organization_id: z.string().nullable(),
  priority: z.string().nullable(),
  requester_id: z.string(),
  status: z.string(),
  subject: z.string(),
  submitter_id: z.string(),
  tags: z.array(z.string()).nullable(),
  type: z.string().nullable(),
  updated_at: z.string(),
  via: z.object({
    channel: z.string(),
  }),
});

export const ZendeskUserDetailSchema = z.object({
  created_at: z.string(),
  email: z.string(),
  external_id: z.string().nullable(),
  default_group_id: z.string(),
  id: z.string(),
  organization_id: z.string(),
  role: z.string(),
  updated_at: z.string(),
});

export const ZendeskOrganizationDetailSchema = z.object({
  created_at: z.string(),
  details: z.string().optional(),
  domain_names: z.array(z.string()),
  external_id: z.string().nullable(),
  group_id: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  shared_comments: z.boolean(),
  shared_tickets: z.boolean(),
  tags: z.array(z.string()),
  updated_at: z.string(),
  url: z.string().optional(),
});

// Zendesk webhook event object (contains change information)
export const ZendeskEventObjectSchema = z.object({
  current: z.unknown().optional(),
  previous: z.unknown().optional(),
  comment: z.object({
    id: z.string(),
    attachment: z.object({
      content_type: z.string(),
      content_url: z.string(),
      filename: z.string(),
      id: z.string(),
      is_public: z.boolean(),
    }).optional(),
  }).optional(),
}).passthrough(); // Allow additional properties for different event types

// Official Zendesk webhook payload structure
export const ZendeskWebhookPayloadSchema = z.object({
  type: ZendeskEventTypeSchema,
  account_id: z.number(),
  id: z.string(), // Unique event ID
  time: z.string(), // ISO timestamp
  zendesk_event_version: z.string(), // e.g., "2022-06-20"
  subject: z.string(), // e.g., "zen:ticket:14038"
  detail: z.union([
    ZendeskTicketDetailSchema,
    ZendeskUserDetailSchema,
    ZendeskOrganizationDetailSchema,
  ]),
  event: ZendeskEventObjectSchema,
});

export type ZendeskWebhookPayload = z.infer<typeof ZendeskWebhookPayloadSchema>;
export type ZendeskTicketDetail = z.infer<typeof ZendeskTicketDetailSchema>;
export type ZendeskUserDetail = z.infer<typeof ZendeskUserDetailSchema>;
export type ZendeskOrganizationDetail = z.infer<typeof ZendeskOrganizationDetailSchema>;
export type ZendeskEventObject = z.infer<typeof ZendeskEventObjectSchema>;

// Zendesk webhook event (wrapper for our internal processing)
export const ZendeskWebhookEventSchema = WebhookEventSchema.extend({
  source: z.literal('zendesk'),
  eventType: ZendeskEventTypeSchema,
  data: ZendeskWebhookPayloadSchema,
});

export type ZendeskWebhookEvent = z.infer<typeof ZendeskWebhookEventSchema>;

// Legacy event type mapping for backward compatibility
export const LegacyZendeskEventTypeSchema = z.enum([
  'ticket.created',
  'ticket.updated', 
  'ticket.status_changed',
  'ticket.priority_changed',
  'ticket.assigned',
  'ticket.comment_added',
]);

export type LegacyZendeskEventType = z.infer<typeof LegacyZendeskEventTypeSchema>;

// Helper function to map official Zendesk event types to legacy types
export function mapZendeskEventType(officialType: ZendeskEventType): LegacyZendeskEventType | null {
  const mapping: Record<ZendeskEventType, LegacyZendeskEventType | null> = {
    'zen:event-type:ticket.created': 'ticket.created',
    'zen:event-type:ticket.agent_assignment_changed': 'ticket.assigned',
    'zen:event-type:ticket.comment_added': 'ticket.comment_added',
    'zen:event-type:ticket.status_changed': 'ticket.status_changed',
    'zen:event-type:ticket.priority_changed': 'ticket.priority_changed',
    'zen:event-type:ticket.subject_changed': 'ticket.updated',
    'zen:event-type:ticket.description_changed': 'ticket.updated',
    'zen:event-type:ticket.tags_changed': 'ticket.updated',
    'zen:event-type:ticket.custom_field_changed': 'ticket.updated',
    'zen:event-type:ticket.group_assignment_changed': 'ticket.updated',
    'zen:event-type:ticket.organization_changed': 'ticket.updated',
    'zen:event-type:ticket.requester_changed': 'ticket.updated',
    'zen:event-type:ticket.type_changed': 'ticket.updated',
    'zen:event-type:ticket.form_changed': 'ticket.updated',
    'zen:event-type:ticket.merged': null,
    'zen:event-type:ticket.soft_deleted': null,
    'zen:event-type:ticket.permanently_deleted': null,
    'zen:event-type:ticket.undeleted': null,
    'zen:event-type:user.created': null,
    'zen:event-type:user.active_changed': null,
    'zen:event-type:organization.created': null,
    'zen:event-type:organization.name_changed': null,
  };
  
  return mapping[officialType] ?? null;
}

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