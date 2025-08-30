/**
 * @ai-metadata
 * @component: SlackNLPProcessor
 * @description: Service for natural language processing in Slack interactions following SRP
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../interfaces", "../interfaces"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "NLP processing service following SRP principles"
 */

import { WebClient } from '@slack/web-api';
import type { ISlackNLPProcessor, ISlackMessagingService } from '../interfaces';
import { IAIService, IZendeskService, IClickUpService } from '../../../../interfaces/service-interfaces';

/**
 * Service responsible for natural language processing in Slack interactions
 * Follows SRP by focusing only on NLP and intent recognition
 * Implements ISlackNLPProcessor for LSP compliance
 */
export class SlackNLPProcessor implements ISlackNLPProcessor {
  private client: WebClient;
  private messagingService: ISlackMessagingService;
  private aiService?: IAIService;
  private zendeskService?: IZendeskService;
  private clickupService?: IClickUpService;

  /**
   * Initialize the NLP processor
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
   * Set external services for NLP processing
   * @param aiService - AI service for intent recognition
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
   * Check if text is a natural language query
   * @param text - The text to analyze
   * @returns True if it's a natural language query
   */
  isNaturalLanguageQuery(text: string): boolean {
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();
    
    // Check for question words
    const questionWords = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'would', 'should'];
    const hasQuestionWord = questionWords.some(word => cleanText.includes(word));
    
    // Check for question marks
    const hasQuestionMark = cleanText.includes('?');
    
    // Check for conversational patterns
    const conversationalPatterns = [
      'i need', 'i want', 'i would like', 'please', 'help me',
      'show me', 'tell me', 'find', 'search for', 'look for',
      'create', 'make', 'generate', 'update', 'change'
    ];
    const hasConversationalPattern = conversationalPatterns.some(pattern => cleanText.includes(pattern));
    
    // Check for specific command keywords (these are NOT natural language)
    const commandKeywords = ['status', 'summarize', 'list tickets', 'analytics', 'help'];
    const hasCommandKeyword = commandKeywords.some(keyword => cleanText.includes(keyword));
    
    // It's a natural language query if it has conversational elements but isn't a direct command
    return (hasQuestionWord || hasQuestionMark || hasConversationalPattern) && !hasCommandKeyword;
  }

  /**
   * Check if text is a help query
   * @param text - The text to analyze
   * @returns True if it's a help query
   */
  isHelpQuery(text: string): boolean {
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();
    
    const helpPatterns = [
      'help', 'what can you do', 'what do you do', 'how do i',
      'commands', 'usage', 'instructions', 'guide', 'tutorial'
    ];
    
    return helpPatterns.some(pattern => cleanText.includes(pattern));
  }

  /**
   * Process natural language query and extract intent
   * @param text - The text to process
   * @param user - The user ID making the query
   * @returns Promise that resolves to intent object
   */
  async processNaturalLanguageQuery(text: string, user: string): Promise<any> {
    if (!this.aiService) {
      throw new Error('AI service is not available for natural language processing');
    }

    try {
      console.log('🧠 Processing natural language query:', text);
      
      // Use AI service to extract intent from the natural language query
      const intent = await this.aiService.extractIntent(text, {
        user,
        context: 'slack_mention',
        availableServices: {
          zendesk: !!this.zendeskService,
          clickup: !!this.clickupService
        }
      });
      
      console.log('🎯 Extracted intent:', intent);
      return intent;
    } catch (error) {
      console.error('Error processing natural language query:', error);
      throw error;
    }
  }

  /**
   * Route natural language intent to appropriate handler
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param user - The user ID
   * @returns Promise that resolves when routing is complete
   */
  async routeNaturalLanguageIntent(intent: any, channel: string, threadTs: string, user: string): Promise<void> {
    try {
      console.log('🚦 Routing intent:', intent.type);
      
      switch (intent.type) {
        case 'zendesk_query':
          await this.handleZendeskNaturalLanguage(intent, channel, threadTs);
          break;
        case 'zendesk_action':
          await this.handleZendeskActionNaturalLanguage(intent, channel, threadTs);
          break;
        case 'clickup_create':
          await this.handleClickUpCreateNaturalLanguage(intent, channel, threadTs);
          break;
        case 'clickup_query':
          await this.handleClickUpQueryNaturalLanguage(intent, channel, threadTs);
          break;
        case 'help':
          await this.handleHelpNaturalLanguage(intent, channel, threadTs);
          break;
        case 'general':
        default:
          await this.handleGeneralNaturalLanguage(intent, channel, threadTs);
          break;
      }
    } catch (error) {
      console.error('Error routing natural language intent:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ I encountered an error while processing your request: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle direct help queries
   * @param text - The help query text
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param user - Optional user ID
   * @returns Promise that resolves when help is provided
   */
  async handleDirectHelpQuery(text: string, channel: string, threadTs: string, user?: string): Promise<void> {
    console.log('❓ Handling direct help query from user:', user);
    
    const helpMessage = this.messagingService.getHelpMessage();
    await this.messagingService.sendMessage(channel, helpMessage, threadTs);
  }

  /**
   * Handle Zendesk natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when query is handled
   */
  private async handleZendeskNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    if (!this.zendeskService) {
      await this.messagingService.sendMessage(
        channel,
        '❌ Zendesk service is not available. Please contact an administrator.',
        threadTs
      );
      return;
    }

    try {
      // Handle different types of Zendesk queries based on intent
      if (intent.action === 'search') {
        const tickets = await this.zendeskService.searchTickets(intent.query || intent.parameters?.query);
        if (tickets && tickets.length > 0) {
          const ticketList = tickets.slice(0, 5).map(ticket => 
            `• #${ticket.id} - ${ticket.subject} (${ticket.status})`
          ).join('\n');
          
          await this.messagingService.sendMessage(
            channel,
            `🔍 **Found ${tickets.length} tickets:**\n${ticketList}`,
            threadTs
          );
        } else {
          await this.messagingService.sendMessage(
            channel,
            '🔍 No tickets found matching your query.',
            threadTs
          );
        }
      } else if (intent.action === 'status' && intent.parameters?.ticketId) {
        const ticket = await this.zendeskService.getTicket(intent.parameters.ticketId);
        if (ticket) {
          await this.messagingService.sendMessage(
            channel,
            `📋 **Ticket #${intent.parameters.ticketId}**\n` +
            `Status: ${ticket.status}\n` +
            `Priority: ${ticket.priority}\n` +
            `Subject: ${ticket.subject}`,
            threadTs
          );
        } else {
          await this.messagingService.sendMessage(
            channel,
            `❌ Ticket #${intent.parameters.ticketId} not found.`,
            threadTs
          );
        }
      } else {
        await this.messagingService.sendMessage(
          channel,
          '🤔 I understand you want to do something with Zendesk, but I need more specific information. Try asking about a specific ticket number or search query.',
          threadTs
        );
      }
    } catch (error) {
      console.error('Error handling Zendesk natural language:', error);
      await this.messagingService.sendMessage(
        channel,
        `❌ Error processing Zendesk request: ${error}`,
        threadTs
      );
    }
  }

  /**
   * Handle Zendesk action natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when action is handled
   */
  private async handleZendeskActionNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '🔧 Zendesk actions through natural language are coming soon! For now, please use specific commands.',
      threadTs
    );
  }

  /**
   * Handle ClickUp create natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when creation is handled
   */
  private async handleClickUpCreateNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '📝 ClickUp task creation through natural language is coming soon! For now, please use the web interface.',
      threadTs
    );
  }

  /**
   * Handle ClickUp query natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when query is handled
   */
  private async handleClickUpQueryNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '📋 ClickUp queries through natural language are coming soon! For now, please use specific commands.',
      threadTs
    );
  }

  /**
   * Handle help natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when help is provided
   */
  private async handleHelpNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    const helpMessage = this.messagingService.getHelpMessage();
    await this.messagingService.sendMessage(channel, helpMessage, threadTs);
  }

  /**
   * Handle general natural language queries
   * @private
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @returns Promise that resolves when general response is sent
   */
  private async handleGeneralNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
    await this.messagingService.sendMessage(
      channel,
      '🤖 I understand you\'re asking something, but I\'m not sure how to help with that specific request. ' +
      'I can help with Zendesk tickets and ClickUp tasks. Type "help" to see what I can do!',
      threadTs
    );
  }
}