/**
 * @ai-metadata
 * @component: ZendeskInterfacesIndex
 * @description: Barrel export for all Zendesk interface definitions
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-interfaces-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./zendesk-user.interface.ts", "./zendesk-ticket.interface.ts", "./zendesk-api-response.interface.ts", "./zendesk-webhook.interface.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Central export point for all Zendesk type definitions using modular interface structure"
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

// Core Zendesk entity interfaces
export * from './zendesk-user.interface';
export * from './zendesk-ticket.interface';
export * from './zendesk-api-response.interface';

// Webhook-related interfaces
export * from './zendesk-webhook.interface';