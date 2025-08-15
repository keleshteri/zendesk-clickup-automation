import { SlackMessage, SlackEvent, TaskGenieContext, Env, TicketAnalysis, ZendeskTicket, AssignmentRecommendation, AIInsights } from '../types/index.js';
import { AIService } from './ai.js';
import { ZendeskService } from './zendesk';
import { MultiAgentService } from './multi-agent-service.js';
import { TaskGenie } from './task-genie.js';

interface SlackCommand {
  isCommand: boolean;
  command: string;
  args: string[];
  originalText: string;
}

export class SlackService {
  private env: Env;
  private aiService: AIService;
  private zendeskService: ZendeskService;
  private multiAgentService: MultiAgentService | null = null;
  private taskGenie: TaskGenie | null = null;

  constructor(env: Env, multiAgentService?: MultiAgentService, taskGenie?: TaskGenie) {
    this.env = env;
    this.aiService = new AIService(env);
    this.zendeskService = new ZendeskService(env);
    this.multiAgentService = multiAgentService || null;
    this.taskGenie = taskGenie || null;
  }

  /**
   * Parse Slack command-style queries (slash commands, hashtag commands)
   */
  private parseSlackCommand(text: string): SlackCommand {
    const trimmedText = text.trim();
    
    // Check for slash commands: /help, /analyze, /status, etc.
    const slashMatch = trimmedText.match(/^\/([a-zA-Z]+)(?:\s+(.*))?$/);
    if (slashMatch) {
      const command = slashMatch[1].toLowerCase();
      const argsString = slashMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    // Check for hashtag commands: #help, #analyze, #status, etc.
    const hashMatch = trimmedText.match(/^#([a-zA-Z]+)(?:\s+(.*))?$/);
    if (hashMatch) {
      const command = hashMatch[1].toLowerCase();
      const argsString = hashMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    // Check for simple command words at the start
    const simpleMatch = trimmedText.match(/^(help|status|analytics|list|analyze|summarize|create)(?:\s+(.*))?$/i);
    if (simpleMatch) {
      const command = simpleMatch[1].toLowerCase();
      const argsString = simpleMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    return {
      isCommand: false,
      command: '',
      args: [],
      originalText: trimmedText
    };
  }

  /**
   * Handle parsed Slack commands
   */
  private async handleSlackCommand(channel: string, threadTs: string, commandResult: SlackCommand, user: string): Promise<void> {
    const { command, args, originalText } = commandResult;
    
    try {
      switch (command) {
        case 'help':
          await this.sendHelpMessage(channel, threadTs);
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

  async sendTaskCreationMessage(
    channel: string,
    ticketId: string,
    ticketUrl: string,
    clickupTaskUrl: string,
    assigneeName?: string
  ): Promise<SlackMessage | null> {
    try {
      const message = {
        channel,
        text: `🧞 TaskGenie`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🧞 *TaskGenie*\n\nHi ${assigneeName || 'there'}! 👋\n\nI've created a task for this Zendesk ticket.`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Zendesk Ticket:*\n<${ticketUrl}|#${ticketId}>`
              },
              {
                type: 'mrkdwn',
                text: `*ClickUp Task:*\n<${clickupTaskUrl}|View Task>`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Need a summary of this ticket? Just reply to this thread and ask for \"summarize\" - I can help with that! 🤖`
            }
          }
        ]
      };

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const result = await response.json() as any;
      
      if (result.ok && result.message) {
        return {
          ts: result.message.ts,
          channel: result.channel,
          text: result.message.text || '',
          user: result.message.user || 'bot',
          thread_ts: result.message.thread_ts
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      return null;
    }
  }

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
      const commandResult = this.parseSlackCommand(messageText);
      
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
            await this.sendSlackResponse(channel, thread_ts || ts, response.message, response.data);
          } else {
            await this.sendSlackResponse(channel, thread_ts || ts, 
              response.message || 'Sorry, I couldn\'t process your request. Please try again.');
          }
          return;
        } catch (taskGenieError) {
          console.error('TaskGenie processing failed, falling back to legacy handlers:', taskGenieError);
          // Fall through to legacy handlers
        }
      }

      // Legacy keyword-based handling (fallback)
      const lowerText = messageText.toLowerCase();
      if (lowerText.includes('analyze') || lowerText.includes('process ticket') || lowerText.includes('multi-agent')) {
        await this.handleMultiAgentRequest(channel, thread_ts || ts, text);
      } else if (lowerText.includes('summarize') || lowerText.includes('summary')) {
        await this.handleSummarizeRequest(channel, thread_ts || ts, text);
      } else if (lowerText.includes('status') || lowerText.includes('what\'s the status')) {
        await this.handleStatusRequest(channel, thread_ts || ts, text);
      } else if (lowerText.includes('analytics') || lowerText.includes('insights') || lowerText.includes('report')) {
        await this.handleAnalyticsRequest(channel, thread_ts || ts);
      } else if (lowerText.includes('help') || lowerText.includes('what can you do')) {
        await this.sendHelpMessage(channel, thread_ts || ts);
      } else if (lowerText.includes('create task') || lowerText.includes('new task')) {
        await this.handleCreateTaskRequest(channel, thread_ts || ts, messageText);
      } else if (lowerText.includes('find ticket') || lowerText.includes('search ticket')) {
        await this.handleTicketSearchRequest(channel, thread_ts || ts, messageText);
      } else if (lowerText.includes('list tickets') || lowerText.includes('show tickets') || lowerText.includes('open tickets')) {
        await this.handleListTicketsRequest(channel, thread_ts || ts, messageText);
      } else {
        // General AI-powered response for other questions
        await this.handleGeneralQuestion(channel, thread_ts || ts, messageText);
      }
    } catch (error) {
      console.error('Error handling Slack mention:', error);
    }
  }

  // Handle member joining channel event
  async handleMemberJoined(event: SlackEvent): Promise<void> {
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
            await this.sendTaskGenieIntroMessage(channel);
            return;
          }
        }
      } catch (botInfoError) {
        console.error('Error getting bot info:', botInfoError);
      }
      
      // Send welcome message to new human users only
      await this.sendUserWelcomeMessage(channel, user);
    } catch (error) {
      console.error('Error handling member joined event:', error);
    }
  }



  async sendTaskGenieIntroMessage(channel: string): Promise<void> {
    try {
      const message = {
        channel,
        text: `🧞 TaskGenie has joined the channel!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧞 TaskGenie has joined!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Hi everyone! 👋\n\nI'm *TaskGenie*, your AI-powered task automation assistant. I'm here to help streamline your workflow between Zendesk and ClickUp!`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🎯 What I can do for you:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries and analysis\n• 📊 Generate insights and analytics reports\n• 🔍 Help you search and find tickets\n• 🤖 Answer questions about your tickets and tasks\n• 🔗 Keep everything connected with smart automation'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*💬 How to interact with me:*\n• Mention me with `@TaskGenie` followed by your question\n• Ask for help: `@TaskGenie help`\n• List open tickets: `@TaskGenie list tickets`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to boost your productivity?* Just mention @TaskGenie and I\'ll assist!'
            }
          }
        ]
      };

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error sending TaskGenie intro message:', error);
    }
  }

  async sendUserWelcomeMessage(channel: string, user: string): Promise<void> {
    try {
      const message = {
        channel,
        text: `🧞 Welcome to TaskGenie!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧞 Welcome to TaskGenie!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Hi <@${user}>! 👋\n\nI'm *TaskGenie*, your AI-powered task automation assistant. I'm here to help streamline your workflow between Zendesk and ClickUp!`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🎯 What I can do for you:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries and analysis\n• 📊 Generate insights and analytics reports\n• 🔍 Help you search and find tickets\n• 🤖 Answer questions about your tickets and tasks\n• 🔗 Keep everything connected with smart automation'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*💬 How to interact with me:*\n• Mention me with `@TaskGenie` followed by your question\n• Ask for help: `@TaskGenie help`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to get started?* Just mention @TaskGenie and I\'ll assist!'
            }
          }
        ]
      };

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error sending user welcome message:', error);
    }
  }

  // Enhanced AI Q&A methods
  private async handleSummarizeRequest(channel: string, threadTs: string, messageText?: string): Promise<void> {
    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '🤔 Let me analyze the ticket and create a summary for you...'
    });

    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (messageText) {
      const ticketMatch = messageText.match(/(?:ticket\s*#?|#)(\d+)/i);
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
        const ticketContent = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nTags: ${ticket.tags.join(', ')}`;
        const aiResponse = await this.aiService.summarizeTicket(ticketContent);
        
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `📋 *Ticket #${ticketId} Summary* (powered by ${this.aiService.getProviderName()})\n\n${aiResponse.summary}`
        });
      } else {
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `❌ Sorry, I couldn't find ticket #${ticketId}. Please check if the ticket ID is correct and exists in Zendesk.`
        });
      }
    } else {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie summarize ticket #27`\n• `@TaskGenie summarize 27`\n• Or reply to a TaskGenie message in a thread.'
      });
    }
  }

  private async handleStatusRequest(channel: string, threadTs: string, messageText?: string): Promise<void> {
    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (messageText) {
      const ticketMatch = messageText.match(/(?:ticket\s*#?|#)(\d+)/i);
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
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `📊 *Ticket Status Update*\n\n🎫 *Ticket #${ticket.id}*\n• Status: ${ticket.status.toUpperCase()}\n• Priority: ${ticket.priority.toUpperCase()}\n• Updated: ${new Date(ticket.updated_at).toLocaleString()}\n• Tags: ${ticket.tags.join(', ') || 'None'}`
        });
      } else {
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `❌ Sorry, I couldn't find ticket #${ticketId}. Please check if the ticket ID is correct and exists in Zendesk.`
        });
      }
    } else {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie status ticket #27`\n• `@TaskGenie status 27`\n• Or reply to a TaskGenie message in a thread.'
      });
    }
  }

  private async handleAnalyticsRequest(channel: string, threadTs: string): Promise<void> {
    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '📊 *Analytics & Insights*\n\nI can provide various analytics reports:\n• Daily ticket insights\n• Team workload analysis\n• Priority distribution\n• Sentiment trends\n\nFor detailed analytics, please check your configured analytics channels or ask for specific metrics!'
    });
  }

  private async handleMultiAgentRequest(channel: string, threadTs: string, messageText?: string): Promise<void> {
    // Check if multi-agent service is available
    if (!this.multiAgentService) {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ Multi-agent analysis is currently unavailable. Please try again later or contact your administrator.'
      });
      return;
    }

    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '🤖 Let me analyze this ticket with our multi-agent system...'
    });

    let ticketId: string | null = null;
    
    // First, try to extract ticket ID from the user's message
    if (messageText) {
      const ticketMatch = messageText.match(/(?:ticket\s*#?|#)(\d+)/i);
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
        
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: agentFeedback
        });
      } catch (error) {
        console.error('Error in multi-agent processing:', error);
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `❌ An error occurred while processing ticket #${ticketId} with the multi-agent system. Please try again later.`
        });
      }
    } else {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ I couldn\'t find a ticket ID. Please specify a ticket number like:\n• `@TaskGenie analyze ticket #27`\n• `@TaskGenie process ticket 27`\n• Or reply to a TaskGenie message in a thread.'
      });
    }
  }

  private async handleCreateTaskRequest(channel: string, threadTs: string, messageText: string): Promise<void> {
    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '🎯 *Create Task*\n\nI automatically create ClickUp tasks when new Zendesk tickets are received. If you need to manually create a task, please:\n\n1. Provide the Zendesk ticket URL or ID\n2. I\'ll analyze the ticket and create the corresponding ClickUp task\n\nExample: `@TaskGenie create task for ticket #12345`'
    });
  }

  private async handleTicketSearchRequest(channel: string, threadTs: string, messageText: string): Promise<void> {
    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '🔍 *Ticket Search*\n\nI can help you find tickets! Try:\n• `@TaskGenie find ticket #12345`\n• `@TaskGenie search tickets with tag "urgent"`\n• `@TaskGenie find tickets from customer@example.com`\n\nWhat specific ticket are you looking for?'
    });
  }

  private async handleListTicketsRequest(channel: string, threadTs: string, messageText: string): Promise<void> {
    try {
      // Extract limit from message if specified
      const limitMatch = messageText.match(/(?:limit|show)\s+(\d+)/i);
      const limit = limitMatch ? Math.min(parseInt(limitMatch[1]), 20) : 10; // Max 20 for clean display
      
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '🔍 Fetching open tickets... Please wait.'
      });

      // Get open tickets from Zendesk
      const tickets = await this.zendeskService.getTicketsByStatus(['new', 'open', 'pending'], limit);
      
      if (tickets.length === 0) {
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: '✅ Great news! No open tickets found. All caught up! 🎉'
        });
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
      
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: ticketListMessage
      });
      
    } catch (error) {
      console.error('Error fetching ticket list:', error);
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ Sorry, I encountered an error while fetching the ticket list. Please try again later.'
      });
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
    ticketList: Array<{ ticket: ZendeskTicket; hasClickUpTask: boolean }>,
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

  private async handleGeneralQuestion(channel: string, threadTs: string, messageText: string): Promise<void> {
    // Use AI to provide intelligent responses to general questions
    try {
      const aiPrompt = `You are TaskGenie, an AI assistant that helps with Zendesk and ClickUp integration. A user asked: "${messageText}". Provide a helpful, concise response about how you can assist with their workflow, ticket management, or task automation. Keep it friendly and professional.`;
      
      const aiResponse = await this.aiService.generateResponse(aiPrompt);
      
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: `🤖 ${aiResponse || 'I\'m here to help with your Zendesk and ClickUp workflow! Try asking me about ticket summaries, status updates, or say "help" to see what I can do.'}`
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      await this.sendHelpMessage(channel, threadTs);
    }
  }

  async sendHelpMessage(channel: string, threadTs?: string): Promise<void> {
    try {
      console.log('📖 Sending help message to channel:', channel, 'thread:', threadTs);
      const message = {
        channel,
        thread_ts: threadTs,
        text: `🧞 TaskGenie Help`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧞 TaskGenie Help'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `I'm your AI-powered task automation assistant! Here's what I can do:`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🎯 Core Features:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries and analysis\n• 📊 Generate insights and analytics reports\n• 🔍 Help you search and find tickets\n• 🤖 Answer questions about your workflow\n• 🔗 Keep everything connected with smart automation'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*💬 Command Formats:*\n• Slash commands: `@TaskGenie /help`, `@TaskGenie /analyze ticket 27`\n• Hashtag commands: `@TaskGenie #help`, `@TaskGenie #analyze ticket 27`\n• Natural language: `@TaskGenie analyze ticket 27`\n• Simple commands: `@TaskGenie help`, `@TaskGenie status`'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🎯 Available Commands:*\n• `/help` or `#help` - Show this help message\n• `/status` or `#status` - Check system status\n• `/status ticket 123` - Check specific ticket status\n• `/analyze ticket 123` - Multi-agent ticket analysis\n• `/summarize ticket 123` - Get ticket summary\n• `/list tickets` - Show open tickets\n• `/analytics` - Get insights and analytics\n• `/create task from ticket 123` - Create ClickUp task'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🗣️ Natural Language Examples:*\n• `How many open tickets are there?`\n• `Show me ticket 12345`\n• `What\'s the status of all tickets?`\n• `Search for recent tickets`\n• `Get insights`\n• Ask me any question about your tickets or workflow!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to boost your productivity?* Choose your preferred command style - they all work!'
            }
          }
        ]
      };

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error sending help message:', error);
    }
  }

  // Phase 1: Enhanced Intelligent Notifications
  async sendIntelligentNotification(
    ticket: ZendeskTicket,
    analysis: TicketAnalysis,
    clickupTaskUrl: string,
    assignment?: AssignmentRecommendation
  ): Promise<SlackMessage | null> {
    try {
      const urgencyEmoji = this.getUrgencyEmoji(analysis.sentiment, analysis.priority);
      const categoryEmoji = this.getCategoryEmoji(analysis.category);
      const teamChannel = this.getTeamChannel(analysis.suggested_team);
      
      console.log('📍 Slack notification details:', {
        suggested_team: analysis.suggested_team,
        target_channel: teamChannel,
        ticket_id: ticket.id
      });
      
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${urgencyEmoji} ${categoryEmoji} New ${analysis.category} ticket`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket*: <${ticket.url}|#${ticket.id}>`
            },
            {
              type: 'mrkdwn',
              text: `*Task*: <${clickupTaskUrl}|View in ClickUp>`
            },
            {
              type: 'mrkdwn',
              text: `*Priority*: ${analysis.priority.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Sentiment*: ${analysis.sentiment}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Summary*: ${analysis.summary}`
          }
        }
      ];
      
      // Add urgency indicators if present
      if (analysis.urgency_indicators.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Urgency Indicators*: ${analysis.urgency_indicators.join(', ')}`
          }
        });
      }
      
      // Add assignment recommendation if available
      if (assignment) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎯 *AI Recommendation*: Assign to ${assignment.team} team (${(assignment.confidence * 100).toFixed(1)}% confidence)\n*Reason*: ${assignment.reason}`
          }
        });
      }
      
      // Add action items
      if (analysis.action_items.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Action Items*:\n${analysis.action_items.map(item => `• ${item}`).join('\n')}`
          }
        });
      }
      
      const message = {
        channel: teamChannel,
        text: `${urgencyEmoji} New ${analysis.category} ticket #${ticket.id}`,
        blocks
      };
      
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      const result = await response.json() as any;
      
      if (result.ok && result.message) {
        console.log('✅ Slack message sent successfully:', {
          channel: result.channel,
          ts: result.message.ts
        });
        return {
          ts: result.message.ts,
          channel: result.channel,
          text: result.message.text || '',
          user: result.message.user || 'bot',
          thread_ts: result.message.thread_ts
        };
      } else {
        console.error('❌ Slack API error:', {
          ok: result.ok,
          error: result.error,
          warning: result.warning,
          response_metadata: result.response_metadata
        });
      }
      
      return null;
    } catch (error) {
      console.error('💥 Failed to send intelligent Slack notification:', error);
      return null;
    }
  }
  
  async sendDailyInsights(insights: AIInsights): Promise<void> {
    try {
      const channel = this.env.SLACK_MANAGEMENT_CHANNEL || '#management';
      
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Daily Insights - ${insights.period}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Tickets*: ${insights.total_tickets}`
            },
            {
              type: 'mrkdwn',
              text: `*High Priority*: ${insights.trends.priority_distribution.high || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Urgent*: ${insights.trends.priority_distribution.urgent || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Technical Issues*: ${insights.trends.category_breakdown.technical || 0}`
            }
          ]
        }
      ];
      
      // Add priority distribution
      const priorityText = Object.entries(insights.trends.priority_distribution)
        .map(([priority, count]) => `${priority}: ${count}`)
        .join(' | ');
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📈 *Priority Distribution*: ${priorityText}`
        }
      });
      
      // Add alerts
      if (insights.alerts.length > 0) {
        const alertText = insights.alerts
          .map(alert => `${this.getAlertEmoji(alert.severity)} ${alert.message}`)
          .join('\n');
        
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🚨 Alerts*:\n${alertText}`
          }
        });
      }
      
      // Add recommendations
      if (insights.recommendations.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*💡 Recommendations*:\n${insights.recommendations.map(rec => `• ${rec}`).join('\n')}`
          }
        });
      }
      
      const message = {
        channel,
        text: `📊 Daily Insights - ${insights.period}`,
        blocks
      };
      
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
    } catch (error) {
      console.error('Failed to send daily insights to Slack:', error);
    }
  }
  
  private getUrgencyEmoji(sentiment: string, priority: string): string {
    if (priority === 'urgent' || sentiment === 'angry') return '🚨';
    if (priority === 'high' || sentiment === 'frustrated') return '⚠️';
    if (sentiment === 'happy') return '😊';
    return '📋';
  }
  
  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'technical': '🔧',
      'billing': '💰',
      'bug': '🐛',
      'feature': '✨',
      'account': '👤',
      'general': '💬'
    };
    return emojiMap[category] || '📋';
  }
  
  private getTeamChannel(team: string): string {
    // Default to #zendesk-clickup-automation for all notifications
    const defaultChannel = '#zendesk-clickup-automation';
    
    const channelMap: Record<string, string> = {
      'development': this.env.SLACK_DEVELOPMENT_CHANNEL || defaultChannel,
      'support': this.env.SLACK_SUPPORT_CHANNEL || defaultChannel,
      'billing': this.env.SLACK_BILLING_CHANNEL || defaultChannel,
      'management': this.env.SLACK_MANAGEMENT_CHANNEL || defaultChannel
    };
    
    return channelMap[team] || this.env.SLACK_DEFAULT_CHANNEL || defaultChannel;
  }
  
  private getAlertEmoji(severity: string): string {
    const emojiMap: Record<string, string> = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojiMap[severity] || '⚪';
  }

  private async getTaskGenieContext(channel: string, threadTs: string): Promise<TaskGenieContext | null> {
    try {
      // In a real implementation, you'd store this context in KV storage
      // For now, we'll try to parse it from the original message
      const response = await fetch('https://slack.com/api/conversations.replies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          ts: threadTs,
          limit: 1
        })
      });

      const result = await response.json() as any;
      
      if (result.ok && result.messages && result.messages.length > 0) {
        const message = result.messages[0];
        // Try to extract ticket ID from the message text
        const ticketMatch = message.text?.match(/#(\d+)/);
        if (ticketMatch) {
          return {
            ticketId: ticketMatch[1],
            channel,
            threadTs
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting TaskGenie context:', error);
      return null;
    }
  }

  async sendMessage(message: { channel: string; text: string; thread_ts?: string }): Promise<void> {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: message.channel,
          text: message.text,
          thread_ts: message.thread_ts
        })
      });

      const result = await response.json() as any;
      if (!result.ok) {
        console.error('Failed to send Slack message:', result.error);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }
  }

  private async sendSlackResponse(channel: string, threadTs: string, response: string, data?: any): Promise<void> {
    try {
      let blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🧞 *TaskGenie*\n\n${response}`
          }
        }
      ];

      // Add data visualization if available
      if (data) {
        if (data.tickets && Array.isArray(data.tickets)) {
          const ticketFields = data.tickets.slice(0, 5).map((ticket: any) => ({
            type: 'mrkdwn',
            text: `*#${ticket.id}*: ${ticket.subject?.substring(0, 50)}...`
          }));
          
          if (ticketFields.length > 0) {
            blocks.push({
              type: 'section',
              fields: ticketFields
            });
          }
        }
        
        if (data.count !== undefined) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `📊 *Count*: ${data.count}`
            }
          });
        }
        
        if (data.insights) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `💡 *Insights*: ${data.insights}`
            }
          });
        }
      }

      const message = {
        channel,
        text: `🧞 TaskGenie: ${response}`,
        blocks,
        thread_ts: threadTs
      };

      const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!slackResponse.ok) {
        console.error('Failed to send TaskGenie response to Slack:', await slackResponse.text());
      }
    } catch (error) {
      console.error('Error sending TaskGenie response to Slack:', error);
      // Fallback to simple text message
      await this.sendMessage({
        channel,
        text: `🧞 TaskGenie: ${response}`,
        thread_ts: threadTs
      });
    }
  }
  async verifyRequest(body: string, timestamp: string, signature: string): Promise<boolean> {
    try {
      // Slack request verification using signing secret
      const signingSecret = this.env.SLACK_SIGNING_SECRET;
      if (!signingSecret) {
        console.warn('SLACK_SIGNING_SECRET not configured');
        return false;
      }

      // Create the signature base string
      const sigBaseString = `v0:${timestamp}:${body}`;
      
      // Create HMAC using Web Crypto API (compatible with Cloudflare Workers)
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(signingSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature_buffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(sigBaseString)
      );
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signature_buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const expectedSignature = `v0=${hashHex}`;
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      return false;
    }
  }
}