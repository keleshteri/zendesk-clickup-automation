import { ZendeskTicket, Env } from '../../../types/index';
import { createZendeskAuth } from '../../../utils/index';

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

  /**
   * Verify Zendesk webhook signature
   * @param body - The raw request body
   * @param signature - The webhook signature from headers
   * @param timestamp - The webhook timestamp from headers
   * @param secret - The webhook secret
   * @returns Promise that resolves to true if signature is valid
   */
  async verifyWebhookSignature(
    body: string,
    signature: string,
    timestamp: string,
    secret: string
  ): Promise<boolean> {
    try {
      if (!secret) {
        console.error('❌ Zendesk webhook secret not configured');
        return false;
      }

      // Check timestamp to prevent replay attacks (within 5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp);
      if (Math.abs(currentTime - requestTime) > 300) {
        console.error('❌ Zendesk webhook timestamp too old');
        return false;
      }

      // Create the signature base string
      const baseString = `${timestamp}${body}`;
      
      // Create HMAC-SHA256 hash
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(baseString)
      );
      
      // Convert to base64 string
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const hashBase64 = btoa(String.fromCharCode(...hashArray));
      
      // Compare signatures
      const isValid = signature === hashBase64;
      
      if (!isValid) {
        console.error('❌ Invalid Zendesk webhook signature');
        console.error('Expected:', hashBase64);
        console.error('Received:', signature);
      }
      
      return isValid;
    } catch (error) {
      console.error('💥 Error verifying Zendesk webhook:', error);
      return false;
    }
  }

  /**
   * Test connectivity to the Zendesk API
   * 
   * Performs a simple API call to verify that authentication is working and the
   * Zendesk API is accessible. This is useful for debugging connection issues.
   * 
   * @returns Promise resolving to boolean indicating if the connection test passed
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🎫 Testing Zendesk API connection...');
      
      // Test with a simple API call that should work with basic permissions
      await this.getTicketDetails('1'); // Test with ticket ID 1
      console.log('✅ Zendesk API connection successful');
      return true;
    } catch (error) {
      // If error is 404, it means connection works but ticket doesn't exist
      const is404 = error instanceof Error && error.message.includes('404');
      console.log(`${is404 ? '✅' : '❌'} Zendesk connection test: ${is404 ? 'Connected (404 expected)' : 'Failed'}`);
      return is404;
    }
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
      let lastError: any = null;
      
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
      } else {
        // Check for SupportProductInactive error
        const errorText = await response.text();
        lastError = { status: response.status, statusText: response.statusText, body: errorText };
        
        if (response.status === 403 && errorText.includes('SupportProductInactive')) {
          console.warn(`⚠️  Zendesk Support product is not active. Cannot access ticket APIs.`);
          throw new Error('Zendesk Support product is not active. Please activate the Support product in your Zendesk account to use ticket-related features.');
        }
      }
      
      // Approach 2: If no results, try with capitalized status
      if (tickets.length === 0 && !lastError) {
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
        } else {
          const errorText = await response.text();
          lastError = { status: response.status, statusText: response.statusText, body: errorText };
          
          if (response.status === 403 && errorText.includes('SupportProductInactive')) {
            console.warn(`⚠️  Zendesk Support product is not active. Cannot access ticket APIs.`);
            throw new Error('Zendesk Support product is not active. Please activate the Support product in your Zendesk account to use ticket-related features.');
          }
        }
      }
      
      // Approach 3: If still no results, try the tickets endpoint directly
      if (tickets.length === 0 && !lastError) {
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
        } else {
          const errorText = await response.text();
          lastError = { status: response.status, statusText: response.statusText, body: errorText };
          
          if (response.status === 403 && errorText.includes('SupportProductInactive')) {
            console.warn(`⚠️  Zendesk Support product is not active. Cannot access ticket APIs.`);
            throw new Error('Zendesk Support product is not active. Please activate the Support product in your Zendesk account to use ticket-related features.');
          }
        }
      }

      // If we have an error and no tickets, throw the error
      if (lastError && tickets.length === 0) {
        console.error(`❌ Failed to fetch tickets by status:`, {
          status: lastError.status,
          statusText: lastError.statusText,
          url: url,
          errorBody: lastError.body
        });
        
        throw new Error(`Zendesk API error: ${lastError.status} ${lastError.statusText} - ${lastError.body}`);
      }

      console.log(`✅ Successfully fetched ${tickets.length} tickets with statuses: ${statuses.join(', ')}`);
      return tickets;
    } catch (error) {
      console.error('❌ Error fetching tickets by status:', error);
      throw error;
    }
  }
}