/**
 * @ai-metadata
 * @component: ZendeskWebhookTypes
 * @description: TypeScript interfaces for Zendesk webhook payloads and ticket creation events
 * @last-update: 2025-01-08
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-webhook-types.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Defines TypeScript interfaces for handling Zendesk webhook payloads, specifically for ticket creation events"
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
 * Zendesk webhook payload structure for ticket creation events
 * Based on the new Zendesk webhook format (zendesk_event_version: "2022-11-06")
 */
export interface ZendeskWebhookPayload {
  /** Zendesk account ID */
  account_id: number;
  
  /** Ticket details - main payload data */
  detail: ZendeskTicketDetail;
  
  /** Event metadata (usually empty object) */
  event: Record<string, unknown>;
  
  /** Unique webhook event ID */
  id: string;
  
  /** Event subject in format "zen:ticket:{ticket_id}" */
  subject: string;
  
  /** Event timestamp */
  time: string;
  
  /** Event type identifier */
  type: 'zen:event-type:ticket.created' | 'zen:event-type:ticket.updated' | string;
  
  /** Zendesk event version */
  zendesk_event_version: string;
}

/**
 * Detailed ticket information from Zendesk webhook
 */
export interface ZendeskTicketDetail {
  /** ID of the user who performed the action */
  actor_id: string;
  
  /** ID of the assigned agent (if any) */
  assignee_id: string | null;
  
  /** Brand ID associated with the ticket */
  brand_id: string;
  
  /** Ticket creation timestamp */
  created_at: string;
  
  /** Custom status ID */
  custom_status: string;
  
  /** Ticket description/content */
  description: string;
  
  /** External ID (if any) */
  external_id: string | null;
  
  /** Form ID used to create the ticket */
  form_id: string;
  
  /** Group ID assigned to the ticket */
  group_id: string;
  
  /** Unique ticket ID */
  id: string;
  
  /** Whether the ticket is public */
  is_public: boolean;
  
  /** Organization ID of the requester */
  organization_id: string;
  
  /** Ticket priority level */
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  
  /** ID of the user who requested the ticket */
  requester_id: string;
  
  /** Current ticket status */
  status: 'NEW' | 'OPEN' | 'PENDING' | 'SOLVED' | 'CLOSED';
  
  /** Ticket subject/title */
  subject: string;
  
  /** ID of the user who submitted the ticket */
  submitter_id: string;
  
  /** Array of tags associated with the ticket */
  tags: string[];
  
  /** Ticket type */
  type: 'INCIDENT' | 'PROBLEM' | 'QUESTION' | 'TASK';
  
  /** Last update timestamp */
  updated_at: string;
  
  /** Information about how the ticket was created */
  via: ZendeskTicketVia;
}

/**
 * Information about the channel through which the ticket was created
 */
export interface ZendeskTicketVia {
  /** Channel type (e.g., 'web_service', 'email', 'api', etc.) */
  channel: string;
  
  /** Additional source information (optional) */
  source?: {
    from?: Record<string, unknown>;
    to?: Record<string, unknown>;
    rel?: string;
  };
}

/**
 * Webhook validation result
 */
export interface WebhookValidationResult {
  /** Whether the webhook payload is valid */
  isValid: boolean;
  
  /** Validation errors (if any) */
  errors: string[];
  
  /** Parsed ticket data (if valid) */
  ticketData?: ZendeskTicketDetail;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  /** Whether the webhook was processed successfully */
  success: boolean;
  
  /** Processing status message */
  message: string;
  
  /** Ticket ID that was processed */
  ticketId?: string;
  
  /** Any error that occurred during processing */
  error?: string;
  
  /** Additional processing metadata */
  metadata?: {
    processingTime: number;
    timestamp: string;
    webhookId: string;
  };
}

/**
 * Type guard to check if payload is a ticket creation event
 */
export function isTicketCreatedEvent(payload: ZendeskWebhookPayload): boolean {
  return payload.type === 'zen:event-type:ticket.created';
}

/**
 * Type guard to check if payload is a ticket update event
 */
export function isTicketUpdatedEvent(payload: ZendeskWebhookPayload): boolean {
  return payload.type === 'zen:event-type:ticket.updated';
}

/**
 * Convert webhook priority to standard format
 */
export function normalizeWebhookPriority(priority: string): 'low' | 'normal' | 'high' | 'urgent' {
  switch (priority.toUpperCase()) {
    case 'LOW':
      return 'low';
    case 'NORMAL':
      return 'normal';
    case 'HIGH':
      return 'high';
    case 'URGENT':
      return 'urgent';
    default:
      return 'normal';
  }
}

/**
 * Convert webhook status to standard format
 */
export function normalizeWebhookStatus(status: string): 'new' | 'open' | 'pending' | 'solved' | 'closed' {
  switch (status.toUpperCase()) {
    case 'NEW':
      return 'new';
    case 'OPEN':
      return 'open';
    case 'PENDING':
      return 'pending';
    case 'SOLVED':
      return 'solved';
    case 'CLOSED':
      return 'closed';
    default:
      return 'new';
  }
}