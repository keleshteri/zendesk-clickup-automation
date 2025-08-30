/**
 * @ai-metadata
 * @component: ISlackCommandHandler
 * @description: Interface for handling Slack commands following ISP and SRP
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../types"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Segregated interface for command handling following ISP principles"
 */

import type { SlackCommand } from '../../types';

/**
 * Interface for Slack command handling operations
 * Follows ISP by focusing only on command processing
 */
export interface ISlackCommandHandler {
  /**
   * Parse a Slack command from text
   * @param text - The text to parse
   * @returns Parsed command object
   */
  parseCommand(text: string): SlackCommand;

  /**
   * Handle a parsed Slack command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param command - The parsed command
   * @param user - The user ID who issued the command
   * @returns Promise that resolves when command is handled
   */
  handleCommand(channel: string, threadTs: string, command: SlackCommand, user: string): Promise<void>;

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
   * Handle search tickets request commands
   * @param channel - The channel ID
   * @param searchQuery - The search query
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when handling is complete
   */
  handleSearchTicketsRequest(channel: string, searchQuery: string, threadTs?: string): Promise<void>;

  /**
   * Handle analytics request commands
   * @param channel - The channel ID
   * @param user - The user ID making the request
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when handling is complete
   */
  handleAnalyticsRequest(channel: string, user: string, threadTs?: string): Promise<void>;
}