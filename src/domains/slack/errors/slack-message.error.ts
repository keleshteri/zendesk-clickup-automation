import { SlackBaseError } from './slack-base.error.js';

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
 * Type guard to check if error is a Slack message error
 */
export function isSlackMessageError(error: any): error is SlackMessageError {
  return error instanceof SlackMessageError;
}