import type { MessageTemplate } from '../interfaces/message-template.interface.js';
import { TemplateCategory } from '../types/slack.types.js';

/**
 * Default message templates for common Slack bot interactions
 */
export const defaultTemplates: MessageTemplate[] = [
  // Welcome Messages
  {
    id: 'welcome-basic',
    name: 'Basic Welcome Message',
    description: 'Simple welcome message when bot joins a channel',
    category: TemplateCategory.WELCOME,
    text: 'Hello! 👋 I\'m {{botName}} and I\'m here to help! Type `@{{botName}} help` to see what I can do.',
    defaultVariables: {
      botName: 'Bot'
    }
  },
  {
    id: 'welcome-detailed',
    name: 'Detailed Welcome Message',
    description: 'Comprehensive welcome message with features overview',
    category: TemplateCategory.WELCOME,
    text: 'Welcome to {{channelName}}! 🎉\n\nI\'m {{botName}}, your friendly automation assistant. Here\'s what I can help you with:\n\n• Zendesk ticket management\n• ClickUp task automation\n• Workflow coordination\n\nJust mention me with `@{{botName}}` followed by your request, or type `@{{botName}} help` for more details!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Welcome to {{channelName}}!* 🎉\n\nI\'m {{botName}}, your friendly automation assistant.'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*What I can help you with:*\n• Zendesk ticket management\n• ClickUp task automation\n• Workflow coordination'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Just mention me with `@{{botName}}` followed by your request, or click the button below for help!'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Get Help'
          },
          action_id: 'help_button',
          value: 'help'
        }
      }
    ],
    defaultVariables: {
      botName: 'Bot',
      channelName: 'this channel'
    }
  },
  
  // Bot Mention Responses
  {
    id: 'mention-greeting',
    name: 'Bot Mention Greeting',
    description: 'Friendly response when bot is mentioned without specific command',
    category: TemplateCategory.CUSTOM,
    text: 'Hi {{userName}}! 👋 How can I help you today? Try `@{{botName}} help` to see available commands.',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hi <@{{userId}}>! 👋 How can I help you today?'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Show Help'
            },
            action_id: 'show_help',
            value: 'help'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Ticket'
            },
            action_id: 'create_ticket',
            value: 'create_ticket'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Manage Tasks'
            },
            action_id: 'manage_tasks',
            value: 'manage_tasks'
          }
        ]
      }
    ],
    defaultVariables: {
      botName: 'Bot',
      userName: 'there',
      userId: 'U000000'
    }
  },
  {
    id: 'help-command',
    name: 'Help Command Response',
    description: 'Comprehensive help message showing available commands',
    category: TemplateCategory.HELP,
    text: 'Here are the commands I understand:\n\n**Zendesk Commands:**\n• `@{{botName}} create ticket` - Create a new support ticket\n• `@{{botName}} ticket status [ID]` - Check ticket status\n\n**ClickUp Commands:**\n• `@{{botName}} create task` - Create a new task\n• `@{{botName}} task status [ID]` - Check task status\n\n**General Commands:**\n• `@{{botName}} help` - Show this help message\n• `@{{botName}} status` - Check bot status',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available Commands* 🤖'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Zendesk Commands:*\n• `@{{botName}} create ticket` - Create a new support ticket\n• `@{{botName}} ticket status [ID]` - Check ticket status'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*ClickUp Commands:*\n• `@{{botName}} create task` - Create a new task\n• `@{{botName}} task status [ID]` - Check task status'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*General Commands:*\n• `@{{botName}} help` - Show this help message\n• `@{{botName}} status` - Check bot status'
        }
      }
    ],
    defaultVariables: {
      botName: 'Bot'
    }
  },
  {
    id: 'unknown-command',
    name: 'Unknown Command Response',
    description: 'Response when user mentions bot with unrecognized command',
    category: TemplateCategory.ERROR,
    text: 'I didn\'t understand that command. 🤔 Type `@{{botName}} help` to see what I can do!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'I didn\'t understand that command. 🤔'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Type `@{{botName}} help` to see available commands, or try one of these:'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Show Help'
            },
            action_id: 'show_help',
            value: 'help'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Ticket'
            },
            action_id: 'create_ticket',
            value: 'create_ticket'
          }
        ]
      }
    ],
    defaultVariables: {
      botName: 'Bot'
    }
  },
  
  // Status and Notification Templates
  {
    id: 'bot-status',
    name: 'Bot Status Response',
    description: 'Shows current bot status and health',
    category: TemplateCategory.CUSTOM,
    text: '🟢 Bot Status: Online and ready!\n\n**Uptime:** {{uptime}}\n**Version:** {{version}}\n**Connected Services:** {{connectedServices}}',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🟢 *Bot Status: Online and ready!*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Uptime:*\n{{uptime}}'
          },
          {
            type: 'mrkdwn',
            text: '*Version:*\n{{version}}'
          },
          {
            type: 'mrkdwn',
            text: '*Connected Services:*\n{{connectedServices}}'
          },
          {
            type: 'mrkdwn',
            text: '*Last Updated:*\n{{lastUpdated}}'
          }
        ]
      }
    ],
    defaultVariables: {
      uptime: '0 minutes',
      version: '1.0.0',
      connectedServices: 'Zendesk, ClickUp',
      lastUpdated: 'Just now'
    }
  },
  {
    id: 'error-generic',
    name: 'Generic Error Message',
    description: 'Generic error message for unexpected issues',
    category: TemplateCategory.ERROR,
    text: '❌ Oops! Something went wrong. Please try again or contact support if the issue persists.\n\n**Error:** {{errorMessage}}',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '❌ *Oops! Something went wrong.*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Please try again or contact support if the issue persists.\n\n*Error:* {{errorMessage}}'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Try Again'
            },
            action_id: 'retry_action',
            value: 'retry'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Get Help'
            },
            action_id: 'get_help',
            value: 'help'
          }
        ]
      }
    ],
    defaultVariables: {
      errorMessage: 'Unknown error occurred'
    }
  },
  {
    id: 'success-generic',
    name: 'Generic Success Message',
    description: 'Generic success message for completed actions',
    category: TemplateCategory.SUCCESS,
    text: '✅ Success! {{action}} completed successfully.',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ *Success!* {{action}} completed successfully.'
        }
      }
    ],
    defaultVariables: {
      action: 'Action'
    }
  }
];

/**
 * Get default template by ID
 */
export function getDefaultTemplate(templateId: string): MessageTemplate | undefined {
  return defaultTemplates.find(template => template.id === templateId);
}

/**
 * Get default templates by category
 */
export function getDefaultTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
  return defaultTemplates.filter(template => template.category === category);
}

/**
 * Get all welcome message templates
 */
export function getWelcomeTemplates(): MessageTemplate[] {
  return getDefaultTemplatesByCategory(TemplateCategory.WELCOME);
}

/**
 * Get all help templates
 */
export function getHelpTemplates(): MessageTemplate[] {
  return getDefaultTemplatesByCategory(TemplateCategory.HELP);
}