/**
 * @ai-metadata
 * @component: ISlackServiceOrchestrator
 * @description: Core orchestrator interface following ISP - only handles service coordination and initialization
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-messaging.interface", "./slack-bot-manager.interface", "./slack-event-handler.interface", "./slack-security.interface"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Focused interface for service orchestration following ISP principles"
 */

import type { ISlackMessagingService } from './slack-messaging.interface';
import type { ISlackBotManager } from './slack-bot-manager.interface';
import type { ISlackEventHandler } from './slack-event-handler.interface';
import type { ISlackSecurityService } from './slack-security.interface';
import type { WebClient } from '@slack/web-api';
import type { IExternalServices } from '../../../../../interfaces/service-interfaces';

/**
 * Core orchestrator interface for Slack service coordination
 * Follows ISP by focusing only on service management and initialization
 */
export interface ISlackServiceOrchestrator {
  /**
   * Initialize the Slack service and all sub-services
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Get the messaging service instance
   * @returns The messaging service
   */
  getMessagingService(): ISlackMessagingService;

  /**
   * Get the bot manager instance
   * @returns The bot manager
   */
  getBotManager(): ISlackBotManager;

  /**
   * Get the event handler instance
   * @returns The event handler
   */
  getEventHandler(): ISlackEventHandler;

  /**
   * Get the security service instance
   * @returns The security service
   */
  getSecurityService(): ISlackSecurityService;

  /**
   * Check if the service is properly initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;

  /**
   * Get the bot user ID
   * @returns The bot user ID or undefined if not set
   */
  getBotUserId(): string | undefined;

  /**
   * Set external services for all sub-services that need them
   * @param services - External services object
   */
  setExternalServices(services: IExternalServices): void;

  /**
   * Wait for initialization to complete with timeout
   * @param timeoutMs - Timeout in milliseconds (default: 30000)
   * @returns Promise that resolves when initialization is complete
   */
  waitForInitialization(timeoutMs?: number): Promise<void>;

  /**
   * Get the Slack WebClient instance
   * @returns The WebClient instance
   */
  getClient(): WebClient;
}