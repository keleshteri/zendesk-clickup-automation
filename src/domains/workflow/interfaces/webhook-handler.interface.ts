/**
 * @type: interface
 * @domain: workflow
 * @purpose: Webhook handler contract for processing incoming webhooks
 * @solid-principle: ISP - Interface segregation for specific webhook handling
 */

import type { WebhookEvent } from '../types/webhook.types';
import type { WorkflowResult } from '../types/workflow.types';

/**
 * Contract for handling webhook events from external services
 */
export interface IWebhookHandler {
  /**
   * Handles incoming webhook events
   * @param event - The webhook event to process
   * @returns Promise resolving to workflow execution result
   */
  handleWebhook(event: WebhookEvent): Promise<WorkflowResult>;

  /**
   * Validates webhook signature/authenticity
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature header
   * @returns Promise resolving to validation result
   */
  validateWebhook(payload: string, signature: string): Promise<boolean>;

  /**
   * Gets the webhook event types this handler supports
   * @returns Array of supported event types
   */
  getSupportedEvents(): readonly string[];
}

/**
 * Contract for Zendesk-specific webhook handling
 */
export interface IZendeskWebhookHandler extends IWebhookHandler {
  /**
   * Handles Zendesk ticket creation events
   * @param ticketData - Zendesk ticket data from webhook
   * @returns Promise resolving to workflow result
   */
  handleTicketCreated(ticketData: unknown): Promise<WorkflowResult>;

  /**
   * Handles Zendesk ticket update events
   * @param ticketData - Updated Zendesk ticket data
   * @returns Promise resolving to workflow result
   */
  handleTicketUpdated(ticketData: unknown): Promise<WorkflowResult>;
}

/**
 * Contract for ClickUp-specific webhook handling
 */
export interface IClickUpWebhookHandler extends IWebhookHandler {
  /**
   * Handles ClickUp task creation events
   * @param taskData - ClickUp task data from webhook
   * @returns Promise resolving to workflow result
   */
  handleTaskCreated(taskData: unknown): Promise<WorkflowResult>;

  /**
   * Handles ClickUp task update events
   * @param taskData - Updated ClickUp task data
   * @returns Promise resolving to workflow result
   */
  handleTaskUpdated(taskData: unknown): Promise<WorkflowResult>;

  /**
   * Handles ClickUp task status change events
   * @param taskData - ClickUp task data with status change
   * @returns Promise resolving to workflow result
   */
  handleTaskStatusChanged(taskData: unknown): Promise<WorkflowResult>;
}