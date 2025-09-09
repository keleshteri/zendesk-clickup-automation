import type { App } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import type { ISlackMessaging } from '../messaging/slack-messaging.interface.js';
import type { IMessageTemplateManager } from '../templates/message-template-manager.interface.js';
import type { SlackBotConfig } from './slack-bot-config.interface.js';
import type { SlackUser } from './slack-user.interface.js';
import type { BotMentionEvent } from './bot-mention-event.interface.js';
import type { WelcomeMessageContext } from './welcome-message-context.interface.js';

/**
 * Main Slack bot interface
 */
export interface ISlackBot {
  /** Slack Bolt app instance */
  readonly app: App;
  /** Slack Web API client */
  readonly client: WebClient;
  /** Bot configuration */
  readonly config: SlackBotConfig;

  /**
   * Initialize the bot with configuration
   */
  initialize(config: SlackBotConfig): Promise<void>;

  /**
   * Start the bot
   */
  start(): Promise<void>;

  /**
   * Stop the bot
   */
  stop(): Promise<void>;

  /**
   * Send welcome message when bot joins channel
   */
  sendWelcomeMessage(context: WelcomeMessageContext): Promise<void>;

  /**
   * Handle bot mention events
   */
  handleBotMention(event: BotMentionEvent): Promise<void>;

  /**
   * Check if bot is in a specific channel
   */
  isBotInChannel(channelId: string): Promise<boolean>;

  /**
   * Get bot information
   */
  getBotInfo(): Promise<SlackUser>;

  /**
   * Check if bot is currently running
   */
  isRunning(): boolean;

  /**
   * Get messaging service instance
   */
  getMessagingService(): ISlackMessaging;

  /**
   * Get template manager instance
   */
  getTemplateManager(): IMessageTemplateManager;
}