import { SlackBaseError } from './slack-base.error.js';

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
 * Type guard to check if error is a Slack template error
 */
export function isSlackTemplateError(error: any): error is SlackTemplateError {
  return error instanceof SlackTemplateError;
}