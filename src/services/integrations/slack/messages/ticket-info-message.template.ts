/**
 * @ai-metadata
 * @component: TicketInfoMessageTemplate
 * @description: Slack message template for displaying Zendesk ticket information with rich formatting
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Template for displaying detailed ticket information in Slack with proper Block Kit formatting"
 */

import type { MessageTemplateRenderer, SlackMessageTemplate, TicketInfoMessageContext } from './types';
import { createBotFooter } from './footers/taskgenie-footer.template';

export type { TicketInfoMessageContext } from './types';

/**
 * Formats priority with appropriate emoji and styling
 */
function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    'urgent': ':red_circle: *Urgent*',
    'high': ':orange_circle: *High*',
    'normal': ':large_yellow_circle: *Normal*',
    'low': ':green_circle: *Low*'
  };
  return priorityMap[priority.toLowerCase()] || `:white_circle: *${priority}*`;
}

/**
 * Formats status with appropriate emoji and styling
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'new': ':new: *New*',
    'open': ':large_orange_diamond: *Open*',
    'pending': ':hourglass_flowing_sand: *Pending*',
    'hold': ':pause_button: *On Hold*',
    'solved': ':white_check_mark: *Solved*',
    'closed': ':lock: *Closed*'
  };
  return statusMap[status.toLowerCase()] || `:grey_question: *${status}*`;
}

/**
 * Truncates text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Ticket information message template for displaying detailed ticket data
 * Provides comprehensive ticket overview with rich formatting and actions
 */
export const ticketInfoMessageTemplate: MessageTemplateRenderer<TicketInfoMessageContext> = (
  context: TicketInfoMessageContext
): SlackMessageTemplate => {
  const { channel, threadTs, ticket, clickupTask, aiSummary, showActions = true } = context;

  const blocks: any[] = [
    // Header with ticket number and subject
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🎫 Ticket #${ticket.id}`,
        emoji: true
      }
    },
    
    // Ticket subject
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${ticket.subject}*`
      }
    },

    // Main ticket information fields
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Status:*\n${formatStatus(ticket.status)}`
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${formatPriority(ticket.priority)}`
        },
        {
          type: 'mrkdwn',
          text: `*Category:*\n${ticket.category || 'General'}`
        },
        {
          type: 'mrkdwn',
          text: `*Assigned Team:*\n${ticket.assignedTeam || 'Unassigned'}`
        }
      ]
    }
  ];

  // Add requester information if available
  if (ticket.requester) {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Requester:*\n${ticket.requester.name}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${ticket.requester.email || 'Not provided'}`
        }
      ]
    });
  }

  // Add assignee if available
  if (ticket.assignee) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Assigned to:* ${ticket.assignee}`
      }
    });
  }

  // Add description if available
  if (ticket.description) {
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${truncateText(ticket.description)}`
        }
      }
    );
  }

  // Add AI summary if available
  if (aiSummary) {
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🤖 AI Summary:*\n${truncateText(aiSummary)}`
        }
      }
    );
  }

  // Add ClickUp task information if available
  if (clickupTask && clickupTask.id) {
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎯 ClickUp Task:*\n${clickupTask.name || 'Untitled Task'}`
        },
        fields: [
          {
            type: 'mrkdwn',
            text: `*Task Status:*\n${clickupTask.status || 'Unknown'}`
          },
          {
            type: 'mrkdwn',
            text: `*Task Assignee:*\n${clickupTask.assignee || 'Unassigned'}`
          }
        ]
      }
    );
  }

  // Add tags if available
  if (ticket.tags && ticket.tags.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Tags:* ${ticket.tags.map(tag => `\`${tag}\``).join(', ')}`
        }
      ]
    });
  }

  // Add timestamps
  const timestampElements = [];
  if (ticket.createdAt) {
    timestampElements.push({
      type: 'mrkdwn',
      text: `*Created:* ${ticket.createdAt}`
    });
  }
  if (ticket.updatedAt) {
    timestampElements.push({
      type: 'mrkdwn',
      text: `*Updated:* ${ticket.updatedAt}`
    });
  }
  
  if (timestampElements.length > 0) {
    blocks.push({
      type: 'context',
      elements: timestampElements
    });
  }

  // Add action buttons if enabled
  if (showActions) {
    const actionElements = [];
    
    if (ticket.url) {
      actionElements.push({
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🎫 View in Zendesk',
          emoji: true
        },
        url: ticket.url,
        style: 'primary'
      });
    }
    
    if (clickupTask?.url) {
      actionElements.push({
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🎯 View in ClickUp',
          emoji: true
        },
        url: clickupTask.url
      });
    }
    
    if (actionElements.length > 0) {
      blocks.push({
        type: 'actions',
        elements: actionElements
      });
    }
  }

  // Add footer
  blocks.push(createBotFooter({
    showSystemStatus: false
  }));

  return {
    channel,
    thread_ts: threadTs,
    text: `Ticket #${ticket.id}: ${ticket.subject}`, // Fallback text for notifications
    blocks
  };
};