import { SlackBaseError } from './slack-base.error.js';

/**
 * API communication errors
 */
export class SlackApiError extends SlackBaseError {
  public readonly statusCode?: number;
  public readonly apiError?: string;

  constructor(
    message: string, 
    statusCode?: number, 
    apiError?: string, 
    details?: Record<string, any>
  ) {
    super(message, 'SLACK_API_ERROR', details);
    this.statusCode = statusCode;
    this.apiError = apiError;
  }
}