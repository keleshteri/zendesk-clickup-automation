import type { SlackChannel } from './slack-channel.interface.js';
import type { SlackUser } from './slack-user.interface.js';

/**
 * Welcome message context
 */
export interface WelcomeMessageContext {
  /** Channel where bot was invited */
  channel: SlackChannel;
  /** User who invited the bot */
  invitedBy?: SlackUser;
  /** Invitation timestamp */
  timestamp: string;
}