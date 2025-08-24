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