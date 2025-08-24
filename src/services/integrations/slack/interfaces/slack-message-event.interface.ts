/**
 * @ai-metadata
 * @component: SlackMessageEventInterface
 * @description: Interface for Slack message events triggered when a message is posted in a channel
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-event.interface"]
 */

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