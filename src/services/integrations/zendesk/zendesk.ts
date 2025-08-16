import { ZendeskTicket, Env } from '../../../types/index.js';
import { createZendeskAuth } from '../../../utils/index.js';

export class ZendeskService {
  private env: Env;
  private baseUrl: string;
  private authHeader: string;

  constructor(env: Env) {
    this.env = env;
    
    // Validate required environment variables
    if (!env.ZENDESK_DOMAIN) {
      throw new Error('ZENDESK_DOMAIN environment variable is required');
    }
    if (!env.ZENDESK_EMAIL) {
      throw new Error('ZENDESK_EMAIL environment variable is required');
    }
    if (!env.ZENDESK_TOKEN) {
      throw new Error('ZENDESK_TOKEN environment variable is required');
    }
    
    // Ensure the domain includes .zendesk.com if not already present
    const domain = env.ZENDESK_DOMAIN.includes('.zendesk.com') 
      ? env.ZENDESK_DOMAIN 
      : `${env.ZENDESK_DOMAIN}.zendesk.com`;
    this.baseUrl = `https://${domain}/api/v2`;
    this.authHeader = createZendeskAuth(env.ZENDESK_EMAIL, env.ZENDESK_TOKEN);
  }

  async getTicket(ticketId: number): Promise<ZendeskTicket | null> {
    try {
      const url = `${this.baseUrl}/tickets/${ticketId}.json`;
      console.log(`🔍 Fetching Zendesk ticket ${ticketId} from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch ticket ${ticketId}:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorBody: errorText
        });
        
        // Throw error with detailed information for better debugging
        throw new Error(`Zendesk API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as { ticket: ZendeskTicket };
      console.log(`✅ Successfully fetched ticket ${ticketId}: ${data.ticket.subject}`);
      return data.ticket;
    } catch (error) {
      console.error('❌ Error fetching Zendesk ticket:', error);
      throw error; // Re-throw to let the caller handle it
    }
  }

  async getTicketComments(ticketId: number): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/comments.json`, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch comments for ticket ${ticketId}:`, response.status, response.statusText);
        return [];
      }

      const data = await response.json() as { comments: any[] };
      return data.comments || [];
    } catch (error) {
      console.error('Error fetching Zendesk ticket comments:', error);
      return [];
    }
  }

  async updateTicket(ticketId: number, updates: Partial<ZendeskTicket>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticket: updates })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating Zendesk ticket:', error);
      return false;
    }
  }

  getTicketUrl(ticketId: number): string {
    return `https://${this.env.ZENDESK_DOMAIN}/agent/tickets/${ticketId}`;
  }

  async addComment(ticketId: number, comment: string, isPublic: boolean = false): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket: {
            comment: {
              body: comment,
              public: isPublic
            }
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding comment to Zendesk ticket:', error);
      return false;
    }
  }

  async getTicketDetails(ticketId: string): Promise<ZendeskTicket | null> {
    return this.getTicket(parseInt(ticketId));
  }

  /**
   * Get a list of open tickets from Zendesk
   * @param limit - Maximum number of tickets to return (default: 25, max: 100)
   * @param status - Filter by status (default: 'open')
   * @returns Promise resolving to an array of ZendeskTicket objects
   */
  async getOpenTickets(limit: number = 25, status: string = 'open'): Promise<ZendeskTicket[]> {
    try {
      // Ensure limit is within Zendesk API bounds
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      
      const url = `${this.baseUrl}/search.json?query=type:ticket status:${status}&per_page=${safeLimit}&sort_by=created_at&sort_order=desc`;
      console.log(`🔍 Fetching open tickets from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch open tickets:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorBody: errorText
        });
        
        throw new Error(`Zendesk API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as { results: ZendeskTicket[], count: number };
      console.log(`✅ Successfully fetched ${data.results?.length || 0} open tickets`);
      return data.results || [];
    } catch (error) {
      console.error('❌ Error fetching open tickets:', error);
      throw error;
    }
  }

  /**
   * Get tickets with multiple status filters
   * @param statuses - Array of statuses to filter by (e.g., ['new', 'open', 'pending'])
   * @param limit - Maximum number of tickets to return (default: 25)
   * @returns Promise resolving to an array of ZendeskTicket objects
   */
  async getTicketsByStatus(statuses: string[] = ['new', 'open', 'pending'], limit: number = 25): Promise<ZendeskTicket[]> {
    try {
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      
      // Try multiple approaches to find tickets
      let tickets: ZendeskTicket[] = [];
      
      // Approach 1: Use search API with lowercase status
      const statusQuery = statuses.map(status => `status:${status.toLowerCase()}`).join(' OR ');
      let url = `${this.baseUrl}/search.json?query=type:ticket (${statusQuery})&per_page=${safeLimit}&sort_by=created_at&sort_order=desc`;
      console.log(`🔍 Fetching tickets by status (lowercase) from: ${url}`);
      
      let response = await fetch(url, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json() as { results: ZendeskTicket[], count: number };
        tickets = data.results || [];
        console.log(`✅ Found ${tickets.length} tickets with lowercase status search`);
      }
      
      // Approach 2: If no results, try with capitalized status
      if (tickets.length === 0) {
        const capitalizedStatusQuery = statuses.map(status => `status:${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`).join(' OR ');
        url = `${this.baseUrl}/search.json?query=type:ticket (${capitalizedStatusQuery})&per_page=${safeLimit}&sort_by=created_at&sort_order=desc`;
        console.log(`🔍 Fetching tickets by status (capitalized) from: ${url}`);
        
        response = await fetch(url, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json() as { results: ZendeskTicket[], count: number };
          tickets = data.results || [];
          console.log(`✅ Found ${tickets.length} tickets with capitalized status search`);
        }
      }
      
      // Approach 3: If still no results, try the tickets endpoint directly
      if (tickets.length === 0) {
        url = `${this.baseUrl}/tickets.json?per_page=${safeLimit}&sort_by=created_at&sort_order=desc`;
        console.log(`🔍 Fetching all recent tickets from: ${url}`);
        
        response = await fetch(url, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json() as { tickets: ZendeskTicket[] };
          const allTickets = data.tickets || [];
          
          // Filter by status locally (case-insensitive)
          const statusesLower = statuses.map(s => s.toLowerCase());
          tickets = allTickets.filter(ticket => 
            statusesLower.includes(ticket.status.toLowerCase())
          );
          
          console.log(`✅ Found ${tickets.length} tickets after local filtering from ${allTickets.length} total tickets`);
          
          // Log some ticket details for debugging
          if (allTickets.length > 0) {
            console.log(`📊 Sample ticket statuses found:`, allTickets.slice(0, 5).map(t => ({ id: t.id, status: t.status })));
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch tickets by status:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorBody: errorText
        });
        
        throw new Error(`Zendesk API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`✅ Successfully fetched ${tickets.length} tickets with statuses: ${statuses.join(', ')}`);
      return tickets;
    } catch (error) {
      console.error('❌ Error fetching tickets by status:', error);
      throw error;
    }
  }
}