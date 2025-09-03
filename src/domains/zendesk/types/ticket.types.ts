/**
 * @type: types
 * @domain: zendesk
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';
import { ZendeskUserSchema } from './user.types';

// Ticket Priority
export const TicketPrioritySchema = z.enum(['urgent', 'high', 'normal', 'low']);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

// Ticket Status
export const TicketStatusSchema = z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

// Ticket Type
export const TicketTypeSchema = z.enum(['problem', 'incident', 'question', 'task']);
export type TicketType = z.infer<typeof TicketTypeSchema>;

// ZendeskUser is imported from user.types.ts to avoid duplication

// Custom Field
export const CustomFieldSchema = z.object({
  id: z.number(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).nullable(),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

// Zendesk Ticket
export const ZendeskTicketSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  external_id: z.string().nullable(),
  type: TicketTypeSchema.nullable(),
  subject: z.string(),
  raw_subject: z.string().optional(),
  description: z.string(),
  priority: TicketPrioritySchema.nullable(),
  status: TicketStatusSchema,
  recipient: z.string().nullable(),
  requester_id: z.number(),
  submitter_id: z.number(),
  assignee_id: z.number().nullable(),
  organization_id: z.number().nullable(),
  group_id: z.number().nullable(),
  collaborator_ids: z.array(z.number()),
  follower_ids: z.array(z.number()),
  email_cc_ids: z.array(z.number()),
  forum_topic_id: z.number().nullable(),
  problem_id: z.number().nullable(),
  has_incidents: z.boolean(),
  is_public: z.boolean(),
  due_at: z.string().nullable(),
  tags: z.array(z.string()),
  custom_fields: z.array(CustomFieldSchema),
  satisfaction_rating: z.object({
    score: z.string(),
    comment: z.string().optional(),
  }).nullable(),
  sharing_agreement_ids: z.array(z.number()),
  fields: z.array(CustomFieldSchema).optional(),
  followup_ids: z.array(z.number()),
  ticket_form_id: z.number().nullable(),
  brand_id: z.number().nullable(),
  allow_channelback: z.boolean(),
  allow_attachments: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ZendeskTicket = z.infer<typeof ZendeskTicketSchema>;

// Zendesk Comment
export const ZendeskCommentSchema = z.object({
  id: z.number(),
  type: z.enum(['Comment', 'VoiceComment']),
  author_id: z.number(),
  body: z.string(),
  html_body: z.string(),
  plain_body: z.string().optional(),
  public: z.boolean(),
  attachments: z.array(z.object({
    id: z.number(),
    name: z.string(),
    content_url: z.string(),
    content_type: z.string(),
    size: z.number(),
    thumbnails: z.array(z.object({
      id: z.number(),
      name: z.string(),
      content_url: z.string(),
    })).optional(),
  })),
  audit_id: z.number(),
  via: z.object({
    channel: z.string(),
    source: z.record(z.unknown()).optional(),
  }),
  created_at: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type ZendeskComment = z.infer<typeof ZendeskCommentSchema>;

// Create Comment Request
export const CreateCommentRequestSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
  html_body: z.string().optional(),
  public: z.boolean().default(true),
  author_id: z.number().optional(),
  uploads: z.array(z.string()).optional(), // Upload tokens
});
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

// Update Ticket Request
export const UpdateTicketRequestSchema = z.object({
  subject: z.string().optional(),
  comment: CreateCommentRequestSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  type: TicketTypeSchema.optional(),
  assignee_id: z.number().nullable().optional(),
  group_id: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.array(CustomFieldSchema).optional(),
  due_at: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
});
export type UpdateTicketRequest = z.infer<typeof UpdateTicketRequestSchema>;

// Ticket Query Parameters
export const TicketQueryParamsSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  assignee_id: z.number().optional(),
  requester_id: z.number().optional(),
  group_id: z.number().optional(),
  organization_id: z.number().optional(),
  external_id: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  updated_before: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'priority', 'status', 'ticket_type']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
  include: z.string().optional(), // Comma-separated includes
});
export type TicketQueryParams = z.infer<typeof TicketQueryParamsSchema>;

// Ticket Validation Result
export const TicketValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});
export type TicketValidationResult = z.infer<typeof TicketValidationResultSchema>;