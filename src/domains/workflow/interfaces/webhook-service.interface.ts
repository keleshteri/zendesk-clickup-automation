/**
 * @type: interface
 * @domain: workflow
 * @purpose: Webhook service contract for managing webhook registrations
 * @solid-principle: ISP - Interface segregation for webhook management
 */

import type { WebhookRegistration, WebhookConfig } from '../types/webhook.types';

/**
 * Contract for managing webhook registrations and configurations
 */
export interface IWebhookService {
  /**
   * Registers a new webhook with external service
   * @param config - Webhook configuration
   * @returns Promise resolving to webhook registration details
   */
  registerWebhook(config: WebhookConfig): Promise<WebhookRegistration>;

  /**
   * Unregisters an existing webhook
   * @param webhookId - Unique identifier for the webhook
   * @returns Promise resolving to unregistration success
   */
  unregisterWebhook(webhookId: string): Promise<boolean>;

  /**
   * Updates webhook configuration
   * @param webhookId - Unique identifier for the webhook
   * @param config - Updated webhook configuration
   * @returns Promise resolving to updated registration
   */
  updateWebhook(webhookId: string, config: Partial<WebhookConfig>): Promise<WebhookRegistration>;

  /**
   * Gets webhook registration details
   * @param webhookId - Unique identifier for the webhook
   * @returns Promise resolving to webhook registration or null
   */
  getWebhook(webhookId: string): Promise<WebhookRegistration | null>;

  /**
   * Lists all registered webhooks
   * @returns Promise resolving to array of webhook registrations
   */
  listWebhooks(): Promise<readonly WebhookRegistration[]>;

  /**
   * Validates webhook configuration
   * @param config - Webhook configuration to validate
   * @returns Promise resolving to validation result
   */
  validateConfig(config: WebhookConfig): Promise<boolean>;
}

/**
 * Contract for Zendesk webhook service
 */
export interface IZendeskWebhookService extends IWebhookService {
  /**
   * Registers webhook for Zendesk ticket events
   * @param events - Array of ticket events to listen for
   * @param endpoint - Webhook endpoint URL
   * @returns Promise resolving to webhook registration
   */
  registerTicketWebhook(events: readonly string[], endpoint: string): Promise<WebhookRegistration>;

  /**
   * Gets Zendesk webhook authentication headers
   * @returns Authentication headers for Zendesk webhooks
   */
  getAuthHeaders(): Record<string, string>;
}

/**
 * Contract for ClickUp webhook service
 */
export interface IClickUpWebhookService extends IWebhookService {
  /**
   * Registers webhook for ClickUp task events in specific space
   * @param spaceId - ClickUp space identifier
   * @param events - Array of task events to listen for
   * @param endpoint - Webhook endpoint URL
   * @returns Promise resolving to webhook registration
   */
  registerTaskWebhook(spaceId: string, events: readonly string[], endpoint: string): Promise<WebhookRegistration>;

  /**
   * Registers webhook for ClickUp list events
   * @param listId - ClickUp list identifier
   * @param events - Array of list events to listen for
   * @param endpoint - Webhook endpoint URL
   * @returns Promise resolving to webhook registration
   */
  registerListWebhook(listId: string, events: readonly string[], endpoint: string): Promise<WebhookRegistration>;

  /**
   * Gets ClickUp webhook secret for signature validation
   * @param webhookId - Webhook identifier
   * @returns Promise resolving to webhook secret
   */
  getWebhookSecret(webhookId: string): Promise<string | null>;
}