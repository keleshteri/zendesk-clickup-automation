/**
 * @ai-metadata
 * @component: SlackMessageBuilderService
 * @description: Service for rendering Slack message templates with dynamic content
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Centralized service for building Slack messages from templates"
 */

import type {
  SlackMessageTemplate,
  MessageTemplateContext,
  WelcomeMessageContext,
  BotIntroMessageContext,
  TicketInfoMessageContext,
  TicketSummaryMessageContext,
  ErrorMessageContext,
  HelpMessageContext
} from '../messages/types';
import { welcomeMessageTemplate } from '../messages/welcome-message.template';
import { botIntroMessageTemplate } from '../messages/bot-intro-message.template';
import { ticketInfoMessageTemplate } from '../messages/ticket-info-message.template';
import { ticketSummaryMessageTemplate } from '../messages/ticket-summary-message.template';
import { errorMessageTemplate } from '../messages/error-message.template';
import { helpMessageTemplate } from '../messages/error-message.template';

/**
 * Service for building Slack messages from templates
 * Provides a centralized way to render message templates with dynamic content
 */
export class SlackMessageBuilderService {
  /**
   * Build a welcome message for a new channel member
   * @param context - Welcome message context with userId and channel
   * @returns Rendered Slack message template
   */
  buildWelcomeMessage(context: WelcomeMessageContext): SlackMessageTemplate {
    return welcomeMessageTemplate(context);
  }

  /**
   * Build a bot introduction message for when TaskGenie joins a channel
   * @param context - Bot intro message context with channel and optional teamName
   * @returns Rendered Slack message template
   */
  buildBotIntroMessage(context: BotIntroMessageContext): SlackMessageTemplate {
    return botIntroMessageTemplate(context);
  }

  /**
   * Validate message template context
   * @param context - Message template context to validate
   * @param requiredFields - Array of required field names
   * @throws Error if required fields are missing
   */
  private validateContext(context: MessageTemplateContext, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !context[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required context fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Build welcome message with validation
   * @param context - Welcome message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildWelcomeMessageSafe(context: WelcomeMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['userId', 'channel']);
    return this.buildWelcomeMessage(context);
  }

  /**
   * Build bot intro message with validation
   * @param context - Bot intro message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildBotIntroMessageSafe(context: BotIntroMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['channel']);
    return this.buildBotIntroMessage(context);
  }

  /**
   * Build a ticket information message
   * @param context - Ticket info message context
   * @returns Rendered Slack message template
   */
  buildTicketInfoMessage(context: TicketInfoMessageContext): SlackMessageTemplate {
    return ticketInfoMessageTemplate(context);
  }

  /**
   * Build a ticket summary message
   * @param context - Ticket summary message context
   * @returns Rendered Slack message template
   */
  buildTicketSummaryMessage(context: TicketSummaryMessageContext): SlackMessageTemplate {
    return ticketSummaryMessageTemplate(context);
  }

  /**
   * Build an error message
   * @param context - Error message context
   * @returns Rendered Slack message template
   */
  buildErrorMessage(context: ErrorMessageContext): SlackMessageTemplate {
    return errorMessageTemplate(context);
  }

  /**
   * Build a help message
   * @param context - Help message context
   * @returns Rendered Slack message template
   */
  buildHelpMessage(context: HelpMessageContext): SlackMessageTemplate {
    return helpMessageTemplate(context);
  }

  /**
   * Build ticket info message with validation
   * @param context - Ticket info message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildTicketInfoMessageSafe(context: TicketInfoMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['channel', 'ticket']);
    if (!context.ticket.id || !context.ticket.subject) {
      throw new Error('Missing required ticket fields: id, subject');
    }
    return this.buildTicketInfoMessage(context);
  }

  /**
   * Build ticket summary message with validation
   * @param context - Ticket summary message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildTicketSummaryMessageSafe(context: TicketSummaryMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['channel', 'tickets']);
    if (!Array.isArray(context.tickets)) {
      throw new Error('Tickets must be an array');
    }
    return this.buildTicketSummaryMessage(context);
  }

  /**
   * Build error message with validation
   * @param context - Error message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildErrorMessageSafe(context: ErrorMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['channel', 'errorType']);
    return this.buildErrorMessage(context);
  }

  /**
   * Build help message with validation
   * @param context - Help message context
   * @returns Rendered Slack message template
   * @throws Error if required context fields are missing
   */
  buildHelpMessageSafe(context: HelpMessageContext): SlackMessageTemplate {
    this.validateContext(context, ['channel']);
    return this.buildHelpMessage(context);
  }
}