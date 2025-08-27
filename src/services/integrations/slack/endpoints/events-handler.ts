/**
 * @ai-metadata
 * @component: SlackEventsHandler
 * @description: Handles Slack event callbacks (app mentions, messages, member joins, etc.)
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-events-handler.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./types", "../types", "../../../../config"]
 * @tests: ["./tests/events-handler.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Organized Slack event handling with proper routing and processing"
 */

import type { EventHandlerOptions, RequestContext } from './types';
import type { SlackEventType } from '../types';
import type { SlackAppMentionEvent } from '../interfaces/slack-app-mention-event.interface';
import type { SlackMemberJoinedChannelEvent } from '../interfaces/slack-member-joined-channel-event.interface';
import type { SlackMessageEvent } from '../interfaces/slack-message-event.interface';
import { HTTP_STATUS, LOG_CONFIG } from '../../../../config';
import { formatSuccessResponse } from '../../../../utils';
import type { ExecutionContext } from '@cloudflare/workers-types';

/**
 * Handles Slack event callbacks
 */
export class SlackEventsHandler {
  private options: EventHandlerOptions;

  constructor(options: EventHandlerOptions) {
    this.options = options;
  }

  /**
   * Handle incoming Slack event
   * @param context - Request context containing parsed data
   * @param ctx - Execution context for async operations (optional)
   * @returns Promise<Response> - The response to send back
   */
  async handleEvent(context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    const { parsedBody } = context;
    const event: SlackEventType = parsedBody.event;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Event received:`, {
      type: event.type,
      channel: 'channel' in event ? event.channel : undefined,
      user: 'user' in event ? event.user : undefined,
      timestamp: 'ts' in event ? event.ts : undefined
    });

    try {
      // Route to specific event handler
      switch (event.type) {
        case 'app_mention':
          return await this.handleAppMention(event as SlackAppMentionEvent, context, ctx);
        
        case 'message':
          return await this.handleMessage(event as SlackMessageEvent, context, ctx);
        
        case 'member_joined_channel':
          return await this.handleMemberJoined(event as SlackMemberJoinedChannelEvent, context, ctx);
        
        default:
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Unhandled event type: ${(event as any).type}`);
          return this.createSuccessResponse({ message: 'Event acknowledged' });
      }
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Event processing error:`, error);
      return this.createSuccessResponse({ message: 'Event processed with errors' });
    }
  }

  /**
   * Handle app mention events
   */
  private async handleAppMention(event: SlackAppMentionEvent, _context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    console.log(`${LOG_CONFIG.PREFIXES.SLACK} App mention from user ${event.user} in channel ${event.channel}`);
    
    try {
      // Process app mention event using SlackService
      const mentionPromise = this.options.slackService.handleMention(event);
      
      if (ctx) {
        ctx.waitUntil(mentionPromise);
      } else {
        await mentionPromise;
      }
      
      return this.createSuccessResponse({ 
        message: 'App mention processed',
        eventId: event.ts
      });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} App mention processing error:`, error);
      return this.createSuccessResponse({ message: 'App mention acknowledged' });
    }
  }

  /**
   * Handle direct message events
   */
  private async handleMessage(event: SlackMessageEvent, _context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    // Skip bot messages and message changes
    if (event.subtype === 'bot_message' || event.subtype === 'message_changed') {
      return this.createSuccessResponse({ message: 'Bot message ignored' });
    }

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Direct message from user ${event.user}`);
    
    try {
      // Process message event using SlackService handleEvent method
      const messagePromise = this.options.slackService.handleEvent(event);
      
      if (ctx) {
        ctx.waitUntil(messagePromise);
      } else {
        await messagePromise;
      }
      
      return this.createSuccessResponse({ 
        message: 'Direct message processed',
        eventId: event.ts
      });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Direct message processing error:`, error);
      return this.createSuccessResponse({ message: 'Direct message acknowledged' });
    }
  }

  /**
   * Handle member joined channel events
   */
  private async handleMemberJoined(event: SlackMemberJoinedChannelEvent, _context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Member ${event.user} joined channel ${event.channel}`);
    
    try {
      // Get bot user ID from the Slack service
      const botUserId = this.options.slackService.getBotUserId();
      console.log(`${LOG_CONFIG.PREFIXES.SLACK} 🔍 Debug: event.user=${event.user}, botUserId=${botUserId}`);
      
      // If bot user ID is not yet initialized, skip processing for now
      if (!botUserId) {
        console.log(`${LOG_CONFIG.PREFIXES.SLACK} ⚠️ Bot user ID not yet initialized, skipping member join processing`);
        return this.createSuccessResponse({ message: 'Bot user ID not initialized yet' });
      }
      
      // Check if the bot joined the channel
      if (event.user === botUserId) {
        console.log(`${LOG_CONFIG.PREFIXES.SLACK} 🤖 Bot joined channel: ${event.channel}`);
        
        // Handle bot join with one-time welcome message (includes cooldown logic)
        const botJoinPromise = this.options.slackService.handleBotJoinedChannel(event.channel);
        
        if (ctx) {
          ctx.waitUntil(botJoinPromise);
        } else {
          await botJoinPromise;
        }
        
        return this.createSuccessResponse({ 
          message: 'Bot join processed',
          eventId: Date.now().toString(),
          botJoined: true
        });
      } else {
        console.log(`${LOG_CONFIG.PREFIXES.SLACK} 👤 User ${event.user} joined channel: ${event.channel}`);
        
        // Send welcome message to the user who joined
        const userWelcomePromise = this.options.slackService.handleMemberJoined(event);
        
        if (ctx) {
          ctx.waitUntil(userWelcomePromise);
        } else {
          await userWelcomePromise;
        }
        
        return this.createSuccessResponse({ 
          message: 'User welcome message sent',
          eventId: Date.now().toString(),
          userJoined: true
        });
      }
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Member join processing error:`, error);
      return this.createSuccessResponse({ message: 'Member join acknowledged' });
    }
  }

  /**
   * Create standardized success response
   */
  private createSuccessResponse(data: any): Response {
    return new Response(
      JSON.stringify(formatSuccessResponse(data)),
      {
        status: HTTP_STATUS.OK,
        headers: this.options.corsHeaders
      }
    );
  }
}