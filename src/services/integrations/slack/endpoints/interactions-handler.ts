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
import { formatSuccessResponse, formatErrorResponse } from '../../../../utils';
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
   * Handle block actions (buttons, select menus, etc.)
   */
  private async handleBlockActions(payload: any, context: RequestContext): Promise<Response> {
    const action = payload.actions?.[0];
    if (!action) {
      return this.createErrorResponse('No action found in block actions');
    }

    const actionId = action.action_id;
    const actionValue = action.value;
    const userId = payload.user?.id;
    const channelId = payload.channel?.id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Block action:`, {
      actionId,
      actionValue,
      userId,
      channelId
    });

    try {
      // Placeholder: Process block action
      const result = { ok: true, message: 'Block action processed successfully' };
      
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Block action error:`, error);
      return this.createErrorResponse('Failed to process block action');
    }
  }

  /**
   * Handle interactive messages (legacy buttons)
   */
  private async handleInteractiveMessage(payload: any, context: RequestContext): Promise<Response> {
    const action = payload.actions?.[0];
    if (!action) {
      return this.createErrorResponse('No action found in interactive message');
    }

    const actionName = action.name;
    const actionValue = action.value;
    const userId = payload.user?.id;
    const channelId = payload.channel?.id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Interactive message:`, {
      actionName,
      actionValue,
      userId,
      channelId
    });

    try {
      // Placeholder: Process interactive message
      const result = { ok: true, message: 'Interactive message processed' };
      
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Interactive message error:`, error);
      return this.createErrorResponse('Failed to process interactive message');
    }
  }

  /**
   * Handle modal submissions
   */
  private async handleViewSubmission(payload: any, context: RequestContext): Promise<Response> {
    const view = payload.view;
    const userId = payload.user?.id;
    const callbackId = view?.callback_id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Modal submission:`, {
      callbackId,
      userId,
      viewId: view?.id
    });

    try {
      // Placeholder: Process modal submission
      const result = { ok: true, message: 'Modal submission processed' };
      
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Modal submission error:`, error);
      return this.createErrorResponse('Failed to process modal submission');
    }
  }

  /**
   * Handle modal closures
   */
  private async handleViewClosed(payload: any, context: RequestContext): Promise<Response> {
    const view = payload.view;
    const userId = payload.user?.id;
    const callbackId = view?.callback_id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Modal closed:`, {
      callbackId,
      userId,
      viewId: view?.id
    });

    try {
      // Placeholder: Process modal closure
      const result = { ok: true, message: 'Modal closure processed' };
      
      return this.createSuccessResponse({ message: 'Modal closure processed' });
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Modal closure error:`, error);
      return this.createSuccessResponse({ message: 'Modal closure acknowledged' });
    }
  }

  /**
   * Handle shortcuts (global and message shortcuts)
   */
  private async handleShortcut(payload: any, context: RequestContext): Promise<Response> {
    const callbackId = payload.callback_id;
    const userId = payload.user?.id;
    const triggerId = payload.trigger_id;

    console.log(`${LOG_CONFIG.PREFIXES.SLACK} Shortcut triggered:`, {
      callbackId,
      userId,
      triggerId
    });

    try {
      // Placeholder: Process shortcut
      const result = { ok: true, message: 'Shortcut processed' };
      
      return this.createSuccessResponse(result);
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Shortcut error:`, error);
      return this.createErrorResponse('Failed to process shortcut');
    }
  }

  /**
   * Handle unknown interactions
   */
  private async handleUnknownInteraction(
    interactionType: string,
    payload: any,
    context: RequestContext
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