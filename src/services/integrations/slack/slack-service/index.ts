/**
 * @ai-metadata
 * @component: SlackServiceIndex
 * @description: Main export file for the modular Slack service, maintaining backward compatibility
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-service"]
 */

// Main service export
export { SlackService } from './slack-service';

// Individual service exports (for advanced usage)
export { SlackMessagingService } from './slack-messaging.service';
export { SlackEventHandler } from './slack-event-handler.service';
export { SlackBotManager } from './slack-bot-manager.service';
export { SlackSecurityService } from './slack-security.service';
export { SlackErrorReportingService } from './slack-error-reporting.service';

// Default export for backward compatibility
export { SlackService as default } from './slack-service';