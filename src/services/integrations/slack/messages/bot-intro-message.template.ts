/**
 * @ai-metadata
 * @component: BotIntroMessageTemplate
 * @description: Slack bot introduction message template for when bot joins a channel
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Template for introducing bot when it joins a new Slack channel"
 */

import type { BotIntroMessageContext, MessageTemplateRenderer, SlackMessageTemplate } from './types';

/**
 * Bot introduction message template for when bot joins a channel
 * Provides comprehensive overview of capabilities and usage instructions
 */
export const botIntroMessageTemplate: MessageTemplateRenderer<BotIntroMessageContext> = (
  context: BotIntroMessageContext
): SlackMessageTemplate => {
  const { channel, _teamName } = context;

  return {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':robot_face: *Bot has joined!*\n\nHi everyone! :wave:'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "I'm your AI-powered task automation assistant. I'm here to help streamline your workflow between Zendesk and ClickUp!"
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':dart: *What I can do for you:*\n• :ticket: Automatically create ClickUp tasks from Zendesk tickets\n• :clipboard: Provide AI-powered ticket summaries and analysis\n• :bar_chart: Generate insights and analytics reports\n• :mag: Help you search and find tickets\n• :robot_face: Answer questions about your tickets and tasks\n• :link: Keep everything connected with smart automation'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':speech_balloon: *How to interact with me:*\n• Mention me followed by your question\n• Ask for help: `help`\n• List open tickets: `list tickets`\n• Get ticket summaries: `summarize ticket #27`\n• Check status: `status ticket #27`\n• Get analytics: `analytics`'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':rocket: *Ready to boost your productivity?* Just mention me and I\'ll assist!'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':robot_face: Bot v0.0.2 • Made by 2DC Team • Powered by AI\n:large_green_circle: Zendesk (2damcreative.zendesk.com) | :large_green_circle: ClickUp | :large_green_circle: AI Provider'
          }
        ]
      }
    ]
  };
};
