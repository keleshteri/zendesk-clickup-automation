// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;

/**
 * Base message options
 */
export interface MessageOptions {
  /** Channel ID */
  channel: string;
  /** Message text */
  text?: string;
  /** Message blocks */
  blocks?: (KnownBlock | Block)[];
  /** Message attachments */
  attachments?: any[];
  /** Thread timestamp for replies */
  threadTimestamp?: string;
  /** Whether to reply in thread and broadcast to channel */
  replyBroadcast?: boolean;
  /** Whether to unfurl links */
  unfurlLinks?: boolean;
  /** Whether to unfurl media */
  unfurlMedia?: boolean;
  /** Icon emoji */
  iconEmoji?: string;
  /** Icon URL */
  iconUrl?: string;
  /** Username */
  username?: string;
  /** Whether message is markdown */
  mrkdwn?: boolean;
  /** Parse mode */
  parse?: 'full' | 'none';
  /** Whether to link names */
  linkNames?: boolean;
}

// Export shared types for other interfaces
export type { Block, KnownBlock };