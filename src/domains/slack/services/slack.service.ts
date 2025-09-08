/**
 * @type: service
 * @domain: slack
 * @purpose: Cloudflare Workers compatible Slack service using HTTP webhooks
 * @framework: @slack/web-api
 */

import { WebClient } from '@slack/web-api';
import type { ChatPostMessageResponse, WebAPICallResult } from '@slack/web-api';
import type { SlackBotConfig } from '../interfaces/slack-bot.interface.js';
import type { SlackEvent, SlackInteraction, SlackCommand } from '../types/slack.types.js';
import { SlackBotError, SlackConfigError } from '../errors/slack.errors.js';

/**
 * Cloudflare Workers compatible Slack service
 * Uses HTTP webhooks instead of Socket Mode for serverless compatibility
 */
export class SlackService {
  private client: WebClient;
  private signingSecret: string;
  private botUserId?: string;

  constructor(config: SlackBotConfig) {
    this.validateConfig(config);
    
    this.client = new WebClient(config.botToken);
    this.signingSecret = config.signingSecret;
  }

  /**
   * Validate configuration for Cloudflare Workers
   */
  private validateConfig(config: SlackBotConfig): asserts config is Required<SlackBotConfig> {
    if (!config.botToken) {
      throw new SlackConfigError('Bot token is required');
    }
    
    if (!config.signingSecret) {
      throw new SlackConfigError('Signing secret is required');
    }
    if (config.socketMode) {
      throw new SlackConfigError('Socket Mode is not supported in Cloudflare Workers. Use HTTP webhooks instead.');
    }
  }

  /**
   * Verify Slack request signature
   * Essential for webhook security
   */
  async verifySignature(
    body: string,
    signature: string | undefined,
    timestamp: string | undefined
  ): Promise<boolean> {
    if (!signature || !timestamp) {
      return false;
    }

    // Check timestamp to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    
    if (Math.abs(currentTime - requestTime) > 300) { // 5 minutes
      return false;
    }

    // Create expected signature
    const sigBasestring = `v0:${timestamp}:${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.signingSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(sigBasestring)
    );
    
    const expectedSignature = `v0=${Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    return signature === expectedSignature;
  }

  /**
   * Handle URL verification challenge
   */
  handleUrlVerification(challenge: string): { challenge: string } {
    return { challenge };
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channel: string,
    text: string,
    options?: {
      blocks?: any[];
      attachments?: any[];
      thread_ts?: string;
      reply_broadcast?: boolean;
    }
  ): Promise<ChatPostMessageResponse> {
    try {
      const messageOptions: any = {
        channel,
        text,
        ...options
      };
      
      // Clean undefined values
      if (messageOptions.attachments === undefined) {
        delete messageOptions.attachments;
      }
      if (messageOptions.blocks === undefined) {
        delete messageOptions.blocks;
      }
      
      const result = await this.client.chat.postMessage(messageOptions);
      
      return result as ChatPostMessageResponse;
    } catch (error) {
      throw new SlackBotError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(
    userId: string,
    text: string,
    options?: {
      blocks?: any[];
      attachments?: any[];
    }
  ): Promise<ChatPostMessageResponse> {
    try {
      // Open DM channel first
      const dmResult = await this.client.conversations.open({
        users: userId
      });
      
      if (!dmResult.ok || !dmResult.channel?.id) {
        throw new SlackBotError('Failed to open DM channel');
      }
      
      return await this.sendMessage(dmResult.channel.id, text, options);
    } catch (error) {
      throw new SlackBotError(
        `Failed to send DM: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle app mention events
   */
  async handleAppMention(event: SlackEvent): Promise<void> {
    if (event.type !== 'app_mention') return;
    
    const { channel, user, text, ts } = event;
    
    // Extract mention and command from text
    const mentionRegex = /<@[UW][A-Z0-9]+>/;
    const command = text?.replace(mentionRegex, '').trim() || '';
    
    let response = `Hello <@${user}>! 👋`;
    
    // Simple command processing
    if (command.toLowerCase().includes('help')) {
      response = `Hello <@${user}>! Here's what I can help you with:\n\n` +
                `• Mention me with \`help\` to see this message\n` +
                `• Mention me with \`status\` to check system status\n` +
                `• I can help with ClickUp and Zendesk integrations!`;
    } else if (command.toLowerCase().includes('status')) {
      response = `System Status: ✅ All systems operational\n` +
                `• ClickUp Integration: Active\n` +
                `• Zendesk Integration: Active\n` +
                `• Automation: Running`;
    }
    
    if (channel) {
      await this.sendMessage(channel, response, {
        thread_ts: ts // Reply in thread
      });
    }
  }

  /**
   * Handle direct messages
   */
  async handleDirectMessage(event: SlackEvent): Promise<void> {
    if (event.type !== 'message' || event.channel_type !== 'im') return;
    
    const { channel, user, text } = event;
    
    const response = `Hello <@${user}>! Thanks for your message. ` +
                    `I'm here to help with ClickUp and Zendesk automation. ` +
                    `Try mentioning me in a channel with \`help\` to see what I can do!`;
    
    if (channel) {
      await this.sendMessage(channel, response);
    }
  }

  /**
   * Handle interactive components (buttons, select menus, etc.)
   */
  async handleInteraction(interaction: SlackInteraction): Promise<any> {
    const { type, user, response_url } = interaction;
    
    switch (type) {
      case 'button_click':
        return await this.handleButtonClick(interaction);
      case 'select_menu':
        return await this.handleSelectMenu(interaction);
      default:
        console.warn(`Unhandled interaction type: ${type}`);
        return { ok: true };
    }
  }

  /**
   * Handle button clicks
   */
  private async handleButtonClick(interaction: SlackInteraction): Promise<any> {
    const { user, actions } = interaction;
    const action = actions?.[0];
    
    if (!action) return { ok: true };
    
    const response = {
      text: `Thanks <@${user.id}>! You clicked: ${action.value || action.action_id}`,
      replace_original: false
    };
    
    return response;
  }

  /**
   * Handle select menu selections
   */
  private async handleSelectMenu(interaction: SlackInteraction): Promise<any> {
    const { user, actions } = interaction;
    const action = actions?.[0];
    
    if (!action) return { ok: true };
    
    const selectedValue = action.selected_option?.value;
    const response = {
      text: `Thanks <@${user.id}>! You selected: ${selectedValue}`,
      replace_original: false
    };
    
    return response;
  }

  /**
   * Handle slash commands
   */
  async handleSlashCommand(command: SlackCommand): Promise<any> {
    const { command: cmd, user_id, text, channel_id } = command;
    
    switch (cmd) {
      case '/status':
        return {
          response_type: 'ephemeral',
          text: '✅ System Status: All integrations are running smoothly!'
        };
      
      case '/help':
        return {
          response_type: 'ephemeral',
          text: 'Available commands:\n• `/status` - Check system status\n• `/help` - Show this help message'
        };
      
      default:
        return {
          response_type: 'ephemeral',
          text: `Unknown command: ${cmd}. Try \`/help\` for available commands.`
        };
    }
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    try {
      const result = await this.client.auth.test();
      this.botUserId = result.user_id;
      return result;
    } catch (error) {
      throw new SlackBotError(
        `Failed to get bot info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if bot is in a channel
   */
  async isBotInChannel(channelId: string): Promise<boolean> {
    try {
      const result = await this.client.conversations.members({
        channel: channelId
      });
      
      if (!this.botUserId) {
        await this.getBotInfo();
      }
      
      return result.members?.includes(this.botUserId!) || false;
    } catch (error) {
      console.warn(`Failed to check bot membership in channel ${channelId}:`, error);
      return false;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const result = await this.client.conversations.info({
        channel: channelId
      });
      return result.channel;
    } catch (error) {
      throw new SlackBotError(
        `Failed to get channel info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const result = await this.client.users.info({
        user: userId
      });
      return result.user;
    } catch (error) {
      throw new SlackBotError(
        `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send welcome message to new channel members
   */
  async sendWelcomeMessage(channelId: string, userId: string): Promise<void> {
    const welcomeText = `Welcome to the team, <@${userId}>! 🎉\n\n` +
                       `I'm here to help with ClickUp and Zendesk automation. ` +
                       `Feel free to mention me if you need assistance!`;
    
    await this.sendMessage(channelId, welcomeText);
  }

  /**
   * Process any Slack event
   */
  async processEvent(event: SlackEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'app_mention':
          await this.handleAppMention(event);
          break;
        
        case 'message':
          // Only handle DMs, ignore channel messages without mentions
          if (event.channel_type === 'im') {
            await this.handleDirectMessage(event);
          }
          break;
        
        case 'member_joined_channel':
          if (event.user && event.channel) {
            await this.sendWelcomeMessage(event.channel, event.user);
          }
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing Slack event:', error);
      throw new SlackBotError(
        `Failed to process event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}