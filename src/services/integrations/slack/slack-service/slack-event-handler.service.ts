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
import { IAIService, IZendeskService, IClickUpService, IExternalServices } from '../../../../interfaces/service-interfaces';

/**
 * Service responsible for handling Slack events
 */
export class SlackEventHandler {
  private client: WebClient;
  private messagingService: SlackMessagingService;
  private botManager: SlackBotManager;
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
  }

  /**
   * Set additional services after initialization
   * @param services - Services object containing AI, Zendesk, and ClickUp services
   */
  setServices(services: IExternalServices): void {
    this.aiService = services.ai;
    this.zendeskService = services.zendesk;
    this.clickupService = services.clickup;
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
   * Check if the text appears to be a natural language query
   * @param cleanText - The cleaned message text to check
   * @returns True if the message appears to be a natural language query
   */
  private isNaturalLanguageQuery(cleanText: string): boolean {
    // Patterns that indicate natural language queries
    const naturalLanguagePatterns = [
      /show\s+me\s+ticket/,
      /get\s+(details|info)\s+for\s+ticket/,
      /what'?s\s+the\s+status\s+of\s+ticket/,
      /find\s+ticket/,
      /look\s+up\s+ticket/,
      /display\s+ticket/,
      /ticket\s*#?\d+/,
      /show\s+(recent|latest)\s+tickets/,
      /list\s+(urgent|high\s+priority)\s+tickets/,
      /create\s+(task|ticket)/,
      /make\s+a\s+(task|ticket)/,
      // Help and search-related queries
      /how\s+(do\s+i|to)\s+search\s+(for\s+)?tickets?/,
      /how\s+(do\s+i|to)\s+(find|look\s+up)\s+tickets?/,
      /how\s+(do\s+i|to)\s+use\s+(this|the\s+bot)/,
      /what\s+can\s+(i|you)\s+do/,
      /search\s+(for\s+)?tickets?/,
      /find\s+tickets?/,
      /help\s+(with\s+)?(searching|finding)\s+tickets?/,
      /show\s+me\s+how\s+to/,
      /what\s+commands\s+(are\s+)?available/
    ];
    
    return naturalLanguagePatterns.some(pattern => pattern.test(cleanText));
  }

  /**
   * Handle natural language queries using AI service
   * @param channel - The channel ID where the query was issued
   * @param threadTs - The thread timestamp for replies
   * @param originalText - The original message text
   * @param user - The user ID who issued the query
   * @returns Promise that resolves when query is handled
   */
  private async handleNaturalLanguageQuery(
    channel: string,
    threadTs: string,
    originalText: string,
    user: string
  ): Promise<void> {
    try {
      // Remove bot mentions from the text for processing
      const cleanText = originalText.replace(/<@U[A-Z0-9]+>/g, '').trim().toLowerCase();
      
      // Check for help-related queries first (fallback mechanism)
      if (this.isHelpQuery(cleanText)) {
        console.log(`Detected help query: "${originalText}"`);
        await this.handleDirectHelpQuery(cleanText, channel, threadTs, user);
        return;
      }
      
      // Get AI service from the service container
      const aiService = this.getAIService();
      
      if (!aiService) {
        console.warn('AI service not available for natural language processing');
        await this.messagingService.sendErrorMessage(
           channel,
           'service_unavailable',
           {
             errorMessage: 'Natural language processing is currently unavailable.',
             suggestions: ['Please try using specific commands like `help` to see available options.'],
             showHelpAction: true
           },
           threadTs
         );
        return;
      }

      console.log(`Processing natural language query from user ${user}: "${originalText}"`);
      
      // Classify user intent using AI
      const nlpResponse = await aiService.classifyIntent(cleanText);
      const { intent, confidence, entities } = nlpResponse;
      
      console.log(`Intent classified: ${intent} (confidence: ${confidence})`);
      console.log(`Entities found:`, JSON.stringify(entities, null, 2));
      console.log(`Original text: "${originalText}", Clean text: "${cleanText}"`);
      
      
      // Handle low confidence responses with fallback help detection
      if (confidence < 0.6) {
        // Check again for help queries in case AI missed it
        if (this.isHelpQuery(cleanText)) {
          await this.handleDirectHelpQuery(cleanText, channel, threadTs, user);
          return;
        }
        
        await this.messagingService.sendMessage(
          channel,
          "I'm not sure I understand. You can try using specific commands like `help` to see available options, or be more specific about what you're looking for.",
          threadTs
        );
        return;
      }
      
      // Route to appropriate handler based on intent
       await this.routeNaturalLanguageIntent({ intent, confidence, entities, originalText }, channel, threadTs, user);
       
     } catch (error) {
       console.error('Error processing natural language query:', error);
       
       // Final fallback - check for help queries even in error cases
       const cleanText = originalText.replace(/<@U[A-Z0-9]+>/g, '').trim().toLowerCase();
       if (this.isHelpQuery(cleanText)) {
         await this.handleDirectHelpQuery(cleanText, channel, threadTs, user);
         return;
       }
       
       await this.messagingService.sendMessage(
         channel,
         'Sorry, I encountered an error processing your request. Please try again or use `help` to see available commands.',
         threadTs
       );
     }
   }

   /**
    * Get the AI service instance
    * @returns The AI service instance or undefined if not available
    */
   private getAIService(): IAIService | undefined {
     return this.aiService;
   }

   /**
    * Route natural language intent to appropriate handler
    * @param intent - The classified user intent
    * @param channel - The channel ID
    * @param threadTs - The thread timestamp
    * @param user - The user ID
    */
   private async routeNaturalLanguageIntent(
     intent: any,
     channel: string,
     threadTs: string,
     user: string
   ): Promise<void> {
     try {
       switch (intent.intent) {
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
          case 'help_search':
          case 'help_general':
            await this.handleHelpNaturalLanguage(intent, channel, threadTs);
            break;
            
          case 'general':
            await this.handleGeneralNaturalLanguage(intent, channel, threadTs);
            break;
            
          default:
            console.log(`Unhandled intent category: ${intent.intent}`);
            await this.messagingService.sendMessage(
              channel,
              "I understand your message but I'm not sure how to help with that. Try using `help` to see available commands.",
              threadTs
            );
       }
     } catch (error) {
       console.error('Error routing natural language intent:', error);
       await this.messagingService.sendMessage(
         channel,
         'Sorry, I encountered an error processing your request. Please try again.',
         threadTs
       );
     }
   }

   /**
    * Handle Zendesk queries from natural language
    */
   private async handleZendeskNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
     if (!this.zendeskService) {
       await this.messagingService.sendErrorMessage(
         channel,
         'service_unavailable',
         {
           errorMessage: 'Zendesk service is not available.',
           suggestions: ['Please try again later or contact support.'],
           showRetryAction: true
         },
         threadTs
       );
       return;
     }

     try {
       const { entities } = intent;
       
       if (entities?.find(e => e.type === 'ticket_id' || e.type === 'ticketId')) {
         // Query specific ticket
         const ticketIdEntity = entities.find(e => e.type === 'ticket_id' || e.type === 'ticketId');
         const ticketId = ticketIdEntity ? parseInt(ticketIdEntity.value) : null;
         
         if (ticketId) {
           const ticket = await this.zendeskService.getTicket(ticketId);
           
           if (ticket) {
             // Use the intelligent notification method for ticket information
             await this.messagingService.sendIntelligentNotification(
               channel,
               {
                 id: ticket.id.toString(),
                 subject: ticket.subject,
                 status: ticket.status,
                 priority: ticket.priority,
                 assignee: 'Unassigned', // TODO: Fetch assignee name from assignee_id
                 requester: {
                   name: 'Unknown', // TODO: Fetch requester name from requester_id
                   email: 'unknown@example.com' // TODO: Fetch requester email from requester_id
                 },
                 createdAt: ticket.created_at,
                 updatedAt: ticket.updated_at,
                 description: ticket.description || 'No description available',
                 tags: ticket.tags || [],
                 url: ticket.url
               },
               { isUpdate: false, previousData: null },
               threadTs
             );
           } else {
             // Use error message template for ticket not found
             await this.messagingService.sendErrorMessage(
               channel,
               'ticket_not_found',
               {
                 ticketId: ticketId.toString(),
                 errorMessage: `No Zendesk ticket matching ID ${ticketId} was found.`,
                 suggestions: ['Please verify the ticket ID and try again.'],
                 showRetryAction: true
               },
               threadTs
             );
           }
         }
       } else {
         // General ticket query
         const tickets = await this.zendeskService.searchTickets?.('') || [];
         
         if (tickets.length > 0) {
           // Use ticket summary template for multiple tickets
           const ticketSummaries = tickets.slice(0, 5).map(ticket => ({
             id: ticket.id.toString(),
             subject: ticket.subject,
             status: ticket.status,
             priority: ticket.priority,
             requester: 'Unknown', // TODO: Fetch requester name from requester_id
             assignee: 'Unassigned', // TODO: Fetch assignee name from assignee_id
             createdAt: ticket.created_at,
             url: ticket.url
           }));
           
           await this.messagingService.sendTicketSummaryMessage(
             channel,
             ticketSummaries,
             {
               totalCount: tickets.length,
               title: 'Recent Tickets',
               searchQuery: 'recent tickets'
             },
             threadTs
           );
         } else {
           await this.messagingService.sendErrorMessage(
             channel,
             'search_failed',
             {
               searchQuery: 'recent tickets',
               errorMessage: 'No tickets were found matching your query.',
               suggestions: ['Try creating a new ticket or check if there are any filters applied.'],
               showHelpAction: true
             },
             threadTs
           );
         }
       }
     } catch (error) {
       console.error('❌ Error handling Zendesk query:', error);
       
       // Provide more specific error messages based on error type
       let errorMessage = 'Sorry, I encountered an error while querying Zendesk. Please try again or use specific commands.';
       
       if (error instanceof Error) {
         console.error('Error details:', {
           message: error.message,
           stack: error.stack,
           name: error.name
         });
         
         // Check for specific AI service errors
         if (error.message.includes('AI service not properly initialized')) {
           errorMessage = '🤖 AI service is not properly configured. Please contact the administrator.';
           console.error('🚨 AI Service Configuration Issue: Check GOOGLE_GEMINI_API_KEY environment variable');
         } else if (error.message.includes('API key')) {
           errorMessage = '🔑 AI service authentication failed. Please contact the administrator.';
           console.error('🚨 AI Service Authentication Issue: Invalid or missing API key');
         } else if (error.message.includes('rate limit')) {
           errorMessage = '⏱️ AI service is temporarily busy. Please try again in a moment.';
           console.error('🚨 AI Service Rate Limit: Too many requests');
         } else if (error.message.includes('quota')) {
           errorMessage = '💰 AI service quota exceeded. Please contact the administrator.';
           console.error('🚨 AI Service Quota Issue: Usage limits exceeded');
         } else if (error.message.includes('generateContextualResponse is not a function')) {
           errorMessage = '🔧 AI service method not available. Please contact the administrator.';
           console.error('🚨 AI Service Method Missing: generateContextualResponse method not implemented');
         }
       }
       
       await this.messagingService.sendMessage(
         channel,
         errorMessage,
         threadTs
       );
     }
   }

   /**
    * Handle other natural language categories with basic responses
    */
   private async handleZendeskActionNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
     await this.messagingService.sendMessage(
       channel,
       'I understand you want to perform a Zendesk action. Please use specific commands like `help` for available options.',
       threadTs
     );
   }

   private async handleClickUpCreateNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
     await this.messagingService.sendMessage(
       channel,
       'I understand you want to create a ClickUp task. Please use specific commands like `help` for available options.',
       threadTs
     );
   }

   private async handleClickUpQueryNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
     await this.messagingService.sendMessage(
       channel,
       'I understand you want to query ClickUp. Please use specific commands like `help` for available options.',
       threadTs
     );
   }

   private async handleGeneralNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
     await this.messagingService.sendMessage(
       channel,
       'Hello! I can help you with Zendesk tickets and ClickUp tasks. Try asking me something like "Show me ticket #12345" or use `help` for available commands.',
       threadTs
     );
   }

   /**
     * Check if a query is help-related (fallback detection)
     * @param cleanText - The cleaned text to check
     * @returns True if the query appears to be help-related
     */
    private isHelpQuery(cleanText: string): boolean {
      // First check if this is an actual search command with a query
      const searchCommandPattern = /^search\s+tickets?\s+.+/;
      if (searchCommandPattern.test(cleanText)) {
        return false; // This is an actual search command, not a help query
      }
      
      const helpPatterns = [
        /how\s+(do\s+i|to)\s+search\s+(for\s+)?tickets?/,
        /how\s+(do\s+i|to)\s+(find|look\s+up)\s+tickets?/,
        /how\s+(do\s+i|to)\s+use\s+(this|the\s+bot)/,
        /what\s+can\s+(i|you)\s+do/,
        /^search\s+(for\s+)?tickets?$/,  // Only "search tickets" without query is help
        /^find\s+tickets?$/,            // Only "find tickets" without query is help
        /help\s+(with\s+)?(searching|finding)\s+tickets?/,
        /show\s+me\s+how\s+to/,
        /what\s+commands\s+(are\s+)?available/,
        /\bhelp\b/,
        /how\s+does\s+(this|it)\s+work/,
        /what\s+(can|should)\s+i\s+(do|ask)/
      ];
      
      return helpPatterns.some(pattern => pattern.test(cleanText));
    }

    /**
     * Handle help queries directly without AI processing
     * @param cleanText - The cleaned text of the query
     * @param channel - The channel ID where the query was issued
     * @param threadTs - The thread timestamp for replies
     * @returns Promise that resolves when help is provided
     */
    private async handleDirectHelpQuery(cleanText: string, channel: string, threadTs: string, user?: string): Promise<void> {
      let helpType: 'general' | 'ticket_commands' | 'search_tips' | 'troubleshooting' = 'general';
      
      // Determine help type based on keywords
      if (cleanText.includes('search') || cleanText.includes('find')) {
        helpType = 'search_tips';
      } else if (cleanText.includes('troubleshoot') || cleanText.includes('problem') || cleanText.includes('issue')) {
        helpType = 'troubleshooting';
      } else if (cleanText.includes('command') || cleanText.includes('ticket')) {
        helpType = 'ticket_commands';
      }
      
      console.log(`Providing direct help with type: ${helpType} for query: "${cleanText}"`);
      
      // Create user mention if user ID is provided
      const userMention = user ? `<@${user}>` : undefined;
      
      // Send the appropriate help message
      await this.messagingService.sendHelpMessage(channel, helpType, userMention, threadTs);
    }

    /**
     * Handle help-related natural language queries
     * @param intent - The classified intent with entities
     * @param channel - The channel ID where the query was issued
     * @param threadTs - The thread timestamp for replies
     * @returns Promise that resolves when help is provided
     */
    private async handleHelpNaturalLanguage(intent: any, channel: string, threadTs: string): Promise<void> {
      const { entities } = intent;
      
      // Determine the type of help requested based on entities or intent
      let helpType: 'general' | 'ticket_commands' | 'search_tips' | 'troubleshooting' = 'general';
      
      if (entities && entities.length > 0) {
        const helpEntity = entities.find((entity: any) => 
          entity.type === 'help_topic' || 
          entity.value.includes('search') || 
          entity.value.includes('find') ||
          entity.value.includes('ticket')
        );
        
        if (helpEntity) {
          if (helpEntity.value.includes('search') || helpEntity.value.includes('find')) {
            helpType = 'search_tips';
          } else if (helpEntity.value.includes('troubleshoot')) {
            helpType = 'troubleshooting';
          } else if (helpEntity.value.includes('ticket') || helpEntity.value.includes('command')) {
            helpType = 'ticket_commands';
          }
        }
      }
      
      // If the original query contains specific keywords, override helpType
      const originalText = intent.originalText?.toLowerCase() || '';
      if (originalText.includes('search') || originalText.includes('find')) {
        helpType = 'search_tips';
      } else if (originalText.includes('troubleshoot')) {
        helpType = 'troubleshooting';
      } else if (originalText.includes('command')) {
        helpType = 'ticket_commands';
      }
      
      console.log(`Providing help with type: ${helpType}`);
      
      // Send the appropriate help message
      await this.messagingService.sendHelpMessage(channel, helpType, threadTs);
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
   * Parse Slack command from mention text
   * @param text - The message text to parse
   * @returns Parsed SlackCommand object with action and parameters
   */
  private parseSlackCommand(text: string): SlackCommand {
    // Remove bot mentions and clean up text
    const cleanText = text
      .replace(/<@U[A-Z0-9]+>/g, '')
      .trim()
      .toLowerCase();

    // Parse different command types
    if (cleanText.includes('help')) {
      return { isCommand: true, command: 'help', args: [], originalText: text };
    } else if (cleanText.includes('search tickets')) {
      // Extract search query after 'search tickets'
      const searchMatch = cleanText.match(/search\s+tickets\s+(.+)/);
      const searchQuery = searchMatch ? searchMatch[1].trim() : '';
      return { isCommand: true, command: 'search_tickets', args: [searchQuery], originalText: text };
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
    } else if (this.isNaturalLanguageQuery(cleanText)) {
      // Route natural language queries to NLP processing
      return { isCommand: true, command: 'natural_language', args: [], originalText: text };
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
    _user: string
  ): Promise<void> {
    switch (command.command) {
      case 'help':
        await this.messagingService.sendHelpMessage(
          channel,
          'general',
          `<@${_user}>`,
          threadTs
        );
        break;
        
      case 'list_tickets':
        await this.handleListTicketsRequest(channel, _user, threadTs);
        break;
        
      case 'search_tickets':
        const searchQuery = command.args[0]; // Extract search query from args
        if (searchQuery && searchQuery.trim()) {
          await this.handleSearchTicketsRequest(channel, searchQuery.trim(), threadTs);
        } else {
          await this.messagingService.sendErrorMessage(
             channel,
             'invalid_input',
             {
               errorMessage: 'Please provide a search query.',
               suggestions: ['Example: `search tickets password reset`'],
               showHelpAction: true
             },
             threadTs
           );
        }
        break;
        
      case 'summarize_ticket':
        const ticketId = command.args[1]; // Extract ticket ID from args
        if (ticketId) {
          await this.handleSummarizeRequest(channel, threadTs, ticketId);
        } else {
          await this.messagingService.sendErrorMessage(
             channel,
             'invalid_input',
             {
               errorMessage: 'Please provide a ticket ID to summarize.',
               suggestions: ['Example: `summarize ticket #123`'],
               showHelpAction: true
             },
             threadTs
           );
        }
        break;
        
      case 'status_ticket':
        const statusTicketId = command.args[1]; // Extract ticket ID from args
        if (statusTicketId) {
          await this.handleStatusRequest(channel, threadTs, statusTicketId);
        } else {
          await this.messagingService.sendErrorMessage(
             channel,
             'invalid_input',
             {
               errorMessage: 'Please provide a ticket ID to check status.',
               suggestions: ['Example: `status ticket #123`'],
               showHelpAction: true
             },
             threadTs
           );
        }
        break;
        
      case 'analytics':
        await this.handleAnalyticsRequest(channel, _user, threadTs);
        break;
        
      case 'natural_language':
        await this.handleNaturalLanguageQuery(channel, threadTs, command.originalText, _user);
        break;
        
      default:
        await this.messagingService.sendErrorMessage(
           channel,
           'invalid_input',
           {
             errorMessage: `I didn't understand that command.`,
             suggestions: ['Type `help` to see available commands.'],
             showHelpAction: true
           },
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