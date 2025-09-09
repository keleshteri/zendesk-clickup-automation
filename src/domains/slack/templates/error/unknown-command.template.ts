import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Unknown command response template
 * Response when user mentions bot with unrecognized command
 */
export const unknownCommandTemplate: MessageTemplate = {
  id: 'unknown-command',
  name: 'Unknown Command Response',
  description: 'Response when user mentions bot with unrecognized command',
  category: TemplateCategory.ERROR,
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
    ]
  }
};