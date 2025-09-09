import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Bot status template
 * Shows current bot status and health information
 */
export const botStatusTemplate: MessageTemplate = {
  id: 'bot-status',
  name: 'Bot Status',
  description: 'Shows current bot status and health information',
  category: TemplateCategory.CUSTOM,
  version: '1.0.0',
  variables: [
    {
      name: 'status',
      type: 'string',
      required: true,
      defaultValue: 'Online',
      description: 'Current bot status'
    },
    {
      name: 'uptime',
      type: 'string',
      required: false,
      defaultValue: 'Unknown',
      description: 'Bot uptime'
    },
    {
      name: 'version',
      type: 'string',
      required: false,
      defaultValue: '1.0.0',
      description: 'Bot version'
    }
  ],
  content: {
    text: '🤖 Bot Status: {{status}} | Uptime: {{uptime}} | Version: {{version}}',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🤖 *Bot Status Information*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Status:*\n{{status}}'
          },
          {
            type: 'mrkdwn',
            text: '*Uptime:*\n{{uptime}}'
          },
          {
            type: 'mrkdwn',
            text: '*Version:*\n{{version}}'
          }
        ]
      }
    ]
  }
};