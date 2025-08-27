/**
 * @ai-metadata
 * @component: ZendeskWebhooksModule
 * @description: Barrel export for Zendesk webhook components
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-webhooks-module.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./webhook.interface.ts", "./webhook.types.ts", "./webhook.validator.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Exports all Zendesk webhook related functionality"
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

// Export webhook interface
export { ZendeskWebhookInterface } from './webhook.interface';

// Export webhook types and utilities
export {
  ZendeskWebhookPayload,
  ZendeskTicketDetail,
  ZendeskTicketVia,
  WebhookValidationResult,
  WebhookProcessingResult,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  normalizeWebhookPriority,
  normalizeWebhookStatus
} from './webhook.types';