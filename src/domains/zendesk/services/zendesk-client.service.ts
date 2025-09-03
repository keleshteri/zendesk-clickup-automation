/**
 * @type: service
 * @domain: zendesk
 * @purpose: Zendesk client implementation for ticket operations
 * @implements: IZendeskClient
 * @dependencies: [IZendeskHttpClient]
 * @tested: no
 */

import type { IZendeskClient } from '../interfaces/zendesk-client.interface';
import type { IZendeskHttpClient } from '../interfaces/http-client.interface';
import type {
  ZendeskTicket,
  ZendeskComment,
  UpdateTicketRequest,
  CreateCommentRequest,
  TicketQueryParams
} from '../types/ticket.types';
import type { ZendeskUser, CurrentUser } from '../types/user.types';
import type { PaginatedResponse } from '../types/api.types';

export class ZendeskClient implements IZendeskClient {
  constructor(private readonly httpClient: IZendeskHttpClient) {}

  async authenticate(): Promise<boolean> {
    return this.httpClient.authenticate();
  }

  async validateToken(apiToken?: string): Promise<boolean> {
    try {
      // If a specific token is provided, we would need to create a new client instance
      // For now, we'll validate the current token by making a test request
      const response = await this.httpClient.get('/users/me.json');
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<CurrentUser> {
    const response = await this.httpClient.get<{ user: CurrentUser }>('/users/me.json');
    return response.data.user;
  }

  async getUser(userId: number): Promise<ZendeskUser | null> {
    try {
      const response = await this.httpClient.get<{ user: ZendeskUser }>(`/users/${userId}.json`);
      return response.data.user;
    } catch (error) {
      // Return null if user not found
      return null;
    }
  }

  async getTicket(ticketId: number, include?: string[]): Promise<ZendeskTicket | null> {
    try {
      const params = new URLSearchParams();
      if (include && include.length > 0) {
        params.set('include', include.join(','));
      }

      const url = `/tickets/${ticketId}.json${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.httpClient.get<{ ticket: ZendeskTicket }>(url);
      return response.data.ticket;
    } catch (error) {
      // Return null if ticket not found
      return null;
    }
  }

  async getTickets(params?: TicketQueryParams): Promise<PaginatedResponse<ZendeskTicket>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }

    const url = `/tickets.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.httpClient.get<{
      tickets: ZendeskTicket[];
      next_page: string | null;
      previous_page: string | null;
      count: number;
    }>(url);

    return {
      items: response.data.tickets,
      next_page: response.data.next_page,
      previous_page: response.data.previous_page,
      count: response.data.count,
    };
  }

  async updateTicket(ticketId: number, updateData: UpdateTicketRequest): Promise<ZendeskTicket> {
    const response = await this.httpClient.put<{ ticket: ZendeskTicket }>(
      `/tickets/${ticketId}.json`,
      { ticket: updateData }
    );
    return response.data.ticket;
  }

  async getTicketComments(
    ticketId: number, 
    params?: { page?: number; per_page?: number; sort_order?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<ZendeskComment>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }

    const url = `/tickets/${ticketId}/comments.json${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.httpClient.get<{
      comments: ZendeskComment[];
      next_page: string | null;
      previous_page: string | null;
      count: number;
    }>(url);

    return {
      items: response.data.comments,
      next_page: response.data.next_page,
      previous_page: response.data.previous_page,
      count: response.data.count,
    };
  }

  async addComment(ticketId: number, commentData: CreateCommentRequest): Promise<ZendeskTicket> {
    const response = await this.httpClient.put<{ ticket: ZendeskTicket }>(
      `/tickets/${ticketId}.json`,
      {
        ticket: {
          comment: commentData
        }
      }
    );
    return response.data.ticket;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      // Check HTTP client health
      const httpHealth = await this.httpClient.healthCheck();
      if (httpHealth.status === 'unhealthy') {
        return httpHealth;
      }

      // Check if we can authenticate
      const canAuthenticate = await this.authenticate();
      if (!canAuthenticate) {
        return { status: 'unhealthy', details: 'Authentication failed' };
      }

      // Check if we can fetch current user (basic API test)
      await this.getCurrentUser();

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to search tickets by query
  async searchTickets(
    query: string,
    params?: { page?: number; per_page?: number; sort_by?: string; sort_order?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<ZendeskTicket>> {
    const searchParams = new URLSearchParams({ query });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }

    const url = `/search.json?${searchParams.toString()}`;
    const response = await this.httpClient.get<{
      results: ZendeskTicket[];
      next_page: string | null;
      previous_page: string | null;
      count: number;
    }>(url);

    return {
      items: response.data.results,
      next_page: response.data.next_page,
      previous_page: response.data.previous_page,
      count: response.data.count,
    };
  }

  // Helper method to get ticket by external ID
  async getTicketByExternalId(externalId: string): Promise<ZendeskTicket | null> {
    try {
      const searchResult = await this.searchTickets(`external_id:${externalId}`);
      return searchResult.items.length > 0 ? searchResult.items[0] : null;
    } catch (error) {
      return null;
    }
  }
}