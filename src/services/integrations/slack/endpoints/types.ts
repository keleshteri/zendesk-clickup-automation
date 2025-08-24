/**
 * @ai-metadata
 * @component: SlackEndpointTypes
 * @description: Type definitions for Slack endpoint handlers
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-endpoint-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../../../types", "../types"]
 * @tests: ["./tests/types.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Type definitions for organized Slack endpoint handling"
 */

import type { Env } from '../../../../types';
import type { SlackService } from '../slack-service';

/**
 * Base configuration for all Slack endpoint handlers
 */
export interface BaseHandlerOptions {
  env: Env;
  slackService: SlackService;
  corsHeaders: Record<string, string>;
}

/**
 * Configuration for webhook handler
 */
export interface WebhookHandlerOptions extends BaseHandlerOptions {
  enableSignatureVerification?: boolean;
  enableRateLimiting?: boolean;
}

/**
 * Configuration for events handler
 */
export interface EventHandlerOptions extends BaseHandlerOptions {
  enableEventFiltering?: boolean;
  supportedEventTypes?: string[];
}

/**
 * Configuration for commands handler
 */
export interface CommandHandlerOptions extends BaseHandlerOptions {
  enableCommandValidation?: boolean;
  supportedCommands?: string[];
}

/**
 * Configuration for interactions handler
 */
export interface InteractionHandlerOptions extends BaseHandlerOptions {
  enableInteractionValidation?: boolean;
  supportedInteractionTypes?: string[];
}

/**
 * Standard response format for all handlers
 */
export interface HandlerResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

/**
 * Request context passed to handlers
 */
export interface RequestContext {
  request: Request;
  body: string;
  parsedBody: any;
  headers: Record<string, string>;
  timestamp: string;
  signature?: string;
}