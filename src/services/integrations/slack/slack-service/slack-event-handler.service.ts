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
  ISlackEventHandler,
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from '../interfaces';
import type {
  SlackCommand,
  SlackEventType
} from '../types';
import { SlackMessagingService } from './slack-messaging.service';
import { SlackBotManager } from './slack-bot-manager.service';
import { SlackCommandHandler } from './slack-command-handler.service';
import { SlackNLPProcessor } from './slack-nlp-processor.service';
import { IAIService, IZendeskService, IClickUpService, IExternalServices } from '../../../../interfaces/service-interfaces';

/**
 * Service responsible for handling Slack events
 * Implements ISlackEventHandler for LSP compliance
 */
export class SlackEventHandler implements ISlackEventHandler {
  private client: WebClient;
  private messagingService: SlackMessagingService;
  private botManager: SlackBotManager;
  private commandHandler: SlackCommandHandler;
  private nlpProcessor: SlackNLPProcessor;
  private aiService?: IAIService;
  private zendeskService?: IZendeskService;
  private clickupService?: IClickUpService;

  private botUserId?: string;

  /**
   * Initialize the Slack event handler
   * @param client - The Slack WebClient instance
   * @param messagingService - The messaging service for sending responses
   * @param botManager - The bot manager for bot-related operations
   * @param services - Optional services object containing AI, Zendesk, and ClickUp services
   */
  constructor(
    client: WebClient,
    messagingService: SlackMessagingService,
    botManager: SlackBotManager,
    services?: IExternalServices
  ) {
    this.client = client;
    this.messagingService = messagingService;
    this.botManager = botManager;
    this.aiService = services?.ai;
    this.zendeskService = services?.zendesk;
    this.clickupService = services?.clickup;
    
    // Initialize command handler and NLP processor
    this.commandHandler = new SlackCommandHandler(client, messagingService);
    this.nlpProcessor = new SlackNLPProcessor(client, messagingService);
    
    // Set services if available
    if (services) {
      this.commandHandler.setServices(services.ai, services.zendesk, services.clickup);
      this.nlpProcessor.setServices(services.ai, services.zendesk, services.clickup);
    }
  }

  /**
   * Set additional services after initialization
   * @param services - Services object containing AI, Zendesk, and ClickUp services
   */
  setServices(services: IExternalServices): void {
    this.aiService = services.ai;
    this.zendeskService = services.zendesk;
    this.clickupService = services.clickup;
    
    // Set services for command handler and NLP processor
    this.commandHandler.setServices(services.ai, services.zendesk, services.clickup);
    this.nlpProcessor.setServices(services.ai, services.zendesk, services.clickup);
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
    console.log('=== SLACK MENTION EVENT RECEIVED ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
      // Check if this is a direct mention (not just a general mention)
      if (!this.isDirectMention(event.text)) {
        console.log('Ignoring indirect mention');
        return;
      }

      // Clean the text by removing the bot mention
      const cleanText = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      
      if (!cleanText) {
        await this.messagingService.sendMessage(
          event.channel,
          '👋 Hi there! How can I help you today? Type "help" to see what I can do.',
          event.ts
        );
        return;
      }
      
      console.log('🧹 Cleaned text:', cleanText);
      
      // Check if it's a help query first
      if (this.nlpProcessor.isHelpQuery(cleanText)) {
        await this.nlpProcessor.handleDirectHelpQuery(cleanText, event.channel, event.ts, event.user);
        return;
      }
      
      // Try to parse as a command first
      const command = this.commandHandler.parseCommand(cleanText);
      
      if (command.isCommand) {
        // Handle as a structured command
        await this.commandHandler.handleCommand(event.channel, event.ts, command, event.user);
      } else if (this.nlpProcessor.isNaturalLanguageQuery(cleanText)) {
        // Handle as natural language query
        const intent = await this.nlpProcessor.processNaturalLanguageQuery(cleanText, event.user);
        await this.nlpProcessor.routeNaturalLanguageIntent(intent, event.channel, event.ts, event.user);
      } else {
        // Fallback to general help
        await this.messagingService.sendMessage(
          event.channel,
          '🤔 I\'m not sure how to help with that. Type "help" to see what I can do!',
          event.ts
        );
      }
      
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
    // Look for direct bot mentions
    const mentionPatterns = [
      /<@U[A-Z0-9]+>/  // Direct user mention format
    ];
    
    return mentionPatterns.some(pattern => pattern.test(text));
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
    await this.messagingService.sendMessage(
      channel,
      `📝 Generating summary for ticket ${ticketId}... (Feature coming soon!)`,
      threadTs
    );
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
   * Handle search tickets request commands
   * @param channel - The channel ID to send the response to
   * @param searchQuery - The search query to use
   * @param threadTs - The thread timestamp for replies
   * @returns Promise that resolves when search results are sent
   */
  async handleSearchTicketsRequest(channel: string, searchQuery: string, threadTs?: string): Promise<void> {
    try {
      console.log(`Searching tickets with query: "${searchQuery}"`);
      
      // Get Zendesk service
      if (!this.zendeskService) {
        await this.messagingService.sendErrorMessage(
          channel,
          'service_unavailable',
          {
            errorMessage: 'Zendesk service is not available.',
            suggestions: ['Please try again later.'],
            showHelpAction: true
          },
          threadTs
        );
        return;
      }

      // Perform the search
      const searchResults = await this.zendeskService.searchTickets(searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        await this.messagingService.sendErrorMessage(
          channel,
          'search_failed',
          {
            searchQuery,
            errorMessage: `No tickets found matching "${searchQuery}".`,
            suggestions: [
              'Try different keywords',
              'Check spelling',
              'Use broader search terms'
            ],
            showHelpAction: true
          },
          threadTs
        );
        return;
      }

      // Send search results
      await this.messagingService.sendTicketSummaryMessage(
        channel,
        searchResults,
        {
          title: `🔍 Search Results for "${searchQuery}"`,
          totalCount: searchResults.length,
          searchQuery,
          showActions: true
        },
        threadTs
      );
      
    } catch (error) {
      console.error('Error searching tickets:', error);
      await this.messagingService.sendErrorMessage(
        channel,
        'search_failed',
        {
          searchQuery,
          errorMessage: 'Failed to search tickets.',
          suggestions: ['Please try again later.'],
          showHelpAction: true
        },
        threadTs
      );
    }
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
      case 'message':
        // Handle message event
        console.log('message event', event);
        break;
      case 'member_joined_channel':
        await this.handleMemberJoined(event as SlackMemberJoinedChannelEvent);
        break;
      default:
        // This should never happen with proper typing, but handle gracefully
        console.log(`Unhandled event type: ${(event as any).type}`);
    }
  }
}