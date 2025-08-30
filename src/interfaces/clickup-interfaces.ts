/**
 * @ai-metadata
 * @component: ClickUpInterfaces
 * @description: TypeScript interfaces for ClickUp service domain
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/clickup-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../services/integrations/clickup/interfaces/index.ts", "./zendesk-interfaces.ts", "../types/index.ts"]
 * @tests: ["./tests/clickup-interfaces.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "ClickUp service interfaces for task management and API integration"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { ClickUpTask, UserOAuthData } from '../services/integrations/clickup/interfaces';
import { ZendeskTicket } from './zendesk-interfaces';
import { TicketAnalysis } from '../types';

/**
 * Interface for ClickUp Service
 * Provides integration with ClickUp API for task management
 */
export interface IClickUpService {
  /**
   * Create a ClickUp task from a Zendesk ticket
   * @param ticket - The Zendesk ticket to convert
   * @param analysis - Optional ticket analysis for enhanced task creation
   * @returns Promise resolving to created task or null if failed
   */
  createTaskFromTicket(ticket: ZendeskTicket, analysis?: TicketAnalysis): Promise<ClickUpTask | null>;

  /**
   * Get a specific task by ID
   * @param taskId - The task ID to retrieve
   * @returns Promise resolving to the task or null if not found
   */
  getTask(taskId: string): Promise<ClickUpTask | null>;

  /**
   * Update a task with new data
   * @param taskId - The task ID to update
   * @param updates - Partial task data to update
   * @returns Promise resolving to true if successful
   */
  updateTask(taskId: string, updates: Partial<ClickUpTask>): Promise<boolean>;

  /**
   * Get current user information
   * @returns Promise resolving to user data
   */
  getCurrentUser(): Promise<any>;

  /**
   * Set OAuth data for authenticated requests
   * @param oauthData - OAuth data or null to clear
   */
  setOAuthData(oauthData: UserOAuthData | null): void;

  /**
   * Check if service has valid authentication
   * @returns True if authentication is available
   */
  hasValidAuth(): boolean;

  /**
   * Get authorization header for API requests
   * @returns The authorization header value
   */
  getAuthHeader(): string;

  /**
   * Search tasks based on query
   * @param query - Search query string
   * @returns Promise resolving to array of matching tasks
   */
  searchTasks?(query: string): Promise<ClickUpTask[]>;

  /**
   * Create a new task
   * @param taskData - Task data for creation
   * @returns Promise resolving to created task
   */
  createTask?(taskData: any): Promise<ClickUpTask | null>;
}

/**
 * Type guard to check if an object implements IClickUpService
 */
export function isClickUpService(service: any): service is IClickUpService {
  return service && 
    typeof service.createTaskFromTicket === 'function' &&
    typeof service.getCurrentUser === 'function' &&
    typeof service.hasValidAuth === 'function';
}

// Re-export ClickUp types for convenience
export { ClickUpTask, UserOAuthData };