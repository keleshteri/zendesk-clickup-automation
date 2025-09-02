/**
 * @type: service
 * @domain: clickup
 * @implements: IClickUpSpaceService
 * @dependencies: [IClickUpClient]
 * @tested: no
 */

import type { IClickUpSpaceService } from '../interfaces/clickup-space-service.interface';
import type { IClickUpClient } from '../interfaces/clickup-client.interface';
import type {
  ClickUpSpace,
  ClickUpFolder,
  ClickUpList,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  CreateFolderRequest,
  CreateListRequest,
} from '../types/workspace.types';
import type {
  SpaceValidationResult,
  FolderValidationResult,
  ListValidationResult,
  WorkspaceSearchFilters,
  SpaceBulkOperation,
  SpaceBulkResult,
  WorkspaceAnalytics,
  WorkspacePermissions,
  SpaceServiceConfig,
} from '../types/workspace-extended.types';

import {
  ClickUpSpaceSchema,
  ClickUpFolderSchema,
  ClickUpListSchema,
  CreateSpaceRequestSchema,
  UpdateSpaceRequestSchema,
  CreateFolderRequestSchema,
  CreateListRequestSchema,
} from '../types/workspace.types';

import { ValidationResult } from '../../../shared/types';

/**
 * ClickUp space service implementation
 * Provides business logic for workspace, folder, and list operations
 */
export class ClickUpSpaceService implements IClickUpSpaceService {
  private readonly config: Required<SpaceServiceConfig>;
  
  constructor(
    private readonly client: IClickUpClient,
    config: SpaceServiceConfig = {}
  ) {
    this.config = {
      defaultTeamId: config.defaultTeamId || '',
      maxBulkOperations: config.maxBulkOperations || 25,
      enableValidation: config.enableValidation ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
      enablePermissionChecks: config.enablePermissionChecks ?? true,
    };
  }
  
  // Space management
  async createSpace(teamId: string, spaceData: CreateSpaceRequest): Promise<ClickUpSpace> {
    if (this.config.enableValidation) {
      const validation = await this.validateSpaceData(spaceData);
      if (!validation.isValid) {
        throw new Error(`Space validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const validatedData = CreateSpaceRequestSchema.parse(spaceData);
    const response = await this.client.createSpace(teamId, validatedData);
    if (!response.data) {
      throw new Error('Failed to create space: No data returned');
    }
    return response.data;
  }
  
  async getSpace(spaceId: string): Promise<ClickUpSpace | null> {
    try {
      const response = await this.client.getSpaces(this.config.defaultTeamId);
      if (!response.data) {
        return null;
      }
      return response.data.items.find((space: ClickUpSpace) => space.id === spaceId) || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSpaceById(spaceId: string): Promise<ClickUpSpace | null> {
    return this.getSpace(spaceId);
  }
  
  async getSpaces(teamId: string): Promise<ClickUpSpace[]> {
    const response = await this.client.getSpaces(teamId);
    if (!response.data) {
      return [];
    }
    return [...response.data.items];
  }

  async getSpacesByTeam(teamId: string, params?: any): Promise<any> {
    const spaces = await this.getSpaces(teamId);
    return {
      items: spaces,
      last_page: true,
      page: 1
    };
  }
  
  async updateSpace(spaceId: string, spaceData: UpdateSpaceRequest): Promise<ClickUpSpace> {
    if (this.config.enableValidation && Object.keys(spaceData).length > 0) {
      const validation = await this.validateSpaceUpdateData(spaceData);
      if (!validation.isValid) {
        throw new Error(`Space update validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const response = await this.client.updateSpace(spaceId, spaceData);
    if (!response.data) {
      throw new Error('Failed to update space: No data returned');
    }
    return response.data;
  }
  
  async deleteSpace(spaceId: string): Promise<void> {
    await this.client.deleteSpace(spaceId);
  }
  
  async archiveSpace(spaceId: string): Promise<ClickUpSpace> {
    return await this.updateSpace(spaceId, { archived: true });
  }
  
  async unarchiveSpace(spaceId: string): Promise<ClickUpSpace> {
    return await this.updateSpace(spaceId, { archived: false });
  }
  
  // Folder management
  async createFolder(spaceId: string, folderData: CreateFolderRequest): Promise<ClickUpFolder> {
    if (this.config.enableValidation) {
      const validation = await this.validateFolderData(folderData);
      if (!validation.isValid) {
        throw new Error(`Folder validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const validatedData = CreateFolderRequestSchema.parse(folderData);
    const response = await this.client.createFolder(spaceId, validatedData);
    if (!response.data) {
      throw new Error('Failed to create folder: No data returned');
    }
    return response.data;
  }
  
  async getFolder(folderId: string, spaceId: string): Promise<ClickUpFolder | null> {
    try {
      const response = await this.client.getFolder(folderId);
      if (!response.data) {
        return null;
      }
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getFolderById(folderId: string): Promise<ClickUpFolder | null> {
    try {
      const response = await this.client.getFolder(folderId);
      if (!response.data) {
        return null;
      }
      return response.data;
    } catch (error) {
      return null;
    }
  }
  
  async getFolders(spaceId: string): Promise<ClickUpFolder[]> {
    const response = await this.client.getFolders(spaceId);
    if (!response.data) {
      return [];
    }
    return [...response.data.items];
  }

  async getFoldersBySpace(spaceId: string, params?: any): Promise<any> {
    const folders = await this.getFolders(spaceId);
    return {
      items: folders,
      last_page: true,
      page: 1
    };
  }
  
  async updateFolder(folderId: string, folderData: Partial<CreateFolderRequest>): Promise<ClickUpFolder> {
    if (this.config.enableValidation && Object.keys(folderData).length > 0) {
      const validation = await this.validateFolderUpdateData(folderData);
      if (!validation.isValid) {
        throw new Error(`Folder update validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const response = await this.client.updateFolder(folderId, folderData);
    if (!response.data) {
      throw new Error('Failed to update folder: No data returned');
    }
    return response.data;
  }
  
  async deleteFolder(folderId: string): Promise<void> {
    await this.client.deleteFolder(folderId);
  }
  
  async moveFolder(folderId: string, targetSpaceId: string): Promise<ClickUpFolder> {
    // Note: ClickUp API doesn't directly support moving folders between spaces
    // This would require recreating the folder in the target space
    throw new Error('Moving folders between spaces is not supported by ClickUp API');
  }
  
  // List management
  async createList(folderId: string, listData: CreateListRequest): Promise<ClickUpList> {
    if (this.config.enableValidation) {
      const validation = await this.validateListData(listData);
      if (!validation.isValid) {
        throw new Error(`List validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const validatedData = CreateListRequestSchema.parse(listData);
    const response = await this.client.createList(folderId, validatedData);
    if (!response.data) {
      throw new Error('Failed to create list: No data returned');
    }
    return response.data;
  }
  
  async getList(listId: string): Promise<ClickUpList | null> {
    try {
      const response = await this.client.getList(listId);
      if (!response.data) {
        return null;
      }
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getListById(listId: string): Promise<ClickUpList | null> {
    return this.getList(listId);
  }
  
  async getLists(folderId: string): Promise<ClickUpList[]> {
    const response = await this.client.getLists(folderId);
    if (!response.data) {
      return [];
    }
    return [...response.data.items];
  }

  async getListsByFolder(folderId: string, params?: any): Promise<any> {
    const lists = await this.getLists(folderId);
    return {
      items: lists,
      last_page: true,
      page: 1
    };
  }
  
  async getListsInSpace(spaceId: string): Promise<ClickUpList[]> {
    const response = await this.client.getFolderlessLists(spaceId);
    if (!response.data) {
      return [];
    }
    return [...response.data.items];
  }

  async getFolderlessLists(spaceId: string, params?: any): Promise<any> {
    const lists = await this.getListsInSpace(spaceId);
    return {
      items: lists,
      last_page: true,
      page: 1
    };
  }

  async createFolderlessList(spaceId: string, data: CreateListRequest): Promise<ClickUpList> {
    const response = await this.client.createList(spaceId, data);
    if (!response.data) {
      throw new Error('Failed to create folderless list: No data returned');
    }
    return response.data;
  }
  
  async updateList(listId: string, listData: Partial<CreateListRequest>): Promise<ClickUpList> {
    if (this.config.enableValidation && Object.keys(listData).length > 0) {
      const validation = await this.validateListUpdateData(listData);
      if (!validation.isValid) {
        throw new Error(`List update validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    const response = await this.client.updateList(listId, listData);
    if (!response.data) {
      throw new Error('Failed to update list: No data returned');
    }
    return response.data;
  }
  
  async deleteList(listId: string): Promise<void> {
    await this.client.deleteList(listId);
  }
  
  async moveList(listId: string, targetFolderId: string): Promise<ClickUpList> {
    // Note: ClickUp API doesn't directly support moving lists between folders
    // This would require recreating the list in the target folder
    throw new Error('Moving lists between folders is not supported by ClickUp API');
  }
  
  // Search and filtering
  async searchSpaces(teamId: string, query: string, filters?: WorkspaceSearchFilters): Promise<ClickUpSpace[]> {
    const spaces = await this.getSpaces(teamId);
    
    let filteredSpaces = spaces;
    
    // Apply filters
    if (filters?.archived !== undefined) {
      filteredSpaces = filteredSpaces.filter(space => space.archived === filters.archived);
    }
    
    if (filters?.private !== undefined) {
      filteredSpaces = filteredSpaces.filter(space => space.private === filters.private);
    }
    
    // Apply text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filteredSpaces = filteredSpaces.filter(space => 
        space.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filteredSpaces;
  }
  
  async searchFolders(spaceId: string, query: string): Promise<ClickUpFolder[]> {
    const folders = await this.getFolders(spaceId);
    
    if (!query.trim()) {
      return folders;
    }
    
    const lowerQuery = query.toLowerCase();
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  async searchLists(spaceId: string, query: string): Promise<ClickUpList[]> {
    const lists = await this.getListsInSpace(spaceId);
    
    if (!query.trim()) {
      return lists;
    }
    
    const lowerQuery = query.toLowerCase();
    return lists.filter(list => 
      list.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Validation
  async validateSpaceData(spaceData: CreateSpaceRequest): Promise<SpaceValidationResult> {
    const errors: string[] = [];
    
    try {
      CreateSpaceRequestSchema.parse(spaceData);
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(error.message);
      }
    }
    
    // Business logic validation
    if (spaceData.name.trim().length === 0) {
      errors.push('Space name cannot be empty');
    }
    
    if (spaceData.name.length > 100) {
      errors.push('Space name cannot exceed 100 characters');
    }
    
    if (spaceData.name.length < 3) {
      errors.push('Space names shorter than 3 characters may be hard to identify');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  async validateSpaceUpdateData(spaceData: UpdateSpaceRequest): Promise<SpaceValidationResult> {
    const errors: string[] = [];
    
    if (spaceData.name !== undefined) {
      if (spaceData.name.trim().length === 0) {
        errors.push('Space name cannot be empty');
      }
      
      if (spaceData.name.length > 100) {
        errors.push('Space name cannot exceed 100 characters');
      }
      
      if (spaceData.name.length < 3) {
        errors.push('Space names shorter than 3 characters may be hard to identify');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  async validateFolderData(folderData: CreateFolderRequest): Promise<FolderValidationResult> {
    const errors: string[] = [];
    
    try {
      CreateFolderRequestSchema.parse(folderData);
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(error.message);
      }
    }
    
    // Business logic validation
    if (folderData.name.trim().length === 0) {
      errors.push('Folder name cannot be empty');
    }
    
    if (folderData.name.length > 100) {
      errors.push('Folder name cannot exceed 100 characters');
    }
    
    if (folderData.name.length < 2) {
      errors.push('Folder names shorter than 2 characters may be hard to identify');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  async validateFolderUpdateData(folderData: Partial<CreateFolderRequest>): Promise<FolderValidationResult> {
    const errors: string[] = [];
    
    if (folderData.name !== undefined) {
      if (folderData.name.trim().length === 0) {
        errors.push('Folder name cannot be empty');
      }
      
      if (folderData.name.length > 100) {
        errors.push('Folder name cannot exceed 100 characters');
      }
      
      if (folderData.name.length < 2) {
        errors.push('Folder names shorter than 2 characters may be hard to identify');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  async validateListData(listData: CreateListRequest): Promise<ListValidationResult> {
    const errors: string[] = [];
    
    try {
      CreateListRequestSchema.parse(listData);
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(error.message);
      }
    }
    
    // Business logic validation
    if (listData.name.trim().length === 0) {
      errors.push('List name cannot be empty');
    }
    
    if (listData.name.length > 100) {
      errors.push('List name cannot exceed 100 characters');
    }
    
    if (listData.name.length < 2) {
      errors.push('List names shorter than 2 characters may be hard to identify');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  async validateListUpdateData(listData: Partial<CreateListRequest>): Promise<ListValidationResult> {
    const errors: string[] = [];
    
    if (listData.name !== undefined) {
      if (listData.name.trim().length === 0) {
        errors.push('List name cannot be empty');
      }
      
      if (listData.name.length > 100) {
        errors.push('List name cannot exceed 100 characters');
      }
      
      if (listData.name.length < 2) {
        errors.push('List names shorter than 2 characters may be hard to identify');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors as readonly string[],
    };
  }
  
  // Bulk operations
  async bulkCreateSpaces(teamId: string, spaces: CreateSpaceRequest[]): Promise<SpaceBulkResult> {
    if (spaces.length > this.config.maxBulkOperations) {
      throw new Error(`Cannot create more than ${this.config.maxBulkOperations} spaces at once`);
    }
    
    const results: SpaceBulkResult = {
      successful: [],
      failed: [],
      totalProcessed: spaces.length,
      successCount: 0,
      failureCount: 0
    };
    
    for (let i = 0; i < spaces.length; i++) {
      try {
        const space = await this.createSpace(teamId, spaces[i]);
        results.successful.push({ 
          operation: 'create',
          spaceId: space.id,
          result: space
        });
        results.successCount++;
      } catch (error: any) {
        results.failed.push({ 
          operation: 'create',
          spaceId: spaces[i].name, // Use name as identifier since space doesn't exist yet
          error: error.message
        });
        results.failureCount++;
      }
    }
    
    return results;
  }
  
  async bulkUpdateSpaces(operations: SpaceBulkOperation[]): Promise<SpaceBulkResult> {
    if (operations.length > this.config.maxBulkOperations) {
      throw new Error(`Cannot update more than ${this.config.maxBulkOperations} spaces at once`);
    }
    
    const results: SpaceBulkResult = {
      successful: [],
      failed: [],
      totalProcessed: operations.length,
      successCount: 0,
      failureCount: 0,
    };
    
    for (const operation of operations) {
      try {
        const space = await this.updateSpace(operation.spaceId!, operation.data);
        results.successful.push({
          operation: operation.operation,
          spaceId: operation.spaceId!,
          result: space
        });
        results.successCount++;
      } catch (error: any) {
        results.failed.push({ 
          operation: operation.operation,
          spaceId: operation.spaceId,
          error: error.message
        });
        results.failureCount++;
      }
    }
    
    return results;
  }
  
  // Analytics
  async getWorkspaceAnalytics(teamId: string): Promise<WorkspaceAnalytics> {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics is disabled');
    }
    
    const spaces = await this.getSpaces(teamId);
    
    const analytics: WorkspaceAnalytics = {
      totalSpaces: spaces.length,
      activeSpaces: 0,
      archivedSpaces: 0,
      privateSpaces: 0,
      publicSpaces: 0,
      totalFolders: 0,
      totalLists: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      activeMembers: 0,
      averageTasksPerList: 0,
      averageListsPerFolder: 0,
      averageFoldersPerSpace: 0,
      createdThisMonth: 0,
      completedThisMonth: 0,
      productivity: {
        completionRate: 0,
        averageCompletionTime: 0,
        tasksCreatedPerDay: 0,
        tasksCompletedPerDay: 0,
      },
    };
    
    for (const space of spaces) {
      // Space type analytics
      if (space.archived) {
        analytics.archivedSpaces++;
      }
      
      if (space.private) {
        analytics.privateSpaces++;
      } else {
        analytics.publicSpaces++;
      }
      
      // Count folders and lists
      try {
        const folders = await this.getFolders(space.id);
        analytics.totalFolders += folders.length;
        
        for (const folder of folders) {
          const lists = await this.getLists(folder.id);
          analytics.totalLists += lists.length;
        }
        
        // Also count lists directly in space (folderless lists)
        const spaceLists = await this.getListsInSpace(space.id);
        const folderlessLists = spaceLists.filter(list => !list.folder?.id);
        analytics.totalLists += folderlessLists.length;
      } catch (error) {
        // Continue with other spaces if one fails
        console.warn(`Failed to get folders/lists for space ${space.id}:`, error);
      }
    }
    
    return analytics;
  }
  
  // Permissions (placeholder - would need actual permission checking logic)
  async checkPermissions(spaceId: string, userId: string): Promise<WorkspacePermissions> {
    if (!this.config.enablePermissionChecks) {
      // Return full permissions if checks are disabled
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canCreateFolders: true,
        canCreateLists: true,
        canManageMembers: true,
        isAdmin: true,
      };
    }
    
    // TODO: Implement actual permission checking logic
    // This would require additional API calls to check user roles and permissions
    throw new Error('Permission checking not yet implemented');
  }
  
  async hasPermission(spaceId: string, userId: string, permission: keyof WorkspacePermissions): Promise<boolean> {
    const permissions = await this.checkPermissions(spaceId, userId);
    return permissions[permission];
  }

  // Additional interface methods
  async getWorkspaceStructure(spaceId: string): Promise<any> {
    const space = await this.getSpace(spaceId);
    const folders = await this.getFolders(spaceId);
    const folderlessLists = await this.getListsInSpace(spaceId);
    
    return {
      space,
      folders,
      folderlessLists
    };
  }

  async moveListToFolder(listId: string, targetFolderId: string): Promise<ClickUpList> {
    // Note: ClickUp API doesn't support moving lists between folders
    // This would require recreating the list in the target folder
    throw new Error('Moving lists between folders is not supported by ClickUp API');
  }

  async moveListToSpace(listId: string, targetSpaceId: string): Promise<ClickUpList> {
    // Note: ClickUp API doesn't support moving lists between spaces
    // This would require recreating the list in the target space
    throw new Error('Moving lists between spaces is not supported by ClickUp API');
  }

  async moveFolderToSpace(folderId: string, targetSpaceId: string): Promise<ClickUpFolder> {
    // Note: ClickUp API doesn't directly support moving folders between spaces
    // This would require recreating the folder in the target space
    throw new Error('Moving folders between spaces is not supported by ClickUp API');
  }

  async canUserAccessSpace(spaceId: string, userId: string): Promise<boolean> {
    const permissions = await this.checkPermissions(spaceId, userId);
    return permissions.canView;
  }

  async canUserModifySpace(spaceId: string, userId: string): Promise<boolean> {
    const permissions = await this.checkPermissions(spaceId, userId);
    return permissions.canEdit;
  }

  async canUserCreateInSpace(spaceId: string, userId: string): Promise<boolean> {
    const permissions = await this.checkPermissions(spaceId, userId);
    return permissions.canCreate;
  }

  async getSpaceStatistics(spaceId: string): Promise<any> {
    const folders = await this.getFolders(spaceId);
    const lists = await this.getListsInSpace(spaceId);
    
    return {
      totalFolders: folders.length,
      totalLists: lists.length,
      totalTasks: 0, // Would need task service integration
      completedTasks: 0,
      activeMembers: 0
    };
  }

  async getTeamWorkspaceOverview(teamId: string): Promise<any> {
    const spaces = await this.getSpaces(teamId);
    
    return {
      totalSpaces: spaces.length,
      archivedSpaces: spaces.filter(s => s.archived).length,
      totalFolders: 0, // Would need aggregation
      totalLists: 0,
      totalTasks: 0
    };
  }
}