/**
 * @ai-metadata
 * @component: SlackMessageTypes
 * @description: Comprehensive type definitions for Slack messages, blocks, elements, and UI components
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-message-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/slack-message-types.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Core Slack message and UI component type definitions - foundation for all Slack interactions"
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
 *   - require-dev-approval-for: ["breaking-changes", "ui-component-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Type definitions for Slack message-related interfaces
 * Provides comprehensive typing for Slack messages, blocks, and elements
 */

/**
 * Basic Slack text object
 */
export interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
}

/**
 * Slack confirmation dialog
 */
export interface SlackConfirmationDialog {
  title: SlackTextObject;
  text: SlackTextObject;
  confirm: SlackTextObject;
  deny: SlackTextObject;
  style?: 'primary' | 'danger';
}

/**
 * Slack option object
 */
export interface SlackOption {
  text: SlackTextObject;
  value: string;
  description?: SlackTextObject;
  url?: string;
}

/**
 * Slack option group
 */
export interface SlackOptionGroup {
  label: SlackTextObject;
  options: SlackOption[];
}

/**
 * Base Slack element interface
 */
export interface SlackElement {
  type: string;
  action_id?: string;
}

/**
 * Slack button element
 */
export interface SlackButtonElement extends SlackElement {
  type: 'button';
  text: SlackTextObject;
  value?: string;
  url?: string;
  style?: 'default' | 'primary' | 'danger';
  confirm?: SlackConfirmationDialog;
  accessibility_label?: string;
}

/**
 * Slack select menu base
 */
export interface SlackSelectMenuBase extends SlackElement {
  placeholder?: SlackTextObject;
  initial_option?: SlackOption;
  initial_options?: SlackOption[];
  confirm?: SlackConfirmationDialog;
  max_selected_items?: number;
  focus_on_load?: boolean;
}

/**
 * Slack static select menu
 */
export interface SlackStaticSelectElement extends SlackSelectMenuBase {
  type: 'static_select' | 'multi_static_select';
  options?: SlackOption[];
  option_groups?: SlackOptionGroup[];
  initial_option?: SlackOption;
  initial_options?: SlackOption[];
}

/**
 * Slack external select menu
 */
export interface SlackExternalSelectElement extends SlackSelectMenuBase {
  type: 'external_select' | 'multi_external_select';
  min_query_length?: number;
  initial_option?: SlackOption;
  initial_options?: SlackOption[];
}

/**
 * Slack users select menu
 */
export interface SlackUsersSelectElement extends SlackSelectMenuBase {
  type: 'users_select' | 'multi_users_select';
  initial_user?: string;
  initial_users?: string[];
}

/**
 * Slack conversations select menu
 */
export interface SlackConversationsSelectElement extends SlackSelectMenuBase {
  type: 'conversations_select' | 'multi_conversations_select';
  initial_conversation?: string;
  initial_conversations?: string[];
  default_to_current_conversation?: boolean;
  filter?: {
    include?: ('im' | 'mpim' | 'private' | 'public')[];
    exclude_external_shared_channels?: boolean;
    exclude_bot_users?: boolean;
  };
}

/**
 * Slack channels select menu
 */
export interface SlackChannelsSelectElement extends SlackSelectMenuBase {
  type: 'channels_select' | 'multi_channels_select';
  initial_channel?: string;
  initial_channels?: string[];
}

/**
 * Slack overflow menu
 */
export interface SlackOverflowElement extends SlackElement {
  type: 'overflow';
  options: SlackOption[];
  confirm?: SlackConfirmationDialog;
}

/**
 * Slack date picker
 */
export interface SlackDatePickerElement extends SlackElement {
  type: 'datepicker';
  placeholder?: SlackTextObject;
  initial_date?: string;
  confirm?: SlackConfirmationDialog;
  focus_on_load?: boolean;
}

/**
 * Slack time picker
 */
export interface SlackTimePickerElement extends SlackElement {
  type: 'timepicker';
  placeholder?: SlackTextObject;
  initial_time?: string;
  confirm?: SlackConfirmationDialog;
  focus_on_load?: boolean;
  timezone?: string;
}

/**
 * Slack datetime picker
 */
export interface SlackDatetimePickerElement extends SlackElement {
  type: 'datetimepicker';
  initial_date_time?: number;
  confirm?: SlackConfirmationDialog;
  focus_on_load?: boolean;
}

/**
 * Slack plain text input
 */
export interface SlackPlainTextInputElement extends SlackElement {
  type: 'plain_text_input';
  placeholder?: SlackTextObject;
  initial_value?: string;
  multiline?: boolean;
  min_length?: number;
  max_length?: number;
  dispatch_action_config?: {
    trigger_actions_on?: ('on_enter_pressed' | 'on_character_entered')[];
  };
  focus_on_load?: boolean;
}

/**
 * Slack URL text input
 */
export interface SlackUrlTextInputElement extends SlackElement {
  type: 'url_text_input';
  placeholder?: SlackTextObject;
  initial_value?: string;
  dispatch_action_config?: {
    trigger_actions_on?: ('on_enter_pressed' | 'on_character_entered')[];
  };
  focus_on_load?: boolean;
}

/**
 * Slack email text input
 */
export interface SlackEmailTextInputElement extends SlackElement {
  type: 'email_text_input';
  placeholder?: SlackTextObject;
  initial_value?: string;
  dispatch_action_config?: {
    trigger_actions_on?: ('on_enter_pressed' | 'on_character_entered')[];
  };
  focus_on_load?: boolean;
}

/**
 * Slack number input
 */
export interface SlackNumberInputElement extends SlackElement {
  type: 'number_input';
  is_decimal_allowed?: boolean;
  placeholder?: SlackTextObject;
  initial_value?: string;
  min_value?: string;
  max_value?: string;
  dispatch_action_config?: {
    trigger_actions_on?: ('on_enter_pressed' | 'on_character_entered')[];
  };
  focus_on_load?: boolean;
}

/**
 * Slack checkboxes
 */
export interface SlackCheckboxesElement extends SlackElement {
  type: 'checkboxes';
  options: SlackOption[];
  initial_options?: SlackOption[];
  confirm?: SlackConfirmationDialog;
  focus_on_load?: boolean;
}

/**
 * Slack radio buttons
 */
export interface SlackRadioButtonsElement extends SlackElement {
  type: 'radio_buttons';
  options: SlackOption[];
  initial_option?: SlackOption;
  confirm?: SlackConfirmationDialog;
  focus_on_load?: boolean;
}

/**
 * Slack file input
 */
export interface SlackFileInputElement extends SlackElement {
  type: 'file_input';
  filetypes?: string[];
  max_files?: number;
}

/**
 * Slack image element
 */
export interface SlackImageElement {
  type: 'image';
  image_url: string;
  alt_text: string;
}

/**
 * Union type for all Slack elements
 */
export type SlackElementType = 
  | SlackButtonElement
  | SlackStaticSelectElement
  | SlackExternalSelectElement
  | SlackUsersSelectElement
  | SlackConversationsSelectElement
  | SlackChannelsSelectElement
  | SlackOverflowElement
  | SlackDatePickerElement
  | SlackTimePickerElement
  | SlackDatetimePickerElement
  | SlackPlainTextInputElement
  | SlackUrlTextInputElement
  | SlackEmailTextInputElement
  | SlackNumberInputElement
  | SlackCheckboxesElement
  | SlackRadioButtonsElement
  | SlackFileInputElement
  | SlackImageElement;

/**
 * Base Slack block interface
 */
export interface SlackBlock {
  type: string;
  block_id?: string;
}

/**
 * Slack section block
 */
export interface SlackSectionBlock extends SlackBlock {
  type: 'section';
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: SlackElementType;
}

/**
 * Slack divider block
 */
export interface SlackDividerBlock extends SlackBlock {
  type: 'divider';
}

/**
 * Slack image block
 */
export interface SlackImageBlock extends SlackBlock {
  type: 'image';
  image_url: string;
  alt_text: string;
  title?: SlackTextObject;
}

/**
 * Slack actions block
 */
export interface SlackActionsBlock extends SlackBlock {
  type: 'actions';
  elements: SlackElementType[];
}

/**
 * Slack context block
 */
export interface SlackContextBlock extends SlackBlock {
  type: 'context';
  elements: (SlackTextObject | SlackImageElement)[];
}

/**
 * Slack input block
 */
export interface SlackInputBlock extends SlackBlock {
  type: 'input';
  label: SlackTextObject;
  element: SlackElementType;
  dispatch_action?: boolean;
  hint?: SlackTextObject;
  optional?: boolean;
}

/**
 * Slack file block
 */
export interface SlackFileBlock extends SlackBlock {
  type: 'file';
  external_id: string;
  source: string;
}

/**
 * Slack header block
 */
export interface SlackHeaderBlock extends SlackBlock {
  type: 'header';
  text: SlackTextObject;
}

/**
 * Slack video block
 */
export interface SlackVideoBlock extends SlackBlock {
  type: 'video';
  video_url: string;
  thumbnail_url: string;
  alt_text: string;
  title: SlackTextObject;
  title_url?: string;
  author_name?: string;
  provider_name?: string;
  provider_icon_url?: string;
  description?: SlackTextObject;
}

/**
 * Union type for all Slack blocks
 */
export type SlackBlockType = 
  | SlackSectionBlock
  | SlackDividerBlock
  | SlackImageBlock
  | SlackActionsBlock
  | SlackContextBlock
  | SlackInputBlock
  | SlackFileBlock
  | SlackHeaderBlock
  | SlackVideoBlock;

/**
 * Slack attachment (legacy)
 */
export interface SlackAttachment {
  id?: number;
  color?: string;
  fallback?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  actions?: any[];
  callback_id?: string;
  mrkdwn_in?: string[];
}

/**
 * Main Slack message interface
 */
export interface SlackMessage {
  text?: string;
  blocks?: SlackBlockType[];
  attachments?: SlackAttachment[];
  channel?: string;
  username?: string;
  user?: string;
  icon_emoji?: string;
  icon_url?: string;
  link_names?: boolean;
  parse?: 'full' | 'none';
  reply_broadcast?: boolean;
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  as_user?: boolean;
  mrkdwn?: boolean;
  ts?: string;
  metadata?: {
    event_type: string;
    event_payload: Record<string, any>;
  };
}

/**
 * Slack message response
 */
export interface SlackMessageResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  message?: {
    text: string;
    user: string;
    ts: string;
    type: string;
    subtype?: string;
    thread_ts?: string;
    blocks?: SlackBlockType[];
    attachments?: SlackAttachment[];
  };
  error?: string;
  warning?: string;
  response_metadata?: {
    next_cursor?: string;
    warnings?: string[];
  };
}

/**
 * Slack message update request
 */
export interface SlackMessageUpdate {
  channel: string;
  ts: string;
  text?: string;
  blocks?: SlackBlockType[];
  attachments?: SlackAttachment[];
  parse?: 'full' | 'none';
  link_names?: boolean;
  as_user?: boolean;
  file_ids?: string[];
  reply_broadcast?: boolean;
}

/**
 * Slack ephemeral message
 */
export interface SlackEphemeralMessage extends Omit<SlackMessage, 'channel'> {
  channel: string;
  user: string;
}

/**
 * Slack scheduled message
 */
export interface SlackScheduledMessage extends SlackMessage {
  post_at: number;
}

/**
 * Slack message permalink
 */
export interface SlackMessagePermalink {
  ok: boolean;
  permalink?: string;
  error?: string;
}

/**
 * Slack message data interface (for message structure)
 */
export interface SlackMessageData {
  type: 'message';
  subtype?: string;
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  blocks?: SlackBlockType[];
  attachments?: SlackAttachment[];
  files?: any[];
  edited?: {
    user: string;
    ts: string;
  };
  bot_id?: string;
  username?: string;
  icons?: {
    emoji?: string;
    image_64?: string;
  };
  client_msg_id?: string;
  team?: string;
  source_team?: string;
  user_team?: string;
}

/**
 * Slack message validation result
 */
export interface SlackMessageValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Slack message builder options
 */
export interface SlackMessageBuilderOptions {
  maxTextLength?: number;
  maxBlocks?: number;
  validateBlocks?: boolean;
  autoTruncate?: boolean;
  preserveFormatting?: boolean;
  enableMarkdown?: boolean;
}

/**
 * Slack message template
 */
export interface SlackMessageTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  template: SlackMessage;
  variables?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    default?: any;
    description?: string;
  }>;
  preview?: {
    image?: string;
    description?: string;
  };
}