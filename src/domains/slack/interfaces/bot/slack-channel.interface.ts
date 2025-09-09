/**
 * Slack channel information
 */
export interface SlackChannel {
  /** Channel ID */
  id: string;
  /** Channel name */
  name: string;
  /** Channel type (public, private, dm, etc.) */
  type: string;
  /** Whether the bot is a member */
  isMember: boolean;
}