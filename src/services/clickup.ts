import { ClickUpTask, Env, ZendeskTicket } from '../types/index.js';
import { mapZendeskToClickUpPriority, mapZendeskToClickUpStatus } from '../utils/index.js';

export class ClickUpService {
  private env: Env;
  private baseUrl: string = 'https://api.clickup.com/api/v2';

  constructor(env: Env) {
    this.env = env;
  }

  async createTaskFromTicket(ticket: ZendeskTicket): Promise<ClickUpTask | null> {
    try {
      const taskData = {
        name: `[Zendesk #${ticket.id}] ${ticket.subject}`,
        description: this.formatTaskDescription(ticket),
        status: mapZendeskToClickUpStatus(ticket.status),
        priority: mapZendeskToClickUpPriority(ticket.priority),
        tags: [
          'zendesk',
          `ticket-${ticket.id}`,
          ...ticket.tags
        ],
        custom_fields: [
          {
            id: 'zendesk_ticket_id',
            value: ticket.id.toString()
          },
          {
            id: 'zendesk_url',
            value: `https://${this.env.ZENDESK_DOMAIN}/agent/tickets/${ticket.id}`
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/list/${this.env.CLICKUP_LIST_ID}/task`, {
        method: 'POST',
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        console.error('Failed to create ClickUp task:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as ClickUpTask;
      return data;
    } catch (error) {
      console.error('Error creating ClickUp task:', error);
      return null;
    }
  }

  async getTask(taskId: string): Promise<ClickUpTask | null> {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch task ${taskId}:`, response.status, response.statusText);
        return null;
      }

      const data = await response.json() as ClickUpTask;
      return data;
    } catch (error) {
      console.error('Error fetching ClickUp task:', error);
      return null;
    }
  }

  async updateTask(taskId: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.env.CLICKUP_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating ClickUp task:', error);
      return false;
    }
  }

  async addComment(taskId: string, comment: string): Promise<boolean> {
    try {
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

      return response.ok;
    } catch (error) {
      console.error('Error adding comment to ClickUp task:', error);
      return false;
    }
  }

  private formatTaskDescription(ticket: ZendeskTicket): string {
    return `
**Zendesk Ticket #${ticket.id}**

**Description:**
${ticket.description}

**Details:**
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Created: ${ticket.created_at}
- Requester ID: ${ticket.requester_id}
${ticket.assignee_id ? `- Assignee ID: ${ticket.assignee_id}` : ''}

**Zendesk URL:** https://${this.env.ZENDESK_DOMAIN}/agent/tickets/${ticket.id}

---
*This task was automatically created by TaskGenie from a Zendesk ticket.*
    `.trim();
  }

  getTaskUrl(taskId: string): string {
    return `https://app.clickup.com/t/${taskId}`;
  }
}