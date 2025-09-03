/**
 * @type: types
 * @domain: clickup
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// ClickUp User
export const ClickUpUserSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => {
    // Convert string IDs to numbers if possible, otherwise keep as string
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }),
  username: z.string(),
  email: z.string().email(),
  color: z.string(),
  profilePicture: z.string().nullable(),
  initials: z.string(),
  week_start_day: z.number().nullable().optional(),
  global_font_support: z.boolean().nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export type ClickUpUser = z.infer<typeof ClickUpUserSchema>;

// ClickUp Team (Workspace)
export const ClickUpTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  avatar: z.string().nullable(),
  members: z.array(z.object({
    user: ClickUpUserSchema,
    invited_by: ClickUpUserSchema.optional(),
  })),
});

export type ClickUpTeam = z.infer<typeof ClickUpTeamSchema>;

// Team Member
export const TeamMemberSchema = z.object({
  user: ClickUpUserSchema,
  invited_by: ClickUpUserSchema.optional(),
  can_edit_tags: z.boolean().optional(),
  can_see_time_spent: z.boolean().optional(),
  can_see_time_estimated: z.boolean().optional(),
  can_create_views: z.boolean().optional(),
  custom_role_id: z.number().optional(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

// Authorized Teams Response
export const AuthorizedTeamsResponseSchema = z.object({
  teams: z.array(ClickUpTeamSchema),
});

export type AuthorizedTeamsResponse = z.infer<typeof AuthorizedTeamsResponseSchema>;

// User Permissions
export const UserPermissionsSchema = z.object({
  can_edit: z.boolean(),
  can_delete: z.boolean(),
  can_comment: z.boolean(),
  can_assign: z.boolean(),
  can_create: z.boolean(),
  can_view: z.boolean(),
});

export type UserPermissions = z.infer<typeof UserPermissionsSchema>;