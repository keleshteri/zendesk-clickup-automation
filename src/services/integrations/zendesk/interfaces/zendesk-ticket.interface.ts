/**
 * @ai-metadata
 * @component: ZendeskTicketInterface
 * @description: Zendesk Ticket interface definition
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-ticket-interface.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines the ZendeskTicket interface for representing support tickets in Zendesk"
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
 * Zendesk Ticket interface
 * Represents a support ticket in Zendesk
 */
export interface ZendeskTicket {
  id: number;
  url: string;
  subject: string;
  description: string;
  raw_subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  requester_id: number;
  assignee_id?: number;
  organization_id?: number;
  group_id?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  external_id?: string;
}