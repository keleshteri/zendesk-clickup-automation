/**
 * @ai-metadata
 * @component: SlackMessagesIndex
 * @description: Barrel export for Slack message templates
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export point for all Slack message templates"
 */

export * from './welcome-message.template';
export * from './bot-intro-message.template';
export * from './ticket-info-message.template';
export * from './ticket-summary-message.template';
export * from './error-message.template';
export * from './types';
export * from './footers';

// Re-export the SlackMessageBuilderService
export { SlackMessageBuilderService } from '../slack-service/slack-message-builder.service';