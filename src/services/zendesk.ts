import { ZendeskTicket, Env } from '../types/index.js';
import { createZendeskAuth } from '../utils/index.js';

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
}