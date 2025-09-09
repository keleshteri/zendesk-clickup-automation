import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Mention greeting template
 * Greeting message when bot is mentioned
 */
export const mentionGreetingTemplate: MessageTemplate = {
  id: 'mention-greeting',
  name: 'Mention Greeting',
  description: 'Greeting message when bot is mentioned',
  category: TemplateCategory.CUSTOM,
  version: '1.0.0',
  variables: [
    {
      name: 'userName',
      type: 'string',
      required: true,
      defaultValue: 'User',
      description: 'Name of the user who mentioned the bot'
    }
  ],
  content: {
    text: 'Hi {{userName}}! 👋 I\'m here to help you manage your Zendesk and ClickUp integration. Type `help` to see what I can do!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hi {{userName}}! 👋 I\'m here to help you manage your *Zendesk* and *ClickUp* integration.'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Type `help` to see what I can do!'
        }
      }
    ]
  }
};