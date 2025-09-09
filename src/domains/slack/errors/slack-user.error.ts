import { SlackBaseError } from './slack-base.error.js';

/**
 * User-related errors
 */
export class SlackUserError extends SlackBaseError {
  public readonly userId?: string;

  constructor(message: string, userId?: string, details?: Record<string, any>) {
    super(message, 'SLACK_USER_ERROR', details);
    this.userId = userId;
  }
}