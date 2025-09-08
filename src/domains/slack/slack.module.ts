import type {
  ISlackBot,
  SlackBotConfig
} from './interfaces/slack-bot.interface.js';
import type { IMessageTemplateManager } from './interfaces/message-template.interface.js';
import type { ISlackMessaging } from './interfaces/slack-messaging.interface.js';
import type { SlackModuleConfig, WelcomeConfig, MentionConfig } from './types/slack.types.js';
import { SlackLegacyService } from './services/slack-legacy.service.js';
import { MessageTemplateManager } from './services/message-template-manager.service.js';
import { SlackMessagingService } from './services/slack-messaging.service.js';
import { MentionHandlerService } from './services/mention-handler.service.js';
import { SlackConfigError, SlackBotError } from './errors/slack.errors.js';

/**
 * Main Slack module that provides a comprehensive interface for Slack functionality
 * Simplifies integration with Slack apps and bots
 */
export class SlackModule {
  private bot: ISlackBot;
  private templateManager: IMessageTemplateManager;
  private messagingService: ISlackMessaging;
  private mentionHandler: MentionHandlerService;
  private config: SlackModuleConfig;

  constructor(config: SlackModuleConfig) {
    this.validateConfig(config);
    this.config = config;

    // Initialize services
    this.bot = new SlackLegacyService(config.bot);
    this.templateManager = new MessageTemplateManager();
    this.messagingService = new SlackMessagingService(this.bot.client);
    this.mentionHandler = new MentionHandlerService(
      this.templateManager,
      this.messagingService,
      config.mentions
    );

    this.setupDefaultHandlers();
  }

  /**
   * Validate module configuration
   */
  private validateConfig(config: SlackModuleConfig): void {
    if (!config.bot) {
      throw new SlackConfigError('Bot configuration is required');
    }
    if (!config.bot.botToken) {
      throw new SlackConfigError('Bot token is required');
    }
    if (!config.bot.signingSecret) {
      throw new SlackConfigError('Signing secret is required');
    }
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultHandlers(): void {
    // Setup welcome message handler
    if (this.config.welcome?.enabled) {
      // Welcome messages will be handled through the bot's sendWelcomeMessage method
      // when needed by the application
    }

    // Setup mention handler through bot's handleBotMention method
    if (this.config.mentions?.enabled) {
      // The bot will handle mentions through its handleBotMention method
      // which will delegate to our mention handler service
    }
  }

  /**
   * Start the Slack module
   */
  async start(): Promise<void> {
    try {
      await this.bot.start();
      console.log('🚀 Slack module started successfully');
    } catch (error) {
      throw new SlackBotError(`Failed to start Slack module: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the Slack module
   */
  async stop(): Promise<void> {
    try {
      await this.bot.stop();
      console.log('🛑 Slack module stopped');
    } catch (error) {
      throw new SlackBotError(`Failed to stop Slack module: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if module is running
   */
  isRunning(): boolean {
    // Check if bot is running by checking if it has been started
    return true; // Placeholder implementation
  }

  /**
   * Get bot instance
   */
  getBot(): ISlackBot {
    return this.bot;
  }

  /**
   * Get template manager
   */
  getTemplateManager(): IMessageTemplateManager {
    return this.templateManager;
  }

  /**
   * Get messaging service
   */
  getMessagingService(): ISlackMessaging {
    return this.messagingService;
  }

  /**
   * Get mention handler
   */
  getMentionHandler(): MentionHandlerService {
    return this.mentionHandler;
  }

  /**
   * Send a welcome message to a channel
   */
  async sendWelcomeMessage(channelId: string, config?: WelcomeConfig): Promise<void> {
    const context = {
      channel: {
        id: channelId,
        name: '',
        type: 'channel',
        isMember: true
      },
      timestamp: new Date().toISOString()
    };
    await this.bot.sendWelcomeMessage(context);
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(channelId: string, text: string, options?: {
    blocks?: any[];
    attachments?: any[];
    threadTs?: string;
  }): Promise<void> {
    try {
      await this.messagingService.sendMessage({
        channel: channelId,
        text,
        blocks: options?.blocks,
        attachments: options?.attachments,
        threadTimestamp: options?.threadTs
      });
    } catch (error) {
      throw new SlackBotError(`Failed to send message: ${error}`);
    }
  }

  /**
   * Register a custom command handler
   */
  registerCommand(command: string, handler: (context: any, args: string[]) => Promise<any>): void {
    this.mentionHandler.registerCommand(command, handler);
  }

  /**
   * Unregister a command handler
   */
  unregisterCommand(command: string): void {
    this.mentionHandler.unregisterCommand(command);
  }

  /**
   * Get module configuration
   */
  getConfig(): SlackModuleConfig {
    return { ...this.config };
  }

  /**
   * Update mention configuration
   */
  updateMentionConfig(config: Partial<MentionConfig>): void {
    this.mentionHandler.updateConfig(config);
  }
}

/**
 * Factory function to create and configure a Slack module
 */
export function createSlackModule(config: SlackModuleConfig): SlackModule {
  return new SlackModule(config);
}

/**
 * Helper function to create a basic Slack module configuration
 */
export function createBasicSlackConfig({
  botToken,
  signingSecret,
  appToken,
  port = 3000
}: {
  botToken: string;
  signingSecret?: string;
  appToken?: string;
  port?: number;
}): SlackModuleConfig {
  return {
    bot: {
      botToken,
      appToken,
      signingSecret,
      socketMode: true,
      port
    },
    welcome: {
      enabled: true,
      templateId: 'welcome-basic'
    },
    mentions: {
      enabled: true,
      defaultResponseTemplateId: 'help-command',
      unknownCommandTemplateId: 'help-command',
      respondInThread: false
    },
    templates: {
      autoLoad: true
    }
  };
}

// Export all types and interfaces for external use
export type {
  SlackModuleConfig,
  WelcomeConfig,
  MentionConfig
} from './types/slack.types.js';

export type {
  ISlackBot,
  SlackBotConfig
} from './interfaces/slack-bot.interface.js';

export type {
  IMessageTemplateManager
} from './interfaces/message-template.interface.js';

export type {
  ISlackMessaging
} from './interfaces/slack-messaging.interface.js';

export type {
  MessageTemplate,
  TemplateVariable,
  RenderedMessage
} from './interfaces/message-template.interface.js';

export type {
  MessageOptions,
  DirectMessageOptions,
  MessageUpdateOptions,
  MessageDeleteOptions,
  EphemeralMessageOptions,
  MessageReactionOptions
} from './interfaces/slack-messaging.interface.js';

// Export services for advanced usage
export {
  SlackLegacyService,
  MessageTemplateManager,
  SlackMessagingService,
  MentionHandlerService
};

// Export errors
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
  SlackRateLimitError
} from './errors/slack.errors.js';

// Export default templates
export { defaultTemplates, getDefaultTemplate, getDefaultTemplatesByCategory } from './templates/default-templates.js';