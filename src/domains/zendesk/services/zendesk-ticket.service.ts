/**
 * @type: service
 * @domain: zendesk
 * @purpose: Zendesk ticket service with business logic and validation
 * @implements: IZendeskTicketService
 * @dependencies: [IZendeskClient]
 * @tested: no
 */

import type { IZendeskTicketService } from '../interfaces/zendesk-ticket-service.interface';
import type { IZendeskClient } from '../interfaces/zendesk-client.interface';
import type {
  ZendeskTicket,
  ZendeskComment,
  UpdateTicketRequest,
  CreateCommentRequest,
  TicketQueryParams,
  TicketValidationResult,
  TicketStatus,
  TicketPriority
} from '../types/ticket.types';
import type { PaginatedResponse } from '../types/api.types';
import {
  UpdateTicketRequestSchema,
  CreateCommentRequestSchema,
  TicketQueryParamsSchema
} from '../types/ticket.types';

export class ZendeskTicketService implements IZendeskTicketService {
  constructor(private readonly zendeskClient: IZendeskClient) {}

  async getTicket(ticketId: number, includeComments?: boolean): Promise<ZendeskTicket | null> {
    const include = includeComments ? ['comments'] : undefined;
    return this.zendeskClient.getTicket(ticketId, include);
  }

  async getTickets(params?: TicketQueryParams): Promise<PaginatedResponse<ZendeskTicket>> {
    // Validate query parameters
    if (params) {
      const validation = this.validateTicketQueryParams(params);
      if (!validation.isValid) {
        throw new Error(`Invalid query parameters: ${validation.errors.join(', ')}`);
      }
    }

    return this.zendeskClient.getTickets(params);
  }

  async updateTicket(ticketId: number, updateData: UpdateTicketRequest): Promise<ZendeskTicket> {
    // Validate update data
    const validation = this.validateUpdateTicketRequest(updateData);
    if (!validation.isValid) {
      throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
    }

    // Get current ticket to check business rules
    const currentTicket = await this.zendeskClient.getTicket(ticketId);
    if (!currentTicket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    // Apply business rules
    const processedUpdateData = this.applyBusinessRules(currentTicket, updateData);

    return this.zendeskClient.updateTicket(ticketId, processedUpdateData);
  }

  async getTicketComments(
    ticketId: number,
    params?: { page?: number; per_page?: number; sort_order?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<ZendeskComment>> {
    // Validate pagination parameters
    if (params?.page && params.page < 1) {
      throw new Error('Page number must be greater than 0');
    }
    if (params?.per_page && (params.per_page < 1 || params.per_page > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    return this.zendeskClient.getTicketComments(ticketId, params);
  }

  async addComment(ticketId: number, commentData: CreateCommentRequest): Promise<ZendeskTicket> {
    // Validate comment data
    const validation = this.validateCreateCommentRequest(commentData);
    if (!validation.isValid) {
      throw new Error(`Invalid comment data: ${validation.errors.join(', ')}`);
    }

    // Get current ticket to check if it can receive comments
    const currentTicket = await this.zendeskClient.getTicket(ticketId);
    if (!currentTicket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    // Check if ticket can receive comments
    if (!this.canAddComment(currentTicket)) {
      throw new Error(`Cannot add comment to ticket ${ticketId} in status ${currentTicket.status}`);
    }

    return this.zendeskClient.addComment(ticketId, commentData);
  }

  async replyToTicket(
    ticketId: number,
    replyText: string,
    isPublic: boolean = true
  ): Promise<ZendeskTicket> {
    const commentData: CreateCommentRequest = {
      body: replyText,
      public: isPublic
    };

    return this.addComment(ticketId, commentData);
  }

  async closeTicket(ticketId: number, closeComment?: string): Promise<ZendeskTicket> {
    const updateData: UpdateTicketRequest = {
      status: 'closed'
    };

    if (closeComment) {
      updateData.comment = {
        body: closeComment,
        public: true
      };
    }

    return this.updateTicket(ticketId, updateData);
  }

  async reopenTicket(ticketId: number, reopenComment?: string): Promise<ZendeskTicket> {
    const updateData: UpdateTicketRequest = {
      status: 'open'
    };

    if (reopenComment) {
      updateData.comment = {
        body: reopenComment,
        public: true
      };
    }

    return this.updateTicket(ticketId, updateData);
  }

  async assignTicket(ticketId: number, assigneeId: number, assignmentComment?: string): Promise<ZendeskTicket> {
    const updateData: UpdateTicketRequest = {
      assignee_id: assigneeId
    };

    if (assignmentComment) {
      updateData.comment = {
        body: assignmentComment,
        public: false // Assignment comments are typically internal
      };
    }

    return this.updateTicket(ticketId, updateData);
  }

  async updateTicketPriority(ticketId: number, priority: TicketPriority): Promise<ZendeskTicket> {
    return this.updateTicket(ticketId, { priority });
  }

  validateUpdateTicketRequest(updateData: UpdateTicketRequest): TicketValidationResult {
    try {
      UpdateTicketRequestSchema.parse(updateData);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errors = error instanceof Error ? [error.message] : ['Invalid update data'];
      return { isValid: false, errors };
    }
  }

  validateCreateCommentRequest(commentData: CreateCommentRequest): TicketValidationResult {
    try {
      CreateCommentRequestSchema.parse(commentData);
      
      const errors: string[] = [];
      const warnings: string[] = [];

      // Additional business validation
      if (commentData.body.trim().length === 0) {
        errors.push('Comment body cannot be empty');
      }

      if (commentData.body.length > 65535) {
        errors.push('Comment body exceeds maximum length of 65535 characters');
      }

      // Check for potentially sensitive information
      if (this.containsSensitiveInfo(commentData.body)) {
        warnings.push('Comment may contain sensitive information');
      }

      return { 
        isValid: errors.length === 0, 
        errors, 
        warnings: warnings.length > 0 ? warnings : undefined 
      };
    } catch (error) {
      const errors = error instanceof Error ? [error.message] : ['Invalid comment data'];
      return { isValid: false, errors };
    }
  }

  validateTicketQueryParams(params: TicketQueryParams): TicketValidationResult {
    try {
      TicketQueryParamsSchema.parse(params);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errors = error instanceof Error ? [error.message] : ['Invalid query parameters'];
      return { isValid: false, errors };
    }
  }

  private applyBusinessRules(currentTicket: ZendeskTicket, updateData: UpdateTicketRequest): UpdateTicketRequest {
    const processedData = { ...updateData };

    // Business rule: Cannot reopen a solved ticket without a comment
    if (currentTicket.status === 'solved' && 
        processedData.status === 'open' && 
        !processedData.comment) {
      processedData.comment = {
        body: 'Ticket reopened automatically',
        public: false
      };
    }

    // Business rule: When closing a ticket, ensure it's marked as solved first
    if (processedData.status === 'closed' && currentTicket.status !== 'solved') {
      processedData.status = 'solved';
    }

    // Business rule: High priority tickets should have an assignee
    if (processedData.priority === 'high' && 
        !processedData.assignee_id && 
        !currentTicket.assignee_id) {
      // This could trigger a notification to supervisors
      // For now, we'll just ensure the ticket is flagged
    }

    return processedData;
  }

  private canAddComment(ticket: ZendeskTicket): boolean {
    // Cannot add comments to closed tickets
    if (ticket.status === 'closed') {
      return false;
    }

    // Additional business rules can be added here
    return true;
  }

  private containsSensitiveInfo(text: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /password\s*[:=]\s*\S+/i, // Password patterns
      /api[_\s]*key\s*[:=]\s*\S+/i, // API key patterns
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  // Helper method to search tickets with business logic
  async searchTicketsByStatus(status: TicketStatus, limit?: number): Promise<ZendeskTicket[]> {
    const params: TicketQueryParams = {
      status,
      per_page: limit || 25,
      sort_by: 'updated_at',
      sort_order: 'desc'
    };

    const result = await this.getTickets(params);
    return [...result.items];
  }

  // Helper method to get tickets assigned to a specific user
  async getTicketsAssignedTo(assigneeId: number, limit?: number): Promise<ZendeskTicket[]> {
    const params: TicketQueryParams = {
      assignee_id: assigneeId,
      per_page: limit || 25,
      sort_by: 'updated_at',
      sort_order: 'desc'
    };

    const result = await this.getTickets(params);
    return [...result.items];
  }
}