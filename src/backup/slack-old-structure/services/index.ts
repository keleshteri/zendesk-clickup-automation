/**
 * @fileoverview Slack Services Layer
 * @description Central export point for all Slack domain services
 * @version 1.0.0
 * @author Zendesk-ClickUp Integration Team
 * @since 2024
 */

// Domain Services
export { SlackIntegrationService } from './slack-integration-service';
export { SlackMessageService } from './slack-message-service';
export { SlackNotificationService } from './slack-notification-service';
export { SlackThreadService } from './slack-thread-service';

// Service Types
export type {
  SlackIntegrationServiceConfig,
  SlackMessageServiceConfig,
  SlackNotificationServiceConfig,
  SlackThreadServiceConfig,
  ServiceResult,
  ServiceError,
  ServiceContext,
  ServiceOptions,
  BaseServiceConfig
} from './types';

// Service Base Classes
export { BaseSlackService } from './base-slack-service';
export { SlackDomainService } from './slack-domain-service';

/**
 * @example
 * ```typescript
 * import { SlackIntegrationService } from './services';
 * 
 * // Create integration service
 * const integrationService = new SlackIntegrationService({
 *   client: { token: 'xoxb-your-bot-token' },
 *   auth: { signingSecret: 'your-signing-secret' }
 * });
 * 
 * // Process integration
 * const result = await integrationService.processIntegration({
 *   type: 'zendesk',
 *   action: 'ticket_created',
 *   payload: { ticketId: '123' }
 * });
 * ```
 */