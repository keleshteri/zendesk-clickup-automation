/**
 * @type: test
 * @domain: clickup
 * @purpose: Unit tests for ClickUpTaskService
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickUpTaskService } from '../clickup-task.service';
import type { IClickUpClient } from '../../interfaces/clickup-client.interface';
import type {
  ClickUpTask,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../types/task.types';

// Mock ClickUp client
class MockClickUpClient implements IClickUpClient {
  // Authentication & Authorization
  validateToken = vi.fn();
  getAuthorizedUser = vi.fn();
  getAuthorizedTeams = vi.fn();
  healthCheck = vi.fn();
  
  // Task Operations
  getTask = vi.fn();
  getTasks = vi.fn();
  createTask = vi.fn();
  updateTask = vi.fn();
  deleteTask = vi.fn();
  
  // Workspace Operations
  getSpaces = vi.fn();
  getSpace = vi.fn();
  createSpace = vi.fn();
  updateSpace = vi.fn();
  deleteSpace = vi.fn();
  
  // Folder Operations
  getFolders = vi.fn();
  getFolder = vi.fn();
  createFolder = vi.fn();
  updateFolder = vi.fn();
  deleteFolder = vi.fn();
  
  // List Operations
  getLists = vi.fn();
  getFolderlessLists = vi.fn();
  getList = vi.fn();
  createList = vi.fn();
  createFolderlessList = vi.fn();
  updateList = vi.fn();
  deleteList = vi.fn();
  
  // Webhook Operations
  createWebhook = vi.fn();
  getWebhooks = vi.fn();
  updateWebhook = vi.fn();
  deleteWebhook = vi.fn();
  
  // Utility Operations
  validateWebhookSignature = vi.fn();
  getRateLimitInfo = vi.fn();
}

describe('ClickUpTaskService', () => {
  let service: ClickUpTaskService;
  let mockClient: MockClickUpClient;

  beforeEach(() => {
    mockClient = new MockClickUpClient();
    service = new ClickUpTaskService(mockClient);
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
        assignees: [123],
        status: 'to do',
        priority: 'normal',
        due_date: Date.now(),
        tags: ['test'],
      };

      mockClient.getRateLimitInfo.mockResolvedValue({
        success: true,
        data: {
          limit: 100,
          remaining: 50,
          reset: Date.now() + 60000,
        },
        statusCode: 200,
        headers: {},
      });

      const mockTask: ClickUpTask = {
        id: 'task-123',
        name: 'Test Task',
        description: 'Test Description',
        status: {
          id: 'status-1',
          status: 'to do',
          color: '#d3d3d3',
          orderindex: 0,
          type: 'open',
        },
        orderindex: '1',
        date_created: '1640995200000',
        date_updated: '1640995200000',
        date_closed: null,
        date_done: null,
        archived: false,
        creator: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          color: '#ff0000',
          profilePicture: null,
          initials: 'TU',
        },
        assignees: [],
        watchers: [],
        checklists: [],
        tags: [],
        parent: null,
        priority: {
          id: '3',
          priority: 'normal',
          color: '#ffcc00',
        },
        due_date: null,
        start_date: null,
        points: null,
        time_estimate: null,
        time_spent: 0,
        custom_fields: [],
        dependencies: [],
        linked_tasks: [],
        team_id: '456',
        url: 'https://app.clickup.com/t/task-123',
        permission_level: 'create',
        list: {
          id: 'list-123',
          name: 'Test List',
          access: true,
        },
        project: {
          id: 'project-123',
          name: 'Test Project',
          hidden: false,
          access: true,
        },
        folder: {
          id: 'folder-123',
          name: 'Test Folder',
          hidden: false,
          access: true,
        },
        space: {
          id: 'space-123',
        },
      };

      mockClient.createTask.mockResolvedValue({
        success: true,
        data: mockTask,
        statusCode: 200,
        headers: {},
      });

      const result = await service.createTask('list-123', taskData);

      expect(result).toEqual(mockTask);
      expect(mockClient.createTask).toHaveBeenCalledWith('list-123', taskData);
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        name: '', // Invalid: empty name
        description: 'Test Description',
      } as CreateTaskRequest;

      await expect(service.createTask('list-123', invalidTaskData))
        .rejects
        .toThrow('Task name is required');

      expect(mockClient.createTask).not.toHaveBeenCalled();
    });

    it('should validate list ID format', async () => {
      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
      };

      await expect(service.createTask('', taskData))
        .rejects
        .toThrow('List ID is required');

      expect(mockClient.createTask).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
      };

      mockClient.getRateLimitInfo.mockResolvedValue({
        success: true,
        data: {
          limit: 100,
          remaining: 50,
          reset: Date.now() + 60000,
        },
        statusCode: 200,
        headers: {},
      });

      const apiError = new Error('API Error: Insufficient permissions');
      mockClient.createTask.mockRejectedValue(apiError);

      await expect(service.createTask('list-123', taskData))
        .rejects
        .toThrow('Failed to create task: API Error: Insufficient permissions');
    });
  });

  describe('getTask', () => {
    it('should return task when found', async () => {
      const mockTask: ClickUpTask = {
        id: 'task-123',
        name: 'Test Task',
        description: 'Test Description',
        status: {
          id: 'status-1',
          status: 'to do',
          color: '#d3d3d3',
          orderindex: 0,
          type: 'open',
        },
        orderindex: '1',
        date_created: '1640995200000',
        date_updated: '1640995200000',
        date_closed: null,
        date_done: null,
        archived: false,
        creator: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          color: '#ff0000',
          profilePicture: null,
          initials: 'TU',
        },
        assignees: [],
        watchers: [],
        checklists: [],
        tags: [],
        parent: null,
        priority: null,
        due_date: null,
        start_date: null,
        points: null,
        time_estimate: null,
        time_spent: 0,
        custom_fields: [],
        dependencies: [],
        linked_tasks: [],
        team_id: '456',
        url: 'https://app.clickup.com/t/task-123',
        permission_level: 'create',
        list: {
          id: 'list-123',
          name: 'Test List',
          access: true,
        },
        project: {
          id: 'project-123',
          name: 'Test Project',
          hidden: false,
          access: true,
        },
        folder: {
          id: 'folder-123',
          name: 'Test Folder',
          hidden: false,
          access: true,
        },
        space: {
          id: 'space-123',
        },
      };

      mockClient.getTask.mockResolvedValue({
        success: true,
        data: mockTask,
        statusCode: 200,
        headers: {},
      });

      const result = await service.getTaskById('task-123');

      expect(result).toEqual(mockTask);
      expect(mockClient.getTask).toHaveBeenCalledWith('task-123');
    });

    it('should return null when task not found', async () => {
      mockClient.getTask.mockResolvedValue({
        success: true,
        data: null,
        statusCode: 200,
        headers: {},
      });

      const result = await service.getTaskById('nonexistent-task');

      expect(result).toBeNull();
      expect(mockClient.getTask).toHaveBeenCalledWith('nonexistent-task');
    });

    it('should validate task ID', async () => {
      await expect(service.getTaskById(''))
        .rejects
        .toThrow('Task ID is required');

      expect(mockClient.getTask).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const updateData: UpdateTaskRequest = {
        name: 'Updated Task Name',
        description: 'Updated Description',
        status: 'in progress',
        priority: 'high',
      };

      const updatedTask: ClickUpTask = {
        id: 'task-123',
        name: 'Updated Task Name',
        description: 'Updated Description',
        status: {
          id: 'status-2',
          status: 'in progress',
          color: '#ffcc00',
          orderindex: 1,
          type: 'custom',
        },
        orderindex: '1',
        date_created: '1640995200000',
        date_updated: '1640995300000',
        date_closed: null,
        date_done: null,
        archived: false,
        creator: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          color: '#ff0000',
          profilePicture: null,
          initials: 'TU',
        },
        assignees: [],
        watchers: [],
        checklists: [],
        tags: [],
        parent: null,
        priority: {
          id: '2',
          priority: 'high',
          color: '#ff0000',
        },
        due_date: null,
        start_date: null,
        points: null,
        time_estimate: null,
        time_spent: 0,
        custom_fields: [],
        dependencies: [],
        linked_tasks: [],
        team_id: '456',
        url: 'https://app.clickup.com/t/task-123',
        permission_level: 'create',
        list: {
          id: 'list-123',
          name: 'Test List',
          access: true,
        },
        project: {
          id: 'project-123',
          name: 'Test Project',
          hidden: false,
          access: true,
        },
        folder: {
          id: 'folder-123',
          name: 'Test Folder',
          hidden: false,
          access: true,
        },
        space: {
          id: 'space-123',
        },
      };

      mockClient.getRateLimitInfo.mockResolvedValue({
        success: true,
        data: {
          limit: 100,
          remaining: 50,
          reset: Date.now() + 60000,
        },
        statusCode: 200,
        headers: {},
      });

      mockClient.updateTask.mockResolvedValue({
        success: true,
        data: updatedTask,
        statusCode: 200,
        headers: {},
      });

      const result = await service.updateTask('task-123', updateData);

      expect(result).toEqual(updatedTask);
      expect(mockClient.updateTask).toHaveBeenCalledWith('task-123', updateData);
    });

    it('should validate task ID for update', async () => {
      const updateData: UpdateTaskRequest = {
        name: 'Updated Task Name',
      };

      await expect(service.updateTask('', updateData))
        .rejects
        .toThrow('Task ID is required');

      expect(mockClient.updateTask).not.toHaveBeenCalled();
      expect(mockClient.getRateLimitInfo).not.toHaveBeenCalled();
    });

    it('should validate update data is not empty', async () => {
      await expect(service.updateTask('task-123', {}))
        .rejects
        .toThrow('Update data cannot be empty');

      expect(mockClient.updateTask).not.toHaveBeenCalled();
      expect(mockClient.getRateLimitInfo).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockClient.deleteTask.mockResolvedValue(undefined);

      await service.deleteTask('task-123');

      expect(mockClient.deleteTask).toHaveBeenCalledWith('task-123');
    });

    it('should validate task ID for deletion', async () => {
      await expect(service.deleteTask(''))
        .rejects
        .toThrow('Task ID is required');

      expect(mockClient.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('getTasksByList', () => {
    it('should get tasks from a list', async () => {

      const mockTasks: ClickUpTask[] = [
        {
          id: 'task-123',
          name: 'Test Task 1',
          description: 'Description 1',
          status: {
            id: 'status-1',
            status: 'to do',
            color: '#d3d3d3',
            orderindex: 0,
            type: 'open',
          },
          orderindex: '1',
          date_created: '1640995200000',
          date_updated: '1640995200000',
          date_closed: null,
          date_done: null,
          archived: false,
          creator: {
            id: 123,
            username: 'testuser',
            email: 'test@example.com',
            color: '#ff0000',
            profilePicture: null,
            initials: 'TU',
          },
          assignees: [],
          watchers: [],
          checklists: [],
          tags: [],
          parent: null,
          priority: null,
          due_date: null,
          start_date: null,
          points: null,
          time_estimate: null,
          time_spent: 0,
          custom_fields: [],
          dependencies: [],
          linked_tasks: [],
          team_id: '456',
          url: 'https://app.clickup.com/t/task-123',
          permission_level: 'create',
          list: {
            id: 'list-123',
            name: 'Test List',
            access: true,
          },
          project: {
            id: 'project-123',
            name: 'Test Project',
            hidden: false,
            access: true,
          },
          folder: {
            id: 'folder-123',
            name: 'Test Folder',
            hidden: false,
            access: true,
          },
          space: {
            id: 'space-123',
          },
        },
      ];

      mockClient.getTasks.mockResolvedValue({
        success: true,
        data: {
          items: mockTasks,
          totalCount: mockTasks.length,
          hasMore: false,
          nextCursor: null,
        },
        statusCode: 200,
        headers: {},
      });

      const result = await service.getTasksByList('list-123');

      expect(result.items).toEqual(mockTasks);
      expect(mockClient.getTasks).toHaveBeenCalledWith('list-123', undefined);
    });
  });

  describe('getTasksByList', () => {
    it('should get tasks from a specific list', async () => {
      const mockTasks: ClickUpTask[] = [
        {
          id: 'task-123',
          name: 'Task 1',
          description: 'Description 1',
          status: {
            id: 'status-1',
            status: 'to do',
            color: '#d3d3d3',
            orderindex: 0,
            type: 'open',
          },
          orderindex: '1',
          date_created: '1640995200000',
          date_updated: '1640995200000',
          date_closed: null,
          date_done: null,
          archived: false,
          creator: {
            id: 123,
            username: 'testuser',
            email: 'test@example.com',
            color: '#ff0000',
            profilePicture: null,
            initials: 'TU',
          },
          assignees: [],
          watchers: [],
          checklists: [],
          tags: [],
          parent: null,
          priority: null,
          due_date: null,
          start_date: null,
          points: null,
          time_estimate: null,
          time_spent: 0,
          custom_fields: [],
          dependencies: [],
          linked_tasks: [],
          team_id: '456',
          url: 'https://app.clickup.com/t/task-123',
          permission_level: 'create',
          list: {
            id: 'list-123',
            name: 'Test List',
            access: true,
          },
          project: {
            id: 'project-123',
            name: 'Test Project',
            hidden: false,
            access: true,
          },
          folder: {
            id: 'folder-123',
            name: 'Test Folder',
            hidden: false,
            access: true,
          },
          space: {
            id: 'space-123',
          },
        },
      ];

      mockClient.getTasks.mockResolvedValue({
        success: true,
        data: {
          items: mockTasks,
          totalCount: mockTasks.length,
          hasMore: false,
          nextCursor: null,
        },
        statusCode: 200,
        headers: {},
      });

      const result = await service.getTasksByList('list-123');

      expect(result.items).toEqual(mockTasks);
      expect(mockClient.getTasks).toHaveBeenCalledWith('list-123', undefined);
    });

    it('should validate list ID', async () => {
      await expect(service.getTasksByList(''))
        .rejects
        .toThrow('List ID is required');

      expect(mockClient.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should wrap client errors with context', async () => {
      // Mock rate limit info to return not rate limited
      mockClient.getRateLimitInfo.mockResolvedValue({
        success: true,
        data: {
          limit: 100,
          remaining: 50,
          reset: Math.floor(Date.now() / 1000) + 3600,
        },
        statusCode: 200,
        headers: {},
      });
      
      const clientError = new Error('ClickUp API Error');
      mockClient.createTask.mockRejectedValue(clientError);

      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
      };

      await expect(service.createTask('list-123', taskData))
        .rejects
        .toThrow('Failed to create task: ClickUp API Error');
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit info to simulate rate limiting
      const resetTime = Math.floor((Date.now() + 60000) / 1000); // 1 minute from now in seconds
      mockClient.getRateLimitInfo.mockResolvedValue({
        success: true,
        data: {
          limit: 100,
          remaining: 0,
          reset: resetTime,
        },
        statusCode: 200,
        headers: {},
      });

      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
      };

      await expect(service.createTask('list-123', taskData))
        .rejects
        .toThrow('Rate limit exceeded. Please try again in 60 seconds.');
    });
  });
});