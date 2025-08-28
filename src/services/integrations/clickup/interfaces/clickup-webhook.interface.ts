/**
 * @ai-metadata
 * @component: ClickUpWebhookInterfaces
 * @description: ClickUp webhook-related type definitions and payload structures
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/clickup-webhook-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./core.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines webhook payload structures and event types for ClickUp integration"
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

import { ClickUpTask } from './clickup-task.interface';
import { ClickUpUser } from './clickup-user.interface';

/**
 * ClickUp Webhook interface
 * Represents incoming webhook data from ClickUp
 */
export interface ClickUpWebhook {
  webhook_id: string;
  event: string;
  task_id?: string;
  history_items: {
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: {
      status_type?: string;
    };
    source: string;
    user: ClickUpUser;
    before?: any;
    after?: any;
  }[];
  task?: ClickUpTask;
}

/**
 * ClickUp Webhook Payload interface
 * Represents the payload structure for ClickUp webhooks
 */
export interface ClickUpWebhookPayload {
  webhook_id: string;
  event: string;
  task_id?: string;
  history_items: any[];
  task?: ClickUpTask;
}