/**
 * @type: types
 * @domain: zendesk
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// User Role
export const UserRoleSchema = z.enum(['end-user', 'agent', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Zendesk User (full)
export const ZendeskUserSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string(),
  time_zone: z.string(),
  iana_time_zone: z.string().optional(),
  phone: z.string().nullable(),
  shared_phone_number: z.string().nullable(),
  photo: z.object({
    id: z.number(),
    name: z.string(),
    content_url: z.string(),
    mapped_content_url: z.string(),
    content_type: z.string(),
    size: z.number(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    inline: z.boolean(),
    deleted: z.boolean(),
  }).nullable(),
  locale_id: z.number(),
  locale: z.string(),
  organization_id: z.number().nullable(),
  role: UserRoleSchema,
  verified: z.boolean(),
  external_id: z.string().nullable(),
  tags: z.array(z.string()),
  alias: z.string().nullable(),
  active: z.boolean(),
  shared: z.boolean(),
  shared_agent: z.boolean(),
  last_login_at: z.string().nullable(),
  two_factor_auth_enabled: z.boolean().nullable(),
  signature: z.string().nullable(),
  details: z.string().nullable(),
  notes: z.string().nullable(),
  role_type: z.number().nullable(),
  custom_role_id: z.number().nullable(),
  moderator: z.boolean(),
  ticket_restriction: z.enum(['assigned', 'groups', 'organization', 'requested']).nullable(),
  only_private_comments: z.boolean(),
  restricted_agent: z.boolean(),
  suspended: z.boolean(),
  default_group_id: z.number().nullable(),
  report_csv: z.boolean(),
  user_fields: z.record(z.unknown()).optional(),
});
export type ZendeskUser = z.infer<typeof ZendeskUserSchema>;

// User Identity
export const UserIdentitySchema = z.object({
  id: z.number(),
  url: z.string().url(),
  user_id: z.number(),
  type: z.enum(['email', 'twitter', 'facebook', 'google', 'phone_number', 'agent_forwarding']),
  value: z.string(),
  verified: z.boolean(),
  primary: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  undeliverable_count: z.number(),
  deliverable_state: z.enum(['deliverable', 'undeliverable', 'unknown']),
});
export type UserIdentity = z.infer<typeof UserIdentitySchema>;

// Current User (simplified response)
export const CurrentUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  active: z.boolean(),
  verified: z.boolean(),
  organization_id: z.number().nullable(),
  time_zone: z.string(),
  locale: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;