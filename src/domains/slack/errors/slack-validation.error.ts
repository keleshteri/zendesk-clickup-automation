import { SlackBaseError } from './slack-base.error.js';

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