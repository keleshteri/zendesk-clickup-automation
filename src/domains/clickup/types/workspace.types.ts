/**
 * @type: types
 * @domain: clickup
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// ClickUp Space
export const ClickUpSpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  private: z.boolean(),
  statuses: z.array(z.object({
    id: z.string(),
    status: z.string(),
    type: z.string(),
    orderindex: z.number(),
    color: z.string(),
  })),
  multiple_assignees: z.boolean(),
  features: z.object({
    due_dates: z.object({
      enabled: z.boolean(),
      start_date: z.boolean(),
      remap_due_dates: z.boolean(),
      remap_closed_due_date: z.boolean(),
    }),
    time_tracking: z.object({
      enabled: z.boolean(),
    }),
    tags: z.object({
      enabled: z.boolean(),
    }),
    time_estimates: z.object({
      enabled: z.boolean(),
    }),
    checklists: z.object({
      enabled: z.boolean(),
    }),
    custom_fields: z.object({
      enabled: z.boolean(),
    }),
    remap_dependencies: z.object({
      enabled: z.boolean(),
    }),
    dependency_warning: z.object({
      enabled: z.boolean(),
    }),
    portfolios: z.object({
      enabled: z.boolean(),
    }),
  }),
  archived: z.boolean(),
});

export type ClickUpSpace = z.infer<typeof ClickUpSpaceSchema>;

// ClickUp Folder (Project)
export const ClickUpFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderindex: z.number(),
  override_statuses: z.boolean(),
  hidden: z.boolean(),
  space: z.object({
    id: z.string(),
    name: z.string(),
    access: z.boolean(),
  }),
  task_count: z.string(),
  archived: z.boolean(),
  statuses: z.array(z.object({
    id: z.string(),
    status: z.string(),
    orderindex: z.number(),
    color: z.string(),
    type: z.string(),
  })),
  lists: z.array(z.object({
    id: z.string(),
    name: z.string(),
    access: z.boolean(),
  })),
  permission_level: z.string(),
});

export type ClickUpFolder = z.infer<typeof ClickUpFolderSchema>;

// ClickUp List
export const ClickUpListSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderindex: z.number(),
  status: z.string().nullable(),
  priority: z.object({
    priority: z.string(),
    color: z.string(),
  }).nullable(),
  assignee: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    color: z.string(),
    initials: z.string(),
    profilePicture: z.string().nullable(),
  }).nullable(),
  task_count: z.number(),
  due_date: z.string().nullable(),
  due_date_time: z.boolean(),
  start_date: z.string().nullable(),
  start_date_time: z.boolean(),
  folder: z.object({
    id: z.string(),
    name: z.string(),
    hidden: z.boolean(),
    access: z.boolean(),
  }),
  space: z.object({
    id: z.string(),
    name: z.string(),
    access: z.boolean(),
  }),
  archived: z.boolean(),
  override_statuses: z.boolean(),
  statuses: z.array(z.object({
    id: z.string(),
    status: z.string(),
    orderindex: z.number(),
    color: z.string(),
    type: z.string(),
  })),
  permission_level: z.string(),
});

export type ClickUpList = z.infer<typeof ClickUpListSchema>;

// Create Space Request
export const CreateSpaceRequestSchema = z.object({
  name: z.string().min(1, 'Space name is required'),
  multiple_assignees: z.boolean().optional(),
  features: z.object({
    due_dates: z.object({
      enabled: z.boolean(),
      start_date: z.boolean().optional(),
      remap_due_dates: z.boolean().optional(),
      remap_closed_due_date: z.boolean().optional(),
    }).optional(),
    time_tracking: z.object({
      enabled: z.boolean(),
    }).optional(),
    tags: z.object({
      enabled: z.boolean(),
    }).optional(),
    time_estimates: z.object({
      enabled: z.boolean(),
    }).optional(),
    checklists: z.object({
      enabled: z.boolean(),
    }).optional(),
    custom_fields: z.object({
      enabled: z.boolean(),
    }).optional(),
    remap_dependencies: z.object({
      enabled: z.boolean(),
    }).optional(),
    dependency_warning: z.object({
      enabled: z.boolean(),
    }).optional(),
    portfolios: z.object({
      enabled: z.boolean(),
    }).optional(),
  }).optional(),
});

export type CreateSpaceRequest = z.infer<typeof CreateSpaceRequestSchema>;

// Update Space Request (includes archived property)
export const UpdateSpaceRequestSchema = CreateSpaceRequestSchema.extend({
  archived: z.boolean().optional(),
}).partial();

export type UpdateSpaceRequest = z.infer<typeof UpdateSpaceRequestSchema>;

// Create Folder Request
export const CreateFolderRequestSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
});

export type CreateFolderRequest = z.infer<typeof CreateFolderRequestSchema>;

// Create List Request
export const CreateListRequestSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  content: z.string().optional(),
  due_date: z.number().optional(),
  due_date_time: z.boolean().optional(),
  priority: z.number().optional(),
  assignee: z.number().optional(),
  status: z.string().optional(),
});

export type CreateListRequest = z.infer<typeof CreateListRequestSchema>;