/**
 * Slack Module - Main Export File
 * 
 * This file provides a clean interface for importing Slack module components.
 * It exports all the main classes, interfaces, types, and utilities needed
 * to integrate Slack functionality into your application.
 */

// Core services
export { MessageTemplateManager } from './services/message-template-manager.service.js';
export { SlackMessagingService } from './services/slack-messaging.service.js';
export { MentionHandlerService } from './services/mention-handler.service.js';

// Interfaces
export type {
  ISlackBot,
  SlackBotConfig,
  SlackChannel,
  SlackUser,
  BotMentionEvent,
  WelcomeMessageContext
} from './interfaces';

export type {
  MessageTemplate,
  TemplateVariable,
  TemplateContext
} from './interfaces/templates/message-template.interface.js';
export type { IMessageTemplateManager } from './interfaces/templates/message-template-manager.interface.js';
export type { RenderedMessage } from './interfaces/templates/rendered-message.interface.js';
export type { ITemplateLoader } from './interfaces/templates/template-loader.interface.js';

export type {
  ISlackMessaging,
  MessageOptions,
  DirectMessageOptions,
  MessageUpdateOptions,
  MessageDeleteOptions,
  EphemeralMessageOptions,
  MessageReactionOptions
} from './interfaces';

// Types and schemas
export {
  SlackEventType,
  SlackChannelType,
  TemplateCategory,
  BotResponseType,
  SlackBotConfigSchema,
  SlackChannelSchema,
  SlackUserSchema,
  MessageTemplateSchema,
  TemplateContextSchema,
  MessageOptionsSchema
} from './types/slack.types.js';

export type {
  SlackBotConfigDto,
  SlackChannelDto,
  SlackUserDto,
  MessageTemplateDto,
  TemplateContextDto,
  SlackError as SlackErrorType,
  SlackApiResponse,
  BotMentionContext,
  WelcomeConfig,
  MentionConfig,
  SlackModuleConfig
} from './types/slack.types.js';

// Error classes
export {
  SlackBaseError as SlackError,
  SlackBotError,
  SlackApiError,
  SlackAuthError,
  SlackChannelError,
  SlackConfigError,
  SlackTemplateError,
  SlackValidationError,
  SlackMessageError,
  SlackUserError,
  SlackRateLimitError,
  SlackErrorFactory,
  isSlackError,
  isSlackAuthError,
  isSlackRateLimitError,
  isSlackTemplateError,
  isSlackMessageError
} from './errors/index.js';

// Template functions
export {
  defaultTemplates,
  getDefaultTemplate,
  getDefaultTemplatesByCategory,
  getWelcomeTemplates,
  getHelpTemplates
} from './templates/default-templates.js';

// Re-export commonly used Slack SDK types for convenience
// Note: @slack/bolt and @slack/web-api types are used internally
// but not re-exported to avoid dependency issues

/**
 * Quick start function for basic Slack bot setup
 * 
 * @param config Basic configuration options
 * @returns Configured and ready-to-start SlackModule
 * 
 * @example
 * ```typescript
 * import { quickStartSlackBot } from './domains/slack';
 * 
 * const bot = await quickStartSlackBot({
 *   botToken: 'xoxb-your-token',
 *   signingSecret: 'your-secret',
 *   botUserId: 'U1234567890',
 *   botName: 'MyBot'
 * });
 * 
 * console.log('Bot is running!');
 * ```
 */
export async function quickStartSlackBot(config: {
  botToken: string;
  signingSecret: string;
  botUserId: string;
  botName?: string;
  port?: number;
  enableWelcome?: boolean;
  enableMentions?: boolean;
}): Promise<any> {
  // TODO: Implement quick start functionality
  // This would create and configure a basic Slack bot instance
  throw new Error('quickStartSlackBot not yet implemented');
}

/**
 * Utility function to validate Slack configuration
 * 
 * @param config Configuration to validate
 * @returns True if valid, throws error if invalid
 */
export function validateSlackConfig(config: any): boolean {
  if (!config.botToken) {
    throw new Error('Bot token is required');
  }
  if (!config.signingSecret) {
    throw new Error('Signing secret is required');
  }
  if (!config.botUserId) {
    throw new Error('Bot user ID is required');
  }
  return true;
}

/**
 * Helper function to create a development-friendly Slack configuration
 * 
 * @param config Basic config with environment variable fallbacks
 * @returns Complete SlackModuleConfig for development
 */
export function createDevSlackConfig(config: {
  botToken?: string;
  signingSecret?: string;
  botUserId?: string;
  // appToken removed - not supported in Cloudflare Workers
  botName?: string;
  port?: number;
}): any {
  return {
    botToken: config.botToken || process.env.SLACK_BOT_TOKEN || '',
    signingSecret: config.signingSecret || process.env.SLACK_SIGNING_SECRET || '',
    botUserId: config.botUserId || process.env.SLACK_BOT_USER_ID || '',
    // appToken removed - not supported in Cloudflare Workers
    botName: config.botName || process.env.SLACK_BOT_NAME || 'DevBot',
    port: config.port || parseInt(process.env.PORT || '3000'),
    // socketMode removed - not supported in Cloudflare Workers
    enableWelcomeMessages: true,
    enableMentionHandling: true,
    welcomeConfig: {
      templateId: 'welcome-basic'
    },
    mentionConfig: {
      botName: config.botName || process.env.SLACK_BOT_NAME || 'DevBot',
      enableHelp: true,
      enableStatus: true,
      enableGreeting: true,
      unknownCommandResponse: true
    }
  };
}

// Version information
export const SLACK_MODULE_VERSION = '1.0.0';

// Default export for convenience
// Default export removed - use named exports instead