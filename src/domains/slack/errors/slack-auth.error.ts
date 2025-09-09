import { SlackBaseError } from './slack-base.error.js';

/**
 * Authentication and authorization errors
 */
export class SlackAuthError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_AUTH_ERROR', details);
  }
}

/**
 * Type guard to check if error is a Slack auth error
 */
export function isSlackAuthError(error: any): error is SlackAuthError {
  return error instanceof SlackAuthError;
}