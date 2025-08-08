import { SlackMessage, SlackEvent, TaskGenieContext, Env } from '../types/index.js';
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
      const messageText = text.toLowerCase();

      // Check if user is asking for summarization
      if (messageText.includes('summarize') || messageText.includes('summary')) {
        // Send thinking message
        await this.sendMessage({
          channel,
          thread_ts: thread_ts || ts,
          text: '🤔 Let me analyze the ticket and create a summary for you...'
        });

        // Get the original message to extract ticket info
        const context = await this.getTaskGenieContext(channel, thread_ts || ts);
        
        if (context?.ticketId) {
          // Fetch ticket details from Zendesk
          const ticket = await this.zendeskService.getTicketDetails(context.ticketId);
          
          if (ticket) {
            // Get AI summary
            const ticketContent = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nTags: ${ticket.tags.join(', ')}`;
            const aiResponse = await this.aiService.summarizeTicket(ticketContent);
            
            // Send summary response
            await this.sendMessage({
              channel,
              thread_ts: thread_ts || ts,
              text: `📋 *Ticket Summary* (powered by ${this.aiService.getProviderName()})\n\n${aiResponse.summary}`
            });
          } else {
            await this.sendMessage({
              channel,
              thread_ts: thread_ts || ts,
              text: '❌ Sorry, I couldn\'t retrieve the ticket details. Please check if the ticket still exists.'
            });
          }
        } else {
          await this.sendMessage({
            channel,
            thread_ts: thread_ts || ts,
            text: '❌ I couldn\'t find the associated ticket information. Please make sure you\'re replying to a TaskGenie message.'
          });
        }
      } else {
        // General help message
        await this.sendHelpMessage(channel, thread_ts || ts);
      }
    } catch (error) {
      console.error('Error handling Slack mention:', error);
    }
  }

  async sendHelpMessage(channel: string, threadTs?: string): Promise<void> {
    try {
      await this.sendMessage({
        channel,
        thread_ts: threadTs,
        text: `🧞‍♂️ *TaskGenie Help*\n\nI'm your AI-powered task automation assistant! Here's what I can do:\n\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries\n• 🔗 Keep everything connected with smart links\n\nTo get a ticket summary, reply to a task creation thread and ask for \"summarize\"!`
      });
    } catch (error) {
      console.error('Error sending help message:', error);
    }
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