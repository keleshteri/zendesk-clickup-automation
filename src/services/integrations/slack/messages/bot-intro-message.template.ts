/**
 * @ai-metadata
 * @component: BotIntroMessageTemplate
 * @description: Slack bot introduction message template for when TaskGenie joins a channel
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Template for introducing TaskGenie bot when it joins a new Slack channel"
 */

import type { BotIntroMessageContext, MessageTemplateRenderer, SlackMessageTemplate } from './types';

/**
 * Bot introduction message template for when TaskGenie joins a channel
 * Provides comprehensive overview of bot capabilities and usage instructions
 */
export const botIntroMessageTemplate: MessageTemplateRenderer<BotIntroMessageContext> = (
  context: BotIntroMessageContext
): SlackMessageTemplate => {
  const { channel, teamName } = context;

  return {
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':genie: *TaskGenie has joined!*\n\nHi everyone! :wave:'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "I'm TaskGenie, your AI-powered task automation assistant. I'm here to help streamline your workflow between Zendesk and ClickUp!"
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
          text: ':speech_balloon: *How to interact with me:*\n• Mention me with @TaskGenie followed by your question\n• Ask for help: `@TaskGenie help`\n• List open tickets: `@TaskGenie list tickets`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':rocket: *Ready to boost your productivity?* Just mention @TaskGenie and I\'ll assist!'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':robot_face: TaskGenie v0.0.2 • Made by 2DC Team • Powered by AI\n:large_green_circle: Zendesk (2damcreative.zendesk.com) | :large_green_circle: ClickUp | :large_green_circle: AI Provider'
          }
        ]
      }
    ]
  };
};
