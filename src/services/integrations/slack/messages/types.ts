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
 * Ticket information message template context
 */
export interface TicketInfoMessageContext extends MessageTemplateContext {
  channel: string;
  threadTs?: string;
  ticket: {
    id: string;
    subject: string;
    description?: string;
    status: string;
    priority: string;
    category?: string;
    assignedTeam?: string;
    assignee?: string;
    requester?: {
      name: string;
      email?: string;
    };
    createdAt?: string;
    updatedAt?: string;
    url?: string;
    tags?: string[];
  };
  clickupTask?: {
    id?: string;
    name?: string;
    status?: string;
    assignee?: string;
    url?: string;
  };
  aiSummary?: string;
  showActions?: boolean;
}

/**
 * Ticket summary message template context
 */
export interface TicketSummaryMessageContext extends MessageTemplateContext {
  channel: string;
  threadTs?: string;
  title?: string;
  tickets: TicketSummaryItem[];
  totalCount?: number;
  searchQuery?: string;
  showActions?: boolean;
  aiInsight?: string;
}

/**
 * Individual ticket summary item
 */
export interface TicketSummaryItem {
  id: string;
  subject: string;
  status: string;
  priority: string;
  assignee?: string;
  requester?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  hasClickUpTask?: boolean;
}

/**
 * Error message template context
 */
export interface ErrorMessageContext extends MessageTemplateContext {
  channel: string;
  threadTs?: string;
  errorType: 'ticket_not_found' | 'search_failed' | 'api_error' | 'permission_denied' | 'invalid_input' | 'service_unavailable' | 'general_error';
  ticketId?: string;
  searchQuery?: string;
  errorMessage?: string;
  suggestions?: string[];
  showRetryAction?: boolean;
  showHelpAction?: boolean;
}

/**
 * Help message template context
 */
export interface HelpMessageContext extends MessageTemplateContext {
  channel: string;
  threadTs?: string;
  helpType?: 'general' | 'ticket_commands' | 'search_tips' | 'troubleshooting';
  userMention?: string;
}

/**
 * Template renderer function type
 */
export type MessageTemplateRenderer<T extends MessageTemplateContext> = (
  context: T
) => SlackMessageTemplate;