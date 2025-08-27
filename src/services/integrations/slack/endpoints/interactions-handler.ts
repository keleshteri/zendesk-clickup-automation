/**
 * @ai-metadata
 * @component: SlackInteractionsHandler
 * @description: Handles Slack interactive components (buttons, modals, select menus, etc.)
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-interactions-handler.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./types", "../../../../config"]
 * @tests: ["./tests/interactions-handler.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Organized Slack interactive component handling with proper routing"
 */

import type { InteractionHandlerOptions, RequestContext } from './types';
import { HTTP_STATUS, LOG_CONFIG } from '../../../../config';
import type { ExecutionContext } from '@cloudflare/workers-types';

/**
 * Handles Slack interactive components
 */
export class SlackInteractionsHandler {
  private options: InteractionHandlerOptions;

  constructor(options: InteractionHandlerOptions) {
    this.options = options;
  }

  /**
   * Handle Slack interaction
   * @param context - Request context containing parsed data
   * @param ctx - Execution context for async operations (optional)
   * @returns Promise<Response> - The response to send back
   */
  async handleInteraction(context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    const { parsedBody } = context;
    const interactionType = parsedBody.type;
    const payload = parsedBody.payload ? JSON.parse(parsedBody.payload) : parsedBody;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Interaction received:`, {
      type: interactionType,
      actionId: payload.actions?.[0]?.action_id,
      userId: payload.user?.id,
      channelId: payload.channel?.id
    });

    try {
      // Validate interaction if validation is enabled
      if (this.options.enableInteractionValidation && !this.isInteractionSupported(interactionType)) {
        return this.createErrorResponse(`Interaction type ${interactionType} is not supported`);
      }

      // Route to specific interaction handler
      switch (interactionType) {
        case 'block_actions':
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing block actions interaction`);
          // For now, acknowledge the block action
          return this.createSuccessResponse({ ok: true });
        
        case 'interactive_message':
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing interactive message`);
          // For now, acknowledge the interactive message
          return this.createSuccessResponse({ ok: true });
        
        case 'view_submission':
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing modal submission`);
          // For now, acknowledge the modal submission
          return this.createSuccessResponse({ ok: true });
        
        case 'view_closed':
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing modal closed event`);
          // For now, acknowledge the modal closed event
          return this.createSuccessResponse({ ok: true });
        
        case 'shortcut':
          console.log(`${LOG_CONFIG.PREFIXES.SLACK} Processing shortcut interaction`);
          // For now, acknowledge the shortcut
          return this.createSuccessResponse({ ok: true });
        
        default:
          return await this.handleUnknownInteraction(interactionType, payload, context);
      }
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Interaction processing error:`, error);
      return this.createErrorResponse('Failed to process interaction');
    }
  }



  /**
   * Handle unknown interactions
   */
  private async handleUnknownInteraction(
    interactionType: string,
    _payload: any,
    _context: RequestContext
  ): Promise<Response> {
    console.warn(`${LOG_CONFIG.PREFIXES.SLACK} Unknown interaction type: ${interactionType}`);
    
    return this.createSuccessResponse({
      message: `Interaction type ${interactionType} acknowledged`
    });
  }

  /**
   * Check if interaction type is supported
   */
  private isInteractionSupported(interactionType: string): boolean {
    if (!this.options.supportedInteractionTypes) {
      return true; // Allow all interactions if no restriction
    }
    return this.options.supportedInteractionTypes.includes(interactionType);
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