/**
 * @ai-metadata
 * @component: SlackCommandsHandler
 * @description: Handles Slack slash commands with proper validation and routing
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-commands-handler.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./types", "../../../../config"]
 * @tests: ["./tests/commands-handler.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Organized Slack slash command handling with validation and routing"
 */

import type { CommandHandlerOptions, RequestContext } from './types';
import { HTTP_STATUS, LOG_CONFIG } from '../../../../config';
import type { ExecutionContext } from '@cloudflare/workers-types';

/**
 * Handles Slack slash commands
 */
export class SlackCommandsHandler {
  private options: CommandHandlerOptions;

  constructor(options: CommandHandlerOptions) {
    this.options = options;
  }

  /**
   * Handle incoming Slack command
   * @param context - Request context containing parsed data
   * @param ctx - Execution context for async operations (optional)
   * @returns Promise<Response> - The response to send back
   */
  async handleCommand(context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    const { parsedBody } = context;
    const command = parsedBody.command;
    const text = parsedBody.text || '';
    const userId = parsedBody.user_id;
    const channelId = parsedBody.channel_id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Slash command received:`, {
      command,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      userId,
      channelId
    });

    try {
      // Validate command if validation is enabled
      if (this.options.enableCommandValidation && !this.isCommandSupported(command)) {
        return this.createErrorResponse(`Command ${command} is not supported`);
      }

      // Route to specific command handler
      switch (command) {
        case '/zendesk':
          return await this.handleZendeskCommand(text, userId, channelId, context);
        
        case '/clickup':
          return await this.handleClickUpCommand(text, userId, channelId, context);
        
        case '/help':
          return await this.handleHelpCommand(text, userId, channelId, context);
        
        case '/status':
          return await this.handleStatusCommand(text, userId, channelId, context);
        
        default:
          return await this.handleUnknownCommand(command, text, userId, channelId, context);
      }
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Command processing error:`, error);
      return this.createErrorResponse('Failed to process command');
    }
  }

  /**
   * Handle /zendesk command
   */
  private async handleZendeskCommand(
    text: string,
    userId: string,
    channelId: string,
    context: RequestContext
  ): Promise<Response> {
    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing Zendesk command for user ${userId}`);
    
    try {
      // For now, return a placeholder response
      return this.createSuccessResponse({
        response_type: 'ephemeral',
        text: `Zendesk command received: ${text}. Integration coming soon!`
      });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Zendesk command error:`, error);
      return this.createErrorResponse('Failed to process Zendesk command');
    }
  }

  /**
   * Handle /clickup command
   */
  private async handleClickUpCommand(
    text: string,
    userId: string,
    channelId: string,
    context: RequestContext
  ): Promise<Response> {
    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing ClickUp command for user ${userId}`);
    
    try {
      // For now, return a placeholder response
      return this.createSuccessResponse({
        response_type: 'ephemeral',
        text: `ClickUp command received: ${text}. Integration coming soon!`
      });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} ClickUp command error:`, error);
      return this.createErrorResponse('Failed to process ClickUp command');
    }
  }

  /**
   * Handle /help command
   */
  private async handleHelpCommand(
    text: string,
    userId: string,
    channelId: string,
    context: RequestContext
  ): Promise<Response> {
    const helpText = `
*Available Commands:*

• \`/zendesk [action]\` - Manage Zendesk tickets
• \`/clickup [action]\` - Manage ClickUp tasks
• \`/status\` - Check system status
• \`/help\` - Show this help message

*Examples:*
• \`/zendesk create ticket\` - Create a new Zendesk ticket
• \`/clickup list tasks\` - List your ClickUp tasks
• \`/status\` - Check if all services are running
    `;

    return this.createSuccessResponse({
      response_type: 'ephemeral',
      text: helpText
    });
  }

  /**
   * Handle /status command
   */
  private async handleStatusCommand(
    text: string,
    userId: string,
    channelId: string,
    context: RequestContext
  ): Promise<Response> {
    try {
      // Placeholder: Get system status
      const status = { ok: true, message: 'All systems operational' };
      
      return this.createSuccessResponse({
        response_type: 'ephemeral',
        text: `*System Status:*\n${status.message}`
      });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Status command error:`, error);
      return this.createErrorResponse('Failed to get system status');
    }
  }

  /**
   * Handle unknown commands
   */
  private async handleUnknownCommand(
    command: string,
    text: string,
    userId: string,
    channelId: string,
    context: RequestContext
  ): Promise<Response> {
    console.warn(`${LOG_CONFIG.PREFIXES.SLACK} Unknown command: ${command}`);
    
    return this.createSuccessResponse({
      response_type: 'ephemeral',
      text: `Unknown command: ${command}. Type \`/help\` for available commands.`
    });
  }

  /**
   * Check if command is supported
   */
  private isCommandSupported(command: string): boolean {
    if (!this.options.supportedCommands) {
      return true; // Allow all commands if no restriction
    }
    return this.options.supportedCommands.includes(command);
  }

  /**
   * Create standardized success response
   */
  private createSuccessResponse(data: any): Response {
    return new Response(
      JSON.stringify(data),
      {
        status: HTTP_STATUS.OK,
        headers: {
          ...this.options.corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(message: string): Response {
    return new Response(
      JSON.stringify({
        response_type: 'ephemeral',
        text: `❌ ${message}`
      }),
      {
        status: HTTP_STATUS.OK, // Slack expects 200 even for errors
        headers: {
          ...this.options.corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}