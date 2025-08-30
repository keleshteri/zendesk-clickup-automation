/**
 * @ai-metadata
 * @component: SlackCommandTypes
 * @description: Type definitions for Slack command parsing and processing
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 */

/**
 * Command parsing type for Slack commands
 * Represents a parsed command from a Slack mention
 */
export type SlackCommand = {
  isCommand: boolean;
  command: string;
  args: string[];
  originalText: string;
  type?: string;
  ticketId?: string;
  searchQuery?: string;
};