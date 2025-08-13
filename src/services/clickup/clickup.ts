import { ClickUpTask, Env, ZendeskTicket, UserOAuthData, TicketAnalysis } from '../../types/index.js';
import { mapZendeskToClickUpPriority } from '../../utils/index.js';
import { AIService } from '../ai.js';

/**
 * ClickUp API Service
 * 
 * This service provides integration with the ClickUp API v2 for managing tasks,
 * comments, and other ClickUp resources. It supports both OAuth and API token authentication.
 * 
 * @example
 * ```typescript
 * const clickUpService = new ClickUpService(env, oauthData);
 * const task = await clickUpService.createTaskFromTicket(zendeskTicket);
 * ```
 */
export class ClickUpService {
  /** Environment configuration containing API keys and settings */
  private env: Env;
  
  /** Base URL for ClickUp API v2 endpoints */
  private baseUrl: string = 'https://api.clickup.com/api/v2';
  
  /** User OAuth data for authenticated requests (optional) */
  private userOAuthData: UserOAuthData | null = null;
  
  /** AI service for enhanced task descriptions and analysis */
  private aiService: AIService;

  /**
   * Creates a new ClickUp service instance
   * 
   * @param env - Environment configuration containing API keys and settings
   * @param aiService - AI service for enhanced task descriptions and analysis
   * @param userOAuthData - Optional OAuth data for user-specific authentication
   */
  constructor(env: Env, aiService: AIService, userOAuthData?: UserOAuthData | null) {
    this.env = env;
    this.aiService = aiService;
    this.userOAuthData = userOAuthData || null;
  }

  /**
   * Set OAuth data for this service instance
   * 
   * This method allows updating the OAuth authentication data after the service
   * has been instantiated. Useful for dynamic authentication scenarios.
   * 
   * @param oauthData - OAuth data containing access token and user info, or null to clear
   * @example
   * ```typescript
   * clickUpService.setOAuthData(newOAuthData);
   * clickUpService.setOAuthData(null); // Clear OAuth data
   * ```
   */
  setOAuthData(oauthData: UserOAuthData | null): void {
    this.userOAuthData = oauthData;
    console.log(`🔧 ClickUp service OAuth data ${oauthData ? 'set' : 'cleared'}`);
  }

  /**
   * Get the appropriate authorization header for ClickUp API requests
   * 
   * This method determines the best available authentication method and returns
   * the properly formatted authorization header. OAuth tokens take precedence over API tokens.
   * 
   * @returns The authorization header value (either "Bearer {token}" for OAuth or the API token)
   * @throws {Error} When no authentication method is available
   * 
   * @example
   * ```typescript
   * const authHeader = clickUpService.getAuthHeader();
   * // Returns: "Bearer abc123..." or "pk_123..."
   * ```
   */
  public getAuthHeader(): string {
    if (this.userOAuthData?.access_token) {
      console.log('🔐 Using OAuth token for ClickUp API');
      return `Bearer ${this.userOAuthData.access_token}`;
    } else if (this.env.CLICKUP_TOKEN) {
      console.log('🔐 Using API token for ClickUp API');
      return this.env.CLICKUP_TOKEN;
    } else {
      throw new Error('No ClickUp authentication available - neither OAuth token nor API token configured');
    }
  }

  /**
   * Check if the service has valid authentication configured
   * 
   * This method verifies that at least one authentication method is available
   * (either OAuth token or API token). It logs the authentication status for debugging.
   * 
   * @returns True if either OAuth or API token authentication is available, false otherwise
   * 
   * @example
   * ```typescript
   * if (clickUpService.hasValidAuth()) {
   *   // Safe to make API calls
   *   const task = await clickUpService.getTask(taskId);
   * }
   * ```
   */
  hasValidAuth(): boolean {
    const hasOAuth = !!(this.userOAuthData?.access_token);
    const hasApiToken = !!this.env.CLICKUP_TOKEN;
    
    console.log('🔍 ClickUp auth check:', {
      oauth: hasOAuth ? '✅' : '❌',
      api_token: hasApiToken ? '✅' : '❌'
    });
    
    return hasOAuth || hasApiToken;
  }

  /**
   * Create a ClickUp task from a Zendesk ticket
   * 
   * This method converts a Zendesk ticket into a ClickUp task with proper formatting,
   * tags, and priority mapping. It validates authentication and configuration before
   * making the API call.
   * 
   * @param ticket - The Zendesk ticket to convert into a ClickUp task
   * @returns Promise resolving to the created ClickUp task, or null if creation fails
   * @throws {Error} When authentication is not configured or API call fails
   * 
   * @example
   * ```typescript
   * const zendeskTicket = { id: 123, subject: "Bug report", priority: "high" };
   * const clickUpTask = await clickUpService.createTaskFromTicket(zendeskTicket);
   * if (clickUpTask) {
   *   console.log(`Task created: ${clickUpTask.url}`);
   * }
   * ```
   */
  async createTaskFromTicket(ticket: ZendeskTicket, analysis?: TicketAnalysis): Promise<ClickUpTask | null> {
    console.log('🚀 Starting ClickUp task creation for ticket:', ticket.id);
    
    try {
      // Validate authentication and required configuration
      if (!this.hasValidAuth()) {
        console.error('❌ No ClickUp authentication available');
        throw new Error('ClickUp authentication is not configured');
      }
      
      if (!this.env.CLICKUP_LIST_ID) {
        console.error('❌ CLICKUP_LIST_ID is not configured');
        throw new Error('ClickUp list ID is not configured');
      }

      console.log('✅ Authentication and environment validated');
      console.log('📋 Target ClickUp List ID:', this.env.CLICKUP_LIST_ID);

      // Get AI analysis if not provided
      let ticketAnalysis = analysis;
      if (!ticketAnalysis) {
        console.log('🤖 Generating AI analysis for ticket...');
        try {
          ticketAnalysis = await this.aiService.analyzeTicket(JSON.stringify(ticket));
          console.log('✅ AI analysis completed:', {
            priority: ticketAnalysis.priority,
            category: ticketAnalysis.category,
            sentiment: ticketAnalysis.sentiment
          });
        } catch (aiError) {
          console.warn('⚠️ AI analysis failed, using fallback:', aiError);
          ticketAnalysis = null;
        }
      }

      // Generate enhanced task description
      const description = ticketAnalysis 
        ? await this.aiService.generateEnhancedTaskDescription(ticket, ticketAnalysis)
        : this.formatTaskDescription(ticket);

      // Use AI-suggested priority if available, otherwise fall back to mapping
      const priority = ticketAnalysis?.priority 
        ? this.mapAIPriorityToClickUp(ticketAnalysis.priority)
        : mapZendeskToClickUpPriority(ticket.priority);

      // Enhanced tags with AI insights
      const tags = [
        'zendesk',
        `ticket-${ticket.id}`,
        ...(ticket.tags || []),
        ...(ticketAnalysis ? [
          `category-${ticketAnalysis.category.toLowerCase()}`,
          `sentiment-${ticketAnalysis.sentiment.toLowerCase()}`,
          ...(ticketAnalysis.urgency_indicators.length > 0 ? ['urgent'] : [])
        ] : [])
      ];

      const taskData = {
        name: `[Zendesk #${ticket.id}] ${ticket.subject}`,
        description,
        priority,
        tags
        // Removed custom_fields as they might require specific field IDs
      };

      console.log('📝 Task data prepared:', {
        name: taskData.name,
        priority: taskData.priority,
        tags: taskData.tags
      });

      const url = `${this.baseUrl}/list/${this.env.CLICKUP_LIST_ID}/task`;
      console.log('🌐 Making API request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      console.log('📡 ClickUp API Response Status:', response.status);
      console.log('📡 ClickUp API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ClickUp API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        // Try to parse error as JSON for better details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ ClickUp API Error Details:', errorJson);
        } catch (parseError) {
          console.error('❌ Failed to parse error response as JSON:', errorText);
        }
        
        throw new Error(`ClickUp API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('✅ ClickUp API Success Response:', responseText);
      
      const data = JSON.parse(responseText) as ClickUpTask;
      console.log('🎉 ClickUp task created successfully:', {
        id: data.id,
        name: data.name,
        url: data.url
      });
      
      return data;
    } catch (error) {
      console.error('💥 Error creating ClickUp task:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        ticket_id: ticket.id,
        ticket_subject: ticket.subject
      });
      
      // Re-throw the error with more context
      throw new Error(`Failed to create ClickUp task for Zendesk ticket ${ticket.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a ClickUp task by its ID
   * 
   * Fetches a specific task from ClickUp using the task ID. This method handles
   * authentication and error cases gracefully.
   * 
   * @param taskId - The unique identifier of the ClickUp task to retrieve
   * @returns Promise resolving to the ClickUp task data, or null if not found or on error
   * 
   * @example
   * ```typescript
   * const task = await clickUpService.getTask("abc123");
   * if (task) {
   *   console.log(`Task: ${task.name}`);
   * } else {
   *   console.log("Task not found or error occurred");
   * }
   * ```
   */
  async getTask(taskId: string): Promise<ClickUpTask | null> {
    try {
      console.log('🔍 Fetching ClickUp task:', taskId);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch ClickUp task:', {
          taskId,
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return null;
      }

      const data = await response.json() as ClickUpTask;
      console.log('✅ ClickUp task fetched successfully:', taskId);
      return data;
    } catch (error) {
      console.error('💥 Error fetching ClickUp task:', error);
      return null;
    }
  }

  /**
   * Update a ClickUp task with new data
   * 
   * Updates an existing ClickUp task with the provided data. This method can update
   * any task properties like name, description, status, priority, etc.
   * 
   * @param taskId - The unique identifier of the ClickUp task to update
   * @param updates - Object containing the task properties to update
   * @returns Promise resolving to true if update was successful, false otherwise
   * 
   * @example
   * ```typescript
   * const success = await clickUpService.updateTask("abc123", {
   *   name: "Updated task name",
   *   status: "in progress",
   *   priority: 2
   * });
   * if (success) {
   *   console.log("Task updated successfully");
   * }
   * ```
   */
  async updateTask(taskId: string, updates: any): Promise<boolean> {
    try {
      console.log('📝 Updating ClickUp task:', taskId, updates);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to update ClickUp task:', {
          taskId,
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      }

      return response.ok;
    } catch (error) {
      console.error('💥 Error updating ClickUp task:', error);
      return false;
    }
  }

  /**
   * Add a comment to a ClickUp task
   * 
   * Posts a new comment to the specified ClickUp task. Comments are useful for
   * adding updates, notes, or communication related to the task.
   * 
   * @param taskId - The unique identifier of the ClickUp task to comment on
   * @param comment - The text content of the comment to add
   * @returns Promise resolving to true if comment was added successfully, false otherwise
   * 
   * @example
   * ```typescript
   * const success = await clickUpService.addComment("abc123", "Task has been reviewed");
   * if (success) {
   *   console.log("Comment added successfully");
   * }
   * ```
   */
  async addComment(taskId: string, comment: string): Promise<boolean> {
    try {
      console.log('💬 Adding comment to ClickUp task:', taskId);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment_text: comment
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to add comment to ClickUp task:', {
          taskId,
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      }

      return response.ok;
    } catch (error) {
      console.error('💥 Error adding comment to ClickUp task:', error);
      return false;
    }
  }

  /**
   * Format a Zendesk ticket into a ClickUp task description
   * 
   * Creates a well-formatted markdown description for the ClickUp task that includes
   * all relevant information from the Zendesk ticket, including links back to the original ticket.
   * 
   * @param ticket - The Zendesk ticket to format
   * @returns Formatted markdown string for the task description
   * 
   * @private
   */
  private formatTaskDescription(ticket: ZendeskTicket): string {
    return `
**Zendesk Ticket #${ticket.id}**

**Description:**
${ticket.description || 'No description provided'}

**Details:**
- Priority: ${ticket.priority || 'normal'}
- Status: ${ticket.status || 'new'}
- Created: ${ticket.created_at || new Date().toISOString()}
- Requester ID: ${ticket.requester_id || 'Unknown'}
${ticket.assignee_id ? `- Assignee ID: ${ticket.assignee_id}` : ''}

**Zendesk URL:** https://${this.env.ZENDESK_DOMAIN}/agent/tickets/${ticket.id}

---
*This task was automatically created by TaskGenie from a Zendesk ticket.*
    `.trim();
  }

  /**
   * Map AI-suggested priority to ClickUp priority values
   * 
   * @param aiPriority - Priority from AI analysis (low, normal, high, urgent)
   * @returns ClickUp priority value (1=urgent, 2=high, 3=normal, 4=low)
   */
  private mapAIPriorityToClickUp(aiPriority: string): number {
    switch (aiPriority.toLowerCase()) {
      case 'urgent':
        return 1;
      case 'high':
        return 2;
      case 'normal':
        return 3;
      case 'low':
        return 4;
      default:
        return 3; // Default to normal
    }
  }

  /**
   * Generate a direct URL to a ClickUp task
   * 
   * Creates a clickable URL that opens the specified task in the ClickUp web application.
   * 
   * @param taskId - The unique identifier of the ClickUp task
   * @returns Direct URL to the task in ClickUp's web interface
   * 
   * @example
   * ```typescript
   * const taskUrl = clickUpService.getTaskUrl("abc123");
   * console.log(`View task: ${taskUrl}`);
   * // Output: "View task: https://app.clickup.com/t/abc123"
   * ```
   */
  getTaskUrl(taskId: string): string {
    return `https://app.clickup.com/t/${taskId}`;
  }

  /**
   * Test connectivity to the ClickUp API
   * 
   * Performs a simple API call to verify that authentication is working and the
   * ClickUp API is accessible. This is useful for debugging connection issues.
   * 
   * @returns Promise resolving to an object containing:
   *   - success: boolean indicating if the connection test passed
   *   - error: optional error message if the test failed
   *   - team: optional team/workspace data if the test succeeded
   * 
   * @example
   * ```typescript
   * const result = await clickUpService.testConnection();
   * if (result.success) {
   *   console.log("ClickUp API is accessible", result.team);
   * } else {
   *   console.error("ClickUp API connection failed:", result.error);
   * }
   * ```
   */
  async testConnection(): Promise<{ success: boolean; error?: string; team?: any }> {
    try {
      console.log('🔧 Testing ClickUp API connection...');
      
      if (!this.hasValidAuth()) {
        return { success: false, error: 'ClickUp authentication not configured' };
      }

      const response = await fetch(`${this.baseUrl}/team`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `API error: ${response.status} ${response.statusText} - ${errorText}` 
        };
      }

      const data = await response.json();
      console.log('✅ ClickUp API connection successful');
      return { success: true, team: data };
    } catch (error) {
      console.error('💥 ClickUp API connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}