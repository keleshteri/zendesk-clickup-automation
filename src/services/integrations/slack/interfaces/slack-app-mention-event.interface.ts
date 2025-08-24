import type { SlackEvent } from './slack-event.interface';

/**
 * Slack app mention event interface
 * Triggered when the bot is mentioned in a channel
 * @see https://api.slack.com/events/app_mention
 */
export interface SlackAppMentionEvent extends SlackEvent {
  type: 'app_mention';
  user: string;
  text: string;
  channel: string;
  ts: string;
}