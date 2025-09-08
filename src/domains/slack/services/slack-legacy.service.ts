import { App, LogLevel } from '@slack/bolt';
import type { ChatPostMessageResponse } from '@slack/web-api';
import type {
  ISlackBot,
  SlackBotConfig,
  WelcomeMessageContext,
  BotMentionEvent
} from '../interfaces/slack-bot.interface.js';
import type { IMessageTemplateManager } from '../interfaces/message-template.interface.js';
import type { ISlackMessaging } from '../interfaces/slack-messaging.interface.js';
import type { BotMentionContext, WelcomeConfig } from '../types/slack.types.js';
import { SlackBotError, SlackConfigError } from '../errors/slack.errors.js';
import { MessageTemplateManager } from './message-template-manager.service.js';
import { SlackMessagingService } from './slack-messaging.service.js';
import { defaultTemplates } from '../templates/default-templates.js';

/**
 * Slack bot service implementation
 * Handles bot initialization, event processing, and core bot functionality
 */
export class SlackLegacyService implements ISlackBot {
  public app: App;
  public config: SlackBotConfig;
  private templateManager: IMessageTemplateManager;
  private messagingService: ISlackMessaging;
  private isStarted = false;
  private welcomeHandler?: (context: WelcomeMessageContext) => Promise<void>;
  private mentionHandler?: (context: BotMentionContext) => Promise<void>;
  private eventHandlers: Map<string, any[]> = new Map();

  constructor(config: SlackBotConfig) {
    this.validateConfig(config);
    this.config = config;
    
    // Initialize Slack app first
    this.app = new App({
      token: config.botToken,
      signingSecret: config.signingSecret,
      socketMode: config.socketMode ?? false,
      appToken: config.appToken,
      logLevel: LogLevel.INFO,
      processBeforeResponse: true
    });
    
    // Initialize services after app
    this.templateManager = new MessageTemplateManager();
    this.messagingService = new SlackMessagingService(this.app.client);

    // Register default templates
    this.registerDefaultTemplates();
    
    // Setup default event handlers
    this.setupDefaultEventHandlers();
  }

  /**
   * Validate bot configuration
   */
  private validateConfig(config: SlackBotConfig): void {
    if (!config.botToken) {
      throw new SlackConfigError('Bot token is required');
    }
    if (!config.signingSecret) {
      throw new SlackConfigError('Signing secret is required');
    }
    if (config.socketMode && !config.appToken) {
      throw new SlackConfigError('App token is required when using socket mode');
    }
  }

  /**
   * Register default message templates
   */
  private registerDefaultTemplates(): void {
    try {
      defaultTemplates.forEach(template => {
        this.templateManager.registerTemplate(template);
      });
    } catch (error) {
      throw new SlackBotError(`Failed to register default templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultEventHandlers(): void {
    // Handle member joined channel events for welcome messages
    this.app.event('member_joined_channel', async ({ event, client }) => {
      try {
        if (this.welcomeHandler && event.user === this.config.botUserId) {
          await this.welcomeHandler({
            channel: {
              id: event.channel,
              name: 'channel',
              type: 'channel',
              isMember: true
            },
            timestamp: event.event_ts || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling member_joined_channel event:', error);
        throw new SlackBotError(`Failed to handle member_joined_channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Handle app mentions for bot responses
    this.app.event('app_mention', async ({ event, client, say }) => {
      try {
        if (this.mentionHandler) {
          const context: BotMentionContext = {
            messageText: event.text,
            cleanText: event.text.replace(/<@[^>]+>/g, '').trim(),
            command: undefined, // Will be parsed from cleanText
            args: [],
            isDirectMention: true,
            isInThread: !!event.thread_ts
          };
          await this.mentionHandler(context);
        }
      } catch (error) {
        console.error('Error handling app_mention event:', error);
        throw new SlackBotError(`Failed to handle app_mention: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Handle errors
    this.app.error(async (error) => {
      console.error('Slack app error:', error);
    });
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      if (this.isStarted) {
        throw new SlackBotError('Bot is already started');
      }

      const port = this.config.port ?? 3000;
      await this.app.start(port);
      this.isStarted = true;
      
      console.log(`⚡️ Slack bot is running on port ${port}`);
    } catch (error) {
      throw new SlackBotError(`Failed to start bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    try {
      if (!this.isStarted) {
        throw new SlackBotError('Bot is not started');
      }

      await this.app.stop();
      this.isStarted = false;
      
      console.log('🛑 Slack bot stopped');
    } catch (error) {
      throw new SlackBotError(`Failed to stop bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if bot is running
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Set welcome message handler
   */
  setWelcomeHandler(handler: (context: WelcomeMessageContext) => Promise<void>): void {
    this.welcomeHandler = handler;
  }

  /**
   * Set mention handler
   */
  setMentionHandler(handler: (context: BotMentionContext) => Promise<void>): void {
    this.mentionHandler = handler;
  }

  /**
   * Add event handler
   */
  addEventListener(eventType: string, handler: any): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    // Register with Slack app
    this.app.event(eventType as any, async (args) => {
      try {
        await handler(args as any);
      } catch (error) {
        console.error(`Error handling ${eventType} event:`, error);
        throw new SlackBotError(`Failed to handle ${eventType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Remove event handler
   */
  removeEventListener(eventType: string, handler: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send welcome message to channel
   */
  async sendWelcomeMessage(context: WelcomeMessageContext): Promise<void> {
    const channelId = context.channel.id;
    const config = undefined; // Use default config
    
    await this._sendWelcomeMessageInternal(channelId, config);
  }

  private async _sendWelcomeMessageInternal(channelId: string, config?: WelcomeConfig): Promise<ChatPostMessageResponse> {
    try {
      const templateId = config?.templateId ?? 'welcome-basic';
      const templateVariables = {
         variables: {
           botName: this.config.botUserId ?? 'Bot',
           channelName: 'this channel',
           ...config?.customVariables
         }
       };

      const renderedMessage = await this.templateManager.renderTemplate(templateId, templateVariables);
      
      return await this.messagingService.sendMessage({
        channel: channelId,
        text: renderedMessage.text,
        blocks: renderedMessage.blocks,
        // attachments: renderedMessage.attachments // Remove if not available in RenderedMessage
      });
    } catch (error) {
      throw new SlackBotError(`Failed to send welcome message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process bot mention
   */
  async processMention(context: BotMentionContext, channel: string, threadTs?: string): Promise<ChatPostMessageResponse> {
    try {
      // Extract command from mention text
      const botMention = `<@${this.config.botUserId || 'bot'}>`;
      const command = context.cleanText.toLowerCase();
      
      let templateId: string;
      let templateVariables: { variables: Record<string, any> } = {
        variables: {
          command: context.command ?? 'help',
          args: context.args ?? [],
          messageText: context.messageText,
          cleanText: context.cleanText,
          botName: 'Bot'
        }
      };

      // Determine response based on command
      if (!command || command === 'hello' || command === 'hi') {
        templateId = 'mention-greeting';
      } else if (command === 'help') {
        templateId = 'help-command';
      } else if (command === 'status') {
        templateId = 'bot-status';
        templateVariables = {
          variables: {
            command: context.command || 'status',
            args: context.args || [],
            messageText: context.messageText,
            cleanText: context.cleanText,
            botName: 'Bot',
            userName: 'User',
            userId: 'user123',
            uptime: this.getUptime(),
            version: '1.0.0',
            connectedServices: 'Zendesk, ClickUp',
            lastUpdated: new Date().toLocaleString()
          }
        };
      } else {
        templateId = 'unknown-command';
      }

      const renderedMessage = await this.templateManager.renderTemplate(templateId, templateVariables);
      
      return await this.messagingService.sendMessage({
        channel: channel,
        text: renderedMessage.text,
        blocks: renderedMessage.blocks,
        threadTimestamp: threadTs
      });
    } catch (error) {
      throw new SlackBotError(`Failed to process mention: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bot configuration
   */
  getConfig(): SlackBotConfig {
    return { ...this.config };
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
   * Get Slack app instance
   */
  getApp(): App {
    return this.app;
  }

  get client() {
    return this.app.client;
  }

  async initialize(config: SlackBotConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    // Re-initialize app with new config if needed
  }

  async handleBotMention(event: BotMentionEvent): Promise<void> {
    if (this.mentionHandler) {
      const context: BotMentionContext = {
        messageText: event.text,
        cleanText: event.text.replace(/<@[^>]+>/g, '').trim(),
        command: undefined,
        args: [],
        isDirectMention: true,
        isInThread: !!event.threadTimestamp
      };
      await this.mentionHandler(context);
    }
  }

  async isBotInChannel(channelId: string): Promise<boolean> {
    try {
      const result = await this.app.client.conversations.members({
        channel: channelId
      });
      const botInfo = await this.getBotInfo();
      return result.members?.includes(botInfo.id) ?? false;
    } catch (error) {
      return false;
    }
  }

  async getBotInfo(): Promise<any> {
    try {
      const result = await this.app.client.auth.test();
      return {
        id: result.user_id,
        name: result.user,
        displayName: result.user,
        email: undefined,
        isBot: true
      };
    } catch (error) {
      throw new SlackBotError(`Failed to get bot info: ${error}`);
    }
  }

  /**
   * Get bot uptime
   */
  private getUptime(): string {
    if (!this.isStarted) {
      return '0 minutes';
    }
    
    // This is a simplified uptime calculation
    // In a real implementation, you'd track the start time
    const uptimeMs = process.uptime() * 1000;
    const minutes = Math.floor(uptimeMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} days, ${hours % 24} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes % 60} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  }

  /**
   * Handle bot events
   */
  async handleEvent(event: any): Promise<void> {
    try {
      const handlers = this.eventHandlers.get(event.type);
      if (handlers && handlers.length > 0) {
        await Promise.all(handlers.map(handler => handler(event as any)));
      }
    } catch (error) {
      throw new SlackBotError(`Failed to handle event ${event.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}