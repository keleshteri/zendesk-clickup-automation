import { SlackBaseError } from './slack-base.error.js';

/**
 * Bot initialization errors
 */
export class SlackBotError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_BOT_ERROR', details);
  }
}