/**
 * Message reaction options
 */
export interface MessageReactionOptions {
  /** Channel ID */
  channel: string;
  /** Message timestamp */
  timestamp: string;
  /** Reaction name (without colons) */
  name: string;
}