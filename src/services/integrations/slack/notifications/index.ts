/**
 * @ai-metadata
 * @component: SlackNotificationsIndex
 * @description: Centralized exports for Slack notification system including builders, senders, and formatters
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-notifications-index.md
 * @stability: stable
 * @edit-permissions: "add-only"
 * @method-permissions: {}
 * @dependencies: ["./slack-notification-builder.ts", "./slack-notification-sender.ts", "./slack-notification-formatter.ts", "../../../../types/index.ts"]
 * @tests: ["./tests/slack-notifications-index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export module for Slack notifications. Changes here affect the public API of the notifications module."
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Slack Notifications Module
 * 
 * This module provides a comprehensive notification system for Slack integrations.
 * It includes builders, senders, and formatters for creating and sending
 * structured Slack notifications.
 */

export { SlackNotificationBuilder } from './slack-notification-builder';
export { SlackNotificationSender } from './slack-notification-sender';
export { SlackNotificationFormatter } from './slack-notification-formatter';

/**
 * Re-export commonly used types for convenience
 */
export {
  SlackMessage,
  SlackApiResponse
} from '../../../../types/index';