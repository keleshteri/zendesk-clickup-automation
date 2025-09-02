/**
 * @type: test
 * @domain: clickup
 * @purpose: Unit tests for ClickUpClient
 * @framework: Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickUpClient } from '../clickup-client.service';
import type { ClickUpHttpClientConfig } from '../../types/http.types';
import type { ClickUpTask, CreateTaskRequest } from '../../types/task.types';
import type { ClickUpSpace } from '../../types/workspace.types';
import type { ClickUpUser } from '../../types/user.types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('ClickUpClient', () => {
  let client: ClickUpClient;
  let config: ClickUpHttpClientConfig;

  beforeEach(() => {
    mockFetch.mockClear();
    
    config = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.clickup.com/api/v2',
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      userAgent: 'ClickUp-Integration/1.0',
    };
    
    client = new ClickUpClient(config);
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockUser = {
        id: 123,
        username: 'testuser',
        email: 'test@example.com',
        color: '#ff0000',
        profilePicture: null,
        initials: 'TU',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ user: mockUser }),
      } as Response);

      const result = await client.validateToken();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.clickup.com/api/v2/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should return false for invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      const result = await client.validateToken();

      expect(result).toBe(false);
    });
  });

  describe('getAuthorizedUser', () => {
    it('should return user information', async () => {
      const mockUser: ClickUpUser = {
        id: 123,
        username: 'testuser',
        email: 'test@example.com',
        color: '#ff0000',
        profilePicture: null,
        initials: 'TU',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ user: mockUser }),
      } as Response);

      const result = await client.getAuthorizedUser();

      expect(result).toEqual(mockUser);
    });

    it('should throw error for failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      await expect(client.getAuthorizedUser())
        .rejects
        .toThrow();
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskData: CreateTaskRequest = {
        name: 'Test Task',
        description: 'Test Description',
        assignees: [123],
        status: 'to do',
        priority: 'normal',
        due_date: Date.now(),
        start_date: Date.now(),
        tags: ['test'],
      };

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockTask),
      } as Response);

      const result = await client.createTask('list-123', taskData);

      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.clickup.com/api/v2/list/list-123/task',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'test-api-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(taskData),
        })
      );
    });

    it('should handle validation errors', async () => {
      const invalidTaskData = {
        name: '', // Invalid: empty name
      } as CreateTaskRequest;

      await expect(client.createTask('list-123', invalidTaskData))
        .rejects
        .toThrow('Task name is required');
    });
  });

  describe('getSpaces', () => {
    it('should return list of spaces', async () => {
      const mockSpaces: ClickUpSpace[] = [
        {
          id: 'space-123',
          name: 'Test Space',
          private: false,
          statuses: [],
          multiple_assignees: true,
          features: {
            due_dates: {
              enabled: true,
              start_date: false,
              remap_due_dates: false,
              remap_closed_due_date: false,
            },
            time_tracking: {
              enabled: true,
            },
            tags: {
              enabled: true,
            },
            time_estimates: {
              enabled: false,
            },
            checklists: {
              enabled: true,
            },
            custom_fields: {
              enabled: true,
            },
            remap_dependencies: {
              enabled: false,
            },
            dependency_warning: {
              enabled: false,
            },
            portfolios: {
              enabled: false,
            },
          },
          archived: false,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ spaces: mockSpaces }),
      } as Response);

      const result = await client.getSpaces('team-123');

      expect(result).toEqual(mockSpaces);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.clickup.com/api/v2/team/team-123/space',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit information', async () => {
      const headers = new Headers({
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
        'x-ratelimit-reset': '1640995200',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers,
        json: () => Promise.resolve({ user: {} }),
      } as Response);

      await client.getAuthorizedUser();

      const rateLimitInfo = client.getRateLimitInfo();
      expect(rateLimitInfo).toEqual({
        limit: 100,
        remaining: 99,
        reset: 1640995200,
        resetTime: new Date(1640995200 * 1000),
      });
    });

    it('should detect rate limiting', async () => {
      const headers = new Headers({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers,
        json: () => Promise.resolve({ user: {} }),
      } as Response);

      await client.getAuthorizedUser();

      const rateLimitInfo = await client.getRateLimitInfo();
      expect(rateLimitInfo.data?.remaining).toBe(0);
      expect(rateLimitInfo.data?.reset).toBeGreaterThan(Date.now());
    });
  });

  describe('error handling', () => {
    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({ user: {} }),
        } as Response);

      await client.getAuthorizedUser();

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.getAuthorizedUser())
        .rejects
        .toThrow('Network error');

      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});