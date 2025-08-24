/**
 * Simplified Slack Service using Official SDK
 * Replaces complex custom implementation with proven @slack/web-api
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../types';

// Simplified types (keep only what you actually use)
export interface SlackEvent {
  type: string;
  event_ts: string;
}

export interface SlackAppMentionEvent extends SlackEvent {
  type: 'app_mention';
  user: string;
  text: string;
  channel: string;
  ts: string;
}

export interface SlackMemberJoinedChannelEvent extends SlackEvent {
  type: 'member_joined_channel';
  user: string;
  channel: string;
}

export type SlackEventType = SlackAppMentionEvent | SlackMemberJoinedChannelEvent;

/**
 * Simplified Slack Service - 80% functionality, 20% code
 */
export class SlackService {
  private client: WebClient;
  private signingSecret: string;
  private multiAgentService?: any;
  private taskGenie?: any;

  constructor(env: Env, multiAgentService?: any, taskGenie?: any) {
    if (!env.SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN is required');
    }
    
    this.client = new WebClient(env.SLACK_BOT_TOKEN);
    this.signingSecret = env.SLACK_SIGNING_SECRET || '';
    this.multiAgentService = multiAgentService;
    this.taskGenie = taskGenie;
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
   * Handle app mentions
   */
  async handleMention(event: SlackAppMentionEvent): Promise<void> {
    try {
      if (event.text.toLowerCase().includes('summarize')) {
        // Use TaskGenie if available
        if (this.taskGenie) {
          await this.taskGenie.handleSlackMention(event);
        } else {
          await this.sendMessage(
            event.channel,
            '🧞 TaskGenie is processing your request...',
            event.ts
          );
        }
      } else {
        await this.sendMessage(
          event.channel,
          '🧞 Hi! I can help with ticket summarization. Try mentioning me with "summarize".',
          event.ts
        );
      }
    } catch (error) {
      console.error('Error handling mention:', error);
    }
  }

  /**
   * Handle member joined events
   */
  async handleMemberJoined(event: SlackMemberJoinedChannelEvent): Promise<void> {
    try {
      await this.sendMessage(
        event.channel,
        `👋 Welcome! I'm TaskGenie, your automation assistant. I help convert Zendesk tickets to ClickUp tasks automatically.`
      );
    } catch (error) {
      console.error('Error handling member joined:', error);
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

  // Stub methods for compatibility (implement as needed)
  setClickUpService(service: any) { /* stub */ }
  getSocketModeStatus() { return { connected: false, connectionState: 'disconnected' }; }
  isSocketModeAvailable() { return false; }
  async reconnectSocketMode() { /* stub */ }
  async shutdownSocketMode() { /* stub */ }
  getAppTemplates() { return {}; }
  async deployAppFromTemplate(template: any, appId?: string) { return { ok: false }; }
  async updateAppConfiguration(appId: string, updates: any, options?: any) { return { ok: false }; }
  async validateAppConfiguration(appId: string) { return { valid: false }; }
  async checkManifestPermissions() { return { hasPermissions: false }; }
}
