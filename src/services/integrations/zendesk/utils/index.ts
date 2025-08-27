/**
 * @ai-metadata
 * @component: ZendeskUtilsModule
 * @description: Barrel export for Zendesk utility functions
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-utils-module.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./retry.ts", "./validators.ts", "./formatters.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Exports all Zendesk utility functions and helpers"
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

// Export retry utilities
export {
  retryZendeskOperation,
  retryZendeskApiCall,
  ZENDESK_RETRY_OPTIONS,
  ZendeskApiError,
  ZendeskRateLimitError,
  ZendeskServiceUnavailableError
} from './retry';