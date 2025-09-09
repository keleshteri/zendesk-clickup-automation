// Bot interfaces
export type {
  SlackBotConfig,
  SlackChannel,
  SlackUser,
  BotMentionEvent,
  WelcomeMessageContext,
  ISlackBot
} from './bot/index.js';

// Messaging interfaces
export type {
  ISlackMessaging,
  MessageOptions,
  DirectMessageOptions,
  MessageUpdateOptions,
  MessageDeleteOptions,
  EphemeralMessageOptions,
  MessageReactionOptions
} from './messaging/index.js';

// Template interfaces
export type {
  TemplateVariable,
  MessageTemplate,
  RenderedMessage,
  TemplateContext,
  IMessageTemplateManager,
  ITemplateLoader
} from './templates/index.js';