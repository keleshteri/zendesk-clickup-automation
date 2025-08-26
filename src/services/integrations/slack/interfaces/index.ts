/**
 * @ai-metadata
 * @component: SlackInterfacesIndex
 * @description: Export file for all Slack interfaces including service contracts and event definitions
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-service.interface", "./slack-messaging.interface", "./slack-bot-manager.interface", "./slack-event-handler.interface", "./slack-security.interface", "./slack-event.interface", "./slack-app-mention-event.interface", "./slack-member-joined-channel-event.interface", "./slack-message-event.interface", "./slack-error.interface", "./slack-error-reporting.interface"]
 */

// Core service interfaces for dependency injection
export * from './services/slack-service.interface';
export * from './services/slack-messaging.interface';
export * from './services/slack-bot-manager.interface';
export * from './services/slack-event-handler.interface';
export * from './services/slack-security.interface';

// Event interfaces
export * from './slack-app-mention-event.interface';
export * from './slack-event.interface';
export * from './slack-member-joined-channel-event.interface';
export * from './slack-message-event.interface';

// Error handling interfaces
export * from './slack-error.interface';
export * from './slack-error-reporting.interface';