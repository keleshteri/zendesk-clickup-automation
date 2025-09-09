import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Generic error message template
 * Generic error message for unexpected issues
 */
export const errorGenericTemplate: MessageTemplate = {
  id: 'error-generic',
  name: 'Generic Error Message',
  description: 'Generic error message for unexpected issues',
  category: TemplateCategory.ERROR,
  version: '1.0.0',
  variables: [
    {
      name: 'errorMessage',
      type: 'string',
      required: true,
      defaultValue: 'Unknown error occurred',
      description: 'Error message to display'
    }
  ],
  content: {
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
    ]
  }
};