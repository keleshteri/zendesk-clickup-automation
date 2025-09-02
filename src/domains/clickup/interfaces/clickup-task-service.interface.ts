/**
 * @type: interface
 * @domain: clickup
 * @purpose: Task service contract with business logic
 * @solid-principle: SRP, ISP
 */

import type {
  ClickUpTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
  TaskStatus,
  TaskStatusEnum,
  TaskPriority,
} from '../types/task.types';
import type {
  ApiResponse,
  PaginatedResponse,
} from '../types/api.types';

/**
 * Task service interface with business logic
 * Focuses on task-specific operations and validation
 * Follows SRP by handling only task-related business logic
 */
export interface IClickUpTaskService {
  // Core Task Operations
  getTaskById(taskId: string): Promise<ClickUpTask | null>;
  getTasksByList(listId: string, params?: TaskQueryParams): Promise<PaginatedResponse<ClickUpTask>>;
  createTask(listId: string, data: CreateTaskRequest): Promise<ClickUpTask>;
  updateTask(taskId: string, data: UpdateTaskRequest): Promise<ClickUpTask>;
  deleteTask(taskId: string): Promise<void>;
  
  // Task Status Management
  updateTaskStatus(taskId: string, status: TaskStatusEnum): Promise<ClickUpTask>;
  getTasksByStatus(listId: string, status: TaskStatusEnum): Promise<readonly ClickUpTask[]>;
  
  // Task Priority Management
  updateTaskPriority(taskId: string, priority: TaskPriority): Promise<ClickUpTask>;
  getTasksByPriority(listId: string, priority: TaskPriority): Promise<readonly ClickUpTask[]>;
  
  // Task Assignment
  assignTask(taskId: string, assigneeIds: readonly string[]): Promise<ClickUpTask>;
  unassignTask(taskId: string, assigneeIds: readonly string[]): Promise<ClickUpTask>;
  getTasksByAssignee(listId: string, assigneeId: string): Promise<readonly ClickUpTask[]>;
  
  // Task Search and Filtering
  searchTasks(listId: string, query: string): Promise<readonly ClickUpTask[]>;
  getOverdueTasks(listId: string): Promise<readonly ClickUpTask[]>;
  getTasksDueToday(listId: string): Promise<readonly ClickUpTask[]>;
  getTasksDueSoon(listId: string, daysAhead?: number): Promise<readonly ClickUpTask[]>;
  
  // Task Validation
  validateTaskData(data: CreateTaskRequest | UpdateTaskRequest): Promise<{ isValid: boolean; errors: readonly string[] }>;
  canUserModifyTask(taskId: string, userId: string): Promise<boolean>;
  
  // Bulk Operations
  createMultipleTasks(listId: string, tasks: readonly CreateTaskRequest[]): Promise<readonly ClickUpTask[]>;
  updateMultipleTasks(updates: readonly { taskId: string; data: UpdateTaskRequest }[]): Promise<readonly ClickUpTask[]>;
  deleteMultipleTasks(taskIds: readonly string[]): Promise<void>;
  
  // Task Analytics
  getTaskCompletionRate(listId: string, dateRange?: { start: Date; end: Date }): Promise<number>;
  getAverageTaskCompletionTime(listId: string): Promise<number>; // in hours
  getTaskCountByStatus(listId: string): Promise<Record<TaskStatusEnum, number>>;
}