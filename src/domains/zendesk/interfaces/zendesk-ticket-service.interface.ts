/**
 * @type: interface
 * @domain: zendesk
 * @purpose: Ticket service contract for business logic operations
 * @solid-principle: SRP, ISP
 */

import type {
  ZendeskTicket,
  ZendeskComment,
  CreateCommentRequest,
  UpdateTicketRequest,
  TicketQueryParams,
  TicketValidationResult,
  TicketPriority,
} from '../types/ticket.types';
import type {
  PaginatedResponse,
  CommonQueryParams,
} from '../types/api.types';

/**
 * Ticket service interface for business logic operations
 * Handles tickets and comments with validation and business rules
 * Follows SRP by focusing on ticket-related business operations
 */
export interface IZendeskTicketService {
  // Core ticket operations
  getTicket(ticketId: number, includeComments?: boolean): Promise<ZendeskTicket | null>;
  getTickets(params?: TicketQueryParams): Promise<PaginatedResponse<ZendeskTicket>>;
  updateTicket(ticketId: number, data: UpdateTicketRequest): Promise<ZendeskTicket>;
  
  // Comment operations
  getTicketComments(ticketId: number, params?: { page?: number; per_page?: number; sort_order?: 'asc' | 'desc' }): Promise<PaginatedResponse<ZendeskComment>>;
  addComment(ticketId: number, data: CreateCommentRequest): Promise<ZendeskTicket>;
  
  // Validation operations
  validateUpdateTicketRequest(data: UpdateTicketRequest): TicketValidationResult;
  validateCreateCommentRequest(data: CreateCommentRequest): TicketValidationResult;
  
  // Additional operations
  replyToTicket(ticketId: number, replyText: string, isPublic?: boolean): Promise<ZendeskTicket>;
  closeTicket(ticketId: number, closeComment?: string): Promise<ZendeskTicket>;
  reopenTicket(ticketId: number, reopenComment?: string): Promise<ZendeskTicket>;
  assignTicket(ticketId: number, assigneeId: number, assignmentComment?: string): Promise<ZendeskTicket>;
  updateTicketPriority(ticketId: number, priority: TicketPriority): Promise<ZendeskTicket>;
}