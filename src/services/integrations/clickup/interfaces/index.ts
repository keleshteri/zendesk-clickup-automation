/**
 * @ai-metadata
 * @component: ClickUpInterfacesIndex
 * @description: Barrel export for all ClickUp interface definitions
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/clickup-interfaces-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./clickup-user.interface.ts", "./clickup-task.interface.ts", "./clickup-api-response.interface.ts", "./clickup-webhook.interface.ts", "./clickup-oauth.interface.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Central export point for all ClickUp type definitions"
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

// ClickUp User types
export * from './clickup-user.interface';

// ClickUp Task types
export * from './clickup-task.interface';

// ClickUp API Response types
export * from './clickup-api-response.interface';

// Webhook-related types
export * from './clickup-webhook.interface';

// OAuth-related types
export * from './clickup-oauth.interface';