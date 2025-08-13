import { SlackMessage, SlackEvent, TaskGenieContext, Env, TicketAnalysis, ZendeskTicket, AssignmentRecommendation, AIInsights } from '../types/index.js';
import { AIService } from './ai.js';
import { ZendeskService } from './zendesk';

export class SlackService {
  private env: Env;
  private aiService: AIService;
  private zendeskService: ZendeskService;

  constructor(env: Env) {
    this.env = env;
    this.aiService = new AIService(env);
    this.zendeskService = new ZendeskService(env);
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
        text: `🧞‍♂️ TaskGenie`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🧞‍♂️ *TaskGenie*\n\nHi ${assigneeName || 'there'}! 👋\n\nI've created a task for this Zendesk ticket.`
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
      const { channel, text, thread_ts, ts } = event;
      const messageText = text?.toLowerCase() || '';

      // Enhanced AI Q&A capabilities
      if (messageText.includes('summarize') || messageText.includes('summary')) {
        await this.handleSummarizeRequest(channel, thread_ts || ts);
      } else if (messageText.includes('status') || messageText.includes('what\'s the status')) {
        await this.handleStatusRequest(channel, thread_ts || ts);
      } else if (messageText.includes('analytics') || messageText.includes('insights') || messageText.includes('report')) {
        await this.handleAnalyticsRequest(channel, thread_ts || ts);
      } else if (messageText.includes('help') || messageText.includes('what can you do')) {
        await this.sendHelpMessage(channel, thread_ts || ts);
      } else if (messageText.includes('create task') || messageText.includes('new task')) {
        await this.handleCreateTaskRequest(channel, thread_ts || ts, messageText);
      } else if (messageText.includes('find ticket') || messageText.includes('search ticket')) {
        await this.handleTicketSearchRequest(channel, thread_ts || ts, messageText);
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
      const { channel, user } = event;
      await this.sendWelcomeMessage(channel, user);
    } catch (error) {
      console.error('Error handling member joined event:', error);
    }
  }

  // Send welcome message when bot joins a channel or new member joins
  async sendWelcomeMessage(channel: string, userId?: string): Promise<void> {
    try {
      const userMention = userId ? `<@${userId}>` : 'everyone';
      
      const message = {
        channel,
        text: `🧞‍♂️ TaskGenie has joined the channel!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧞‍♂️ Welcome to TaskGenie!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Hi ${userMention}! 👋\n\nI'm *TaskGenie*, your AI-powered task automation assistant. I'm here to help streamline your workflow between Zendesk and ClickUp!`
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
              text: '*💬 How to interact with me:*\n• Mention me with `@TaskGenie` followed by your question\n• Ask for help: `@TaskGenie help`\n• Get ticket summaries: `@TaskGenie summarize`\n• Check status: `@TaskGenie status`\n• Get analytics: `@TaskGenie analytics`'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to get started?* Just mention me anytime you need assistance!'
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
      console.error('Error sending welcome message:', error);
    }
  }

  // Enhanced AI Q&A methods
  private async handleSummarizeRequest(channel: string, threadTs: string): Promise<void> {
    await this.sendMessage({
      channel,
      thread_ts: threadTs,
      text: '🤔 Let me analyze the ticket and create a summary for you...'
    });

    const context = await this.getTaskGenieContext(channel, threadTs);
    
    if (context?.ticketId) {
      const ticket = await this.zendeskService.getTicketDetails(context.ticketId);
      
      if (ticket) {
        const ticketContent = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nTags: ${ticket.tags.join(', ')}`;
        const aiResponse = await this.aiService.summarizeTicket(ticketContent);
        
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: `📋 *Ticket Summary* (powered by ${this.aiService.getProviderName()})\n\n${aiResponse.summary}`
        });
      } else {
        await this.sendMessage({
          channel,
          thread_ts: threadTs,
          text: '❌ Sorry, I couldn\'t retrieve the ticket details. Please check if the ticket still exists.'
        });
      }
    } else {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ I couldn\'t find the associated ticket information. Please make sure you\'re replying to a TaskGenie message.'
      });
    }
  }

  private async handleStatusRequest(channel: string, threadTs: string): Promise<void> {
    const context = await this.getTaskGenieContext(channel, threadTs);
    
    if (context?.ticketId) {
      const ticket = await this.zendeskService.getTicketDetails(context.ticketId);
      
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
          text: '❌ Sorry, I couldn\'t retrieve the current ticket status.'
        });
      }
    } else {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: '❌ I couldn\'t find the associated ticket information. Please make sure you\'re replying to a TaskGenie message.'
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
      const message = {
        channel,
        thread_ts: threadTs,
        text: `🧞‍♂️ TaskGenie Help`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧞‍♂️ TaskGenie Help'
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
              text: '*💬 How to use me:*\n• `@TaskGenie help` - Show this help message\n• `@TaskGenie summarize` - Get AI ticket summary\n• `@TaskGenie status` - Check ticket status\n• `@TaskGenie analytics` - Get insights and reports\n• `@TaskGenie create task` - Manual task creation\n• `@TaskGenie find ticket` - Search for tickets\n• Ask me any question about your tickets or workflow!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to boost your productivity?* Just mention me anytime!'
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