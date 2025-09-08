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
 * Authentication and authorization errors
 */
export class SlackAuthError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_AUTH_ERROR', details);
  }
}

/**
 * Configuration errors
 */
export class SlackConfigError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_CONFIG_ERROR', details);
  }
}

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
 * Template-related errors
 */
export class SlackTemplateError extends SlackBaseError {
  public readonly templateId?: string;

  constructor(message: string, templateId?: string, details?: Record<string, any>) {
    super(message, 'SLACK_TEMPLATE_ERROR', details);
    this.templateId = templateId;
  }
}

/**
 * Message sending errors
 */
export class SlackMessageError extends SlackBaseError {
  public readonly channel?: string;
  public readonly messageType?: string;

  constructor(
    message: string, 
    channel?: string, 
    messageType?: string, 
    details?: Record<string, any>
  ) {
    super(message, 'SLACK_MESSAGE_ERROR', details);
    this.channel = channel;
    this.messageType = messageType;
  }
}

/**
 * Bot initialization errors
 */
export class SlackBotError extends SlackBaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_BOT_ERROR', details);
  }
}

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

/**
 * Validation errors
 */
export class SlackValidationError extends SlackBaseError {
  public readonly field?: string;
  public readonly validationErrors?: string[];

  constructor(
    message: string, 
    field?: string, 
    validationErrors?: string[], 
    details?: Record<string, any>
  ) {
    super(message, 'SLACK_VALIDATION_ERROR', details);
    this.field = field;
    this.validationErrors = validationErrors;
  }
}

/**
 * Error factory for creating appropriate error types
 */
export class SlackErrorFactory {
  /**
   * Create error from Slack API response
   */
  static fromApiResponse(response: any): SlackBaseError {
    const { error, ok, response_metadata } = response;
    
    if (!ok && error) {
      switch (error) {
        case 'invalid_auth':
        case 'account_inactive':
        case 'token_revoked':
          return new SlackAuthError(`Authentication failed: ${error}`, { response });
        
        case 'rate_limited':
          const retryAfter = response_metadata?.retry_after;
          return new SlackRateLimitError(
            'Rate limit exceeded', 
            retryAfter, 
            { response }
          );
        
        case 'channel_not_found':
        case 'not_in_channel':
          return new SlackChannelError(
            `Channel error: ${error}`, 
            undefined, 
            { response }
          );
        
        case 'user_not_found':
          return new SlackUserError(
            `User error: ${error}`, 
            undefined, 
            { response }
          );
        
        default:
          return new SlackApiError(
            `API error: ${error}`, 
            undefined, 
            error, 
            { response }
          );
      }
    }
    
    return new SlackApiError('Unknown API error', undefined, undefined, { response });
  }
  
  /**
   * Create error from HTTP response
   */
  static fromHttpResponse(statusCode: number, message: string, body?: any): SlackApiError {
    return new SlackApiError(
      `HTTP ${statusCode}: ${message}`, 
      statusCode, 
      undefined, 
      { body }
    );
  }
  
  /**
   * Create validation error from Zod validation result
   */
  static fromValidation(field: string, errors: string[]): SlackValidationError {
    return new SlackValidationError(
      `Validation failed for ${field}`, 
      field, 
      errors
    );
  }
}

/**
 * Type guard to check if error is a Slack error
 */
export function isSlackError(error: any): error is SlackBaseError {
  return error instanceof SlackBaseError;
}

/**
 * Type guard to check specific Slack error types
 */
export function isSlackAuthError(error: any): error is SlackAuthError {
  return error instanceof SlackAuthError;
}

export function isSlackRateLimitError(error: any): error is SlackRateLimitError {
  return error instanceof SlackRateLimitError;
}

export function isSlackTemplateError(error: any): error is SlackTemplateError {
  return error instanceof SlackTemplateError;
}

export function isSlackMessageError(error: any): error is SlackMessageError {
  return error instanceof SlackMessageError;
}