/**
 * @ai-metadata
 * @component: SlackEventHandler
 * @description: Handles all Slack event processing including mentions, member joins, and command parsing
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../interfaces", "../types"]
 */

import { WebClient } from '@slack/web-api';
import type {
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from '../interfaces';
import type {
  SlackCommand,
  SlackEventType
} from '../types';
import { SlackMessagingService } from './slack-messaging.service';
import { SlackBotManager } from './slack-bot-manager.service';

/**
 * Service responsible for handling Slack events
 */
export class SlackEventHandler {
  private client: WebClient;
  private messagingService: SlackMessagingService;
  private botManager: SlackBotManager;
  private multiAgentService?: any;
  private taskGenie?: any;
  private botUserId?: string;

  /**
   * Initialize the Slack event handler
   * @param client - The Slack WebClient instance
   * @param messagingService - The messaging service for sending responses
   * @param botManager - The bot manager for bot-related operations
   * @param multiAgentService - Optional multi-agent service for advanced processing
   * @param taskGenie - Optional task genie service for task operations
   */
  constructor(
    client: WebClient,
    messagingService: SlackMessagingService,
    botManager: SlackBotManager,
    multiAgentService?: any,
    taskGenie?: any
  ) {
    this.client = client;
    this.messagingService = messagingService;
    this.botManager = botManager;
    this.multiAgentService = multiAgentService;
    this.taskGenie = taskGenie;
  }

  /**
   * Set the bot's user ID for mention detection
   * @param botUserId - The bot's Slack user ID
   */
  setBotUserId(botUserId: string): void {
    this.botUserId = botUserId;
  }

  /**
   * Handle app mention events when the bot is mentioned
   * @param event - The app mention event data
   * @returns Promise that resolves when mention is handled
   */
  async handleMention(event: SlackAppMentionEvent): Promise<void> {
    try {
      // Check if this is a direct mention (not just a general mention)
      if (!this.isDirectMention(event.text)) {
        console.log('Ignoring indirect mention');
        return;
      }

      // Parse the command from the mention
      const command = this.parseSlackCommand(event.text);
      
      // Handle the command
      await this.handleSlackCommand(event.channel, event.ts, command, event.user);
    } catch (error) {
      console.error('Error handling mention:', error);
      await this.messagingService.sendMessage(
        event.channel,
        '❌ Sorry, I encountered an error processing your request. Please try again.',
        event.ts
      );
    }
  }

  /**
   * Handle member joined channel events
   * @param event - The member joined event data
   * @returns Promise that resolves when event is handled
   */
  async handleMemberJoined(event: SlackMemberJoinedChannelEvent): Promise<void> {
    try {
      console.log(`💬 Member ${event.user} joined channel ${event.channel}`);
      
      // Wait for bot user ID to be initialized (with timeout)
      if (!this.botUserId) {
        console.log(`⏳ Bot user ID not yet initialized, waiting...`);
        // Wait up to 10 seconds for initialization
        await this.waitForBotUserId(10000);
      }
      
      console.log(`🔍 Debug: event.user=${event.user}, botUserId=${this.botUserId}`);
      
      // Check if the bot itself joined the channel
      if (event.user === this.botUserId) {
        console.log(`🤖 Bot joined channel ${event.channel}, sending welcome message`);
        await this.botManager.handleBotJoinedChannel(event.channel);
      } else {
        console.log(`👤 User ${event.user} joined channel ${event.channel}, sending welcome message`);
        await this.messagingService.sendUserWelcomeMessage(event.channel, event.user);
        console.log(`✅ Welcome message sent to user ${event.user} in channel ${event.channel}`);
      }
    } catch (error) {
      console.error('❌ Failed to process member join event:', error);
      console.log('⚠️ Skipping member join processing due to initialization timeout');
    }
  }

  /**
   * Wait for bot user ID to be initialized
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @returns Promise that resolves when bot user ID is available or timeout occurs
   */
  private async waitForBotUserId(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    while (!this.botUserId && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }
    
    if (!this.botUserId) {
      throw new Error(`Bot user ID not initialized within ${timeoutMs}ms timeout`);
    }
  }

  /**
   * Check if the text contains a direct mention of the bot
   * @param text - The message text to check
   * @returns True if the message directly mentions the bot
   */
  private isDirectMention(text: string): boolean {
    // Look for @TaskGenie or direct bot mentions
    const mentionPatterns = [
      /@TaskGenie/i,
      /<@U[A-Z0-9]+>/,  // Direct user mention format
      /hey\s+taskgenie/i,
      /hi\s+taskgenie/i
    ];
    
    return mentionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Parse Slack command from mention text
   * @param text - The message text to parse
   * @returns Parsed SlackCommand object with action and parameters
   */
  private parseSlackCommand(text: string): SlackCommand {
    // Remove bot mentions and clean up text
    const cleanText = text
      .replace(/<@U[A-Z0-9]+>/g, '')
      .replace(/@TaskGenie/gi, '')
      .trim()
      .toLowerCase();

    // Parse different command types
    if (cleanText.includes('help')) {
      return { isCommand: true, command: 'help', args: [], originalText: text };
    } else if (cleanText.includes('list tickets')) {
      return { isCommand: true, command: 'list_tickets', args: [], originalText: text };
    } else if (cleanText.includes('summarize ticket')) {
      const ticketMatch = cleanText.match(/ticket\s*#?(\d+)/);
      const args = ticketMatch ? ['ticket', ticketMatch[1]] : ['ticket'];
      return { isCommand: true, command: 'summarize_ticket', args, originalText: text };
    } else if (cleanText.includes('status ticket')) {
      const ticketMatch = cleanText.match(/ticket\s*#?(\d+)/);
      const args = ticketMatch ? ['ticket', ticketMatch[1]] : ['ticket'];
      return { isCommand: true, command: 'status_ticket', args, originalText: text };
    } else if (cleanText.includes('analytics')) {
      return { isCommand: true, command: 'analytics', args: [], originalText: text };
    } else {
      return { isCommand: false, command: 'unknown', args: [], originalText: text };
    }
  }

  /**
   * Handle parsed Slack commands and route to appropriate handlers
   * @param channel - The channel ID where the command was issued
   * @param threadTs - The thread timestamp for replies
   * @param command - The parsed command object
   * @param user - The user ID who issued the command
   * @returns Promise that resolves when command is handled
   */
  private async handleSlackCommand(
    channel: string, 
    threadTs: string, 
    command: SlackCommand, 
    user: string
  ): Promise<void> {
    switch (command.command) {
      case 'help':
        await this.messagingService.sendMessage(
          channel,
          this.messagingService.getHelpMessage(),
          threadTs
        );
        break;
        
      case 'list_tickets':
        await this.handleListTicketsRequest(channel, threadTs);
        break;
        
      case 'summarize_ticket':
        const ticketId = command.args[1]; // Extract ticket ID from args
        if (ticketId) {
          await this.handleSummarizeRequest(channel, threadTs, ticketId);
        } else {
          await this.messagingService.sendMessage(
            channel,
            '❌ Please provide a ticket ID. Example: `@TaskGenie summarize ticket #123`',
            threadTs
          );
        }
        break;
        
      case 'status_ticket':
        const statusTicketId = command.args[1]; // Extract ticket ID from args
        if (statusTicketId) {
          await this.handleStatusRequest(channel, threadTs, statusTicketId);
        } else {
          await this.messagingService.sendMessage(
            channel,
            '❌ Please provide a ticket ID. Example: `@TaskGenie status ticket #123`',
            threadTs
          );
        }
        break;
        
      case 'analytics':
        await this.handleAnalyticsRequest(channel, threadTs);
        break;
        
      default:
        await this.messagingService.sendMessage(
          channel,
          `🤔 I didn't understand that command. Type \`@TaskGenie help\` to see available commands.`,
          threadTs
        );
    }
  }

  /**
   * Handle status request commands
   * @param channel - The channel ID to send the response to
   * @param threadTs - The thread timestamp for replies
   * @param ticketId - The ticket ID to get status for
   * @returns Promise that resolves when status is sent
   */
  async handleStatusRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      `📊 Checking status for ticket ${ticketId}... (Feature coming soon!)`,
      threadTs
    );
  }

  /**
   * Handle summarize request commands
   * @param channel - The channel ID to send the response to
   * @param threadTs - The thread timestamp for replies
   * @param ticketId - The ticket ID to summarize
   * @returns Promise that resolves when summary is sent
   */
  async handleSummarizeRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    if (this.taskGenie) {
      // Use TaskGenie service if available
      await this.taskGenie.handleSlackSummarize(channel, threadTs, ticketId);
    } else {
      await this.messagingService.sendMessage(
        channel,
        `📝 Generating summary for ticket ${ticketId}... (Feature coming soon!)`,
        threadTs
      );
    }
  }

  /**
   * Handle list tickets request commands
   * @param channel - The channel ID to send the response to
   * @param user - The user ID who made the request
   * @param threadTs - Optional thread timestamp for replies
   * @returns Promise that resolves when ticket list is sent
   */
  async handleListTicketsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '📋 Fetching recent tickets... (Feature coming soon!)',
      threadTs
    );
  }

  /**
   * Handle analytics request commands
   * @param channel - The channel ID to send the response to
   * @param user - The user ID who made the request
   * @param threadTs - Optional thread timestamp for replies
   * @returns Promise that resolves when analytics are sent
   */
  async handleAnalyticsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '📊 Generating analytics report... (Feature coming soon!)',
      threadTs
    );
  }

  /**
   * Handle general Slack events and route to specific handlers
   * @param event - The Slack event object to process
   * @returns Promise that resolves when event is handled
   */
  async handleEvent(event: SlackEventType): Promise<void> {
    switch (event.type) {
      case 'app_mention':
        await this.handleMention(event as SlackAppMentionEvent);
        break;
      case 'member_joined_channel':
        await this.handleMemberJoined(event as SlackMemberJoinedChannelEvent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}