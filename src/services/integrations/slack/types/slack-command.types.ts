/**
 * Command parsing type for Slack commands
 * Represents a parsed command from a Slack mention
 */
export type SlackCommand = {
  isCommand: boolean;
  command: string;
  args: string[];
  originalText: string;
};