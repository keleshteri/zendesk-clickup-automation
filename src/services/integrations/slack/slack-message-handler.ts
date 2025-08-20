import { SlackEvent, Env, TokenUsage } from '../../../types/index.js';
import { SlackCommandParser, SlackCommand } from './slack-command-parser.js';
import { SlackNotificationService } from './slack-notification-service.js';
import { SlackUtils } from './slack-utils.js';
import { AIService } from '../../ai/ai-service.js';
import { ZendeskService } from '../zendesk/zendesk.js';
import { MultiAgentService } from '../../multi-agent-service.js';
import { TaskGenie } from '../../task-genie.js';

interface TaskGenieContext {
  ticketId?: string;
  channel: string;
  threadTs?: string;
}

export class SlackMessageHandler {
  private env: Env;
  private aiService: AIService;
  private zendeskService: ZendeskService;
  private multiAgentService: MultiAgentService | null = null;
  private taskGenie: TaskGenie | null = null;
  private clickupService: any = null;
  private notificationService: SlackNotificationService;
  private slackService: any;

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
   * Set Slack service instance
   */
  setSlackService(slackService: any): void {
    this.slackService = slackService;
  }

  /**
   * Handle Slack mention events
   */
  async handleMention(event: SlackEvent): Promise<void> {
    try {
      const { channel, text, thread_ts, ts, user } = event;
      let messageText = text || '';
      
      messageText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
      
      console.log('🎯 handleMention called:', {
        channel,
        user: event.user,
        bot_id: event.bot_id,
        text: text?.substring(0, 100),
        cleanedText: messageText.substring(0, 100),
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



  // Placeholder methods for request handlers - these would need to be implemented
  // based on the existing logic in the original slack.ts file
  
  private async handleStatusRequest(channel: string, threadTs: string, text: string): Promise<void> {
    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (text) {
      const ticketMatch = text.match(/(?:ticket\s*#?|#)(\d+)/i);
      if (ticketMatch) {
        ticketId = ticketMatch[1];
      }
    }
    
    // If no ticket ID found in message, try to get context from thread
    if (!ticketId) {
      const context = await this.getTaskGenieContext(channel, threadTs);
      ticketId = context?.ticketId || null;
    }
    
    if (ticketId) {
      const ticket = await this.zendeskService.getTicketDetails(ticketId);
      
      if (ticket) {
        await this.sendSlackResponse(
          channel,
          threadTs,
          `📊 *Ticket Status Update*\n\n🎫 *Ticket #${ticket.id}*\n• Status: ${ticket.status.toUpperCase()}\n• Priority: ${ticket.priority.toUpperCase()}\n• Updated: ${new Date(ticket.updated_at).toLocaleString()}\n• Tags: ${ticket.tags.join(', ') || 'None'}`
        );
      } else {
        await this.sendSlackResponse(
          channel,
          threadTs,
          `❌ Sorry, I couldn't find ticket #${ticketId}. Please check if the ticket ID is correct and exists in Zendesk.`
        );
      }
    } else {
      await this.sendSlackResponse(
        channel,
        threadTs,
        '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie status ticket #27`\n• `@TaskGenie status 27`\n• Or reply to a TaskGenie message in a thread.'
      );
    }
  }

  private async handleMultiAgentRequest(channel: string, threadTs: string, text: string): Promise<void> {
    // Check if multi-agent service is available
    if (!this.multiAgentService) {
      await this.sendSlackResponse(
        channel,
        threadTs,
        '❌ Multi-agent analysis is currently unavailable. Please try again later or contact your administrator.'
      );
      return;
    }

    await this.sendSlackResponse(
      channel,
      threadTs,
      '🤖 Let me analyze this ticket with our multi-agent system...'
    );

    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (text) {
      const ticketMatch = text.match(/(?:ticket\s*#?|#)(\d+)/i);
      if (ticketMatch) {
        ticketId = ticketMatch[1];
      }
    }
    
    // If no ticket ID found in message, try to get context from thread
    if (!ticketId) {
      const context = await this.getTaskGenieContext(channel, threadTs);
      ticketId = context?.ticketId || null;
    }
    
    if (ticketId) {
      try {
        // Process ticket with multi-agent system
        const result = await this.multiAgentService.processTicket(ticketId);
        
        // Format agent feedback for Slack
        let agentFeedback = `🎯 *Multi-Agent Analysis for Ticket #${ticketId}*\n\n`;
        
        // Add workflow information
        if (result.workflow && result.workflow.context && result.workflow.context.insights) {
          agentFeedback += `📋 *Agent Workflow:*\n`;
          result.workflow.context.insights.forEach((insight: any, index: number) => {
            agentFeedback += `${index + 1}. **${insight.agentRole}**: ${insight.analysis}\n`;
            if (insight.recommendedActions && insight.recommendedActions.length > 0) {
              insight.recommendedActions.forEach((action: string) => {
                agentFeedback += `   • ${action}\n`;
              });
            }
          });
          agentFeedback += `\n`;
        }
        
        // Add final recommendations
        if (result.finalRecommendations && result.finalRecommendations.length > 0) {
          agentFeedback += `💡 *Final Recommendations:*\n`;
          result.finalRecommendations.forEach((rec: string) => {
            agentFeedback += `• ${rec}\n`;
          });
          agentFeedback += `\n`;
        }
        
        // Add agent involvement summary
        if (result.agentsInvolved && result.agentsInvolved.length > 0) {
          agentFeedback += `👥 *Agents Involved:* ${result.agentsInvolved.join(', ')}\n`;
        }
        
        if (result.confidence) {
          agentFeedback += `📊 *Confidence Score:* ${(result.confidence * 100).toFixed(1)}%\n`;
        }
        
        if (result.handoffCount !== undefined) {
          agentFeedback += `🔄 *Handoffs:* ${result.handoffCount}\n`;
        }
        
        if (result.processingTimeMs) {
          agentFeedback += `⏱️ *Processing Time:* ${result.processingTimeMs}ms`;
        }
        
        await this.sendSlackResponse(channel, threadTs, agentFeedback);
      } catch (error) {
        console.error('Error in multi-agent processing:', error);
        await this.sendSlackResponse(
          channel,
          threadTs,
          `❌ An error occurred while processing ticket #${ticketId} with the multi-agent system. Please try again later.`
        );
      }
    } else {
      await this.sendSlackResponse(
        channel,
        threadTs,
        '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie analyze ticket #27`\n• `@TaskGenie process ticket 27`\n• Or reply to a TaskGenie message in a thread.'
      );
    }
  }

  private async handleSummarizeRequest(channel: string, threadTs: string, text: string): Promise<void> {
    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (text) {
      const ticketMatch = text.match(/(?:ticket\s*#?|#)(\d+)/i);
      if (ticketMatch) {
        ticketId = ticketMatch[1];
      }
    }
    
    // If no ticket ID found in message, try to get context from thread
    if (!ticketId) {
      const context = await this.getTaskGenieContext(channel, threadTs);
      ticketId = context?.ticketId || null;
    }
    
    if (ticketId) {
      try {
        await this.sendSlackResponse(
          channel,
          threadTs,
          '📝 Let me analyze and summarize this ticket for you...'
        );
        
        // Get ticket details from Zendesk
        const ticket = await this.zendeskService.getTicket(parseInt(ticketId, 10));
        
        if (ticket) {
          // Create ticket content for AI summarization
          const ticketContent = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nRequester: ${ticket.requester_id}`;
          
          // Use AI service to summarize the ticket
          const summary = await this.aiService.summarizeTicket(ticketContent);
          
          const summaryMessage = `📋 *Ticket #${ticketId} Summary*\n\n${summary.summary}`;
          
          await this.sendSlackResponse(channel, threadTs, summaryMessage);
        } else {
          await this.sendSlackResponse(
            channel,
            threadTs,
            `❌ Ticket #${ticketId} not found. Please check the ticket number and try again.`
          );
        }
      } catch (error) {
        console.error('Error summarizing ticket:', error);
        await this.sendSlackResponse(
          channel,
          threadTs,
          `❌ An error occurred while summarizing ticket #${ticketId}. Please try again later.`
        );
      }
    } else {
      await this.sendSlackResponse(
        channel,
        threadTs,
        '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie summarize ticket #27`\n• `@TaskGenie summarize 27`\n• Or reply to a TaskGenie message in a thread.'
      );
    }
  }

  private async handleAnalyticsRequest(channel: string, threadTs: string): Promise<void> {
    const analyticsMessage = `📊 *TaskGenie Analytics*\n\nHere are the types of analytics reports available:\n\n• **Ticket Volume**: Daily/weekly/monthly ticket counts\n• **Response Times**: Average first response and resolution times\n• **Agent Performance**: Individual agent metrics\n• **Priority Distribution**: Breakdown by ticket priority\n• **Status Tracking**: Tickets by status over time\n• **ClickUp Integration**: Task creation and completion rates\n\nTo get specific analytics, please:\n• Check the #analytics channel for automated reports\n• Ask for specific metrics like "show me this week's ticket volume"\n• Request custom reports from your team lead`;
    
    await this.sendSlackResponse(channel, threadTs, analyticsMessage);
  }

  private async handleCreateTaskRequest(channel: string, threadTs: string, text: string): Promise<void> {
    const createTaskMessage = `✅ *Create ClickUp Task*\n\nTasks are automatically created from Zendesk tickets when they meet certain criteria.\n\nTo manually create a task:\n• Provide a ticket URL or ID\n• Example: \`@TaskGenie create task for ticket #123\`\n• Or: \`@TaskGenie create task https://yourcompany.zendesk.com/agent/tickets/123\`\n\nThe system will:\n• Extract ticket details\n• Create a ClickUp task\n• Link them together\n• Notify relevant team members`;
    
    await this.sendSlackResponse(channel, threadTs, createTaskMessage);
  }

  private async handleTicketSearchRequest(channel: string, threadTs: string, text: string): Promise<void> {
    const searchMessage = `🔍 *Search Tickets*\n\nHere are the ways you can search for tickets:\n\n**By Status:**\n• \`@TaskGenie list open tickets\`\n• \`@TaskGenie list pending tickets\`\n• \`@TaskGenie list solved tickets\`\n\n**By Priority:**\n• \`@TaskGenie list urgent tickets\`\n• \`@TaskGenie list high priority tickets\`\n• \`@TaskGenie list low priority tickets\`\n\n**By Assignee:**\n• \`@TaskGenie list my tickets\`\n• \`@TaskGenie list tickets assigned to john@company.com\`\n\n**By Date:**\n• \`@TaskGenie list tickets created today\`\n• \`@TaskGenie list tickets updated this week\`\n\n**By Keywords:**\n• \`@TaskGenie search tickets containing \"login issue\"\`\n• \`@TaskGenie find tickets about \"password reset\"\`\n\n**General Lists:**\n• \`@TaskGenie list tickets\` - Shows recent tickets\n• \`@TaskGenie show ticket #123\` - Get specific ticket details`;
    
    await this.sendSlackResponse(channel, threadTs, searchMessage);
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
    try {
      // Use AI service to generate a response
      const prompt = `You are TaskGenie, an AI assistant that helps with Zendesk and ClickUp integration. Provide helpful, concise responses about ticket management, task creation, and workflow automation.\n\nUser question: ${text}`;
      const response = await this.aiService.generateResponse(prompt);
      
      await this.sendSlackResponse(channel, threadTs, `🤖 ${response}`);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to help message
      const helpMessage = `❓ I'm here to help with Zendesk and ClickUp integration!\n\nHere are some things I can help you with:\n\n• **Ticket Management**: Get ticket status, summaries, and details\n• **Task Creation**: Create ClickUp tasks from Zendesk tickets\n• **Analytics**: View reports and metrics\n• **Multi-Agent Analysis**: Get AI-powered ticket insights\n• **Search**: Find tickets by various criteria\n\nTry asking me something like:\n• "How do I create a task from a ticket?"\n• "Show me the status of ticket #123"\n• "What analytics are available?"\n\nFor a full list of commands, just say "help" or "commands".`;
      
      await this.sendSlackResponse(channel, threadTs, helpMessage);
    }
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

  /**
   * Get TaskGenie context from thread
   */
  private async getTaskGenieContext(channel: string, threadTs: string): Promise<TaskGenieContext | null> {
    try {
      // Get the original message in the thread
      const result = await this.slackService.getConversationReplies(channel, threadTs);
      
      if (result && result.messages && result.messages.length > 0) {
        const originalMessage = result.messages[0];
        
        // Look for ticket ID in the original message
        if (originalMessage.text) {
          const ticketMatch = originalMessage.text.match(/(?:ticket\s*#?|#)(\d+)/i);
          if (ticketMatch) {
            return {
              ticketId: ticketMatch[1],
              channel: channel,
              threadTs: threadTs
            };
          }
        }
        
        // Look for ticket ID in message blocks
        if (originalMessage.blocks) {
          for (const block of originalMessage.blocks) {
            if (block.type === 'section' && block.text && block.text.text) {
              const ticketMatch = block.text.text.match(/(?:ticket\s*#?|#)(\d+)/i);
              if (ticketMatch) {
                return {
                  ticketId: ticketMatch[1],
                  channel: channel,
                  threadTs: threadTs
                };
              }
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting TaskGenie context:', error);
      return null;
    }
  }

  /**
   * Send message to Slack
   */
  private async sendMessage(message: { channel: string; text: string; thread_ts?: string }): Promise<void> {
    try {
      await this.slackService.sendMessage(message);
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }
}