/**
 * @ai-metadata
 * @component: ClickUpApiResponseInterface
 * @description: ClickUp API response-related type definitions and structures
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/clickup-api-response-interface.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./clickup-user.interface.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines ClickUp API response structures and related types"
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

import { ClickUpUser } from './clickup-user.interface';

/**
 * ClickUp API Response interface
 * Generic response structure for ClickUp API calls
 */
export interface ClickUpApiResponse<T = any> {
  tasks?: T[];
  task?: T;
  teams?: any[];
  spaces?: any[];
  folders?: any[];
  lists?: any[];
  members?: ClickUpUser[];
  last_page?: boolean;
}