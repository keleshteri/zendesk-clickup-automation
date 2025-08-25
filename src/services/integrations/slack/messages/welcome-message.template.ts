/**
 * @ai-metadata
 * @component: WelcomeMessageTemplate
 * @description: Slack welcome message template for new channel members
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Template for welcoming new users to Slack channels with TaskGenie introduction"
 */

import type { WelcomeMessageContext, MessageTemplateRenderer, SlackMessageTemplate } from './types';
import { createTaskGenieFooter } from './footers/taskgenie-footer.template';

/**
 * Welcome message template for new channel members
 * Introduces TaskGenie and provides quick start information
 */
export const welcomeMessageTemplate: MessageTemplateRenderer<WelcomeMessageContext> = (
  context: WelcomeMessageContext
): SlackMessageTemplate => {
  const { userId, channel } = context;

  return {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:wave: Welcome to the channel, <@${userId}>!`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "I'm TaskGenie :genie:, your AI-powered task automation assistant. I help streamline workflows between Zendesk and ClickUp!"
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':sparkles: *Quick Start:*\n• Mention @TaskGenie to get help or ask questions\n• I can create ClickUp tasks from Zendesk tickets\n• Get AI-powered summaries and insights\n• Type `@TaskGenie help` for all available commands'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':robot_face: Ready to boost your productivity? Just mention me anytime!'
          }
        ]
      },
      ...createTaskGenieFooter({
        version: 'v0.0.2',
        zendeskDomain: '2damcreative.zendesk.com',
        showSystemStatus: true
      }).elements.map(element => ({
        type: 'context' as const,
        elements: [element]
      }))
    ]
  };
};