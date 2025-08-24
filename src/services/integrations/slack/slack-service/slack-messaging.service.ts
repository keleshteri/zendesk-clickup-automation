/**
 * @ai-metadata
 * @component: SlackMessagingService
 * @description: Handles all Slack messaging operations including sending messages, threaded responses, and notifications
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types"]
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../../types';
// Note: These types should be defined in the main types or created as needed
// For now, using 'any' to resolve compilation errors
// TODO: Define proper types for SlackMessage, SlackMessageBlock, SlackAttachment, TicketData, TaskData
import { SlackEmojiService } from './slack-emoji.service';

/**
 * Service responsible for all Slack messaging operations
 */
export class SlackMessagingService {
  private client: WebClient;
  private env: Env;
  private emojiService: SlackEmojiService;

  /**
   * Initialize the Slack messaging service
   * @param client - The Slack WebClient instance
   * @param env - Environment configuration
   */
  constructor(client: WebClient, env: Env) {
    this.client = client;
    this.env = env;
    this.emojiService = new SlackEmojiService();
  }

  /**
   * Send a message to a Slack channel
   * @param channel - The channel ID to send the message to
   * @param text - The message text content
   * @param threadTs - Optional thread timestamp for threaded replies
   * @returns Promise that resolves to the sent message object
   * @throws Error if message sending fails
   */
  async sendMessage(channel: string, text: string, threadTs?: string): Promise<any> {
    try {
      const result = await this.client.chat.postMessage({
        channel,
        text,
        thread_ts: threadTs,
      });
      return result.message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send intelligent notification with AI insights
   */
  /**
   * Send an intelligent notification with rich formatting based on ticket data
   * @param channel - The channel ID to send the notification to
   * @param ticketData - The ticket data object containing ticket information
   * @param context - Additional context including update status and previous data
   * @param context.isUpdate - Whether this is an update to an existing ticket
   * @param context.previousData - Previous ticket data for comparison
   * @returns Promise that resolves to the sent message object
   * @throws Error if notification sending fails
   */
  async sendIntelligentNotification(
    channel: string,
    ticketData: any,
    context: { isUpdate?: boolean; previousData?: any } = {}
  ): Promise<any> {
    
    try {
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎫 New Ticket: ${ticketData.subject}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket ID:*\n${ticketData.id}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${ticketData.priority || 'Medium'}`
            },
            {
              type: 'mrkdwn',
              text: `*Category:*\n${ticketData.category || 'General'}`
            },
            {
              type: 'mrkdwn',
              text: `*Assigned Team:*\n${ticketData.assignedTeam || 'Unassigned'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Summary:*\n${ticketData.summary || 'Processing...'}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in Zendesk',
                emoji: true
              },
              url: ticketData.url
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in ClickUp',
                emoji: true
              },
              url: ticketData.clickupUrl || '#'
            }
          ]
        }
      ];

      return await this.client.chat.postMessage({
        channel,
        blocks,
        text: `New ticket: ${ticketData.subject}` // Fallback text
      });
    } catch (error) {
      console.error('Failed to send intelligent notification:', error);
      throw error;
    }
  }

  /**
   * Send task creation message
   */
  /**
   * Send a task creation confirmation message
   * @param channel - The channel ID to send the message to
   * @param ticketData - The original ticket data
   * @param taskData - The created task data
   * @param threadTs - Optional thread timestamp for threaded replies
   * @returns Promise that resolves to the sent message object
   */
  async sendTaskCreationMessage(
    channel: string,
    ticketData: any,
    taskData: any,
    threadTs?: string
  ): Promise<any> {
    const message = `✅ Task created for ticket #${ticketData.id}\n📋 Zendesk: ${ticketData.url}\n🎯 ClickUp: ${taskData.url}\n👤 Assigned to: ${taskData.assignee}`;
    return this.sendMessage(channel, message, threadTs);
  }

  /**
   * Send threaded AI analysis message
   */
  /**
   * Send AI analysis as a threaded response
   * @param channel - The channel ID to send the analysis to
   * @param threadTs - The thread timestamp to reply to
   * @param analysis - The AI analysis text content
   * @returns Promise that resolves to the sent message object
   */
  async sendThreadedAIAnalysis(
    channel: string,
    threadTs: string,
    analysis: string
  ): Promise<any> {
    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🤖 *AI Analysis*\n${analysis}`
          }
        }
      ];

      const result = await this.client.chat.postMessage({
        channel,
        blocks,
        thread_ts: threadTs
      });

      return result;
    } catch (error) {
      console.error('Error sending threaded AI analysis:', error);
      throw error;
    }
  }

  /**
   * Send threaded team mentions message
   */
  /**
   * Send team mentions with enhanced messaging in a thread
   * @param channel - The channel ID to send the mentions to
   * @param threadTs - The thread timestamp to reply to
   * @param mentions - Array of user IDs to mention
   * @param enhancedMessage - The enhanced message content
   * @param timeline - Optional timeline information
   * @param nextSteps - Optional array of next steps
   * @returns Promise that resolves to the sent message object
   */
  async sendThreadedTeamMentions(
    channel: string,
    threadTs: string,
    mentions: string[],
    enhancedMessage: string,
    timeline?: string,
    nextSteps?: string[]
  ): Promise<any> {
    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: enhancedMessage
          }
        }
      ];

      // Add next steps if provided
      if (nextSteps && nextSteps.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Next Steps:*\n${nextSteps.map(step => `• ${step}`).join('\n')}`
          }
        });
      }

      const result = await this.client.chat.postMessage({
        channel,
        blocks,
        thread_ts: threadTs
      });

      return result;
    } catch (error) {
      console.error('Error sending threaded team mentions:', error);
      throw error;
    }
  }

  /**
   * Send threaded message with optional blocks
   */
  /**
   * Send a threaded message with optional blocks
   * @param channel - The channel ID to send the message to
   * @param threadTs - The thread timestamp to reply to
   * @param text - The message text content
   * @param blocks - Optional Slack blocks for rich formatting
   * @returns Promise that resolves to the sent message object
   */
  async sendThreadedMessage(
    channel: string,
    threadTs: string,
    text: string,
    blocks?: any[]
  ): Promise<any> {
    try {
      const payload: any = {
        channel,
        thread_ts: threadTs
      };

      if (blocks) {
        payload.blocks = blocks;
      } else {
        payload.text = text;
      }

      const result = await this.client.chat.postMessage(payload);
      return result;
    } catch (error) {
      console.error('Error sending threaded message:', error);
      throw error;
    }
  }

  /**
   * Send bot intro message when joining a channel
   */
  /**
   * Send bot introduction message to a channel
   * @param channel - The channel ID to send the introduction to
   * @returns Promise that resolves when message is sent
   */
  async sendBotIntroMessage(channel: string): Promise<void> {
    const introMessage = {
      channel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '👋 Hello! I\'m TaskGenie',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'I\'m here to help streamline your workflow between Zendesk and ClickUp! 🎯\n\n*What I can do:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 🤖 Provide AI-powered ticket analysis and insights\n• 👥 Smart team assignment based on ticket content\n• 📊 Real-time status updates and notifications\n• 💬 Interactive commands for ticket management'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🚀 *Ready to boost your productivity?* Just mention @TaskGenie and I\'ll assist!'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🤖 TaskGenie v0.0.2 • Made by 2DC Team • Powered by AI\n🟢 Zendesk (2damcreative.zendesk.com) | 🟢 ClickUp | 🟢 AI Provider'
            }
          ]
        }
      ]
    };

    await this.client.chat.postMessage(introMessage);
  }

  /**
   * Get emoji for a specific category
   * @param category - The category name to get emoji for
   * @returns The emoji string for the category
   */
  getCategoryEmoji(category: string): string {
    return this.emojiService.getCategoryEmoji(category);
  }

  /**
   * Get emoji for a specific priority level
   * @param priority - The priority level to get emoji for
   * @returns The emoji string for the priority
   */
  getPriorityEmoji(priority: string): string {
    return this.emojiService.getPriorityEmoji(priority);
  }

  /**
   * Get the emoji service instance
   * @returns The SlackEmojiService instance
   */
  getEmojiService(): SlackEmojiService {
    return this.emojiService;
  }

  /**
   * Get the help message text
   * @returns The formatted help message string
   */
  getHelpMessage(): string {
    return `🧞 *TaskGenie Help*\n\n*Available Commands:*\n• \`@TaskGenie help\` - Show this help message\n• \`@TaskGenie list tickets\` - List recent tickets\n• \`@TaskGenie summarize ticket #123\` - Get AI summary of ticket\n• \`@TaskGenie status ticket #123\` - Check ticket status\n• \`@TaskGenie analytics\` - Get analytics report\n\n*Need more help?* Just mention me with your question!`;
  }
}