/**
 * @ai-metadata
 * @component: ISlackService
 * @description: Main interface defining the contract for the Slack service orchestrator
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-messaging.interface", "./slack-bot-manager.interface", "./slack-event-handler.interface", "./slack-security.interface", "../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in main Slack service orchestration"
 */

import type { ISlackMessagingService } from './slack-messaging.interface';
import type { ISlackBotManager } from './slack-bot-manager.interface';
import type { ISlackEventHandler } from './slack-event-handler.interface';
import type { ISlackSecurityService } from './slack-security.interface';
import type {
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from '..';
import type { SlackEventType } from '../../types';

/**
 * Main interface for Slack service operations
 * Orchestrates all Slack-related functionality through sub-services
 */
export interface ISlackService {
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
   * Send a message to a Slack channel
   * @param channel - The channel ID
   * @param text - The message text
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves to the message response
   */
  sendMessage(channel: string, text: string, threadTs?: string): Promise<any>;

  /**
   * Send a formatted message with blocks
   * @param channel - The channel ID
   * @param blocks - The message blocks
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves to the message response
   */
  sendFormattedMessage(channel: string, blocks: any[], threadTs?: string): Promise<any>;

  /**
   * Handle app mention events
   * @param event - The app mention event
   * @returns Promise that resolves when handling is complete
   */
  handleMention(event: SlackAppMentionEvent): Promise<void>;

  /**
   * Handle member joined channel events
   * @param event - The member joined event
   * @returns Promise that resolves when handling is complete
   */
  handleMemberJoined(event: SlackMemberJoinedChannelEvent): Promise<void>;

  /**
   * Handle generic Slack events
   * @param event - The Slack event
   * @returns Promise that resolves when handling is complete
   */
  handleEvent(event: SlackEventType): Promise<void>;

  /**
   * Handle bot joined channel events
   * @param channel - The channel ID
   * @returns Promise that resolves when handling is complete
   */
  handleBotJoinedChannel(channel: string): Promise<void>;

  /**
   * Verify Slack request signature
   * @param signature - The request signature
   * @param body - The request body
   * @param timestamp - The request timestamp
   * @returns Promise that resolves to true if valid
   */
  verifyRequest(signature: string, body: string, timestamp: string): Promise<boolean>;

  /**
   * Get service health status
   * @returns Promise that resolves to health status object
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      messaging: boolean;
      botManager: boolean;
      eventHandler: boolean;
      security: boolean;
    };
    timestamp: string;
  }>;
}