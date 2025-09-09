import type { SlackError } from '../types/slack.types.js';

/**
 * Base Slack error class
 */
export class SlackBaseError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to SlackError interface
   */
  toSlackError(): SlackError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Type guard to check if error is a Slack error
 */
export function isSlackError(error: any): error is SlackBaseError {
  return error instanceof SlackBaseError;
}