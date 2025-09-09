import { SlackBaseError } from './slack-base.error.js';

/**
 * Channel-related errors
 */
export class SlackChannelError extends SlackBaseError {
  public readonly channelId?: string;

  constructor(message: string, channelId?: string, details?: Record<string, any>) {
    super(message, 'SLACK_CHANNEL_ERROR', details);
    this.channelId = channelId;
  }
}