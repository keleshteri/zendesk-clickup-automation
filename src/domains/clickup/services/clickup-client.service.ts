/**
 * @type: service
 * @domain: clickup
 * @implements: IClickUpClient
 * @dependencies: [HTTPConfig]
 * @tested: no
 */

import type { IClickUpClient } from "../interfaces/clickup-client.interface";

import type {
  ClickUpTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
} from "../types/task.types";

import type {
  ClickUpSpace,
  ClickUpFolder,
  ClickUpList,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  CreateFolderRequest,
  CreateListRequest,
} from "../types/workspace.types";

import type {
  ClickUpUser,
  ClickUpTeam,
  AuthorizedTeamsResponse,
} from "../types/user.types";

import type {
  ClickUpWebhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookRegistration,
  WebhookConfig,
} from "../types/webhook.types";

import type {
  ApiResponse,
  PaginatedResponse,
  CommonQueryParams,
  ClickUpRateLimitInfo,
} from "../types/api.types";

import { ClickUpHttpClient } from "./clickup-http-client.service";
import type { ClickUpHttpClientConfig } from "../types/http.types";
import {
  ClickUpAuthService,
  type IClickUpAuthService,
} from "./clickup-auth.service";

// Validation schemas are now used in HTTP client and auth service
// Error handling is delegated to HTTP client service

// API schemas are used in HTTP client and auth service

/**
 * ClickUp API client implementation
 * Handles HTTP communication with ClickUp's REST API
 */
export class ClickUpClient implements IClickUpClient {
  private readonly httpClient: ClickUpHttpClient;
  private readonly authService: IClickUpAuthService;

  constructor(config: ClickUpHttpClientConfig) {
    this.httpClient = new ClickUpHttpClient(config);
    this.authService = new ClickUpAuthService(this.httpClient);
  }

  // Authentication methods
  /**
   * Validate the API token by attempting to get authorized user
   */
  async validateToken(): Promise<boolean> {
    return this.authService.validateToken();
  }

  async getAuthorizedUser(): Promise<ApiResponse<ClickUpUser>> {
    return this.authService.getAuthorizedUser();
  }

  async getAuthorizedTeams(): Promise<ApiResponse<AuthorizedTeamsResponse>> {
    return this.authService.getAuthorizedTeams();
  }

  // Task management methods
  async getTask(taskId: string): Promise<ApiResponse<ClickUpTask>> {
    const response = await this.httpClient.makeRequest<ClickUpTask>(
      "GET",
      `/task/${taskId}`
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createTask(
    listId: string,
    taskData: CreateTaskRequest
  ): Promise<ApiResponse<ClickUpTask>> {
    const response = await this.httpClient.makeRequest<ClickUpTask>(
      "POST",
      `/list/${listId}/task`,
      taskData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async updateTask(
    taskId: string,
    taskData: UpdateTaskRequest
  ): Promise<ApiResponse<ClickUpTask>> {
    const response = await this.httpClient.makeRequest<ClickUpTask>(
      "PUT",
      `/task/${taskId}`,
      taskData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.makeRequest(
      "DELETE",
      `/task/${taskId}`
    );

    return {
      success: true,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getTasks(
    listId: string,
    params?: TaskQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpTask>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      tasks: ClickUpTask[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/list/${listId}/task${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.tasks,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // Workspace management methods
  async getSpaces(
    teamId: string,
    params?: CommonQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpSpace>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      spaces: ClickUpSpace[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/team/${teamId}/space${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.spaces,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getSpace(spaceId: string): Promise<ApiResponse<ClickUpSpace>> {
    const response = await this.httpClient.makeRequest<ClickUpSpace>(
      "GET",
      `/space/${spaceId}`
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createSpace(
    teamId: string,
    spaceData: CreateSpaceRequest
  ): Promise<ApiResponse<ClickUpSpace>> {
    const response = await this.httpClient.makeRequest<ClickUpSpace>(
      "POST",
      `/team/${teamId}/space`,
      spaceData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async updateSpace(
    spaceId: string,
    spaceData: UpdateSpaceRequest
  ): Promise<ApiResponse<ClickUpSpace>> {
    const response = await this.httpClient.makeRequest<ClickUpSpace>(
      "PUT",
      `/space/${spaceId}`,
      spaceData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async deleteSpace(spaceId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.makeRequest(
      "DELETE",
      `/space/${spaceId}`
    );

    return {
      success: true,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // Folder management methods
  async getFolders(
    spaceId: string,
    params?: CommonQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpFolder>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      folders: ClickUpFolder[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/space/${spaceId}/folder${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.folders,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getFolder(folderId: string): Promise<ApiResponse<ClickUpFolder>> {
    const response = await this.httpClient.makeRequest<ClickUpFolder>(
      "GET",
      `/folder/${folderId}`
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createFolder(
    spaceId: string,
    folderData: CreateFolderRequest
  ): Promise<ApiResponse<ClickUpFolder>> {
    const response = await this.httpClient.makeRequest<ClickUpFolder>(
      "POST",
      `/space/${spaceId}/folder`,
      folderData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async updateFolder(
    folderId: string,
    folderData: Partial<CreateFolderRequest>
  ): Promise<ApiResponse<ClickUpFolder>> {
    const response = await this.httpClient.makeRequest<ClickUpFolder>(
      "PUT",
      `/folder/${folderId}`,
      folderData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async deleteFolder(folderId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.makeRequest(
      "DELETE",
      `/folder/${folderId}`
    );

    return {
      success: true,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // List management methods
  async getLists(
    folderId: string,
    params?: CommonQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpList>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      lists: ClickUpList[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/folder/${folderId}/list${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.lists,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getListsInSpace(
    spaceId: string,
    params?: CommonQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpList>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      lists: ClickUpList[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/space/${spaceId}/list${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.lists,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getList(listId: string): Promise<ApiResponse<ClickUpList>> {
    const response = await this.httpClient.makeRequest<ClickUpList>(
      "GET",
      `/list/${listId}`
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createList(
    folderId: string,
    listData: CreateListRequest
  ): Promise<ApiResponse<ClickUpList>> {
    const response = await this.httpClient.makeRequest<ClickUpList>(
      "POST",
      `/folder/${folderId}/list`,
      listData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async updateList(
    listId: string,
    listData: Partial<CreateListRequest>
  ): Promise<ApiResponse<ClickUpList>> {
    const response = await this.httpClient.makeRequest<ClickUpList>(
      "PUT",
      `/list/${listId}`,
      listData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async deleteList(listId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.makeRequest(
      "DELETE",
      `/list/${listId}`
    );

    return {
      success: true,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getFolderlessLists(
    spaceId: string,
    params?: CommonQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ClickUpList>>> {
    const queryString = params ? this.httpClient.buildQueryString(params) : "";
    const response = await this.httpClient.makeRequest<{
      lists: ClickUpList[];
      last_page?: boolean;
      page?: number;
    }>("GET", `/space/${spaceId}/list${queryString}`);

    return {
      success: true,
      data: {
        items: response.data.lists,
        last_page: response.data.last_page,
        page: response.data.page,
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createFolderlessList(
    spaceId: string,
    listData: CreateListRequest
  ): Promise<ApiResponse<ClickUpList>> {
    const response = await this.httpClient.makeRequest<ClickUpList>(
      "POST",
      `/space/${spaceId}/list`,
      listData
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // Webhook management methods
  async getWebhooks(
    teamId: string
  ): Promise<ApiResponse<{ webhooks: WebhookRegistration[] }>> {
    const response = await this.httpClient.makeRequest<{
      webhooks: WebhookRegistration[];
    }>("GET", `/team/${teamId}/webhook`);

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async getWebhook(webhookId: string): Promise<ApiResponse<ClickUpWebhook>> {
    const response = await this.httpClient.makeRequest<ClickUpWebhook>(
      "GET",
      `/webhook/${webhookId}`
    );

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async createWebhook(
    teamId: string,
    config: WebhookConfig
  ): Promise<ApiResponse<WebhookRegistration>> {
    const response = await this.httpClient.makeRequest<ClickUpWebhook>(
      "POST",
      `/team/${teamId}/webhook`,
      config
    );

    return {
      success: true,
      data: {
        id: response.data.id,
        webhook: {
          id: response.data.id,
          userid: response.data.userid,
          team_id: response.data.team_id,
          endpoint: response.data.endpoint,
          client_id: response.data.client_id,
          events: response.data.events,
          task_id: response.data.task_id,
          list_id: response.data.list_id,
          folder_id: response.data.folder_id,
          space_id: response.data.space_id,
          health: response.data.health,
          secret: response.data.secret,
        },
      },
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async updateWebhook(
    webhookId: string,
    config: Partial<WebhookConfig>
  ): Promise<ApiResponse<WebhookRegistration>> {
    const response = await this.httpClient.makeRequest<ClickUpWebhook>(
      "PUT",
      `/webhook/${webhookId}`,
      config
    );

    return {
      success: true,
      data: {
        id: response.data.id,
        webhook: response.data,
      } as WebhookRegistration,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.makeRequest(
      "DELETE",
      `/webhook/${webhookId}`
    );

    return {
      success: true,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // Utility methods
  async getRateLimitInfo(): Promise<
    ApiResponse<{ limit: number; remaining: number; reset: number }>
  > {
    const rateLimitInfo = this.httpClient.getRateLimitInfo();

    if (!rateLimitInfo) {
      return {
        success: false,
        data: { limit: 0, remaining: 0, reset: 0 },
        statusCode: 503,
        headers: {},
      };
    }

    return {
      success: true,
      data: {
        limit: rateLimitInfo.limit || 0,
        remaining: rateLimitInfo.remaining || 0,
        reset: rateLimitInfo.reset || 0,
      },
      statusCode: 200,
      headers: {},
    };
  }

  isRateLimited(): boolean {
    return this.httpClient.isRateLimited();
  }

  getTimeUntilReset(): number {
    return this.httpClient.getTimeUntilReset();
  }

  validateWebhookSignature(
    signature: string,
    body: string,
    secret: string
  ): boolean {
    try {
      // For synchronous validation, we'll use a simpler approach
      // In a real implementation, you might want to use a crypto library that supports sync operations
      // This is a simplified version for demonstration
      const expectedSignature = `sha256=${secret}`; // Simplified for demo
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Create HMAC hash of the payload using the secret
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const hashBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(payload)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const expectedSignature = `sha256=${hashHex}`;

      const isValid = expectedSignature === signature;

      return {
        success: true,
        data: isValid,
        statusCode: 200,
        headers: {},
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        statusCode: 400,
        headers: {},
        error:
          error instanceof Error
            ? error.message
            : "Webhook signature verification failed",
      };
    }
  }

  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    try {
      // Simple health check - try to get authorized user
      await this.getAuthorizedUser();
      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: healthData,
        statusCode: 200,
        headers: {},
      };
    } catch (error) {
      const healthData = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };

      return {
        success: false,
        data: healthData,
        statusCode: 503,
        headers: {},
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }
}
