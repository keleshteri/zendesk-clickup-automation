import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Basic welcome message template
 * Simple welcome message when bot joins a channel
 */
export const welcomeBasicTemplate: MessageTemplate = {
  id: 'welcome-basic',
  name: 'Basic Welcome Message',
  description: 'Simple welcome message when bot joins a channel',
  category: TemplateCategory.WELCOME,
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
    text: 'Hello! 👋 I\'m {{botName}} and I\'m here to help! Type `@{{botName}} help` to see what I can do.'
  }
};