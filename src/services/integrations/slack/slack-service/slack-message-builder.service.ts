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
  BotIntroMessageContext
} from '../messages/types';
import { welcomeMessageTemplate } from '../messages/welcome-message.template';
import { botIntroMessageTemplate } from '../messages/bot-intro-message.template';

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
}