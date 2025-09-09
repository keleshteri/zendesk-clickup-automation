import { SlackBaseError } from './slack-base.error.js';

/**
 * Configuration errors
 */
export class SlackConfigError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_CONFIG_ERROR', details);
  }
}