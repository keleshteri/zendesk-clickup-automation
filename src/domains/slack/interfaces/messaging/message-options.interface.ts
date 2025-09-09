// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;

/**
 * Base message options
 */
export interface MessageOptions {
  /** Channel ID or name */
  channel: string;
  /** Message text */
  text?: string;
  /** Message blocks */
  blocks?: (KnownBlock | Block)[];
  /** Message attachments */
  attachments?: any[];
  /** Thread timestamp for replies */
  threadTimestamp?: string;
  /** Whether to reply in broadcast */
  replyBroadcast?: boolean;
  /** Whether to unfurl links */
  unfurlLinks?: boolean;
  /** Whether to unfurl media */
  unfurlMedia?: boolean;
  /** Custom icon emoji */
  iconEmoji?: string;
  /** Custom icon URL */
  iconUrl?: string;
  /** Custom username */
  username?: string;
  /** Whether message is markdown */
  mrkdwn?: boolean;
}

/**
 * Direct message options
 */
export interface DirectMessageOptions {
  /** User ID to send message to */
  userId: string;
  /** Message text */
  text?: string;
  /** Message blocks */
  blocks?: (KnownBlock | Block)[];
  /** Message attachments */
  attachments?: any[];
  /** Whether to unfurl links */
  unfurlLinks?: boolean;
  /** Whether to unfurl media */
  unfurlMedia?: boolean;
  /** Whether message is markdown */
  mrkdwn?: boolean;
}

/**
 * Message update options
 */
export interface MessageUpdateOptions {
  /** Channel ID */
  channel: string;
  /** Message timestamp */
  timestamp: string;
  /** New message text */
  text?: string;
  /** New message blocks */
  blocks?: (KnownBlock | Block)[];
  /** New message attachments */
  attachments?: any[];
  /** Whether message is markdown */
  mrkdwn?: boolean;
}

/**
 * Message delete options
 */
export interface MessageDeleteOptions {
  /** Channel ID */
  channel: string;
  /** Message timestamp */
  timestamp: string;
}

/**
 * Ephemeral message options
 */
export interface EphemeralMessageOptions {
  /** Channel ID */
  channel: string;
  /** User ID to show message to */
  user: string;
  /** Message text */
  text?: string;
  /** Message blocks */
  blocks?: (KnownBlock | Block)[];
  /** Message attachments */
  attachments?: any[];
  /** Thread timestamp */
  threadTimestamp?: string;
  /** Whether message is markdown */
  mrkdwn?: boolean;
}

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