/**
 * @type: interface
 * @domain: clickup
 * @purpose: Space service contract for workspace management
 * @solid-principle: SRP, ISP
 */

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
  PaginatedResponse,
  CommonQueryParams,
} from '../types/api.types';

/**
 * Space service interface for workspace management
 * Handles spaces, folders, and lists with business logic
 * Follows SRP by focusing on workspace structure operations
 */
export interface IClickUpSpaceService {
  // Space Operations
  getSpaceById(spaceId: string): Promise<ClickUpSpace | null>;
  getSpacesByTeam(teamId: string, params?: CommonQueryParams): Promise<PaginatedResponse<ClickUpSpace>>;
  createSpace(teamId: string, data: CreateSpaceRequest): Promise<ClickUpSpace>;
  updateSpace(spaceId: string, data: UpdateSpaceRequest): Promise<ClickUpSpace>;
  deleteSpace(spaceId: string): Promise<void>;
  archiveSpace(spaceId: string): Promise<ClickUpSpace>;
  unarchiveSpace(spaceId: string): Promise<ClickUpSpace>;
  
  // Folder Operations
  getFolderById(folderId: string): Promise<ClickUpFolder | null>;
  getFoldersBySpace(spaceId: string, params?: CommonQueryParams): Promise<PaginatedResponse<ClickUpFolder>>;
  createFolder(spaceId: string, data: CreateFolderRequest): Promise<ClickUpFolder>;
  updateFolder(folderId: string, data: Partial<CreateFolderRequest>): Promise<ClickUpFolder>;
  deleteFolder(folderId: string): Promise<void>;
  
  // List Operations
  getListById(listId: string): Promise<ClickUpList | null>;
  getListsByFolder(folderId: string, params?: CommonQueryParams): Promise<PaginatedResponse<ClickUpList>>;
  getFolderlessLists(spaceId: string, params?: CommonQueryParams): Promise<PaginatedResponse<ClickUpList>>;
  createList(folderId: string, data: CreateListRequest): Promise<ClickUpList>;
  createFolderlessList(spaceId: string, data: CreateListRequest): Promise<ClickUpList>;
  updateList(listId: string, data: Partial<CreateListRequest>): Promise<ClickUpList>;
  deleteList(listId: string): Promise<void>;
  
  // Workspace Structure Operations
  getWorkspaceStructure(spaceId: string): Promise<{
    space: ClickUpSpace;
    folders: readonly ClickUpFolder[];
    folderlessLists: readonly ClickUpList[];
  }>;
  
  moveListToFolder(listId: string, targetFolderId: string): Promise<ClickUpList>;
  moveListToSpace(listId: string, targetSpaceId: string): Promise<ClickUpList>;
  moveFolderToSpace(folderId: string, targetSpaceId: string): Promise<ClickUpFolder>;
  
  // Search and Discovery
  searchSpaces(teamId: string, query: string): Promise<readonly ClickUpSpace[]>;
  searchFolders(spaceId: string, query: string): Promise<readonly ClickUpFolder[]>;
  searchLists(spaceId: string, query: string): Promise<readonly ClickUpList[]>;
  
  // Validation
  validateSpaceData(data: CreateSpaceRequest): Promise<{ isValid: boolean; errors: readonly string[] }>;
  validateFolderData(data: CreateFolderRequest): Promise<{ isValid: boolean; errors: readonly string[] }>;
  validateListData(data: CreateListRequest): Promise<{ isValid: boolean; errors: readonly string[] }>;
  
  // Permissions
  canUserAccessSpace(spaceId: string, userId: string): Promise<boolean>;
  canUserModifySpace(spaceId: string, userId: string): Promise<boolean>;
  canUserCreateInSpace(spaceId: string, userId: string): Promise<boolean>;
  
  // Analytics
  getSpaceStatistics(spaceId: string): Promise<{
    totalFolders: number;
    totalLists: number;
    totalTasks: number;
    completedTasks: number;
    activeMembers: number;
  }>;
  
  getTeamWorkspaceOverview(teamId: string): Promise<{
    totalSpaces: number;
    archivedSpaces: number;
    totalFolders: number;
    totalLists: number;
    totalTasks: number;
  }>;
}