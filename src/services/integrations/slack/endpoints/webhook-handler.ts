/**
 * @ai-metadata
 * @component: SlackWebhookHandler
 * @description: Handles Slack webhook requests with proper signature verification and routing
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-webhook-handler.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./types", "../slack-service", "../../../../config"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Centralized Slack webhook handling with improved signature verification"
 */

import type { WebhookHandlerOptions, RequestContext } from './types';
import { SlackEventsHandler } from './events-handler';
import { SlackCommandsHandler } from './commands-handler';
import { SlackInteractionsHandler } from './interactions-handler';
import { HTTP_STATUS, LOG_CONFIG, ERROR_MESSAGES } from '../../../../config';
import { formatErrorResponse, formatSuccessResponse, getDuplicateEventMonitor } from '../../../../utils';

/**
 * Centralized Slack webhook handler
 */
export class SlackWebhookHandler {
  private options: WebhookHandlerOptions;
  private eventsHandler: SlackEventsHandler;
  private commandsHandler: SlackCommandsHandler;
  private interactionsHandler: SlackInteractionsHandler;

  constructor(options: WebhookHandlerOptions) {
    this.options = options;
    this.eventsHandler = new SlackEventsHandler({
      env: options.env,
      slackService: options.slackService,
      corsHeaders: options.corsHeaders
    });
    this.commandsHandler = new SlackCommandsHandler({
      env: options.env,
      slackService: options.slackService,
      corsHeaders: options.corsHeaders
    });
    this.interactionsHandler = new SlackInteractionsHandler({
      env: options.env,
      slackService: options.slackService,
      corsHeaders: options.corsHeaders
    });
  }

  /**
   * Handle incoming Slack webhook requests
   * @param request - The incoming HTTP request
   * @param ctx - Execution context for async operations (optional)
   * @returns Promise<Response> - The HTTP response
   */
  async handle(request: Request, ctx?: ExecutionContext): Promise<Response> {
    try {
      // Extract request context
      const context = await this.extractRequestContext(request);
      
      console.log(`${LOG_CONFIG.PREFIXES.SLACK} Webhook received:`, {
        type: context.parsedBody?.type,
        hasSignature: !!context.signature,
        timestamp: context.timestamp
      });

      // Handle URL verification challenge FIRST (before signature verification)
      if (context.parsedBody?.type === 'url_verification') {
        console.log(`${LOG_CONFIG.PREFIXES.SLACK} URL verification challenge received`);
        return new Response(context.parsedBody.challenge, {
          status: HTTP_STATUS.OK,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Verify signature for all other requests
      if (this.options.enableSignatureVerification !== false) {
        const isValidSignature = await this.verifySignature(context);
        if (!isValidSignature) {
          console.warn(`${LOG_CONFIG.PREFIXES.SLACK} Invalid webhook signature`);
          return new Response(
            JSON.stringify(formatErrorResponse(ERROR_MESSAGES.UNAUTHORIZED)),
            {
              status: HTTP_STATUS.UNAUTHORIZED,
              headers: this.options.corsHeaders
            }
          );
        }
      }

      // Route to appropriate handler based on request type
      return await this.routeRequest(context, ctx);

    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Webhook processing error:`, error);
      return new Response(
        JSON.stringify(formatErrorResponse('Internal server error')),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: this.options.corsHeaders
        }
      );
    }
  }

  /**
   * Extract and validate request context
   */
  private async extractRequestContext(request: Request): Promise<RequestContext> {
    // Clone request to read body multiple times if needed
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(body);
    } catch (error) {
      console.warn(`${LOG_CONFIG.PREFIXES.SLACK} Failed to parse request body as JSON`);
      parsedBody = {};
    }

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const timestamp = headers['x-slack-request-timestamp'] || '';
    const signature = headers['x-slack-signature'] || '';

    return {
      request,
      body,
      parsedBody,
      headers,
      timestamp,
      signature
    };
  }

  /**
   * Verify Slack request signature
   */
  private async verifySignature(context: RequestContext): Promise<boolean> {
    if (!context.signature || !context.timestamp) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Missing signature or timestamp headers`);
      return false;
    }

    try {
      const isValid = await this.options.slackService.verifyRequest(
        context.signature,
        context.body,
        context.timestamp
      );

      if (!isValid) {
        console.error(`${LOG_CONFIG.PREFIXES.SLACK} Signature verification failed:`, {
          expectedSignaturePrefix: 'v0=',
          receivedSignaturePrefix: context.signature.substring(0, 3),
          bodyLength: context.body.length,
          timestamp: context.timestamp
        });
      }

      return isValid;
    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.SLACK} Signature verification error:`, error);
      return false;
    }
  }

  /**
   * Route request to appropriate handler
   */
  private async routeRequest(context: RequestContext, ctx?: ExecutionContext): Promise<Response> {
    const { parsedBody } = context;
    const monitor = getDuplicateEventMonitor();

    // Handle Slack events
    if (parsedBody.type === 'event_callback' && parsedBody.event) {
      const eventType = parsedBody.event.type;
      const eventKey = `${eventType}:${parsedBody.event.ts || 'unknown'}:${parsedBody.event.channel || 'unknown'}`;
      
      console.log(`${LOG_CONFIG.PREFIXES.SLACK} Routing event: ${eventType} (${eventKey})`);
      monitor.recordEvent(eventKey, eventType, {
        source: 'webhook-handler',
        channel: parsedBody.event.channel,
        user: parsedBody.event.user,
        timestamp: parsedBody.event.ts
      });
      
      return await this.eventsHandler.handleEvent(context, ctx);
    }

    // Handle Slack commands
    if (parsedBody.command) {
      const commandKey = `command:${parsedBody.command}:${parsedBody.user_id}:${Date.now()}`;
      
      console.log(`${LOG_CONFIG.PREFIXES.SLACK} Routing command: ${parsedBody.command}`);
      monitor.recordEvent(commandKey, 'slack_command', {
        source: 'webhook-handler',
        command: parsedBody.command,
        user: parsedBody.user_id,
        channel: parsedBody.channel_id
      });
      
      return await this.commandsHandler.handleCommand(context, ctx);
    }

    // Handle Slack interactions (buttons, modals, etc.)
    if (parsedBody.type === 'interactive_message' || parsedBody.type === 'block_actions') {
      const interactionKey = `interaction:${parsedBody.type}:${parsedBody.user?.id || 'unknown'}:${Date.now()}`;
      
      console.log(`${LOG_CONFIG.PREFIXES.SLACK} Routing interaction: ${parsedBody.type}`);
      monitor.recordEvent(interactionKey, 'slack_interaction', {
        source: 'webhook-handler',
        interactionType: parsedBody.type,
        user: parsedBody.user?.id,
        channel: parsedBody.channel?.id
      });
      
      return await this.interactionsHandler.handleInteraction(context, ctx);
    }

    // Unknown request type
    console.warn(`${LOG_CONFIG.PREFIXES.SLACK} Unknown webhook type:`, parsedBody.type);
    return new Response(
      JSON.stringify(formatSuccessResponse({ message: 'Request processed' })),
      {
        status: HTTP_STATUS.OK,
        headers: this.options.corsHeaders
      }
    );
  }
}