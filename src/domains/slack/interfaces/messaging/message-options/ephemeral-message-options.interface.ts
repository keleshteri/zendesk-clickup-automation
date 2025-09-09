import type { Block, KnownBlock } from './message-options.interface';

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