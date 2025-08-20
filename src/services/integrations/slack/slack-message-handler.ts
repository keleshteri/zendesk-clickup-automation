import { SlackEvent, Env, TokenUsage } from '../../../types/index.js';
import { SlackCommandParser, SlackCommand } from './slack-command-parser.js';
import { SlackNotificationService } from './slack-notification-service.js';
import { SlackUtils } from './slack-utils.js';
import { AIService } from '../../ai/ai-service.js';
import { ZendeskService } from '../zendesk/zendesk.js';
import { MultiAgentService } from '../../multi-agent-service.js';
import { TaskGenie } from '../../task-genie.js';

export class SlackMessageHandler {
  private env: Env;
  private aiService: AIService;
  private zendeskService: ZendeskService;
  private multiAgentService: MultiAgentService | null = null;
  private taskGenie: TaskGenie | null = null;
  private clickupService: any = null;
  private notificationService: SlackNotificationService;

  constructor(
    env: Env,
    aiService: AIService,
    zendeskService: ZendeskService,
    notificationService: SlackNotificationService,
    multiAgentService?: MultiAgentService,
    taskGenie?: TaskGenie
  ) {
    this.env = env;
    this.aiService = aiService;
    this.zendeskService = zendeskService;
    this.notificationService = notificationService;
    this.multiAgentService = multiAgentService || null;
    this.taskGenie = taskGenie || null;
  }

  /**
   * Set ClickUp service instance
   */
  setClickUpService(clickupService: any): void {
    this.clickupService = clickupService;
  }

  /**
   * Handle Slack mention events
   */
  async handleMention(event: SlackEvent): Promise<void> {
    try {
      const { channel, text, thread_ts, ts, user } = event;
      const messageText = text || '';
      
      console.log('🎯 handleMention called:', {
        channel,
        user: event.user,
        bot_id: event.bot_id,
        text: text?.substring(0, 100),
        event_ts: ts
      });

      // Parse command-style queries first (slash commands, hashtag commands)
      const commandResult = SlackCommandParser.parseSlackCommand(messageText);
      
      if (commandResult.isCommand) {
        await this.handleSlackCommand(channel, thread_ts || ts, commandResult, user);
        return;
      }

      // Use TaskGenie for natural language processing if available
      if (this.taskGenie) {
        try {
          const sessionId = `slack_${channel}_${user}`;
          const response = await this.taskGenie.chat(messageText, user, sessionId);
          
          if (response.success && response.message) {
            await this.sendSlackResponse(channel, thread_ts || ts, response.message, response.data, response.tokenUsage, response.aiProvider);
          } else {
            await this.sendSlackResponse(channel, thread_ts || ts, 
              response.message || 'Sorry, I couldn\'t process your request. Please try again.', undefined, response.tokenUsage, response.aiProvider);
          }
          return;
        } catch (taskGenieError) {
          console.error('TaskGenie processing failed, falling back to legacy handlers:', taskGenieError);
          // Fall through to legacy handlers
        }
      }

      // Legacy keyword-based handling (fallback)
      await this.handleLegacyKeywordProcessing(channel, thread_ts || ts, messageText);
    } catch (error) {
      console.error('Error handling Slack mention:', error);
    }
  }

  /**
   * Handle parsed Slack commands
   */
  private async handleSlackCommand(channel: string, threadTs: string, commandResult: SlackCommand, user: string): Promise<void> {
    const { command, args, originalText } = commandResult;
    
    try {
      switch (command) {
        case 'help':
          await this.notificationService.sendCommandHelpMessage(channel, threadTs);
          break;
          
        case 'status':
          if (args.length > 0 && args[0] === 'ticket' && args[1]) {
            await this.handleStatusRequest(channel, threadTs, `status ticket ${args[1]}`);
          } else {
            await this.handleStatusRequest(channel, threadTs, originalText);
          }
          break;
          
        case 'analyze':
          if (args.length > 0 && args[0] === 'ticket' && args[1]) {
            await this.handleMultiAgentRequest(channel, threadTs, `analyze ticket ${args[1]}`);
          } else {
            await this.handleMultiAgentRequest(channel, threadTs, originalText);
          }
          break;
          
        case 'summarize':
          if (args.length > 0 && args[0] === 'ticket' && args[1]) {
            await this.handleSummarizeRequest(channel, threadTs, `summarize ticket ${args[1]}`);
          } else {
            await this.handleSummarizeRequest(channel, threadTs, originalText);
          }
          break;
          
        case 'list':
          if (args.length > 0 && args[0] === 'tickets') {
            await this.handleListTicketsRequest(channel, threadTs, originalText);
          } else {
            await this.sendSlackResponse(channel, threadTs, 
              '📋 Please specify what to list. Try: `@TaskGenie /list tickets` or `@TaskGenie #list tickets`');
          }
          break;
          
        case 'analytics':
          await this.handleAnalyticsRequest(channel, threadTs);
          break;
          
        case 'create':
          if (args.length > 0 && args[0] === 'task') {
            await this.handleCreateTaskRequest(channel, threadTs, originalText);
          } else {
            await this.sendSlackResponse(channel, threadTs, 
              '📝 Please specify what to create. Try: `@TaskGenie /create task from ticket 123`');
          }
          break;
          
        default:
          await this.sendSlackResponse(channel, threadTs, 
            `❓ Unknown command: \`${command}\`. Type \`@TaskGenie /help\` or \`@TaskGenie #help\` for available commands.`);
          break;
      }
    } catch (error) {
      console.error(`Error handling Slack command '${command}':`, error);
      await this.sendSlackResponse(channel, threadTs, 
        `❌ Sorry, there was an error processing the \`${command}\` command. Please try again.`);
    }
  }

  /**
   * Handle legacy keyword-based processing
   */
  private async handleLegacyKeywordProcessing(channel: string, threadTs: string, messageText: string): Promise<void> {
    const lowerText = messageText.toLowerCase();
    
    if (lowerText.includes('analyze') || lowerText.includes('process ticket') || lowerText.includes('multi-agent')) {
      await this.handleMultiAgentRequest(channel, threadTs, messageText);
    } else if (lowerText.includes('summarize') || lowerText.includes('summary')) {
      await this.handleSummarizeRequest(channel, threadTs, messageText);
    } else if (lowerText.includes('status') || lowerText.includes('what\'s the status')) {
      await this.handleStatusRequest(channel, threadTs, messageText);
    } else if (lowerText.includes('analytics') || lowerText.includes('insights') || lowerText.includes('report')) {
      await this.handleAnalyticsRequest(channel, threadTs);
    } else if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      await this.notificationService.sendHelpMessage(channel, threadTs);
    } else if (lowerText.includes('create task') || lowerText.includes('new task')) {
      await this.handleCreateTaskRequest(channel, threadTs, messageText);
    } else if (lowerText.includes('find ticket') || lowerText.includes('search ticket')) {
      await this.handleTicketSearchRequest(channel, threadTs, messageText);
    } else if (lowerText.includes('list tickets') || lowerText.includes('show tickets') || lowerText.includes('open tickets')) {
      await this.handleListTicketsRequest(channel, threadTs, messageText);
    } else {
      // General AI-powered response for other questions
      await this.handleGeneralQuestion(channel, threadTs, messageText);
    }
  }

  /**
   * Handle member joining channel event
   */
  async handleMemberJoined(event: SlackEvent, serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }): Promise<void> {
    try {
      const { channel, user, bot_id } = event;
      
      // Skip if any bot is joining (including TaskGenie)
      if (bot_id) {
        console.log('Bot joined channel, skipping welcome message');
        return;
      }
      
      // Get bot info to check if the joining user is TaskGenie itself
      try {
        const botInfoResponse = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (botInfoResponse.ok) {
          const botInfo: any = await botInfoResponse.json();
          if (botInfo.user_id === user) {
            // TaskGenie is joining - send intro message
            await this.notificationService.sendTaskGenieIntroMessage(channel, serviceStatuses);
            return;
          }
        }
      } catch (botInfoError) {
        console.error('Error getting bot info:', botInfoError);
      }
      
      // Send welcome message to new human users only
      await this.notificationService.sendUserWelcomeMessage(channel, user, serviceStatuses);
    } catch (error) {
      console.error('Error handling member joined event:', error);
    }
  }

  // Placeholder methods for request handlers - these would need to be implemented
  // based on the existing logic in the original slack.ts file
  
  private async handleStatusRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement status request handling
    await this.sendSlackResponse(channel, threadTs, '🔄 Status request handling - implementation needed');
  }

  private async handleMultiAgentRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement multi-agent request handling
    await this.sendSlackResponse(channel, threadTs, '🤖 Multi-agent analysis - implementation needed');
  }

  private async handleSummarizeRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement summarize request handling
    await this.sendSlackResponse(channel, threadTs, '📋 Summarize request - implementation needed');
  }

  private async handleAnalyticsRequest(channel: string, threadTs: string): Promise<void> {
    // TODO: Implement analytics request handling
    await this.sendSlackResponse(channel, threadTs, '📊 Analytics request - implementation needed');
  }

  private async handleCreateTaskRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement create task request handling
    await this.sendSlackResponse(channel, threadTs, '📝 Create task request - implementation needed');
  }

  private async handleTicketSearchRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement ticket search request handling
    await this.sendSlackResponse(channel, threadTs, '🔍 Ticket search request - implementation needed');
  }

  private async handleListTicketsRequest(channel: string, threadTs: string, text: string): Promise<void> {
    try {
      // Extract limit from message if specified
      const limitMatch = text.match(/(?:limit|show)\s+(\d+)/i);
      const limit = limitMatch ? Math.min(parseInt(limitMatch[1]), 20) : 10; // Max 20 for clean display
      
      await this.sendSlackResponse(channel, threadTs, '🔍 Fetching open tickets... Please wait.');

      // Get open tickets from Zendesk
      const tickets = await this.zendeskService.getTicketsByStatus(['new', 'open', 'pending'], limit);
      
      if (tickets.length === 0) {
        await this.sendSlackResponse(channel, threadTs, '✅ Great news! No open tickets found. All caught up! 🎉');
        return;
      }

      // Check ClickUp task associations for each ticket
      const ticketList = await Promise.all(
        tickets.map(async (ticket) => {
          const hasClickUpTask = await this.checkClickUpTaskExists(ticket.id.toString());
          return {
            ticket,
            hasClickUpTask
          };
        })
      );

      // Format the ticket list message
      const ticketListMessage = await this.formatTicketListMessage(ticketList, limit);
      
      await this.sendSlackResponse(channel, threadTs, ticketListMessage);
      
    } catch (error) {
      console.error('Error fetching ticket list:', error);
      await this.sendSlackResponse(channel, threadTs, '❌ Sorry, I encountered an error while fetching the ticket list. Please try again later.');
    }
  }

  private async handleGeneralQuestion(channel: string, threadTs: string, text: string): Promise<void> {
    // TODO: Implement general question handling
    await this.sendSlackResponse(channel, threadTs, '💬 General question handling - implementation needed');
  }

  /**
   * Send Slack response message
   */
  private async sendSlackResponse(
    channel: string,
    threadTs: string,
    message: string,
    data?: any,
    tokenUsage?: TokenUsage,
    aiProvider?: string
  ): Promise<void> {
    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ];

      // Add context footer with TaskGenie version, token usage and AI provider
      const footerText = SlackUtils.createTaskGenieFooter(tokenUsage, aiProvider);
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: footerText
        }]
      } as any);

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          thread_ts: threadTs,
          text: message,
          blocks
        })
      });

      const result = await response.json() as any;
      if (!result.ok) {
        console.error('Failed to send Slack response:', result.error);
      }
    } catch (error) {
      console.error('Error sending Slack response:', error);
    }
  }

  /**
   * Check if a Zendesk ticket has an associated ClickUp task
   */
  private async checkClickUpTaskExists(ticketId: string): Promise<boolean> {
    try {
      if (!this.env.TASK_MAPPING) {
        return false;
      }
      
      const mapping = await this.env.TASK_MAPPING.get(`ticket:${ticketId}`);
      return mapping !== null;
    } catch (error) {
      console.error(`Error checking ClickUp task for ticket ${ticketId}:`, error);
      return false;
    }
  }

  /**
   * Format the ticket list message with clean, easy-to-read display
   */
  private async formatTicketListMessage(
    ticketList: Array<{ ticket: any; hasClickUpTask: boolean }>,
    requestedLimit: number
  ): Promise<string> {
    const totalTickets = ticketList.length;
    const ticketsWithTasks = ticketList.filter(item => item.hasClickUpTask).length;
    const ticketsWithoutTasks = totalTickets - ticketsWithTasks;

    let message = `📋 *Open Tickets Summary*\n\n`;
    message += `📊 *Overview:* ${totalTickets} open tickets\n`;
    message += `✅ *With ClickUp Tasks:* ${ticketsWithTasks}\n`;
    message += `⚠️ *Missing ClickUp Tasks:* ${ticketsWithoutTasks}\n\n`;

    // Group tickets by status for better organization
    const ticketsByStatus = {
      new: ticketList.filter(item => item.ticket.status === 'new'),
      open: ticketList.filter(item => item.ticket.status === 'open'),
      pending: ticketList.filter(item => item.ticket.status === 'pending')
    };

    for (const [status, tickets] of Object.entries(ticketsByStatus)) {
      if (tickets.length === 0) continue;
      
      const statusEmoji = this.getStatusEmoji(status);
      message += `${statusEmoji} *${status.toUpperCase()} (${tickets.length})*\n`;
      
      tickets.forEach(({ ticket, hasClickUpTask }) => {
        const priorityEmoji = this.getPriorityEmoji(ticket.priority);
        const taskStatus = hasClickUpTask ? '✅' : '❌';
        const ticketUrl = this.zendeskService.getTicketUrl(ticket.id);
        
        // Truncate subject if too long
        const subject = ticket.subject.length > 50 
          ? ticket.subject.substring(0, 47) + '...'
          : ticket.subject;
        
        message += `  ${taskStatus} ${priorityEmoji} <${ticketUrl}|#${ticket.id}> ${subject}\n`;
      });
      message += '\n';
    }

    message += `💡 *Legend:*\n`;
    message += `• ✅ = Has ClickUp task\n`;
    message += `• ❌ = Missing ClickUp task\n`;
    message += `• 🔴 = Urgent • 🟠 = High • 🟡 = Normal • 🟢 = Low\n\n`;
    
    if (totalTickets >= requestedLimit) {
      message += `📝 *Note:* Showing first ${requestedLimit} tickets. Use \`@TaskGenie list tickets limit 20\` for more.`;
    }

    return message;
  }

  /**
   * Get emoji for ticket status
   */
  private getStatusEmoji(status: string): string {
    switch (status.toLowerCase()) {
      case 'new': return '🆕';
      case 'open': return '🔓';
      case 'pending': return '⏳';
      case 'solved': return '✅';
      case 'closed': return '🔒';
      default: return '📋';
    }
  }

  /**
   * Get emoji for ticket priority
   */
  private getPriorityEmoji(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'normal': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
}