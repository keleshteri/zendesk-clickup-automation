/**
 * @ai-metadata
 * @component: SlackMessageTypes
 * @description: TypeScript interfaces for Slack message templates
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Type definitions for Slack Block Kit message templates"
 */

/**
 * Base interface for all Slack message templates
 */
export interface SlackMessageTemplate {
  channel: string;
  blocks: SlackBlock[];
  text?: string;
  thread_ts?: string;
}

/**
 * Slack Block Kit block types
 */
export interface SlackBlock {
  type: 'section' | 'context' | 'divider' | 'header' | 'actions' | 'image';
  text?: SlackTextElement;
  elements?: SlackElement[];
  accessory?: SlackElement;
  fields?: SlackTextElement[];
}

/**
 * Slack text element types
 */
export interface SlackTextElement {
  type: 'mrkdwn' | 'plain_text';
  text: string;
  emoji?: boolean;
}

/**
 * Slack interactive elements
 */
export interface SlackElement {
  type: 'button' | 'static_select' | 'multi_static_select' | 'datepicker' | 'timepicker' | 'mrkdwn' | 'plain_text';
  text?: SlackTextElement | string;
  action_id?: string;
  value?: string;
  url?: string;
  style?: 'primary' | 'danger';
}

/**
 * Template context for dynamic content
 */
export interface MessageTemplateContext {
  userId?: string;
  channel?: string;
  userName?: string;
  teamName?: string;
  botName?: string;
  [key: string]: any;
}

/**
 * Welcome message template context
 */
export interface WelcomeMessageContext extends MessageTemplateContext {
  userId: string;
  channel: string;
}

/**
 * Bot intro message template context
 */
export interface BotIntroMessageContext extends MessageTemplateContext {
  channel: string;
  teamName?: string;
}

/**
 * Template renderer function type
 */
export type MessageTemplateRenderer<T extends MessageTemplateContext> = (
  context: T
) => SlackMessageTemplate;