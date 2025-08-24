/**
 * Updated index to export the new simplified Slack service
 */
export { SlackService } from './slack-service';

// Export types for compatibility
export type {
  SlackEvent,
  SlackEventType,
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from './slack-service';
