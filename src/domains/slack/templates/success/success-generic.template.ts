import type { MessageTemplate } from '../../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../../types/slack.types.js';

/**
 * Generic success message template
 * Generic success message for completed actions
 */
export const successGenericTemplate: MessageTemplate = {
  id: 'success-generic',
  name: 'Generic Success Message',
  description: 'Generic success message for completed actions',
  category: TemplateCategory.SUCCESS,
  version: '1.0.0',
  variables: [
    {
      name: 'action',
      type: 'string',
      required: true,
      defaultValue: 'Action',
      description: 'Action that was completed'
    }
  ],
  content: {
    text: '✅ Success! {{action}} completed successfully.',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ *Success!* {{action}} completed successfully.'
        }
      }
    ]
  }
};