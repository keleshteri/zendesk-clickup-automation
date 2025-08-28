/**
 * @ai-metadata
 * @component: ZendeskUserInterface
 * @description: Zendesk User interface definition
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-user-interface.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines the ZendeskUser interface for representing users in the Zendesk system"
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
 * Zendesk User interface
 * Represents a user in the Zendesk system
 */
export interface ZendeskUser {
  id: number;
  name: string;
  email: string;
}