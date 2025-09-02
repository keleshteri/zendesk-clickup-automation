/**
 * @type: interface
 * @domain: clickup
 * @purpose: Main ClickUp API client contract
 * @solid-principle: ISP
 */

import type {
  ClickUpTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
} from '../types/task.types';
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
  ClickUpUser,
  ClickUpTeam,
  AuthorizedTeamsResponse,
} from '../types/user.types';
import type {
  ApiResponse,
  PaginatedResponse,
  CommonQueryParams,
} from '../types/api.types';
import type {
  WebhookConfig,
  WebhookRegistration,
} from '../types/webhook.types';

/**
 * Main ClickUp API client interface
 * Provides comprehensive access to ClickUp API operations
 * Follows ISP by grouping related operations
 */
export interface IClickUpClient {
  // Authentication & Authorization
  getAuthorizedUser(): Promise<ApiResponse<ClickUpUser>>;
  getAuthorizedTeams(): Promise<ApiResponse<AuthorizedTeamsResponse>>;
  
  // Task Operations
  getTask(taskId: string): Promise<ApiResponse<ClickUpTask>>;
  getTasks(listId: string, params?: TaskQueryParams): Promise<ApiResponse<PaginatedResponse<ClickUpTask>>>;
  createTask(listId: string, data: CreateTaskRequest): Promise<ApiResponse<ClickUpTask>>;
  updateTask(taskId: string, data: UpdateTaskRequest): Promise<ApiResponse<ClickUpTask>>;
  deleteTask(taskId: string): Promise<ApiResponse<void>>;
  
  // Workspace Operations
  getSpaces(teamId: string, params?: CommonQueryParams): Promise<ApiResponse<PaginatedResponse<ClickUpSpace>>>;
  getSpace(spaceId: string): Promise<ApiResponse<ClickUpSpace>>;
  createSpace(teamId: string, data: CreateSpaceRequest): Promise<ApiResponse<ClickUpSpace>>;
  updateSpace(spaceId: string, data: UpdateSpaceRequest): Promise<ApiResponse<ClickUpSpace>>;
  deleteSpace(spaceId: string): Promise<ApiResponse<void>>;
  
  // Folder Operations
  getFolders(spaceId: string, params?: CommonQueryParams): Promise<ApiResponse<PaginatedResponse<ClickUpFolder>>>;
  getFolder(folderId: string): Promise<ApiResponse<ClickUpFolder>>;
  createFolder(spaceId: string, data: CreateFolderRequest): Promise<ApiResponse<ClickUpFolder>>;
  updateFolder(folderId: string, data: Partial<CreateFolderRequest>): Promise<ApiResponse<ClickUpFolder>>;
  deleteFolder(folderId: string): Promise<ApiResponse<void>>;
  
  // List Operations
  getLists(folderId: string, params?: CommonQueryParams): Promise<ApiResponse<PaginatedResponse<ClickUpList>>>;
  getFolderlessLists(spaceId: string, params?: CommonQueryParams): Promise<ApiResponse<PaginatedResponse<ClickUpList>>>;
  getList(listId: string): Promise<ApiResponse<ClickUpList>>;
  createList(folderId: string, data: CreateListRequest): Promise<ApiResponse<ClickUpList>>;
  createFolderlessList(spaceId: string, data: CreateListRequest): Promise<ApiResponse<ClickUpList>>;
  updateList(listId: string, data: Partial<CreateListRequest>): Promise<ApiResponse<ClickUpList>>;
  deleteList(listId: string): Promise<ApiResponse<void>>;
  
  // Webhook Operations
  createWebhook(teamId: string, config: WebhookConfig): Promise<ApiResponse<WebhookRegistration>>;
  getWebhooks(teamId: string): Promise<ApiResponse<{ webhooks: WebhookRegistration[] }>>;
  updateWebhook(webhookId: string, config: Partial<WebhookConfig>): Promise<ApiResponse<WebhookRegistration>>;
  deleteWebhook(webhookId: string): Promise<ApiResponse<void>>;
  
  // Utility Operations
  validateWebhookSignature(signature: string, body: string, secret: string): boolean;
  getRateLimitInfo(): Promise<ApiResponse<{ limit: number; remaining: number; reset: number }>>;
}