import type { Block, KnownBlock } from './message-options.interface';

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