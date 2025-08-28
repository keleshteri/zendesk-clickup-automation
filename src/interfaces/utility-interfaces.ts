/**
 * @ai-metadata
 * @component: UtilityInterfaces
 * @description: Interface definitions for utility functions and common types
 * @last-update: 2025-01-28
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/utility-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["../utils/tests/index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Common utility type definitions for Zendesk and ClickUp integrations"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

/**
 * Zendesk priority levels
 */
export type ZendeskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * ClickUp priority levels (numeric)
 */
export type ClickUpPriority = 1 | 2 | 3 | 4;