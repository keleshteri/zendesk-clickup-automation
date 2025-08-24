import type { SlackEvent } from './slack-event.interface';

/**
 * Slack message event interface
 * Triggered when a message is posted in a channel
 * @see https://api.slack.com/events/message
 */
export interface SlackMessageEvent extends SlackEvent {
  type: 'message';
  user?: string;
  bot_id?: string;
  text?: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
}