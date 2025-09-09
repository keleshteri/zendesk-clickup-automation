import { SlackBaseError } from './slack-base.error.js';

/**
 * Rate limiting errors
 */
export class SlackRateLimitError extends SlackBaseError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    super(message, 'SLACK_RATE_LIMIT_ERROR', details);
    this.retryAfter = retryAfter;
  }
}

/**
 * Type guard to check if error is a Slack rate limit error
 */
export function isSlackRateLimitError(error: any): error is SlackRateLimitError {
  return error instanceof SlackRateLimitError;
}