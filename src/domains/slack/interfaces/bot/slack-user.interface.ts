/**
 * Slack user information
 */
export interface SlackUser {
  /** User ID */
  id: string;
  /** Username */
  name: string;
  /** Display name */
  displayName?: string;
  /** User email */
  email?: string;
  /** Whether user is a bot */
  isBot: boolean;
}