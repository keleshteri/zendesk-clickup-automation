import type { SlackAppMentionEvent } from '../interfaces/slack-app-mention-event.interface';
import type { SlackMemberJoinedChannelEvent } from '../interfaces/slack-member-joined-channel-event.interface';
import type { SlackMessageEvent } from '../interfaces/slack-message-event.interface';

/**
 * Union type for all supported Slack event types
 * This represents the possible event types that can be processed by the service
 */
export type SlackEventType = SlackAppMentionEvent | SlackMemberJoinedChannelEvent | SlackMessageEvent;