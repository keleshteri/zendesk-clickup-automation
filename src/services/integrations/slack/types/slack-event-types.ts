/**
 * @ai-metadata
 * @component: SlackEventTypes
 * @description: Comprehensive type definitions for Slack events, users, channels, and API responses
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-event-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-message-types.ts"]
 * @tests: ["./tests/slack-event-types.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Core Slack API type definitions for events, users, channels, and responses - critical for integration stability"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "api-interface-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Type definitions for Slack event-related interfaces
 * Provides comprehensive typing for Slack events, users, channels, and API responses
 */

import { SlackMessage, SlackBlockType } from './slack-message-types';

/**
 * Base Slack event interface
 */
export interface SlackEvent {
  type: string;
  event_ts: string;
}

/**
 * Slack user profile
 */
export interface SlackUserProfile {
  avatar_hash?: string;
  status_text?: string;
  status_emoji?: string;
  status_expiration?: number;
  real_name?: string;
  display_name?: string;
  real_name_normalized?: string;
  display_name_normalized?: string;
  email?: string;
  image_original?: string;
  image_24?: string;
  image_32?: string;
  image_48?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
  team?: string;
  fields?: Record<string, {
    value: string;
    alt: string;
  }>;
  phone?: string;
  skype?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Slack user interface
 */
export interface SlackUser {
  id: string;
  team_id?: string;
  name?: string;
  deleted?: boolean;
  color?: string;
  real_name?: string;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile?: SlackUserProfile;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  is_bot?: boolean;
  is_app_user?: boolean;
  updated?: number;
  is_email_confirmed?: boolean;
  who_can_share_contact_card?: string;
  locale?: string;
  presence?: 'active' | 'away';
  enterprise_user?: {
    id: string;
    enterprise_id: string;
    enterprise_name: string;
    is_admin: boolean;
    is_owner: boolean;
    teams: string[];
  };
}

/**
 * Slack channel topic/purpose
 */
export interface SlackChannelTopicPurpose {
  value: string;
  creator: string;
  last_set: number;
}

/**
 * Slack channel interface
 */
export interface SlackChannel {
  id: string;
  name?: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  created?: number;
  is_archived?: boolean;
  is_general?: boolean;
  unlinked?: number;
  name_normalized?: string;
  is_shared?: boolean;
  is_org_shared?: boolean;
  is_member?: boolean;
  is_pending_ext_shared?: boolean;
  pending_shared?: string[];
  context_team_id?: string;
  updated?: number;
  parent_conversation?: string;
  creator?: string;
  is_ext_shared?: boolean;
  shared_team_ids?: string[];
  pending_connected_team_ids?: string[];
  is_pending_ext_shared_with_team?: boolean;
  topic?: SlackChannelTopicPurpose;
  purpose?: SlackChannelTopicPurpose;
  previous_names?: string[];
  num_members?: number;
  locale?: string;
  priority?: number;
}

/**
 * Slack team interface
 */
export interface SlackTeam {
  id: string;
  name: string;
  domain: string;
  email_domain?: string;
  icon?: {
    image_34?: string;
    image_44?: string;
    image_68?: string;
    image_88?: string;
    image_102?: string;
    image_132?: string;
    image_230?: string;
    image_default?: boolean;
  };
  enterprise_id?: string;
  enterprise_name?: string;
}

/**
 * Slack bot interface
 */
export interface SlackBot {
  id: string;
  deleted?: boolean;
  name: string;
  updated?: number;
  app_id?: string;
  user_id?: string;
  icons?: {
    image_36?: string;
    image_48?: string;
    image_72?: string;
  };
}

/**
 * Slack file interface
 */
export interface SlackFile {
  id: string;
  created: number;
  timestamp: number;
  name?: string;
  title?: string;
  mimetype?: string;
  filetype?: string;
  pretty_type?: string;
  user?: string;
  editable?: boolean;
  size?: number;
  mode?: string;
  is_external?: boolean;
  external_type?: string;
  is_public?: boolean;
  public_url_shared?: boolean;
  display_as_bot?: boolean;
  username?: string;
  url_private?: string;
  url_private_download?: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  thumb_480?: string;
  thumb_480_w?: number;
  thumb_480_h?: number;
  thumb_160?: string;
  thumb_720?: string;
  thumb_720_w?: number;
  thumb_720_h?: number;
  thumb_800?: string;
  thumb_800_w?: number;
  thumb_800_h?: number;
  thumb_960?: string;
  thumb_960_w?: number;
  thumb_960_h?: number;
  thumb_1024?: string;
  thumb_1024_w?: number;
  thumb_1024_h?: number;
  image_exif_rotation?: number;
  original_w?: number;
  original_h?: number;
  permalink?: string;
  permalink_public?: string;
  comments_count?: number;
  is_starred?: boolean;
  shares?: {
    public?: Record<string, any>;
    private?: Record<string, any>;
  };
  channels?: string[];
  groups?: string[];
  ims?: string[];
  has_rich_preview?: boolean;
}

/**
 * Slack reaction interface
 */
export interface SlackReaction {
  name: string;
  users: string[];
  count: number;
}

/**
 * Message event
 */
export interface SlackMessageEvent extends SlackEvent {
  type: 'message';
  subtype?: string;
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  blocks?: SlackBlockType[];
  attachments?: any[];
  files?: SlackFile[];
  upload?: boolean;
  display_as_bot?: boolean;
  username?: string;
  bot_id?: string;
  icons?: {
    emoji?: string;
    image_64?: string;
  };
  edited?: {
    user: string;
    ts: string;
  };
  client_msg_id?: string;
  team?: string;
  source_team?: string;
  user_team?: string;
  reactions?: SlackReaction[];
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  parent_user_id?: string;
}

/**
 * App mention event
 */
export interface SlackAppMentionEvent extends SlackEvent {
  type: 'app_mention';
  user: string;
  text: string;
  ts: string;
  channel: string;
  thread_ts?: string;
  blocks?: SlackBlockType[];
  client_msg_id?: string;
  team?: string;
  source_team?: string;
  user_team?: string;
}

/**
 * Reaction added event
 */
export interface SlackReactionAddedEvent extends SlackEvent {
  type: 'reaction_added';
  user: string;
  reaction: string;
  item_user?: string;
  item: {
    type: 'message' | 'file' | 'file_comment';
    channel?: string;
    ts?: string;
    file?: string;
    file_comment?: string;
  };
}

/**
 * Reaction removed event
 */
export interface SlackReactionRemovedEvent extends SlackEvent {
  type: 'reaction_removed';
  user: string;
  reaction: string;
  item_user?: string;
  item: {
    type: 'message' | 'file' | 'file_comment';
    channel?: string;
    ts?: string;
    file?: string;
    file_comment?: string;
  };
}

/**
 * Member joined channel event
 */
export interface SlackMemberJoinedChannelEvent extends SlackEvent {
  type: 'member_joined_channel';
  user: string;
  channel: string;
  channel_type: 'C' | 'G';
  team: string;
  inviter?: string;
}

/**
 * Member left channel event
 */
export interface SlackMemberLeftChannelEvent extends SlackEvent {
  type: 'member_left_channel';
  user: string;
  channel: string;
  channel_type: 'C' | 'G';
  team: string;
}

/**
 * Channel created event
 */
export interface SlackChannelCreatedEvent extends SlackEvent {
  type: 'channel_created';
  channel: {
    id: string;
    name: string;
    created: number;
    creator: string;
  };
}

/**
 * Channel deleted event
 */
export interface SlackChannelDeletedEvent extends SlackEvent {
  type: 'channel_deleted';
  channel: string;
}

/**
 * Channel rename event
 */
export interface SlackChannelRenameEvent extends SlackEvent {
  type: 'channel_rename';
  channel: {
    id: string;
    name: string;
    created: number;
  };
}

/**
 * Channel archive event
 */
export interface SlackChannelArchiveEvent extends SlackEvent {
  type: 'channel_archive';
  channel: string;
  user: string;
}

/**
 * Channel unarchive event
 */
export interface SlackChannelUnarchiveEvent extends SlackEvent {
  type: 'channel_unarchive';
  channel: string;
  user: string;
}

/**
 * User change event
 */
export interface SlackUserChangeEvent extends SlackEvent {
  type: 'user_change';
  user: SlackUser;
}

/**
 * Team join event
 */
export interface SlackTeamJoinEvent extends SlackEvent {
  type: 'team_join';
  user: SlackUser;
}

/**
 * File shared event
 */
export interface SlackFileSharedEvent extends SlackEvent {
  type: 'file_shared';
  file_id: string;
  user_id: string;
  file: SlackFile;
}

/**
 * File unshared event
 */
export interface SlackFileUnsharedEvent extends SlackEvent {
  type: 'file_unshared';
  file_id: string;
  user_id: string;
  file: SlackFile;
}

/**
 * Union type for all Slack events
 */
export type SlackEventType = 
  | SlackMessageEvent
  | SlackAppMentionEvent
  | SlackReactionAddedEvent
  | SlackReactionRemovedEvent
  | SlackMemberJoinedChannelEvent
  | SlackMemberLeftChannelEvent
  | SlackChannelCreatedEvent
  | SlackChannelDeletedEvent
  | SlackChannelRenameEvent
  | SlackChannelArchiveEvent
  | SlackChannelUnarchiveEvent
  | SlackUserChangeEvent
  | SlackTeamJoinEvent
  | SlackFileSharedEvent
  | SlackFileUnsharedEvent;

/**
 * Slack event wrapper
 */
export interface SlackEventWrapper {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEventType;
  type: 'event_callback';
  event_id: string;
  event_time: number;
  authorizations?: Array<{
    enterprise_id?: string;
    team_id: string;
    user_id: string;
    is_bot: boolean;
    is_enterprise_install?: boolean;
  }>;
  is_ext_shared_channel?: boolean;
  context_team_id?: string;
  context_enterprise_id?: string;
}

/**
 * Slack URL verification
 */
export interface SlackUrlVerification {
  token: string;
  challenge: string;
  type: 'url_verification';
}

/**
 * Slack app rate limited
 */
export interface SlackAppRateLimited {
  token: string;
  type: 'app_rate_limited';
  team_id: string;
  minute_rate_limited: number;
  api_app_id: string;
}

/**
 * Slack interactive component
 */
export interface SlackInteractiveComponent {
  type: 'interactive_message' | 'block_actions' | 'message_action' | 'shortcut' | 'view_submission' | 'view_closed';
  token: string;
  action_ts: string;
  team: SlackTeam;
  user: SlackUser;
  channel?: SlackChannel;
  is_enterprise_install?: boolean;
  enterprise?: {
    id: string;
    name: string;
  };
}

/**
 * Slack block actions
 */
export interface SlackBlockActions extends SlackInteractiveComponent {
  type: 'block_actions';
  actions: Array<{
    action_id: string;
    block_id: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    value?: string;
    type: string;
    action_ts: string;
    selected_option?: {
      text: {
        type: string;
        text: string;
        emoji?: boolean;
      };
      value: string;
    };
    selected_options?: Array<{
      text: {
        type: string;
        text: string;
        emoji?: boolean;
      };
      value: string;
    }>;
    selected_user?: string;
    selected_users?: string[];
    selected_conversation?: string;
    selected_conversations?: string[];
    selected_channel?: string;
    selected_channels?: string[];
    selected_date?: string;
    selected_time?: string;
    selected_date_time?: number;
    initial_option?: {
      text: {
        type: string;
        text: string;
        emoji?: boolean;
      };
      value: string;
    };
    initial_options?: Array<{
      text: {
        type: string;
        text: string;
        emoji?: boolean;
      };
      value: string;
    }>;
  }>;
  message?: SlackMessage;
  response_url?: string;
  trigger_id?: string;
}

/**
 * Slack slash command
 */
export interface SlackSlashCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id: string;
  is_enterprise_install?: boolean;
  enterprise_id?: string;
  enterprise_name?: string;
}

/**
 * Slack API response base
 */
export interface SlackApiResponse {
  ok: boolean;
  success?: boolean;
  error?: string;
  warning?: string;
  channel?: string;
  ts?: string;
  data?: {
    ts?: string;
    channel?: string;
    message?: {
      text: string;
      user: string;
      ts: string;
      thread_ts?: string;
    };
  };
  message?: {
    text: string;
    user: string;
    ts: string;
    thread_ts?: string;
  };
  response_metadata?: {
    next_cursor?: string;
    warnings?: string[];
    messages?: string[];
  };
}

/**
 * Slack conversations list response
 */
export interface SlackConversationsListResponse extends SlackApiResponse {
  channels?: SlackChannel[];
}

/**
 * Slack users list response
 */
export interface SlackUsersListResponse extends SlackApiResponse {
  members?: SlackUser[];
}

/**
 * Slack auth test response
 */
export interface SlackAuthTestResponse extends SlackApiResponse {
  url?: string;
  team?: string;
  user?: string;
  team_id?: string;
  user_id?: string;
  bot_id?: string;
  enterprise_id?: string;
  is_enterprise_install?: boolean;
}

/**
 * Slack event handler interface
 */
export interface SlackEventHandler<T extends SlackEventType = SlackEventType> {
  eventType: T['type'];
  handle(event: T, context: SlackEventContext): Promise<void>;
}

/**
 * Slack event context
 */
export interface SlackEventContext {
  teamId: string;
  enterpriseId?: string;
  apiAppId: string;
  eventId: string;
  eventTime: number;
  retryNum?: number;
  retryReason?: string;
}

/**
 * Slack webhook verification
 */
export interface SlackWebhookVerification {
  timestamp: string;
  signature: string;
  body: string;
  signingSecret: string;
}