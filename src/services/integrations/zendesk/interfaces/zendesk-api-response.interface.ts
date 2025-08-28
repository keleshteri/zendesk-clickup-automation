/**
 * @ai-metadata
 * @component: ZendeskApiResponseInterface
 * @description: Zendesk API Response interface definition
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-api-response-interface.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./zendesk-user.interface.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines the ZendeskApiResponse interface for generic API response structures"
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

import { ZendeskUser } from './zendesk-user.interface';

/**
 * Zendesk API Response interface
 * Generic response structure for Zendesk API calls
 */
export interface ZendeskApiResponse<T = any> {
  ticket?: T;
  tickets?: T[];
  users?: ZendeskUser[];
  count?: number;
  next_page?: string;
  previous_page?: string;
}