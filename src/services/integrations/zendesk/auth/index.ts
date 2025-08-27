/**
 * @ai-metadata
 * @component: ZendeskAuthModule
 * @description: Barrel export for Zendesk authentication components
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-auth-module.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./auth.service.ts", "./credential-validator.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Exports all Zendesk authentication related functionality"
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

// Export credential validation
export {
  validateZendeskCredentials,
  createZendeskAuthHeader,
  getZendeskBaseUrl,
  ZendeskCredentialValidationResult,
  ZendeskCredentialConfig,
  ZENDESK_CREDENTIAL_CONFIG
} from './credential-validator';