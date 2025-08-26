/**
 * @ai-metadata
 * @component: ISlackBotManager
 * @description: Interface defining the contract for Slack bot management operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in Slack bot management"
 */

import type { BotJoinTracker } from '../../types';

/**
 * Interface for Slack bot manager operations
 * Defines the contract for bot join tracking and channel management
 */
export interface ISlackBotManager {
  /**
   * Set the bot user ID for tracking purposes
   * @param botUserId - The Slack bot user ID
   */
  setBotUserId(botUserId: string): void;

  /**
   * Handle bot joined channel event
   * @param channel - The channel ID where the bot was added
   * @returns Promise that resolves when handling is complete
   */
  handleBotJoinedChannel(channel: string): Promise<void>;

  /**
   * Reset channel tracking data
   * @param channelId - Optional specific channel ID to reset, if not provided resets all
   * @returns Promise that resolves when reset is complete
   */
  resetChannelTracking(channelId?: string): Promise<void>;

  /**
   * Get the current bot join tracker data
   * @returns The bot join tracker object
   */
  getBotJoinTracker(): BotJoinTracker;
}