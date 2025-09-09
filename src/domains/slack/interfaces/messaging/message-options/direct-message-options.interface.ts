import type { Block, KnownBlock } from './message-options.interface';

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