/**
 * @ai-metadata
 * @component: SlackAppMentionEventInterface
 * @description: Interface for Slack app mention events triggered when the bot is mentioned in a channel
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-event.interface"]
 */

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