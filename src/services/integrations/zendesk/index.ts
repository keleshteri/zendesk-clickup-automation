/**
 * @ai-metadata
 * @component: ZendeskIntegrationIndex
 * @description: Main export file for Zendesk integration services and interfaces
 * @last-update: 2025-01-08
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-integration-index.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./zendesk.service.ts", "./webhook.interface.ts", "./webhook.types.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Barrel export file for all Zendesk integration components"
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

// Export the main Zendesk service
export { ZendeskService } from './zendesk.service';

// Export the webhook interface
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

// Re-export commonly used types from the main types file
export type { ZendeskTicket, ZendeskUser, ZendeskWebhook } from '../../../types/index';