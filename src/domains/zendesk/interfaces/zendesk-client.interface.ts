/**
 * @type: interface
 * @domain: zendesk
 * @purpose: Main Zendesk API client contract
 * @solid-principle: ISP
 */

import type {
  ZendeskTicket,
  ZendeskComment,
  CreateCommentRequest,
  UpdateTicketRequest,
  TicketQueryParams,
} from '../types/ticket.types';
import type {
  ZendeskUser,
  CurrentUser,
} from '../types/user.types';
import type {
  ApiResponse,
  PaginatedResponse,
  CommonQueryParams,
} from '../types/api.types';

/**
 * Main Zendesk API client interface
 * Provides access to essential Zendesk API operations
 * Follows ISP by grouping related operations
 */
export interface IZendeskClient {
  // Authentication & Authorization
  validateToken(apiToken?: string): Promise<boolean>;
  getCurrentUser(): Promise<CurrentUser>;
  
  // Ticket Operations
  getTicket(ticketId: number, include?: string[]): Promise<ZendeskTicket | null>;
  getTickets(params?: TicketQueryParams): Promise<PaginatedResponse<ZendeskTicket>>;
  updateTicket(ticketId: number, data: UpdateTicketRequest): Promise<ZendeskTicket>;
  
  // Comment Operations
  getTicketComments(ticketId: number, params?: { page?: number; per_page?: number; sort_order?: 'asc' | 'desc' }): Promise<PaginatedResponse<ZendeskComment>>;
  addComment(ticketId: number, data: CreateCommentRequest): Promise<ZendeskTicket>;
  
  // Health Check
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }>;
}