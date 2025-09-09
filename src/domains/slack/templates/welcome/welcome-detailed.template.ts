import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Detailed welcome message template
 * Comprehensive welcome message with features overview
 */
export const welcomeDetailedTemplate: MessageTemplate = {
  id: 'welcome-detailed',
  name: 'Detailed Welcome Message',
  description: 'Comprehensive welcome message with features overview',
  category: TemplateCategory.WELCOME,
  version: '1.0.0',
  variables: [
    {
      name: 'botName',
      type: 'string',
      required: true,
      defaultValue: 'Bot',
      description: 'Name of the bot'
    },
    {
      name: 'channelName',
      type: 'string',
      required: true,
      defaultValue: 'this channel',
      description: 'Name of the channel'
    }
  ],
  content: {
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
    ]
  }
};