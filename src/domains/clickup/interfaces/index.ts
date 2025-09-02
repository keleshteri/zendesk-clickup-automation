/**
 * @type: interface
 * @domain: clickup
 * @purpose: Export all ClickUp domain interfaces
 * @solid-principle: ISP
 */

// OAuth interfaces
export type { IClickUpOAuthService } from './clickup-oauth.interface';
export type { IClickUpAuthClient } from './clickup-auth-client.interface';

// API client interfaces
export type { IClickUpClient } from './clickup-client.interface';
export type { IClickUpTaskService } from './clickup-task-service.interface';
export type { IClickUpSpaceService } from './clickup-space-service.interface';