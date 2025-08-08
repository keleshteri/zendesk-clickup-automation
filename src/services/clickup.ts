import { ClickUpTask, Env, ZendeskTicket } from '../types/index.js';
import { mapZendeskToClickUpPriority, mapZendeskToClickUpStatus } from '../utils/index.js';

export class ClickUpService {
  private env: Env;
  private baseUrl: string = 'https://api.clickup.com/api/v2';

  constructor(env: Env) {
    this.env = env;
  }

  async createTaskFromTicket(ticket: ZendeskTicket): Promise<ClickUpTask | null> {
    console.log('🚀 Starting ClickUp task creation for ticket:', ticket.id);
    
    try {
      // Validate required environment variables
      if (!this.env.CLICKUP_TOKEN) {
        console.error('❌ CLICKUP_TOKEN is not configured');
        throw new Error('ClickUp token is not configured');
      }
      
      if (!this.env.CLICKUP_LIST_ID) {
        console.error('❌ CLICKUP_LIST_ID is not configured');
        throw new Error('ClickUp list ID is not configured');
      }

      console.log('✅ Environment variables validated');
      console.log('📋 Target ClickUp List ID:', this.env.CLICKUP_LIST_ID);

      const taskData = {
        name: `[Zendesk #${ticket.id}] ${ticket.subject}`,
        description: this.formatTaskDescription(ticket),
        // Remove status - let it use default status from the list
        // status: mapZendeskToClickUpStatus(ticket.status),
        priority: mapZendeskToClickUpPriority(ticket.priority),
        tags: [
          'zendesk',
          `ticket-${ticket.id}`,
          ...(ticket.tags || [])
        ]
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
          'Authorization': this.env.CLICKUP_TOKEN,
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

  async getTask(taskId: string): Promise<ClickUpTask | null> {
    try {
      console.log('🔍 Fetching ClickUp task:', taskId);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
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

  async updateTask(taskId: string, updates: any): Promise<boolean> {
    try {
      console.log('📝 Updating ClickUp task:', taskId, updates);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
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

  async addComment(taskId: string, comment: string): Promise<boolean> {
    try {
      console.log('💬 Adding comment to ClickUp task:', taskId);
      
      const response = await fetch(`${this.baseUrl}/task/${taskId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
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

  getTaskUrl(taskId: string): string {
    return `https://app.clickup.com/t/${taskId}`;
  }

  // Add a method to test ClickUp API connectivity
  async testConnection(): Promise<{ success: boolean; error?: string; team?: any }> {
    try {
      console.log('🔧 Testing ClickUp API connection...');
      
      if (!this.env.CLICKUP_TOKEN) {
        return { success: false, error: 'ClickUp token not configured' };
      }

      const response = await fetch(`${this.baseUrl}/team`, {
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
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