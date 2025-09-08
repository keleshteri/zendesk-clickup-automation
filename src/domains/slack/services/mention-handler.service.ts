import type { BotMentionContext, MentionConfig } from '../types/slack.types.js';
import type { IMessageTemplateManager } from '../interfaces/message-template.interface.js';
import type { ISlackMessaging } from '../interfaces/slack-messaging.interface.js';
import type { SlackApiResponse } from '../types/slack.types.js';
import { SlackBotError } from '../errors/slack.errors.js';

/**
 * Command handler function type
 */
export type CommandHandler = (context: BotMentionContext, args: string[], channel: string, threadTs?: string) => Promise<SlackApiResponse>;

/**
 * Mention handler service
 * Provides default implementations for handling bot mentions and commands
 */
export class MentionHandlerService {
  private commands: Map<string, CommandHandler> = new Map();
  private config: MentionConfig;
  private templateManager: IMessageTemplateManager;
  private messagingService: ISlackMessaging;

  constructor(
    templateManager: IMessageTemplateManager,
    messagingService: ISlackMessaging,
    config: MentionConfig = {
      enabled: true,
      defaultResponseTemplateId: 'default-response'
    }
  ) {
    this.templateManager = templateManager;
    this.messagingService = messagingService;
    this.config = config;

    this.registerDefaultCommands();
  }

  /**
   * Register default command handlers
   */
  private registerDefaultCommands(): void {
    // Register default commands
    this.registerCommand('hello', this.handleGreeting.bind(this));
    this.registerCommand('hi', this.handleGreeting.bind(this));
    this.registerCommand('hey', this.handleGreeting.bind(this));
    this.registerCommand('help', this.handleHelp.bind(this));
    this.registerCommand('commands', this.handleHelp.bind(this));
    this.registerCommand('status', this.handleStatus.bind(this));
    this.registerCommand('health', this.handleStatus.bind(this));
    this.registerCommand('ping', this.handlePing.bind(this));

    // Zendesk commands
    this.registerCommand('ticket', this.handleTicketCommand.bind(this));
    this.registerCommand('zendesk', this.handleZendeskCommand.bind(this));

    // ClickUp commands
    this.registerCommand('task', this.handleTaskCommand.bind(this));
    this.registerCommand('clickup', this.handleClickUpCommand.bind(this));
  }

  /**
   * Register a command handler
   */
  registerCommand(command: string, handler: CommandHandler): void {
    this.commands.set(command.toLowerCase(), handler);
  }

  /**
   * Unregister a command handler
   */
  unregisterCommand(command: string): void {
    this.commands.delete(command.toLowerCase());
  }

  /**
   * Get all registered commands
   */
  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Handle bot mention
   */
  async handleMention(context: BotMentionContext, channel: string, threadTs?: string): Promise<SlackApiResponse> {
    try {
      // Extract command from mention text
      const botMention = `<@BOT_USER_ID>`; // This should be the bot's user ID
      const cleanText = context.cleanText.replace(botMention, '').trim();
      
      if (!cleanText) {
        // No command provided, show greeting
        return await this.handleGreeting(context, [], channel, threadTs);
      }

      // Parse command and arguments
      const parts = cleanText.split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Find and execute command handler
      const handler = this.commands.get(command);
      if (handler) {
        return await handler(context, args, channel, threadTs);
      }

      // Unknown command
      return await this.handleUnknownCommand(context, [command, ...args], channel, threadTs);
    } catch (error) {
      throw new SlackBotError(`Failed to handle mention: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle greeting command
   */
  private async handleGreeting(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const templateContext = {
      variables: {
        botName: 'Bot',
        userName: 'User',
        userId: 'unknown'
      }
    };

    const renderedMessage = await this.templateManager.renderTemplate('mention-greeting', templateContext);
    
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: renderedMessage.text,
      blocks: renderedMessage.blocks,
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle help command
   */
  private async handleHelp(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const templateContext = {
      variables: {
        botName: 'Bot',
        commands: this.getCommands().join(', ')
      }
    };

    const renderedMessage = await this.templateManager.renderTemplate('help-command', templateContext);
    
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: renderedMessage.text,
      blocks: renderedMessage.blocks,
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle status command
   */
  private async handleStatus(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const templateContext = {
      variables: {
        botName: 'Bot',
        uptime: this.getUptime(),
        version: '1.0.0',
        connectedServices: 'Zendesk, ClickUp',
        lastUpdated: new Date().toLocaleString()
      }
    };

    const renderedMessage = await this.templateManager.renderTemplate('bot-status', templateContext);
    
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: renderedMessage.text,
      blocks: renderedMessage.blocks,
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle ping command
   */
  private async handlePing(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: '🏓 Pong! I\'m alive and ready to help!',
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle unknown command
   */
  private async handleUnknownCommand(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const templateContext = {
      variables: {
        botName: 'Bot',
        command: args[0] || 'unknown'
      }
    };

    const renderedMessage = await this.templateManager.renderTemplate('unknown-command', templateContext);
    
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: renderedMessage.text,
      blocks: renderedMessage.blocks,
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle ticket-related commands
   */
  private async handleTicketCommand(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const subCommand = args[0]?.toLowerCase();
    
    switch (subCommand) {
      case 'create':
          const createResponse = await this.messagingService.sendMessage({
            channel: channel,
            text: '🎫 Creating a new Zendesk ticket... (This is a mock response)',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '🎫 *Creating a new Zendesk ticket...*\n\n_This is a mock response. In a real implementation, this would integrate with the Zendesk API._'
                }
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Open Ticket Form'
                    },
                    action_id: 'open_ticket_form',
                    value: 'ticket_form'
                  }
                ]
              }
            ],
            threadTimestamp: threadTs
          });
          return {
            ok: createResponse.ok,
            data: createResponse,
            error: createResponse.error ? { code: 'SLACK_API_ERROR', message: createResponse.error, timestamp: new Date() } : undefined
          };
      
      case 'status':
          const ticketId = args[1];
          const statusResponse = await this.messagingService.sendMessage({
            channel: channel,
            text: `🔍 Checking status for ticket ${ticketId || '#12345'}... (Mock response)`,
            threadTimestamp: threadTs
          });
          return {
            ok: statusResponse.ok,
            data: statusResponse,
            error: statusResponse.error ? { code: 'SLACK_API_ERROR', message: statusResponse.error, timestamp: new Date() } : undefined
          };
      
      default:
          const defaultResponse = await this.messagingService.sendMessage({
            channel: channel,
            text: '🎫 Zendesk ticket commands:\n• `ticket create` - Create a new ticket\n• `ticket status [ID]` - Check ticket status',
            threadTimestamp: threadTs
          });
          return {
            ok: defaultResponse.ok,
            data: defaultResponse,
            error: defaultResponse.error ? { code: 'SLACK_API_ERROR', message: defaultResponse.error, timestamp: new Date() } : undefined
          };
    }
  }

  /**
   * Handle Zendesk-related commands
   */
  private async handleZendeskCommand(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: '🎫 Zendesk integration commands:\n• `zendesk tickets` - List recent tickets\n• `zendesk create` - Create a new ticket\n• `zendesk search [query]` - Search tickets',
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Handle task-related commands
   */
  private async handleTaskCommand(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const subCommand = args[0]?.toLowerCase();
    
    switch (subCommand) {
      case 'create':
        const createResponse = await this.messagingService.sendMessage({
          channel: channel,
          text: '📋 Creating a new ClickUp task... (This is a mock response)',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '📋 *Creating a new ClickUp task...*\n\n_This is a mock response. In a real implementation, this would integrate with the ClickUp API._'
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Open Task Form'
                  },
                  action_id: 'open_task_form',
                  value: 'task_form'
                }
              ]
            }
          ],
          threadTimestamp: threadTs
        });
        return {
          ok: createResponse.ok,
          data: createResponse,
          error: createResponse.error ? { code: 'SLACK_API_ERROR', message: createResponse.error, timestamp: new Date() } : undefined
        };
      
      case 'status':
        const taskId = args[1];
        const statusResponse = await this.messagingService.sendMessage({
          channel: channel,
          text: `🔍 Checking status for task ${taskId || '#TASK-123'}... (Mock response)`,
          threadTimestamp: threadTs
        });
        return {
          ok: statusResponse.ok,
          data: statusResponse,
          error: statusResponse.error ? { code: 'SLACK_API_ERROR', message: statusResponse.error, timestamp: new Date() } : undefined
        };
      
      default:
        const defaultResponse = await this.messagingService.sendMessage({
          channel: channel,
          text: '📋 ClickUp task commands:\n• `task create` - Create a new task\n• `task status [ID]` - Check task status',
          threadTimestamp: threadTs
        });
        return {
          ok: defaultResponse.ok,
          data: defaultResponse,
          error: defaultResponse.error ? { code: 'SLACK_API_ERROR', message: defaultResponse.error, timestamp: new Date() } : undefined
        };
    }
  }

  /**
   * Handle ClickUp-related commands
   */
  private async handleClickUpCommand(context: BotMentionContext, args: string[], channel: string, threadTs?: string): Promise<SlackApiResponse> {
    const response = await this.messagingService.sendMessage({
      channel: channel,
      text: '📋 ClickUp integration commands:\n• `clickup tasks` - List recent tasks\n• `clickup create` - Create a new task\n• `clickup search [query]` - Search tasks',
      threadTimestamp: threadTs
    });
    return {
      ok: response.ok,
      data: response,
      error: response.error ? { code: 'SLACK_API_ERROR', message: response.error, timestamp: new Date() } : undefined
    };
  }

  /**
   * Get bot uptime (simplified)
   */
  private getUptime(): string {
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
   * Update configuration
   */
  updateConfig(config: Partial<MentionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MentionConfig {
    return { ...this.config };
  }
}