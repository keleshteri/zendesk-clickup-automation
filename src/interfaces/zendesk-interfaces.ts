/**
 * @ai-metadata
 * @component: ZendeskInterfaces
 * @description: TypeScript interfaces for Zendesk service domain
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../services/integrations/zendesk/interfaces/index.ts"]
 * @tests: ["./tests/zendesk-interfaces.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Zendesk service interfaces for ticket management and API integration"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { ZendeskTicket } from '../services/integrations/zendesk/interfaces';

/**
 * Interface for Zendesk Service
 * Provides integration with Zendesk API for ticket management
 */
export interface IZendeskService {
  /**
   * Get a specific ticket by ID
   * @param ticketId - The ticket ID to retrieve
   * @returns Promise resolving to the ticket or null if not found
   */
  getTicket(ticketId: number): Promise<ZendeskTicket | null>;

  /**
   * Get comments for a specific ticket
   * @param ticketId - The ticket ID to get comments for
   * @returns Promise resolving to array of comments
   */
  getTicketComments(ticketId: number): Promise<any[]>;

  /**
   * Update a ticket with new data
   * @param ticketId - The ticket ID to update
   * @param updates - Partial ticket data to update
   * @returns Promise resolving to true if successful
   */
  updateTicket(ticketId: number, updates: Partial<ZendeskTicket>): Promise<boolean>;

  /**
   * Get the URL for a ticket in Zendesk
   * @param ticketId - The ticket ID
   * @returns The ticket URL
   */
  getTicketUrl(ticketId: number): string;

  /**
   * Verify webhook signature for security
   * @param body - The raw request body
   * @param signature - The webhook signature
   * @param timestamp - The webhook timestamp
   * @param secret - The webhook secret
   * @returns Promise resolving to true if signature is valid
   */
  verifyWebhookSignature(body: string, signature: string, timestamp: string, secret: string): Promise<boolean>;

  /**
   * Test connectivity to Zendesk API
   * @returns Promise resolving to true if connection is successful
   */
  testConnection(): Promise<boolean>;

  /**
   * Search tickets based on query
   * @param query - Search query string
   * @returns Promise resolving to array of matching tickets
   */
  searchTickets?(query: string): Promise<ZendeskTicket[]>;
}

/**
 * Type guard to check if an object implements IZendeskService
 */
export function isZendeskService(service: any): service is IZendeskService {
  return service && 
    typeof service.getTicket === 'function' &&
    typeof service.updateTicket === 'function' &&
    typeof service.testConnection === 'function';
}

// Re-export ZendeskTicket for convenience
export { ZendeskTicket };