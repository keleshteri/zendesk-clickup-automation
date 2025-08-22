import { Env } from '../../../types/index';
import { SlackMessage } from './types/index';
import { SlackFormatters } from './utils/index';
import { AIService } from '../../ai/ai-service';

export class SlackNotificationService {
  private env: Env;
  private aiService: AIService;

  constructor(env: Env, aiService: AIService) {
    this.env = env;
    this.aiService = aiService;
  }

  /**
   * Send task creation notification message
   */
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
              text: `🧞 *TaskGenie*\n\nHi @here! 👋\n\nI've created a task for this Zendesk ticket.`
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
              text: `Need a summary of this ticket? Just reply to this thread and ask for "summarize" - I can help with that! 🤖`
            }
          },
          SlackFormatters.createContextFooter(this.aiService.isAvailable())
        ]
      };

      const response = await this.sendSlackMessage(message);
      
      if (response && response.ok && response.message) {
        return {
          ts: response.ts || response.message?.ts || '',
          channel: response.channel,
          text: response.message.text || '',
          user: response.message.user || 'bot',
          thread_ts: response.message.thread_ts
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to send task creation message:', error);
      return null;
    }
  }

  /**
   * Send TaskGenie introduction message when bot joins channel
   */
  async sendTaskGenieIntroMessage(channel: string, serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }): Promise<void> {
    try {
      const message = {
        channel,
        text: `🧞 TaskGenie has joined the channel!`,
        blocks: [
          SlackFormatters.createHeader('🧞 TaskGenie has joined!'),
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
          },
          SlackFormatters.createBrandingFooter(),
            SlackFormatters.createServiceStatusFooter(serviceStatuses)
        ]
      };

      await this.sendSlackMessage(message);
    } catch (error) {
      console.error('Error sending TaskGenie intro message:', error);
    }
  }

  /**
   * Send welcome message to new user joining channel
   */
  async sendUserWelcomeMessage(channel: string, user: string, serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }): Promise<void> {
    try {
      const message = {
        channel,
        text: `🧞 Welcome to TaskGenie!`,
        blocks: [
          SlackFormatters.createHeader('🧞 Welcome to TaskGenie!'),
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
              text: '*💬 How to interact with me:*\n• Mention me with `@TaskGenie` followed by your question\n• Ask for help: `@TaskGenie help`\n• List open tickets: `@TaskGenie list tickets`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🚀 *Ready to boost your productivity?* Just mention @TaskGenie and I\'ll assist!'
            }
          },
          SlackFormatters.createBrandingFooter(),
            SlackFormatters.createServiceStatusFooter(serviceStatuses)
        ]
      };

      await this.sendSlackMessage(message);
    } catch (error) {
      console.error('Error sending user welcome message:', error);
    }
  }

  /**
   * Send help message with available commands
   */
  async sendHelpMessage(channel: string, threadTs: string): Promise<void> {
    try {
      const message = {
        channel,
        thread_ts: threadTs,
        text: `🧞 TaskGenie Help`,
        blocks: [
          SlackFormatters.createHeader('🧞 TaskGenie Help'),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Available Commands:*\n\n*📋 Ticket Management:*\n• `@TaskGenie list tickets` - Show open tickets\n• `@TaskGenie summarize ticket #123` - Get ticket summary\n• `@TaskGenie analyze ticket #123` - Deep ticket analysis\n• `@TaskGenie status ticket #123` - Check ticket status\n\n*📊 Analytics & Insights:*\n• `@TaskGenie analytics` - Generate reports\n• `@TaskGenie insights` - Get AI insights\n\n*🔧 Task Management:*\n• `@TaskGenie create task from ticket #123` - Create ClickUp task\n\n*❓ General:*\n• `@TaskGenie help` - Show this help message\n• `@TaskGenie status` - Check system status'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*💡 Tips:*\n• You can use `/` or `#` prefixes: `/help`, `#analyze`\n• Ask natural questions: "What\'s the status of ticket 123?"\n• I understand context in threads!'
            }
          },
          SlackFormatters.createContextFooter(this.aiService.isAvailable())
        ]
      };

      await this.sendSlackMessage(message);
    } catch (error) {
      console.error('Error sending help message:', error);
    }
  }

  /**
   * Send command-specific help message
   */
  async sendCommandHelpMessage(channel: string, threadTs: string): Promise<void> {
    try {
      const message = {
        channel,
        thread_ts: threadTs,
        text: `🧞 TaskGenie Commands`,
        blocks: [
          SlackFormatters.createHeader('🧞 Available Commands'),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Command Formats:*\n\n*Slash Commands:*\n• `/help` - Show help\n• `/status` - System status\n• `/analyze ticket 123` - Analyze ticket\n• `/summarize ticket 123` - Summarize ticket\n• `/list tickets` - List tickets\n• `/analytics` - Generate analytics\n• `/create task from ticket 123` - Create task\n\n*Hashtag Commands:*\n• `#help` - Show help\n• `#status` - System status\n• `#analyze ticket 123` - Analyze ticket\n\n*Natural Language:*\n• "What\'s the status of ticket 123?"\n• "Summarize ticket 456"\n• "Create a task for ticket 789"'
            }
          },
          SlackFormatters.createContextFooter(this.aiService.isAvailable())
        ]
      };

      await this.sendSlackMessage(message);
    } catch (error) {
      console.error('Error sending command help message:', error);
    }
  }

  /**
   * Send generic Slack message
   */
  private async sendSlackMessage(message: any): Promise<any> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    return await response.json();
  }
}