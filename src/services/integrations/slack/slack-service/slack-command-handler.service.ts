/**
 * @ai-metadata
 * @component: SlackCommandHandler
 * @description: Service for handling Slack commands following SRP - separated from event handling
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../interfaces", "../interfaces", "../types"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Command handling service following SRP principles"
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../../types';
import type { ISlackCommandHandler } from '../interfaces';
import type { SlackCommand } from '../types';
import { SlackMessagingService } from './slack-messaging.service';
import { IAIService, IZendeskService, IClickUpService } from '../../../../interfaces/service-interfaces';
import type { ISlackMessagingService } from '../interfaces/services/slack-messaging.interface';

/**
 * Service responsible for handling Slack commands
 * Follows SRP by focusing only on command parsing and execution
 * Implements ISlackCommandHandler for LSP compliance
 */
export class SlackCommandHandler implements ISlackCommandHandler {
  private client: WebClient;
  private messagingService: ISlackMessagingService;
  private aiService?: IAIService;
  private zendeskService?: IZendeskService;
  private clickupService?: IClickUpService;

  /**
   * Initialize the command handler
   * @param client - The Slack WebClient instance
   * @param messagingService - The messaging service for sending responses
   */
  constructor(
    client: WebClient,
    messagingService: ISlackMessagingService
  ) {
    this.client = client;
    this.messagingService = messagingService;
  }

  /**
   * Set external services for command execution
   * @param aiService - AI service for intelligent responses
   * @param zendeskService - Zendesk service for ticket operations
   * @param clickupService - ClickUp service for task operations
   */
  setServices(
    aiService?: IAIService,
    zendeskService?: IZendeskService,
    clickupService?: IClickUpService
  ): void {
    this.aiService = aiService;
    this.zendeskService = zendeskService;
    this.clickupService = clickupService;
  }

  /**
   * Parse Slack command from text
   * @param text - The text to parse
   * @returns Parsed command object
   */
  parseCommand(text: string): SlackCommand {
    // Remove bot mention and clean up text
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();
    const words = cleanText.split(/\s+/);
    
    // Check for specific commands
    if (cleanText.toLowerCase().includes('status') || 
        cleanText.toLowerCase().includes('show me ticket') ||
        cleanText.toLowerCase().includes('get ticket')) {
      const ticketMatch = cleanText.match(/(?:ticket|#)(\d+)/i);
      return {
        isCommand: true,
        command: 'status',
        args: words.slice(1),
        originalText: text,
        type: 'status',
        ticketId: ticketMatch ? ticketMatch[1] : undefined
      };
    }
    
    if (cleanText.toLowerCase().includes('summarize') || cleanText.toLowerCase().includes('summary')) {
      const ticketMatch = cleanText.match(/(?:ticket|#)(\d+)/i);
      return {
        isCommand: true,
        command: 'summarize',
        args: words.slice(1),
        originalText: text,
        type: 'summarize',
        ticketId: ticketMatch ? ticketMatch[1] : undefined
      };
    }
    
    if (cleanText.toLowerCase().includes('list tickets') || cleanText.toLowerCase().includes('show tickets')) {
      return {
        isCommand: true,
        command: 'list_tickets',
        args: words.slice(2),
        originalText: text,
        type: 'list_tickets'
      };
    }
    
    if (cleanText.toLowerCase().includes('search')) {
      const searchMatch = cleanText.match(/search\s+(.+)/i);
      return {
        isCommand: true,
        command: 'search_tickets',
        args: words.slice(1),
        originalText: text,
        type: 'search_tickets',
        searchQuery: searchMatch ? searchMatch[1].trim() : undefined
      };
    }
    
    if (cleanText.toLowerCase().includes('analytics') || cleanText.toLowerCase().includes('stats')) {
      return {
        isCommand: true,
        command: 'analytics',
        args: words.slice(1),
        originalText: text,
        type: 'analytics'
      };
    }
    
    if (cleanText.toLowerCase().includes('help')) {
      return {
        isCommand: true,
        command: 'help',
        args: words.slice(1),
        originalText: text,
        type: 'help'
      };
    }
    
    // Default to unknown command
    return {
      isCommand: false,
      command: '',
      args: [],
      originalText: text,
      type: 'unknown'
    };
  }

  /**
   * Handle parsed Slack command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param command - The parsed command
   * @param user - The user ID
   * @returns Promise that resolves when command is handled
   */
  async handleCommand(
    channel: string,
    threadTs: string,
    command: SlackCommand,
    user: string
  ): Promise<void> {
    console.log('🎯 Handling command:', command.type, 'for user:', user);
    
    try {
      switch (command.type) {
        case 'status':
          await this.handleStatusRequest(channel, threadTs, command.ticketId || '');
          break;
        case 'summarize':
          await this.handleSummarizeRequest(channel, threadTs, command.ticketId || '');
          break;
        case 'list_tickets':
          await this.handleListTicketsRequest(channel, user, threadTs);
          break;
        case 'search_tickets':
          await this.handleSearchTicketsRequest(channel, command.searchQuery || '', threadTs, user);
          break;
        case 'analytics':
          await this.handleAnalyticsRequest(channel, user, threadTs);
          break;
        case 'help':
          await this.handleHelpRequest(channel, threadTs, user);
          break;
        default:
          await this.handleUnknownCommand(channel, threadTs, command.originalText, user);
          break;
      }
    } catch (error) {
      console.error('Error handling command:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Sorry, I encountered an error while processing your command: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle status request command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param ticketId - The ticket ID
   * @param user - The user ID
   * @returns Promise that resolves when status is provided
   */
  async handleStatusRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    if (!ticketId) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Please provide a ticket ID. Example: `status ticket 12345` or `status #12345`',
        threadTs
      );
      return;
    }

    if (!this.zendeskService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Zendesk service is not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
      if (ticket) {
        await this.messagingService.sendMessage(
          channel,
          `📋 **Ticket #${ticketId} Status**\n` +
          `Status: ${ticket.status}\n` +
          `Priority: ${ticket.priority}\n` +
          `Subject: ${ticket.subject}\n` +
          `Assignee: ${ticket.assignee_id ? `ID: ${ticket.assignee_id}` : 'Unassigned'}`,
          threadTs
        );
      } else {
        await this.messagingService.sendMessage(
          channel,
          `❌ Ticket #${ticketId} not found.`,
          threadTs
        );
      }
    } catch (error) {
      console.error('Error fetching ticket status:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error fetching ticket #${ticketId}: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle summarize request command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param ticketId - The ticket ID
   * @param user - The user ID
   * @returns Promise that resolves when summary is provided
   */
  async handleSummarizeRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    if (!ticketId) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Please provide a ticket ID. Example: `summarize ticket 12345` or `summarize #12345`',
        threadTs
      );
      return;
    }

    if (!this.zendeskService || !this.aiService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Required services are not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
      if (ticket) {
        const summary = await this.aiService.summarizeTicket(ticket.description);
        await this.messagingService.sendMessage(
          channel,
          `📝 **Ticket #${ticketId} Summary**\n${summary}`,
          threadTs
        );
      } else {
        await this.messagingService.sendMessage(
          channel,
          `❌ Ticket #${ticketId} not found.`,
          threadTs
        );
      }
    } catch (error) {
      console.error('Error summarizing ticket:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error summarizing ticket #${ticketId}: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle list tickets request command
   * @param channel - The channel ID
   * @param user - The user ID
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when tickets are listed
   */
  async handleListTicketsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    if (!this.zendeskService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Zendesk service is not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      const tickets = await this.zendeskService.getRecentTickets(10);
      if (tickets && tickets.length > 0) {
        const ticketList = tickets.map(ticket => 
          `• #${ticket.id} - ${ticket.subject} (${ticket.status})`
        ).join('\n');
        
        await this.messagingService.sendMessage(
          channel,
          `📋 **Recent Tickets**\n${ticketList}`,
          threadTs
        );
      } else {
        await this.messagingService.sendMessage(
          channel,
          '📋 No recent tickets found.',
          threadTs
        );
      }
    } catch (error) {
      console.error('Error listing tickets:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error listing tickets: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle search tickets request command
   * @param channel - The channel ID
   * @param searchQuery - The search query
   * @param threadTs - Optional thread timestamp
   * @param user - The user ID
   * @returns Promise that resolves when search results are provided
   */
  async handleSearchTicketsRequest(channel: string, searchQuery: string, threadTs?: string, user?: string): Promise<void> {
    if (!searchQuery) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Please provide a search query. Example: `search login issues`',
        threadTs
      );
      return;
    }

    if (!this.zendeskService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Zendesk service is not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      const tickets = await this.zendeskService.searchTickets(searchQuery);
      if (tickets && tickets.length > 0) {
        const ticketList = tickets.slice(0, 10).map(ticket => 
          `• #${ticket.id} - ${ticket.subject} (${ticket.status})`
        ).join('\n');
        
        await this.messagingService.sendMessage(
          channel,
          `🔍 **Search Results for "${searchQuery}"**\n${ticketList}`,
          threadTs
        );
      } else {
        await this.messagingService.sendMessage(
          channel,
          `🔍 No tickets found for "${searchQuery}".`,
          threadTs
        );
      }
    } catch (error) {
      console.error('Error searching tickets:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error searching tickets: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle analytics request command
   * @param channel - The channel ID
   * @param user - The user ID
   * @param threadTs - Optional thread timestamp
   * @returns Promise that resolves when analytics are provided
   */
  async handleAnalyticsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    if (!this.zendeskService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Zendesk service is not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      const analytics = await this.zendeskService.getAnalytics();
      await this.messagingService.sendMessage(
        channel,
        `📊 **Analytics Summary**\n` +
        `Open Tickets: ${analytics.openTickets || 0}\n` +
        `Resolved Today: ${analytics.resolvedToday || 0}\n` +
        `Average Response Time: ${analytics.avgResponseTime || 'N/A'}`,
        threadTs
      );
    } catch (error) {
      console.error('Error fetching analytics:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error fetching analytics: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle help request command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param user - The user ID
   * @returns Promise that resolves when help is provided
   */
  async handleHelpRequest(channel: string, threadTs: string, user: string): Promise<void> {
    const helpMessage = this.messagingService.getHelpMessage();
    await this.messagingService.sendMessage(channel, helpMessage, threadTs);
  }

  /**
   * Handle unknown command
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param originalText - The original command text
   * @param user - The user ID
   * @returns Promise that resolves when response is sent
   */
  async handleUnknownCommand(channel: string, threadTs: string, originalText: string, user: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      `❓ I didn't understand that command. Type "help" to see available commands.\n\nYou said: "${originalText}"`,
      threadTs
    );
  }
}