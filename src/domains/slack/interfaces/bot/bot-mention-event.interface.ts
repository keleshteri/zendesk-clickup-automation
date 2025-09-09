import type { SlackUser } from './slack-user.interface.js';
import type { SlackChannel } from './slack-channel.interface.js';

/**
 * Bot mention event data
 */
export interface BotMentionEvent {
  /** Message text */
  text: string;
  /** User who mentioned the bot */
  user: SlackUser;
  /** Channel where mention occurred */
  channel: SlackChannel;
  /** Message timestamp */
  timestamp: string;
  /** Thread timestamp if in thread */
  threadTimestamp?: string;
}