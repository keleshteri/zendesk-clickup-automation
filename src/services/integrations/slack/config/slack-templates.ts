/**
 * @ai-metadata
 * @component: SlackTemplates
 * @description: Message template management system for Slack notifications with dynamic content rendering
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-templates.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "getTemplate": "read-only", "getTemplatesByCategory": "read-only", "renderTemplate": "read-only", "validateTemplateVariables": "read-only", "createCustomTemplate": "allow", "registerTemplate": "allow" }
 * @dependencies: ["../types/slack-message-types.ts", "../utils/slack-emojis.ts", "../utils/slack-formatters.ts"]
 * @tests: ["./tests/slack-templates.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Template system that defines message formats for all Slack notifications. Changes here affect the appearance and structure of all automated messages sent to Slack."
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { SlackMessage } from '../types/slack-message-types';
import { SlackEmojis } from '../utils/slack-emojis';
import { SlackFormatters } from '../utils/slack-formatters';

/**
 * Template configuration for different message types
 */
export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ticket' | 'task' | 'system' | 'user' | 'ai' | 'report';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiresThreading: boolean;
  variables: string[];
  template: Partial<SlackMessage>;
}

/**
 * Template variables for dynamic content
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | object;
}

/**
 * Template categories and their configurations
 */
export interface TemplateCategory {
  name: string;
  description: string;
  defaultChannel: string;
  defaultThreading: boolean;
  templates: string[];
}

/**
 * Main Slack templates configuration class
 */
export class SlackTemplates {
  /**
   * Predefined message templates
   */
  static readonly TEMPLATES: Record<string, MessageTemplate> = {
    // Ticket Templates
    'ticket-created': {
      id: 'ticket-created',
      name: 'New Ticket Created',
      description: 'Template for new ticket notifications',
      category: 'ticket',
      priority: 'medium',
      requiresThreading: true,
      variables: ['ticketId', 'title', 'priority', 'requester', 'description', 'tags'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎫 New Support Ticket Created'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Ticket ID:*\n#{ticketId}'
              },
              {
                type: 'mrkdwn',
                text: '*Priority:*\n{priority}'
              },
              {
                type: 'mrkdwn',
                text: '*Requester:*\n{requester}'
              },
              {
                type: 'mrkdwn',
                text: '*Created:*\n{createdAt}'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Subject:*\n{title}'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Description:*\n{description}'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Ticket'
                },
                style: 'primary',
                url: '{ticketUrl}'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Assign to Me'
                },
                action_id: 'assign_ticket',
                value: '{ticketId}'
              }
            ]
          }
        ]
      }
    },

    'ticket-updated': {
      id: 'ticket-updated',
      name: 'Ticket Updated',
      description: 'Template for ticket update notifications',
      category: 'ticket',
      priority: 'low',
      requiresThreading: true,
      variables: ['ticketId', 'title', 'updateType', 'updatedBy', 'changes'],
      template: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '📝 *Ticket #{ticketId} Updated*\n{updateType} by {updatedBy}'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Changes:*\n{changes}'
            }
          }
        ]
      }
    },

    'ticket-assigned': {
      id: 'ticket-assigned',
      name: 'Ticket Assigned',
      description: 'Template for ticket assignment notifications',
      category: 'ticket',
      priority: 'medium',
      requiresThreading: true,
      variables: ['ticketId', 'title', 'assignee', 'assignedBy'],
      template: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '👤 *Ticket #{ticketId} Assigned*\nAssigned to {assignee} by {assignedBy}'
            }
          }
        ]
      }
    },

    'ticket-resolved': {
      id: 'ticket-resolved',
      name: 'Ticket Resolved',
      description: 'Template for ticket resolution notifications',
      category: 'ticket',
      priority: 'low',
      requiresThreading: false,
      variables: ['ticketId', 'title', 'resolvedBy', 'resolution', 'resolutionTime'],
      template: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *Ticket #{ticketId} Resolved*\nResolved by {resolvedBy} in {resolutionTime}'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Resolution:*\n{resolution}'
            }
          }
        ]
      }
    },

    // Task Templates
    'task-created': {
      id: 'task-created',
      name: 'New Task Created',
      description: 'Template for new task notifications',
      category: 'task',
      priority: 'medium',
      requiresThreading: true,
      variables: ['taskId', 'title', 'priority', 'assignee', 'dueDate', 'project'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📋 New Task Created'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Task ID:*\n{taskId}'
              },
              {
                type: 'mrkdwn',
                text: '*Priority:*\n{priority}'
              },
              {
                type: 'mrkdwn',
                text: '*Assignee:*\n{assignee}'
              },
              {
                type: 'mrkdwn',
                text: '*Due Date:*\n{dueDate}'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Title:*\n{title}'
            }
          }
        ]
      }
    },

    // System Templates
    'system-alert': {
      id: 'system-alert',
      name: 'System Alert',
      description: 'Template for system alerts and warnings',
      category: 'system',
      priority: 'high',
      requiresThreading: false,
      variables: ['alertType', 'severity', 'message', 'timestamp', 'affectedServices'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 System Alert'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Alert Type:*\n{alertType}'
              },
              {
                type: 'mrkdwn',
                text: '*Severity:*\n{severity}'
              },
              {
                type: 'mrkdwn',
                text: '*Timestamp:*\n{timestamp}'
              },
              {
                type: 'mrkdwn',
                text: '*Affected Services:*\n{affectedServices}'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Message:*\n{message}'
            }
          }
        ]
      }
    },

    // AI Templates
    'ai-analysis': {
      id: 'ai-analysis',
      name: 'AI Analysis Result',
      description: 'Template for AI analysis and insights',
      category: 'ai',
      priority: 'medium',
      requiresThreading: true,
      variables: ['analysisType', 'confidence', 'insights', 'recommendations', 'dataPoints'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🤖 AI Analysis Complete'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Analysis Type:*\n{analysisType}'
              },
              {
                type: 'mrkdwn',
                text: '*Confidence:*\n{confidence}%'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Key Insights:*\n{insights}'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Recommendations:*\n{recommendations}'
            }
          }
        ]
      }
    },

    // User Templates
    'user-welcome': {
      id: 'user-welcome',
      name: 'User Welcome Message',
      description: 'Template for welcoming new users',
      category: 'user',
      priority: 'low',
      requiresThreading: false,
      variables: ['userName', 'userRole', 'teamName'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '👋 Welcome to the Team!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Welcome {userName}! We\'re excited to have you join our {teamName} team as a {userRole}.'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Here are some helpful resources to get you started:\n• Use `/help` for available commands\n• Check out our team channels\n• Feel free to ask questions!'
            }
          }
        ]
      }
    },

    // Report Templates
    'daily-summary': {
      id: 'daily-summary',
      name: 'Daily Summary Report',
      description: 'Template for daily activity summaries',
      category: 'report',
      priority: 'low',
      requiresThreading: false,
      variables: ['date', 'ticketsCreated', 'ticketsResolved', 'tasksCompleted', 'highlights'],
      template: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 Daily Summary - {date}'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Tickets Created:*\n{ticketsCreated}'
              },
              {
                type: 'mrkdwn',
                text: '*Tickets Resolved:*\n{ticketsResolved}'
              },
              {
                type: 'mrkdwn',
                text: '*Tasks Completed:*\n{tasksCompleted}'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Today\'s Highlights:*\n{highlights}'
            }
          }
        ]
      }
    }
  };

  /**
   * Template categories configuration
   */
  static readonly CATEGORIES: Record<string, TemplateCategory> = {
    ticket: {
      name: 'Ticket Templates',
      description: 'Templates for ticket-related notifications',
      defaultChannel: 'support-tickets',
      defaultThreading: true,
      templates: ['ticket-created', 'ticket-updated', 'ticket-assigned', 'ticket-resolved']
    },
    task: {
      name: 'Task Templates',
      description: 'Templates for task-related notifications',
      defaultChannel: 'dev-tasks',
      defaultThreading: true,
      templates: ['task-created', 'task-updated', 'task-completed']
    },
    system: {
      name: 'System Templates',
      description: 'Templates for system alerts and notifications',
      defaultChannel: 'system-alerts',
      defaultThreading: false,
      templates: ['system-alert', 'system-error', 'system-recovery']
    },
    ai: {
      name: 'AI Templates',
      description: 'Templates for AI analysis and insights',
      defaultChannel: 'ai-insights',
      defaultThreading: true,
      templates: ['ai-analysis', 'ai-recommendation', 'ai-summary']
    },
    user: {
      name: 'User Templates',
      description: 'Templates for user-related messages',
      defaultChannel: 'general',
      defaultThreading: false,
      templates: ['user-welcome', 'user-help', 'user-notification']
    },
    report: {
      name: 'Report Templates',
      description: 'Templates for reports and summaries',
      defaultChannel: 'daily-reports',
      defaultThreading: false,
      templates: ['daily-summary', 'weekly-report', 'monthly-report']
    }
  };

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): MessageTemplate | null {
    return this.TEMPLATES[templateId] || null;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): MessageTemplate[] {
    return Object.values(this.TEMPLATES).filter(template => template.category === category);
  }

  /**
   * Get templates by priority
   */
  static getTemplatesByPriority(priority: string): MessageTemplate[] {
    return Object.values(this.TEMPLATES).filter(template => template.priority === priority);
  }

  /**
   * Render template with variables
   */
  static renderTemplate(templateId: string, variables: TemplateVariables): Partial<SlackMessage> | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    // Deep clone the template
    const rendered = JSON.parse(JSON.stringify(template.template));

    // Replace variables in the template
    const templateStr = JSON.stringify(rendered);
    const replacedStr = this.replaceVariables(templateStr, variables);
    
    return JSON.parse(replacedStr);
  }

  /**
   * Replace variables in template string
   */
  private static replaceVariables(templateStr: string, variables: TemplateVariables): string {
    let result = templateStr;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    });
    
    return result;
  }

  /**
   * Validate template variables
   */
  static validateTemplateVariables(templateId: string, variables: TemplateVariables): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    // Check if all required variables are provided
    return template.variables.every(variable => variables.hasOwnProperty(variable));
  }

  /**
   * Get missing variables for a template
   */
  static getMissingVariables(templateId: string, variables: TemplateVariables): string[] {
    const template = this.getTemplate(templateId);
    if (!template) return [];

    return template.variables.filter(variable => !variables.hasOwnProperty(variable));
  }

  /**
   * Get all template IDs
   */
  static getAllTemplateIds(): string[] {
    return Object.keys(this.TEMPLATES);
  }

  /**
   * Get category configuration
   */
  static getCategory(categoryName: string): TemplateCategory | null {
    return this.CATEGORIES[categoryName] || null;
  }

  /**
   * Get all categories
   */
  static getAllCategories(): TemplateCategory[] {
    return Object.values(this.CATEGORIES);
  }

  /**
   * Check if template requires threading
   */
  static requiresThreading(templateId: string): boolean {
    const template = this.getTemplate(templateId);
    return template?.requiresThreading || false;
  }

  /**
   * Get template priority
   */
  static getTemplatePriority(templateId: string): string {
    const template = this.getTemplate(templateId);
    return template?.priority || 'medium';
  }

  /**
   * Create custom template
   */
  static createCustomTemplate(
    id: string,
    name: string,
    description: string,
    category: string,
    template: Partial<SlackMessage>,
    variables: string[] = [],
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    requiresThreading: boolean = false
  ): MessageTemplate {
    return {
      id,
      name,
      description,
      category: category as any,
      priority,
      requiresThreading,
      variables,
      template
    };
  }

  /**
   * Register custom template
   */
  static registerTemplate(template: MessageTemplate): void {
    this.TEMPLATES[template.id] = template;
  }
}