/**
 * @ai-metadata
 * @component: TicketSummaryMessageTemplate
 * @description: Slack message template for displaying ticket summaries and search results
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Template for displaying ticket summaries, search results, and ticket lists in Slack"
 */

import type { MessageTemplateRenderer, SlackMessageTemplate, TicketSummaryMessageContext, TicketSummaryItem } from './types';
import { createBotFooter } from './footers/taskgenie-footer.template';

export type { TicketSummaryMessageContext, TicketSummaryItem } from './types';

/**
 * Formats priority with emoji for compact display
 */
function formatPriorityCompact(priority: string): string {
  const priorityMap: Record<string, string> = {
    'urgent': '🔴',
    'high': '🟠',
    'normal': '🟡',
    'low': '🟢'
  };
  return priorityMap[priority.toLowerCase()] || '⚪';
}

/**
 * Formats status with emoji for compact display
 */
function formatStatusCompact(status: string): string {
  const statusMap: Record<string, string> = {
    'new': '🆕',
    'open': '🔶',
    'pending': '⏳',
    'hold': '⏸️',
    'solved': '✅',
    'closed': '🔒'
  };
  return statusMap[status.toLowerCase()] || '❓';
}

/**
 * Truncates subject for summary display
 */
function truncateSubject(subject: string, maxLength: number = 60): string {
  if (subject.length <= maxLength) return subject;
  return subject.substring(0, maxLength - 3) + '...';
}

/**
 * Formats relative time (simplified)
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  } catch {
    return 'Unknown';
  }
}

/**
 * Ticket summary message template for displaying lists of tickets
 * Provides clean, organized view of multiple tickets with key information
 */
export const ticketSummaryMessageTemplate: MessageTemplateRenderer<TicketSummaryMessageContext> = (
  context: TicketSummaryMessageContext
): SlackMessageTemplate => {
  const { 
    channel, 
    threadTs, 
    title, 
    tickets, 
    totalCount, 
    searchQuery, 
    showActions = true,
    aiInsight 
  } = context;

  const blocks: any[] = [];

  // Header
  const headerText = title || (searchQuery ? `Search Results for "${searchQuery}"` : 'Ticket Summary');
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `🎫 ${headerText}`,
      emoji: true
    }
  });

  // Results count and search info
  if (searchQuery || totalCount !== undefined) {
    const countText = totalCount !== undefined 
      ? `Found ${totalCount} ticket${totalCount !== 1 ? 's' : ''}` 
      : `Showing ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;
    
    const searchText = searchQuery ? ` matching "${searchQuery}"` : '';
    
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${countText}${searchText}`
        }
      ]
    });
  }

  // AI Insight if available
  if (aiInsight) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🤖 AI Insight:*\n${aiInsight}`
        }
      },
      {
        type: 'divider'
      }
    );
  }

  // Tickets list
  if (tickets.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📭 *No tickets found*\n\nTry adjusting your search criteria or check if there are any open tickets.'
      }
    });
  } else {
    // Group tickets by status for better organization
    const ticketsByStatus = tickets.reduce((acc, ticket) => {
      const status = ticket.status.toLowerCase();
      if (!acc[status]) acc[status] = [];
      acc[status].push(ticket);
      return acc;
    }, {} as Record<string, TicketSummaryItem[]>);

    // Display tickets by status groups
    const statusOrder = ['new', 'open', 'pending', 'hold', 'solved', 'closed'];
    
    for (const status of statusOrder) {
      const statusTickets = ticketsByStatus[status];
      if (!statusTickets || statusTickets.length === 0) continue;

      // Status group header
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${formatStatusCompact(status)} ${status.toUpperCase()} (${statusTickets.length})*`
        }
      });

      // Individual tickets in this status
      for (const ticket of statusTickets.slice(0, 10)) { // Limit to 10 per status
        const ticketLine = [
          `${formatPriorityCompact(ticket.priority)}`,
          `*#${ticket.id}*`,
          truncateSubject(ticket.subject),
          ticket.hasClickUpTask ? '🎯' : '',
          `_${formatRelativeTime(ticket.updatedAt)}_`
        ].filter(Boolean).join(' ');

        const assigneeInfo = ticket.assignee ? `👤 ${ticket.assignee}` : '👤 Unassigned';
        const requesterInfo = ticket.requester ? `📧 ${ticket.requester}` : '';
        
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ticketLine
          },
          accessory: ticket.url ? {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View',
              emoji: true
            },
            url: ticket.url,
            action_id: `view_ticket_${ticket.id}`
          } : undefined
        });

        // Add assignee/requester info as context
        if (assigneeInfo || requesterInfo) {
          blocks.push({
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: [assigneeInfo, requesterInfo].filter(Boolean).join(' • ')
              }
            ]
          });
        }
      }

      // Show "and X more" if there are more tickets in this status
      if (statusTickets.length > 10) {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_... and ${statusTickets.length - 10} more ${status} tickets_`
            }
          ]
        });
      }

      // Add divider between status groups
      blocks.push({
        type: 'divider'
      });
    }

    // Remove the last divider
    if (blocks[blocks.length - 1]?.type === 'divider') {
      blocks.pop();
    }
  }

  // Action buttons
  if (showActions && tickets.length > 0) {
    const actionElements = [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🔍 Refine Search',
          emoji: true
        },
        action_id: 'refine_search',
        value: searchQuery || ''
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '📊 Get Analytics',
          emoji: true
        },
        action_id: 'get_analytics'
      }
    ];

    blocks.push({
      type: 'actions',
      elements: actionElements
    });
  }

  // Legend for emojis
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '*Legend:* 🔴 Urgent • 🟠 High • 🟡 Normal • 🟢 Low • 🎯 Has ClickUp Task'
      }
    ]
  });

  // Footer
  blocks.push(createBotFooter({
    showSystemStatus: false
  }));

  return {
    channel,
    thread_ts: threadTs,
    text: `${headerText} - ${tickets.length} tickets`, // Fallback text for notifications
    blocks
  };
};