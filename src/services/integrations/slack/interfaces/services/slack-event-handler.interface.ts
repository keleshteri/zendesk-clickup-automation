/**
 * @ai-metadata
 * @component: ISlackEventHandler
 * @description: Interface defining the contract for Slack event handling operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../interfaces", "../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in Slack event handling"
 */

import type {
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from '..';
import type { SlackEventType } from '../../types';
import type { IExternalServices } from '../../../../../interfaces/service-interfaces';

/**
 * Interface for Slack event handler operations
 * Defines the contract for handling various Slack events
 */
export interface ISlackEventHandler {
  /**
   * Set the bot user ID for event processing
   * @param botUserId - The Slack bot user ID
   */
  setBotUserId(botUserId: string): void;

  /**
   * Handle app mention events
   * @param event - The Slack app mention event
   * @returns Promise that resolves when handling is complete
   */
  handleMention(event: SlackAppMentionEvent): Promise<void>;

  /**
   * Handle member joined channel events
   * @param event - The Slack member joined channel event
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
   * Handle status request commands
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param ticketId - The ticket ID to get status for
   * @returns Promise that resolves when handling is complete
   */
  handleStatusRequest(channel: string, threadTs: string, ticketId: string): Promise<void>;

  /**
   * Handle summarize request commands
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param ticketId - The ticket ID to summarize
   * @returns Promise that resolves when handling is complete
   */
  handleSummarizeRequest(channel: string, threadTs: string, ticketId: string): Promise<void>;

  /**
   * Handle list tickets request commands
   * @param channel - The channel ID
   * @param user - The user ID making the request
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when handling is complete
   */
  handleListTicketsRequest(channel: string, user: string, threadTs?: string): Promise<void>;

  /**
   * Handle analytics request commands
   * @param channel - The channel ID
   * @param user - The user ID making the request
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when handling is complete
   */
  handleAnalyticsRequest(channel: string, user: string, threadTs?: string): Promise<void>;

  /**
   * Set external services for the event handler
   * @param services - External services object
   */
  setServices(services: IExternalServices): void;
}