/**
 * @ai-metadata
 * @component: SlackService
 * @description: Enhanced Slack service with bot join tracking and improved mention handling
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../types"]
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../types';
import type {
  SlackEvent,
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent
} from './interfaces';
import type {
  BotJoinTracker,
  PersistentBotJoinData,
  SlackCommand,
  SlackEventType
} from './types';

/**
 * Enhanced Slack Service with bot join tracking and improved mention handling
 */
export class SlackService {
  private client: WebClient;
  private signingSecret: string;
  private multiAgentService?: any;
  private taskGenie?: any;
  private botJoinTracker: BotJoinTracker;
  private botUserId?: string;
  private readonly KV_BOT_JOIN_PREFIX = 'bot_join_';
  private readonly BOT_JOIN_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
  private env: Env;

  constructor(env: Env, multiAgentService?: any, taskGenie?: any) {
    if (!env.SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN is required');
    }
    
    this.client = new WebClient(env.SLACK_BOT_TOKEN);
    this.signingSecret = env.SLACK_SIGNING_SECRET || '';
    this.multiAgentService = multiAgentService;
    this.taskGenie = taskGenie;
    this.env = env;
    
    // Initialize bot join tracking
    this.botJoinTracker = {
      channelsJoined: new Set<string>(),
      lastJoinTime: new Map<string, number>()
    };
    
    // Initialize bot user ID
    this.initializeBotUserId();
  }

  /**
   * Initialize bot user ID for mention detection
   */
  private async initializeBotUserId(): Promise<void> {
    try {
      const authResult = await this.client.auth.test();
      this.botUserId = authResult.user_id as string;
      console.log('Bot user ID initialized:', this.botUserId);
    } catch (error) {
      console.error('Failed to initialize bot user ID:', error);
    }
  }

  /**
   * Send message to channel
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
  async sendIntelligentNotification(
    ticket: any,
    aiAnalysis: any,
    clickupUrl: string,
    assignmentRec: any
  ): Promise<any> {
    const channel = '#automation'; // Use your default channel
    
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎫 *New Ticket Created*\n*${ticket.subject}*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Priority:* ${aiAnalysis.priority}`
          },
          {
            type: 'mrkdwn', 
            text: `*Category:* ${aiAnalysis.category}`
          },
          {
            type: 'mrkdwn',
            text: `*Sentiment:* ${aiAnalysis.sentiment}`
          },
          {
            type: 'mrkdwn',
            text: `*Urgency:* ${aiAnalysis.urgency_indicators.join(', ')}`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 View ClickUp Task' },
            url: clickupUrl
          },
          {
            type: 'button', 
            text: { type: 'plain_text', text: '🎫 View Zendesk Ticket' },
            url: ticket.url
          }
        ]
      }
    ];

    const result = await this.client.chat.postMessage({
      channel,
      text: `New ticket: ${ticket.subject}`,
      blocks
    });

    return result.message;
  }

  /**
   * Send basic task creation message
   */
  async sendTaskCreationMessage(
    channel: string,
    ticketId: string,
    zendeskUrl: string,
    clickupUrl: string,
    userName: string
  ): Promise<any> {
    const text = `🎫 Ticket ${ticketId} has been converted to a ClickUp task!\n` +
                 `📋 <${clickupUrl}|View ClickUp Task>\n` +
                 `🎫 <${zendeskUrl}|View Zendesk Ticket>`;

    const result = await this.client.chat.postMessage({
      channel,
      text,
    });

    return result.message;
  }

  /**
   * Handle app mentions with enhanced command parsing
   */
  async handleMention(event: SlackAppMentionEvent): Promise<void> {
    try {
      // Ensure this is a direct mention to TaskGenie
      if (!this.isDirectMention(event.text)) {
        console.log('Ignoring non-direct mention');
        return;
      }

      // Parse the command from the mention
      const command = this.parseSlackCommand(event.text);
      
      if (command.isCommand) {
        await this.handleSlackCommand(event.channel, event.ts, command, event.user);
      } else {
        // Default help response for non-command mentions
        await this.sendMessage(
          event.channel,
          this.getHelpMessage(),
          event.ts
        );
      }
    } catch (error) {
      console.error('Error handling mention:', error);
      await this.sendMessage(
        event.channel,
        '❌ Sorry, I encountered an error processing your request. Please try again.',
        event.ts
      );
    }
  }

  /**
   * Check if the text is a direct mention to TaskGenie
   */
  private isDirectMention(text: string): boolean {
    // Check for @TaskGenie or bot user ID mention
    const mentionPatterns = [
      /@TaskGenie\b/i,
      new RegExp(`<@${this.botUserId}>`, 'i')
    ];
    
    return mentionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Parse Slack command from mention text
   */
  private parseSlackCommand(text: string): SlackCommand {
    // Remove bot mention and clean up text
    const cleanText = text
      .replace(/@TaskGenie\b/gi, '')
      .replace(new RegExp(`<@${this.botUserId}>`, 'gi'), '')
      .trim();
    
    // Check for command patterns
    const commandMatch = cleanText.match(/^(help|status|analytics|list|analyze|summarize|create)(?:\s+(.*))?$/i);
    
    if (commandMatch) {
      const command = commandMatch[1].toLowerCase();
      const argsString = commandMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: cleanText
      };
    }
    
    return {
      isCommand: false,
      command: '',
      args: [],
      originalText: cleanText
    };
  }

  /**
   * Handle parsed Slack commands
   */
  private async handleSlackCommand(
    channel: string, 
    threadTs: string, 
    command: SlackCommand, 
    user: string
  ): Promise<void> {
    try {
      switch (command.command) {
        case 'help':
          await this.sendMessage(channel, this.getHelpMessage(), threadTs);
          break;
          
        case 'status':
          if (command.args.length > 0 && command.args[0] === 'ticket' && command.args[1]) {
            await this.handleStatusRequest(channel, threadTs, command.args[1]);
          } else {
            await this.sendMessage(channel, '📊 Please specify a ticket number. Example: `@TaskGenie status ticket 123`', threadTs);
          }
          break;
          
        case 'summarize':
          if (command.args.length > 0 && command.args[0] === 'ticket' && command.args[1]) {
            await this.handleSummarizeRequest(channel, threadTs, command.args[1]);
          } else {
            await this.sendMessage(channel, '📝 Please specify a ticket number. Example: `@TaskGenie summarize ticket 123`', threadTs);
          }
          break;
          
        case 'list':
          if (command.args.length > 0 && command.args[0] === 'tickets') {
            await this.handleListTicketsRequest(channel, threadTs);
          } else {
            await this.sendMessage(channel, '📋 Please specify what to list. Example: `@TaskGenie list tickets`', threadTs);
          }
          break;
          
        case 'analytics':
          await this.handleAnalyticsRequest(channel, threadTs);
          break;
          
        default:
          await this.sendMessage(channel, `❓ Unknown command: \`${command.command}\`. Type \`@TaskGenie help\` for available commands.`, threadTs);
          break;
      }
    } catch (error) {
      console.error(`Error handling command '${command.command}':`, error);
      await this.sendMessage(channel, `❌ Error processing \`${command.command}\` command. Please try again.`, threadTs);
    }
  }

  /**
   * Handle member joined events with bot join tracking
   */
  async handleMemberJoined(event: SlackMemberJoinedChannelEvent): Promise<void> {
    try {
      // Check if the bot itself joined the channel
      if (event.user === this.botUserId) {
        await this.handleBotJoinedChannel(event.channel);
      } else {
        // Handle human user joining - send a brief welcome
        await this.sendMessage(
          event.channel,
          `👋 Welcome <@${event.user}>! I'm TaskGenie, your AI automation assistant. Mention me with \`@TaskGenie help\` to see what I can do!`
        );
      }
    } catch (error) {
      console.error('Error handling member joined:', error);
    }
  }

  /**
   * Handle bot joining a channel - send introductory message only once per channel
   * with a cooldown period to prevent spam using persistent KV storage
   */
  private async handleBotJoinedChannel(channel: string): Promise<void> {
    const now = Date.now();
    
    try {
      // Check persistent storage for previous join data
      const lastJoinData = await this.getBotJoinData(channel);
      
      if (lastJoinData && (now - lastJoinData.lastJoinTime) < this.BOT_JOIN_COOLDOWN) {
        console.log(`🤖 Bot join message skipped for channel ${channel} - within cooldown period`);
        return;
      }

      await this.sendBotIntroMessage(channel);
      
      // Store/update persistent join data
      await this.storeBotJoinData(channel, {
        channelId: channel,
        lastJoinTime: now,
        messagesSent: (lastJoinData?.messagesSent || 0) + 1,
        botUserId: this.botUserId || 'unknown',
        createdAt: lastJoinData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Also update in-memory tracker for quick access
      this.botJoinTracker.channelsJoined.add(channel);
      this.botJoinTracker.lastJoinTime.set(channel, now);
      
      console.log(`🤖 Bot intro message sent to channel ${channel}`);
    } catch (error) {
      console.error(`❌ Failed to send bot intro message to channel ${channel}:`, error);
    }
  }

  /**
   * Send comprehensive bot introduction message
   */
  private async sendBotIntroMessage(channel: string): Promise<void> {
    const introMessage = {
      channel,
      text: '🧞 TaskGenie has joined!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🧞 *TaskGenie has joined!*\n\nHi everyone! 👋\n\nI\'m TaskGenie, your AI-powered task automation assistant. I\'m here to help streamline your workflow between Zendesk and ClickUp!'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎯 *What I can do for you:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries and analysis\n• 📊 Generate insights and analytics reports\n• 🔍 Help you search and find tickets\n• 🤖 Answer questions about your tickets and tasks\n• 🔗 Keep everything connected with smart automation'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '💬 *How to interact with me:*\n• Mention me with @TaskGenie followed by your question\n• Ask for help: `@TaskGenie help`\n• List open tickets: `@TaskGenie list tickets`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`'
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
   * Get help message for users
   */
  private getHelpMessage(): string {
    return `🧞 *TaskGenie Help*\n\n*Available Commands:*\n• \`@TaskGenie help\` - Show this help message\n• \`@TaskGenie list tickets\` - List recent tickets\n• \`@TaskGenie summarize ticket #123\` - Get AI summary of ticket\n• \`@TaskGenie status ticket #123\` - Check ticket status\n• \`@TaskGenie analytics\` - Get analytics report\n\n*Need more help?* Just mention me with your question!`;
  }

  /**
   * Handle status request (placeholder)
   */
  private async handleStatusRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    await this.sendMessage(channel, `📊 Checking status for ticket ${ticketId}... (Feature coming soon!)`, threadTs);
  }

  /**
   * Handle summarize request (placeholder)
   */
  private async handleSummarizeRequest(channel: string, threadTs: string, ticketId: string): Promise<void> {
    if (this.taskGenie) {
      // Use TaskGenie service if available
      await this.taskGenie.handleSlackSummarize(channel, threadTs, ticketId);
    } else {
      await this.sendMessage(channel, `📝 Generating summary for ticket ${ticketId}... (Feature coming soon!)`, threadTs);
    }
  }

  /**
   * Handle list tickets request (placeholder)
   */
  private async handleListTicketsRequest(channel: string, threadTs: string): Promise<void> {
    await this.sendMessage(channel, '📋 Fetching recent tickets... (Feature coming soon!)', threadTs);
  }

  /**
   * Handle analytics request (placeholder)
   */
  private async handleAnalyticsRequest(channel: string, threadTs: string): Promise<void> {
    await this.sendMessage(channel, '📊 Generating analytics report... (Feature coming soon!)', threadTs);
  }

  /**
   * Get bot join data from persistent storage
   */
  private async getBotJoinData(channelId: string): Promise<PersistentBotJoinData | null> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - using in-memory tracking only');
      const hasChannel = this.botJoinTracker.channelsJoined.has(channelId);
      const lastJoinTime = this.botJoinTracker.lastJoinTime.get(channelId);
      
      if (hasChannel && lastJoinTime) {
        return {
          channelId,
          lastJoinTime,
          messagesSent: 1,
          botUserId: this.botUserId || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return null;
    }

    try {
      const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
      const data = await this.env.TASK_MAPPING.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as PersistentBotJoinData;
    } catch (error) {
      console.error('💥 Error retrieving bot join data:', error);
      return null;
    }
  }

  /**
   * Store bot join data to persistent storage
   */
  private async storeBotJoinData(channelId: string, data: PersistentBotJoinData): Promise<void> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - bot join data not persisted');
      return;
    }

    try {
      const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
      await this.env.TASK_MAPPING.put(key, JSON.stringify(data));
      console.log('💾 Bot join data stored for channel:', channelId);
    } catch (error) {
      console.error('💥 Error storing bot join data:', error);
    }
  }

  /**
   * Reset bot join tracking for a channel (for testing)
   * Clears both in-memory and persistent storage
   */
  public async resetChannelTracking(channelId?: string): Promise<void> {
    if (channelId) {
      // Clear in-memory tracking
      this.botJoinTracker.channelsJoined.delete(channelId);
      this.botJoinTracker.lastJoinTime.delete(channelId);
      
      // Clear persistent storage
      if (this.env.TASK_MAPPING) {
        try {
          const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
          await this.env.TASK_MAPPING.delete(key);
          console.log(`🔄 Reset tracking for channel ${channelId} (memory + storage)`);
        } catch (error) {
          console.error(`❌ Failed to clear persistent data for channel ${channelId}:`, error);
        }
      } else {
        console.log(`🔄 Reset in-memory tracking for channel ${channelId}`);
      }
    } else {
      // Clear all in-memory tracking
      this.botJoinTracker.channelsJoined.clear();
      this.botJoinTracker.lastJoinTime.clear();
      
      console.log('🔄 Reset all in-memory channel tracking');
      console.warn('⚠️ Persistent storage reset requires manual cleanup or specific channel IDs');
    }
  }

  /**
   * Verify Slack request signature
   */
  async verifyRequest(body: string, timestamp: string, signature: string): Promise<boolean> {
    if (!this.signingSecret) return true; // Skip verification if no secret
    
    // Simple timestamp check (5 minutes tolerance)
    const requestTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
      return false;
    }

    // Verify signature using Web Crypto API
    try {
      const sigString = `v0:${timestamp}:${body}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(sigString);
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.signingSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const expectedSignature = await crypto.subtle.sign('HMAC', key, data);
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const expected = `v0=${expectedHex}`;
      return expected === signature;
    } catch {
      return true; // Fail open for now
    }
  }

  /**
   * Send threaded AI analysis message
   */
  async sendThreadedAIAnalysis(
    channel: string,
    threadTs: string,
    ticket: any,
    analysis: any
  ): Promise<any> {
    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🤖 *AI Analysis*\n📂 *Category*: ${this.getCategoryEmoji(analysis.category)} ${analysis.category}\n⚡ *Priority*: ${this.getPriorityEmoji(analysis.priority)} ${analysis.priority}\n📝 *Summary*: ${analysis.summary || 'Analysis in progress...'}`
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
   * Get category emoji
   */
  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'technical': '⚙️',
      'bug': '🐛',
      'feature': '✨',
      'support': '🎧',
      'general': '📋'
    };
    return emojiMap[category] || '📋';
  }

  /**
   * Get priority emoji
   */
  private getPriorityEmoji(priority: string): string {
    const emojiMap: Record<string, string> = {
      'urgent': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojiMap[priority] || '🟡';
  }

  // Stub methods for compatibility (implement as needed)
  setClickUpService(service: any) { /* stub */ }
  getSocketModeStatus() { 
    return { 
      connected: false, 
      connectionState: 'disconnected',
      lastConnected: null,
      lastDisconnected: null,
      reconnectAttempts: 0,
      eventsReceived: 0,
      lastEventTime: null,
      lastError: null
    }; 
  }
  isSocketModeAvailable() { return false; }
  async reconnectSocketMode() { /* stub */ }
  async shutdownSocketMode() { /* stub */ }
  getAppTemplates() { return {}; }
  async deployAppFromTemplate(template: any, appId?: string) { return { ok: false }; }
  async updateAppConfiguration(appId: string, updates: any, options?: any) { return { ok: false }; }

  // Security and token management methods
  getSecurityMetrics() {
    return {
      totalRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastSecurityCheck: null,
      activeTokens: 0,
      expiredTokens: 0
    };
  }

  getSecurityAuditLog(limit?: number, severity?: string) {
    return {
      entries: [],
      totalCount: 0,
      filters: { limit, severity }
    };
  }

  getTokenMetadata() {
    return {
      tokens: [],
      totalCount: 0,
      activeCount: 0,
      expiredCount: 0
    };
  }

  async checkTokenRotationStatus() {
    return {
      rotationEnabled: false,
      lastRotation: null,
      nextRotation: null,
      rotationInterval: null
    };
  }

  async forceTokenRotation(tokenType: string) {
    return {
      success: false,
      message: 'Token rotation not implemented',
      tokenType
    };
  }

  updateTokenRotationConfig(config: any) {
    // Stub implementation
    console.log('Token rotation config updated:', config);
  }

  async verifyRequestWithAudit(signature: string, body: string, timestamp: string) {
    const isValid = await this.verifyRequest(body, timestamp, signature);
    // Log audit entry (stub)
    return {
      isValid,
      auditId: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
  }
  async validateAppConfiguration(appId: string) { return { valid: false }; }
  async checkManifestPermissions() { return { hasPermissions: false }; }
}
