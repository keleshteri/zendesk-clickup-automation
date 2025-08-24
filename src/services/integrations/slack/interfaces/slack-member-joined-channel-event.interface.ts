/**
 * @ai-metadata
 * @component: SlackMemberJoinedChannelEventInterface
 * @description: Interface for Slack member joined channel events triggered when a user joins a channel
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-event.interface"]
 */

import type { SlackEvent } from './slack-event.interface';

/**
 * Slack member joined channel event interface
 * Triggered when a user joins a channel
 * @see https://api.slack.com/events/member_joined_channel
 */
export interface SlackMemberJoinedChannelEvent extends SlackEvent {
  type: 'member_joined_channel';
  user: string;
  channel: string;
}