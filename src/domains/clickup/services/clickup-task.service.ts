/**
 * @type: service
 * @domain: clickup
 * @implements: IClickUpTaskService
 * @dependencies: [IClickUpClient]
 * @tested: no
 */

import type { IClickUpTaskService } from '../interfaces/clickup-task-service.interface';
import type { IClickUpClient } from '../interfaces/clickup-client.interface';
import type {
  ClickUpTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
  TaskStatus,
  TaskStatusEnum,
  TaskPriority,
  TaskValidationResult,
  TaskSearchFilters,
  TaskBulkOperation,
  TaskBulkResult,
  TaskAnalytics,
} from '../types/task.types';
import type { PaginatedResponse } from '../types/api.types';

import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  TaskQueryParamsSchema,
  TaskPrioritySchema,
  priorityToNumber,
} from '../types/task.types';

/**
 * Task service configuration
 */
export interface TaskServiceConfig {
  readonly defaultListId?: string;
  readonly maxBulkOperations?: number;
  readonly enableValidation?: boolean;
  readonly enableAnalytics?: boolean;
}

/**
 * ClickUp task service implementation
 * Provides business logic for task operations
 */
export class ClickUpTaskService implements IClickUpTaskService {
  private readonly config: Required<TaskServiceConfig>;
  
  constructor(
    private readonly client: IClickUpClient,
    config: TaskServiceConfig = {}
  ) {
    this.config = {
      defaultListId: config.defaultListId || '',
      maxBulkOperations: config.maxBulkOperations || 50,
      enableValidation: config.enableValidation ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
    };
  }
  
  // Core CRUD operations
  async createTask(listId: string, taskData: CreateTaskRequest): Promise<ClickUpTask> {
    if (!listId || listId.trim() === '') {
      throw new Error('List ID is required');
    }

    if (!taskData.name || taskData.name.trim() === '') {
      throw new Error('Task name is required');
    }

    try {
      // Check rate limits before making API call
      const rateLimitInfo = await this.client.getRateLimitInfo();
      if (rateLimitInfo.success && rateLimitInfo.data && rateLimitInfo.data.remaining === 0) {
        const timeUntilReset = Math.ceil((rateLimitInfo.data.reset * 1000 - Date.now()) / 1000);
        throw new Error(`Rate limit exceeded. Please try again in ${timeUntilReset} seconds.`);
      }
      
      if (this.config.enableValidation) {
        const validation = await this.validateTaskData(taskData);
        if (!validation.isValid) {
          throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      const validatedData = CreateTaskRequestSchema.parse(taskData);
      const response = await this.client.createTask(listId, validatedData);
      return response.data!;
    } catch (error: any) {
      // If it's already a rate limit error, re-throw as is
      if (error.message?.includes('Rate limit exceeded')) {
        throw error;
      }
      // Wrap other errors with context
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }
  
  async getTaskById(taskId: string): Promise<ClickUpTask | null> {
    if (!taskId || taskId.trim() === '') {
      throw new Error('Task ID is required');
    }

    try {
      const response = await this.client.getTask(taskId);
      return response.data || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }
  
  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<ClickUpTask> {
    if (!taskId || taskId.trim() === '') {
      throw new Error('Task ID is required');
    }

    if (!taskData || Object.keys(taskData).length === 0) {
      throw new Error('Update data cannot be empty');
    }

    // Check rate limits before making the request
    const rateLimitInfo = await this.client.getRateLimitInfo();
    if (!rateLimitInfo.success || !rateLimitInfo.data) {
      throw new Error('Failed to check rate limits');
    }

    if (rateLimitInfo.data.remaining <= 0) {
      const resetTime = Math.ceil((rateLimitInfo.data.reset - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Please try again in ${resetTime} seconds.`);
    }

    try {
      const validatedData = UpdateTaskRequestSchema.parse(taskData);
      const response = await this.client.updateTask(taskId, validatedData);
      return response.data!;
    } catch (error: any) {
      // Re-throw rate limit errors as is
      if (error.message && error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      // Wrap other errors with context
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }
  
  async deleteTask(taskId: string): Promise<void> {
    if (!taskId || taskId.trim() === '') {
      throw new Error('Task ID is required');
    }

    try {
      await this.client.deleteTask(taskId);
    } catch (error: any) {
      if (error.code === 404) {
        return; // Task already deleted or doesn't exist
      }
      throw error;
    }
  }
  
  async getTasksByList(listId: string, params?: TaskQueryParams): Promise<PaginatedResponse<ClickUpTask>> {
    if (!listId || listId.trim() === '') {
      throw new Error('List ID is required');
    }
    
    const validatedParams = params ? TaskQueryParamsSchema.parse(params) : undefined;
    const response = await this.client.getTasks(listId, validatedParams);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch tasks');
    }
    
    return response.data;
  }
  
  // Status management
  async updateTaskStatus(taskId: string, status: TaskStatusEnum): Promise<ClickUpTask> {
    return await this.updateTask(taskId, { status: status });
  }
  
  async getTasksByStatus(listId: string, status: TaskStatusEnum): Promise<readonly ClickUpTask[]> {
    const result = await this.getTasksByList(listId);
    return result.items.filter(task => task.status?.status === status);
  }
  
  async moveTaskToStatus(taskId: string, fromStatus: TaskStatusEnum, toStatus: TaskStatusEnum): Promise<ClickUpTask> {
    // Verify current status before moving
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status?.status !== fromStatus) {
      throw new Error(
        `Task ${taskId} is not in expected status ${fromStatus}, current status: ${task.status?.status}`
      );
    }
    
    return await this.updateTaskStatus(taskId, toStatus);
  }
  
  // Priority management
  async updateTaskPriority(taskId: string, priority: TaskPriority): Promise<ClickUpTask> {
    const validatedPriority = TaskPrioritySchema.parse(priority);
    const priorityNumber = priorityToNumber(validatedPriority);
    return await this.updateTask(taskId, { priority: priorityNumber });
  }
  
  async getTasksByPriority(listId: string, priority: TaskPriority): Promise<readonly ClickUpTask[]> {
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    return tasks.filter(task => task.priority?.priority === priority);
  }
  
  async getHighPriorityTasks(listId: string): Promise<readonly ClickUpTask[]> {
    return await this.getTasksByPriority(listId, 'urgent');
  }
  
  // Assignment management
  async assignTask(taskId: string, assigneeIds: string[]): Promise<ClickUpTask> {
    if (assigneeIds.length === 0) {
      throw new Error('At least one assignee is required');
    }
    
    const assigneeNumbers = assigneeIds.map(id => parseInt(id, 10));
    return await this.updateTask(taskId, { assignees: assigneeNumbers });
  }
  
  async unassignTask(taskId: string, assigneeIds: readonly string[]): Promise<ClickUpTask> {
    if (assigneeIds && assigneeIds.length > 0) {
      // Remove specific assignees
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      const assigneeNumbers = assigneeIds.map(id => parseInt(id, 10));
      const currentAssignees = task.assignees?.map(a => a.id) || [];
      const remainingAssignees = currentAssignees.filter(id => !assigneeNumbers.includes(id));
      
      return await this.updateTask(taskId, { assignees: remainingAssignees });
    } else {
      // Remove all assignees
      return await this.updateTask(taskId, { assignees: [] });
    }
  }
  
  async getTasksByAssignee(listId: string, assigneeId: string): Promise<readonly ClickUpTask[]> {
    const assigneeNumber = parseInt(assigneeId, 10);
    const result = await this.getTasksByList(listId, { assignees: [assigneeNumber] });
    return result.items;
  }
  
  async reassignTask(taskId: string, fromAssigneeId: string, toAssigneeId: string): Promise<ClickUpTask> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const fromAssigneeIdNum = parseInt(fromAssigneeId, 10);
    const toAssigneeIdNum = parseInt(toAssigneeId, 10);
    
    const currentAssignees = task.assignees?.map(a => a.id) || [];
    if (!currentAssignees.includes(fromAssigneeIdNum)) {
      throw new Error(`Task ${taskId} is not assigned to user ${fromAssigneeId}`);
    }
    
    const updatedAssignees = currentAssignees.map(id => 
      id === fromAssigneeIdNum ? toAssigneeIdNum : id
    );
    
    return await this.updateTask(taskId, { assignees: updatedAssignees });
  }
  
  // Search and filtering
  async searchTasks(listId: string, query: string, filters?: TaskSearchFilters): Promise<readonly ClickUpTask[]> {
    const searchParams: TaskQueryParams = {
      ...(filters?.status && { statuses: filters.status }),
      ...(filters?.assignees && { assignees: filters.assignees }),
      ...(filters?.tags && { tags: filters.tags }),
      ...(filters?.createdFrom && { date_created_gt: filters.createdFrom.getTime() }),
      ...(filters?.createdTo && { date_created_lt: filters.createdTo.getTime() }),
      ...(filters?.dueDateFrom && { due_date_gt: filters.dueDateFrom.getTime() }),
      ...(filters?.dueDateTo && { due_date_lt: filters.dueDateTo.getTime() }),
    };
    
    const result = await this.getTasksByList(listId, searchParams);
    const tasks = result.items;
    
    // Filter by query string (name and description)
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      return tasks.filter(task => 
        task.name.toLowerCase().includes(lowerQuery) ||
        (task.description && task.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    return tasks;
  }
  
  async filterTasks(listId: string, filters: TaskSearchFilters): Promise<readonly ClickUpTask[]> {
    return await this.searchTasks(listId, '', filters);
  }
  
  async getOverdueTasks(listId: string): Promise<readonly ClickUpTask[]> {
    const now = Date.now();
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return parseInt(task.due_date) < now;
    });
  }
  
  async getTasksDueToday(listId: string): Promise<readonly ClickUpTask[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;
    
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseInt(task.due_date);
      return dueDate >= startOfDay && dueDate <= endOfDay;
    });
  }
  
  async getTasksDueSoon(listId: string, daysAhead: number = 7): Promise<readonly ClickUpTask[]> {
    const now = Date.now();
    const futureTime = now + (daysAhead * 24 * 60 * 60 * 1000);
    
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseInt(task.due_date);
      return dueDate > now && dueDate <= futureTime;
    });
  }
  
  async canUserModifyTask(taskId: string, userId: string): Promise<boolean> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        return false;
      }
      
      // Check if user is assigned to the task or is the creator
      const userIdNum = parseInt(userId, 10);
      const isAssigned = task.assignees?.some(assignee => assignee.id === userIdNum);
      const isCreator = task.creator?.id === userIdNum;
      
      return isAssigned || isCreator || false;
    } catch (error) {
      return false;
    }
  }

  // Validation
  async validateTaskData(data: CreateTaskRequest | UpdateTaskRequest): Promise<{ isValid: boolean; errors: readonly string[] }> {
    const errors: string[] = [];
    
    // Validate required fields for CreateTaskRequest
    if ('name' in data) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Task name is required');
      }
      
      if (data.name && data.name.length > 255) {
        errors.push('Task name must be 255 characters or less');
      }
    }
    
    // Validate assignees if provided
    if (data.assignees && data.assignees.length > 10) {
      errors.push('Cannot assign more than 10 users to a task');
    }
    
    // Validate due date if provided
    if (data.due_date) {
      const dueDate = new Date(data.due_date);
      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }


  

  


  // Bulk Operations
  async createMultipleTasks(listId: string, tasks: readonly CreateTaskRequest[]): Promise<readonly ClickUpTask[]> {
    const results: ClickUpTask[] = [];
    
    for (const taskData of tasks) {
      try {
        const task = await this.createTask(listId, taskData);
        results.push(task);
      } catch (error) {
        // Log error but continue with other tasks
        console.error(`Failed to create task: ${taskData.name}`, error);
      }
    }
    
    return results;
  }

  async updateMultipleTasks(updates: readonly { taskId: string; data: UpdateTaskRequest }[]): Promise<readonly ClickUpTask[]> {
    const results: ClickUpTask[] = [];
    
    for (const update of updates) {
      try {
        const task = await this.updateTask(update.taskId, update.data);
        results.push(task);
      } catch (error) {
        // Log error but continue with other tasks
        console.error(`Failed to update task: ${update.taskId}`, error);
      }
    }
    
    return results;
  }

  async deleteMultipleTasks(taskIds: readonly string[]): Promise<void> {
    for (const taskId of taskIds) {
      try {
        await this.deleteTask(taskId);
      } catch (error) {
        // Log error but continue with other tasks
        console.error(`Failed to delete task: ${taskId}`, error);
      }
    }
  }
  
  // Analytics
  async getTaskAnalytics(listId: string): Promise<TaskAnalytics> {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics is disabled');
    }
    
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    
    const analytics: TaskAnalytics = {
      totalTasks: tasks.length,
      tasksByStatus: {},
      tasksByPriority: {},
      tasksByAssignee: {},
      overdueTasks: 0,
      completedTasks: 0,
      averageCompletionTime: 0,
    };
    
    let totalCompletionTime = 0;
    let completedCount = 0;
    const now = Date.now();
    
    tasks.forEach(task => {
      // Status analytics
      const status = task.status?.status || 'unknown';
      analytics.tasksByStatus[status] = (analytics.tasksByStatus[status] || 0) + 1;
      
      // Priority analytics
      const priority = task.priority?.priority?.toString() || 'none';
      analytics.tasksByPriority[priority] = (analytics.tasksByPriority[priority] || 0) + 1;
      
      // Assignee analytics
      task.assignees?.forEach(assignee => {
        analytics.tasksByAssignee[assignee.username] = 
          (analytics.tasksByAssignee[assignee.username] || 0) + 1;
      });
      
      // Overdue tasks
      if (task.due_date && parseInt(task.due_date) < now) {
        analytics.overdueTasks++;
      }
      
      // Completed tasks and completion time
      if (task.status?.status === 'complete' || task.status?.status === 'closed') {
        analytics.completedTasks++;
        
        if (task.date_created && task.date_closed) {
          const completionTime = parseInt(task.date_closed) - parseInt(task.date_created);
          totalCompletionTime += completionTime;
          completedCount++;
        }
      }
    });
    
    // Calculate average completion time in days
    if (completedCount > 0) {
      analytics.averageCompletionTime = Math.round(
        (totalCompletionTime / completedCount) / (1000 * 60 * 60 * 24)
      );
    }
    
    return analytics;
  }
  
  // Task Analytics
  async getTaskCompletionRate(listId: string, dateRange?: { start: Date; end: Date }): Promise<number> {
    const result = await this.getTasksByList(listId);
    let tasks = result.items;
    
    // Filter by date range if provided
    if (dateRange) {
      const startTime = dateRange.start.getTime();
      const endTime = dateRange.end.getTime();
      
      tasks = tasks.filter(task => {
        if (!task.date_created) return false;
        const createdTime = parseInt(task.date_created);
        return createdTime >= startTime && createdTime <= endTime;
      });
    }
    
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => 
      task.status?.status === 'complete' || task.status?.status === 'closed'
    );
    
    return (completedTasks.length / tasks.length) * 100;
  }

  async getAverageTaskCompletionTime(listId: string): Promise<number> {
    const result = await this.getTasksByList(listId);
    const completedTasks = result.items.filter(task => 
      (task.status?.status === 'complete' || task.status?.status === 'closed') &&
      task.date_created && task.date_closed
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalCompletionTime = completedTasks.reduce((sum, task) => {
      const createdTime = parseInt(task.date_created!);
      const closedTime = parseInt(task.date_closed!);
      return sum + (closedTime - createdTime);
    }, 0);
    
    // Return average in hours
    return (totalCompletionTime / completedTasks.length) / (1000 * 60 * 60);
  }

  async getTaskCountByStatus(listId: string): Promise<Record<TaskStatusEnum, number>> {
    const result = await this.getTasksByList(listId);
    const tasks = result.items;
    
    const statusCounts: Record<string, number> = {};
    
    tasks.forEach(task => {
      const status = task.status?.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return statusCounts as Record<TaskStatusEnum, number>;
  }
}