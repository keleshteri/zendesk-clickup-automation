/**
 * @type: types
 * @domain: clickup
 * @purpose: Extended workspace-related data structures for ClickUp operations
 * @exports: [SpaceValidationResult, FolderValidationResult, ListValidationResult, WorkspaceSearchFilters, SpaceBulkOperation, SpaceBulkResult, WorkspaceAnalytics, WorkspacePermissions, SpaceServiceConfig]
 */

import type { ValidationResult } from '../../../shared/types';
import type { ClickUpSpace, ClickUpFolder, ClickUpList } from './workspace.types';
import { z } from 'zod';

// Service configuration types
export interface SpaceServiceConfig {
  readonly defaultTeamId?: string;
  readonly maxBulkOperations?: number;
  readonly enableValidation?: boolean;
  readonly enableAnalytics?: boolean;
  readonly enablePermissionChecks?: boolean;
}

// Validation Result Types - Interface Compatible
export const SpaceValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).readonly(),
});

export type SpaceValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly string[];
};

export const FolderValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).readonly(),
});

export type FolderValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly string[];
};

export const ListValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).readonly(),
});

export type ListValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly string[];
};

// Search and Filter Types
export const WorkspaceSearchFiltersSchema = z.object({
  archived: z.boolean().optional(),
  private: z.boolean().optional(),
  hasMembers: z.boolean().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  orderBy: z.enum(['name', 'created', 'updated']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

export type WorkspaceSearchFilters = z.infer<typeof WorkspaceSearchFiltersSchema>;

// Bulk Operation Types
export const SpaceBulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'archive', 'unarchive']),
  spaceId: z.string().optional(), // Required for update, delete, archive, unarchive
  data: z.any().optional(), // Required for create and update
});

export type SpaceBulkOperation = z.infer<typeof SpaceBulkOperationSchema>;

export const SpaceBulkResultSchema = z.object({
  successful: z.array(z.object({
    operation: z.string(),
    spaceId: z.string(),
    result: z.any(),
  })),
  failed: z.array(z.object({
    operation: z.string(),
    spaceId: z.string().optional(),
    error: z.string(),
  })),
  totalProcessed: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
});

export type SpaceBulkResult = z.infer<typeof SpaceBulkResultSchema>;

// Analytics Types
export const WorkspaceAnalyticsSchema = z.object({
  totalSpaces: z.number(),
  activeSpaces: z.number(),
  archivedSpaces: z.number(),
  privateSpaces: z.number(),
  publicSpaces: z.number(),
  totalFolders: z.number(),
  totalLists: z.number(),
  totalTasks: z.number(),
  completedTasks: z.number(),
  overdueTasks: z.number(),
  activeMembers: z.number(),
  averageTasksPerList: z.number(),
  averageListsPerFolder: z.number(),
  averageFoldersPerSpace: z.number(),
  createdThisMonth: z.number(),
  completedThisMonth: z.number(),
  productivity: z.object({
    completionRate: z.number(),
    averageCompletionTime: z.number(),
    tasksCreatedPerDay: z.number(),
    tasksCompletedPerDay: z.number(),
  }),
});

export type WorkspaceAnalytics = z.infer<typeof WorkspaceAnalyticsSchema>;

// Permission Types
export const WorkspacePermissionsSchema = z.object({
  canView: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canCreate: z.boolean(),
  canCreateFolders: z.boolean(),
  canCreateLists: z.boolean(),
  canManageMembers: z.boolean(),
  isAdmin: z.boolean(),
});

export type WorkspacePermissions = z.infer<typeof WorkspacePermissionsSchema>;