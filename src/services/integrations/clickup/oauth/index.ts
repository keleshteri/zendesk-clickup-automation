/**
 * @ai-metadata
 * @component: ClickUpOAuthModule
 * @description: Barrel export for ClickUp OAuth components
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/clickup-oauth-module.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./oauth.service.ts", "./token-manager.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Exports all ClickUp OAuth related functionality"
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

// Export OAuth service
export { OAuthService } from './oauth.service';