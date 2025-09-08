import type { App } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import type { ISlackMessaging } from './slack-messaging.interface';
import type { IMessageTemplateManager } from './message-template.interface';

/**
 * Configuration for Slack bot initialization
 */
export interface SlackBotConfig {
  /** Bot token for authentication */
  botToken: string;
  /** Bot user ID for mentions */
  botUserId?: string;
  /** App token for socket mode (optional) */
  appToken?: string;
  /** Signing secret for request verification */
  signingSecret?: string;
  /** Enable socket mode for real-time events */
  socketMode?: boolean;
  /** Custom port for HTTP mode */
  port?: number;
}

/**
 * Slack channel information
 */
export interface SlackChannel {
  /** Channel ID */
  id: string;
  /** Channel name */
  name: string;
  /** Channel type (public, private, dm, etc.) */
  type: string;
  /** Whether the bot is a member */
  isMember: boolean;
}

/**
 * Slack user information
 */
export interface SlackUser {
  /** User ID */
  id: string;
  /** Username */
  name: string;
  /** Display name */
  displayName?: string;
  /** User email */
  email?: string;
  /** Whether user is a bot */
  isBot: boolean;
}

/**
 * Bot mention event data
 */
export interface BotMentionEvent {
  /** Message text */
  text: string;
  /** User who mentioned the bot */
  user: SlackUser;
  /** Channel where mention occurred */
  channel: SlackChannel;
  /** Message timestamp */
  timestamp: string;
  /** Thread timestamp if in thread */
  threadTimestamp?: string;
}

/**
 * Welcome message context
 */
export interface WelcomeMessageContext {
  /** Channel the bot joined */
  channel: SlackChannel;
  /** User who invited the bot (if available) */
  invitedBy?: SlackUser;
  /** Timestamp of the join event */
  timestamp: string;
}

/**
 * Core Slack bot interface
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
   * Start the bot (begin listening for events)
   */
  start(): Promise<void>;
  
  /**
   * Stop the bot
   */
  stop(): Promise<void>;
  
  /**
   * Send a welcome message when bot joins a channel
   */
  sendWelcomeMessage(context: WelcomeMessageContext): Promise<void>;
  
  /**
   * Handle bot mentions in messages
   */
  handleBotMention(event: BotMentionEvent): Promise<void>;
  
  /**
   * Check if bot is member of a channel
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
   * Get the messaging service instance
   */
  getMessagingService(): ISlackMessaging;
  
  /**
   * Get the template manager instance
   */
  getTemplateManager(): IMessageTemplateManager;
}