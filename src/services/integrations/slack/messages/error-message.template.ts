/**
 * @ai-metadata
 * @component: ErrorMessageTemplate
 * @description: Slack message templates for error handling and user feedback
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Templates for displaying error messages and user guidance in Slack"
 */

import type { MessageTemplateRenderer, SlackMessageTemplate, ErrorMessageContext, HelpMessageContext } from './types';
import { createBotFooter } from './footers/taskgenie-footer.template';

export type { ErrorMessageContext, HelpMessageContext } from './types';

/**
 * Error message template for various error scenarios
 * Provides user-friendly error messages with helpful suggestions
 */
export const errorMessageTemplate: MessageTemplateRenderer<ErrorMessageContext> = (
  context: ErrorMessageContext
): SlackMessageTemplate => {
  const { 
    channel, 
    threadTs, 
    errorType, 
    ticketId, 
    searchQuery, 
    errorMessage, 
    suggestions = [],
    showRetryAction = true,
    showHelpAction = true 
  } = context;

  const blocks: any[] = [];

  // Error-specific content
  switch (errorType) {
    case 'ticket_not_found':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔍 *Ticket Not Found*\n\nI couldn't find ticket #${ticketId || 'unknown'} in Zendesk.`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Possible reasons:*\n• The ticket ID might be incorrect\n• The ticket might have been deleted\n• You might not have access to this ticket\n• The ticket might be in a different Zendesk instance'
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Double-check the ticket ID',
          'Try searching by keywords instead',
          'Use `list tickets` to see recent tickets'
        );
      }
      break;

    case 'search_failed':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔍 *Search Failed*\n\nI couldn't complete the search${searchQuery ? ` for "${searchQuery}"` : ''}.`
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Try using different keywords',
          'Check your spelling',
          'Use more specific search terms',
          'Try searching by ticket ID instead'
        );
      }
      break;

    case 'api_error':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚠️ *API Connection Error*\n\nI\'m having trouble connecting to Zendesk right now.'
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Try again in a few moments',
          'Check if Zendesk is experiencing issues',
          'Contact your admin if the problem persists'
        );
      }
      break;

    case 'permission_denied':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🔒 *Access Denied*\n\nYou don\'t have permission to access this resource.'
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Contact your Zendesk administrator',
          'Check if you\'re logged into the correct account',
          'Verify your user permissions'
        );
      }
      break;

    case 'invalid_input':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ *Invalid Input*\n\nThe command or input format isn\'t recognized.'
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Check the command syntax',
          'Use `help` to see available commands',
          'Try mentioning me with a clear question'
        );
      }
      break;

    case 'service_unavailable':
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🚫 *Service Unavailable*\n\nThe requested service is temporarily unavailable.'
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Try again later',
          'Check system status',
          'Use alternative commands if available'
        );
      }
      break;

    default: // general_error
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Something went wrong*\n\n${errorMessage || 'An unexpected error occurred while processing your request.'}`
          }
        }
      );
      
      if (!suggestions.length) {
        suggestions.push(
          'Try rephrasing your request',
          'Use `help` for available commands',
          'Contact support if the issue persists'
        );
      }
      break;
  }

  // Add suggestions if available
  if (suggestions.length > 0) {
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💡 Suggestions:*\n${suggestions.map(s => `• ${s}`).join('\n')}`
        }
      }
    );
  }

  // Action buttons
  const actionElements = [];
  
  if (showRetryAction) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: '🔄 Try Again',
        emoji: true
      },
      action_id: 'retry_action',
      style: 'primary'
    });
  }
  
  if (showHelpAction) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: '❓ Get Help',
        emoji: true
      },
      action_id: 'show_help'
    });
  }
  
  if (actionElements.length > 0) {
    blocks.push({
      type: 'actions',
      elements: actionElements
    });
  }

  // Footer
  blocks.push(createBotFooter({
    showSystemStatus: false
  }));

  return {
    channel,
    thread_ts: threadTs,
    text: `Error: ${errorType.replace('_', ' ')}`, // Fallback text for notifications
    blocks
  };
};

/**
 * Help message template for providing user guidance
 * Displays available commands and usage instructions
 */
export const helpMessageTemplate: MessageTemplateRenderer<HelpMessageContext> = (
  context: HelpMessageContext
): SlackMessageTemplate => {
  const { channel, threadTs, helpType = 'general', userMention } = context;

  const blocks: any[] = [];

  // Greeting
  if (userMention) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `👋 Hi ${userMention}! I'm here to help you with Zendesk and ClickUp automation.`
      }
    });
  }

  // Help content based on type
  switch (helpType) {
    case 'ticket_commands':
      blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎫 Ticket Commands',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*View Ticket Information:*\n• `show ticket #123` - Get detailed ticket info\n• `ticket #123` - Quick ticket lookup\n• `status ticket #123` - Check ticket status'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Search & List Tickets:*\n• `list tickets` - Show recent tickets\n• `search tickets keyword` - Search by keyword\n• `my tickets` - Show tickets assigned to you\n• `open tickets` - Show all open tickets'
          }
        }
      );
      break;

    case 'search_tips':
      blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔍 Search Tips',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Effective Search Strategies:*\n• Use specific keywords from the ticket subject\n• Include requester name or email\n• Search by priority: `urgent tickets`\n• Search by status: `pending tickets`\n• Use quotes for exact phrases: `"login issue"`'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Search Examples:*\n• `search tickets password reset`\n• `search tickets "billing question"`\n• `search tickets john@company.com`\n• `urgent tickets from last week`'
          }
        }
      );
      break;

    case 'troubleshooting':
      blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔧 Troubleshooting',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Common Issues:*\n• **Ticket not found**: Check the ticket ID and try again\n• **Search returns no results**: Try broader keywords\n• **Slow responses**: Zendesk API might be busy\n• **Permission errors**: Contact your admin'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Getting Better Results:*\n• Be specific in your requests\n• Use ticket IDs when possible\n• Mention me clearly in your message\n• Try alternative phrasings if something doesn\'t work'
          }
        }
      );
      break;

    default: // general
      blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🤖 TaskGenie Help',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🎫 Ticket Operations:*\n• `show ticket #123` - View ticket details\n• `list tickets` - Show recent tickets\n• `search tickets [keyword]` - Search tickets\n• `summarize ticket #123` - Get AI summary'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📊 Analytics & Reports:*\n• `analytics` - Get ticket analytics\n• `team performance` - Team metrics\n• `ticket trends` - Trend analysis'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🎯 ClickUp Integration:*\n• `create task from ticket #123` - Create ClickUp task\n• `link ticket #123 to task` - Link existing task\n• `task status` - Check task progress'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*💬 How to interact:*\n• Mention me: `@TaskGenie show ticket #123`\n• Ask naturally: `@TaskGenie what\'s the status of ticket 456?`\n• Use commands: `help`, `status`, `analytics`'
          }
        }
      );
      break;
  }

  // Quick action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🎫 Ticket Help',
          emoji: true
        },
        action_id: 'help_tickets'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🔍 Search Tips',
          emoji: true
        },
        action_id: 'help_search'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🔧 Troubleshooting',
          emoji: true
        },
        action_id: 'help_troubleshooting'
      }
    ]
  });

  // Footer
  blocks.push(createBotFooter());

  return {
    channel,
    thread_ts: threadTs,
    text: 'TaskGenie Help - Available commands and usage guide', // Fallback text for notifications
    blocks
  };
};