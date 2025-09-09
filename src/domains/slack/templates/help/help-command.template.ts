import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Help command response template
 * Comprehensive help message showing available commands
 */
export const helpCommandTemplate: MessageTemplate = {
  id: 'help-command',
  name: 'Help Command Response',
  description: 'Comprehensive help message showing available commands',
  category: TemplateCategory.HELP,
  version: '1.0.0',
  variables: [
    {
      name: 'botName',
      type: 'string',
      required: true,
      defaultValue: 'Bot',
      description: 'Name of the bot'
    }
  ],
  content: {
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
    ]
  }
};