/**
 * @ai-metadata
 * @component: ClickUpAuthModule
 * @description: Barrel export for ClickUp authentication components
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/clickup-auth-module.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./auth.service.ts", "./credential-validator.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Exports all ClickUp authentication related functionality"
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
  validateClickUpCredentials,
  hasValidClickUpAuth,
  ClickUpCredentialValidationResult,
  ClickUpCredentialConfig,
  CLICKUP_CREDENTIAL_CONFIG,
  validateClickUpCredentialsMiddleware
} from './auth.service';