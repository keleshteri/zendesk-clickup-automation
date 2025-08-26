/**
 * @ai-metadata
 * @component: ISlackMessagingService
 * @description: Interface defining the contract for Slack messaging operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../../../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in Slack services"
 */

import type { SlackEmojiService } from '../../slack-service/slack-emoji.service';

/**
 * Interface for Slack messaging service operations
 * Defines the contract for all messaging-related functionality
 */
export interface ISlackMessagingService {
  /**
   * Send a message to a Slack channel
   * @param channel - The channel ID to send the message to
   * @param text - The message text content
   * @param threadTs - Optional thread timestamp for threaded replies
   * @returns Promise that resolves to the sent message object
   */
  sendMessage(channel: string, text: string, threadTs?: string): Promise<any>;

  /**
   * Send an intelligent notification with ticket data
   * @param channel - The channel ID to send the notification to
   * @param ticketData - The ticket data to include in the notification
   * @param context - Additional context for the notification
   * @returns Promise that resolves to the sent message object
   */
  sendIntelligentNotification(
    channel: string,
    ticketData: any,
    context?: { isUpdate?: boolean; previousData?: any }
  ): Promise<any>;

  /**
   * Send a task creation message
   * @param channel - The channel ID to send the message to
   * @param ticketData - The ticket data
   * @param taskData - The task data
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves to the sent message object
   */
  sendTaskCreationMessage(
    channel: string,
    ticketData: any,
    taskData: any,
    threadTs?: string
  ): Promise<any>;

  /**
   * Send a threaded AI analysis message
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param analysis - The analysis content
   * @returns Promise that resolves to the sent message object
   */
  sendThreadedAIAnalysis(
    channel: string,
    threadTs: string,
    analysis: string
  ): Promise<any>;

  /**
   * Send threaded team mentions
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param mentions - Array of user mentions
   * @param enhancedMessage - The enhanced message content
   * @param timeline - Optional timeline information
   * @param nextSteps - Optional next steps array
   * @returns Promise that resolves to the sent message object
   */
  sendThreadedTeamMentions(
    channel: string,
    threadTs: string,
    mentions: string[],
    enhancedMessage: string,
    timeline?: string,
    nextSteps?: string[]
  ): Promise<any>;

  /**
   * Send a threaded message
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param text - The message text
   * @param blocks - Optional message blocks
   * @returns Promise that resolves to the sent message object
   */
  sendThreadedMessage(
    channel: string,
    threadTs: string,
    text: string,
    blocks?: any[]
  ): Promise<any>;

  /**
   * Send bot introduction message
   * @param channel - The channel ID to send the intro message to
   * @returns Promise that resolves when message is sent
   */
  sendBotIntroMessage(channel: string): Promise<void>;

  /**
   * Send user welcome message
   * @param channel - The channel ID
   * @param userId - The user ID to welcome
   * @returns Promise that resolves when message is sent
   */
  sendUserWelcomeMessage(channel: string, userId: string): Promise<void>;

  /**
   * Get category emoji for a given category
   * @param category - The category name
   * @returns The emoji string for the category
   */
  getCategoryEmoji(category: string): string;

  /**
   * Get priority emoji for a given priority
   * @param priority - The priority level
   * @returns The emoji string for the priority
   */
  getPriorityEmoji(priority: string): string;

  /**
   * Get the help message content
   * @returns The help message string
   */
  getHelpMessage(): string;

  /**
   * Get the emoji service instance
   * @returns The SlackEmojiService instance
   */
  getEmojiService(): SlackEmojiService;
}