import { SlackBaseError } from './slack-base.error.js';
import { SlackAuthError } from './slack-auth.error.js';
import { SlackApiError } from './slack-api.error.js';
import { SlackRateLimitError } from './slack-rate-limit.error.js';
import { SlackChannelError } from './slack-channel.error.js';
import { SlackUserError } from './slack-user.error.js';
import { SlackValidationError } from './slack-validation.error.js';

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