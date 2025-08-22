/**
 * @ai-metadata
 * @component: SlackThreadBuilder
 * @description: Builder for creating threaded Slack messages and conversations with various reply types
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-thread-builder.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "startThread": "allow", "addReply": "allow", "addBotReply": "allow", "addSystemReply": "allow" }
 * @dependencies: ["../../../../types/index.ts", "../core/slack-message-builder.ts", "../utils/slack-emojis.ts", "../utils/slack-formatters.ts", "./slack-thread-context.ts"]
 * @tests: ["./tests/slack-thread-builder.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Fluent interface for building complex threaded conversations. Critical for structured message flows."
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { SlackMessage } from '../../../../types/index';
import { SlackMessageBuilder } from '../core/slack-message-builder';
import { SlackEmojis } from '../utils/slack-emojis';
import { SlackFormatters } from '../utils/slack-formatters';
import { SlackThreadContext } from './slack-thread-context';

/**
 * Builder for creating threaded Slack messages and conversations
 */
export class SlackThreadBuilder {
  private messageBuilder: SlackMessageBuilder;
  private threadContext?: SlackThreadContext;
  private messages: SlackMessage[] = [];
  private currentMessage?: SlackMessage;

  constructor() {
    this.messageBuilder = new SlackMessageBuilder();
  }

  /**
   * Set the thread context
   */
  setThreadContext(context: SlackThreadContext): SlackThreadBuilder {
    this.threadContext = context;
    return this;
  }

  /**
   * Start a new thread with an initial message
   */
  startThread(
    channel: string,
    initialMessage: string,
    options?: {
      username?: string;
      iconEmoji?: string;
      metadata?: Record<string, any>;
    }
  ): SlackThreadBuilder {
    this.currentMessage = {
      channel,
      text: initialMessage,
      user: 'bot',
      ts: new Date().getTime().toString(),
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: initialMessage
        }
      }]
    };

    if (options?.username) {
      this.currentMessage.username = options.username;
    }

    if (options?.iconEmoji) {
      this.currentMessage.icon_emoji = options.iconEmoji;
    }

    this.messages.push(this.currentMessage);
    return this;
  }

  /**
   * Add a threaded reply
   */
  addReply(
    text: string,
    options?: {
      blocks?: any[];
      username?: string;
      iconEmoji?: string;
      userId?: string;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text,
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: options?.blocks || [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      }]
    };

    if (options?.blocks) {
      reply.blocks = options.blocks;
    } else {
      reply.blocks = [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      }];
    }

    if (options?.username) {
      reply.username = options.username;
    }

    if (options?.iconEmoji) {
      reply.icon_emoji = options.iconEmoji;
    }

    this.messages.push(reply);
    return this;
  }

  /**
   * Add a bot reply with TaskGenie branding
   */
  addBotReply(
    text: string,
    options?: {
      includeHeader?: boolean;
      includeFooter?: boolean;
      actions?: Array<{
        text: string;
        value: string;
        style?: 'primary' | 'danger';
        url?: string;
      }>;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: `${SlackEmojis.getAgentEmoji('taskgenie')} TaskGenie`,
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      username: 'TaskGenie',
      icon_emoji: SlackEmojis.getAgentEmoji('taskgenie'),
      blocks: []
    };

    if (options?.includeHeader) {
      reply.blocks.push({
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${SlackEmojis.getAgentEmoji('taskgenie')} TaskGenie`
        }
      });
    }

    reply.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text
      }
    });

    if (options?.actions) {
      const actionElements = options.actions.map(action => ({
        type: 'button' as const,
        text: {
          type: 'plain_text' as const,
          text: action.text,
          emoji: true
        },
        ...(action.url ? { url: action.url } : { value: action.value, action_id: `action_${action.value}` }),
        ...(action.style && { style: action.style })
      }));

      reply.blocks.push({
        type: 'actions',
        elements: actionElements
      });
    }

    if (options?.includeFooter) {
      reply.blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `${SlackEmojis.getAgentEmoji('taskgenie')} Powered by TaskGenie`
        }]
      });
    }
    this.messages.push(reply);
    return this;
  }

  /**
   * Add a system notification reply
   */
  addSystemReply(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    details?: string
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type];

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: `${emoji} System Notification`,
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} **${message}**`
        }
      }]
    };

    if (details) {
      reply.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: details
        }
      });
    }
    this.messages.push(reply);
    return this;
  }

  /**
   * Add a ticket update reply
   */
  addTicketUpdateReply(
    ticketId: string,
    ticketUrl: string,
    updateType: 'created' | 'updated' | 'resolved' | 'assigned',
    details?: {
      assignee?: string;
      status?: string;
      priority?: string;
      comment?: string;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const emoji = {
      created: '🎫',
      updated: '📝',
      resolved: '✅',
      assigned: '👤'
    }[updateType];

    const actionText = {
      created: 'created',
      updated: 'updated',
      resolved: 'resolved',
      assigned: 'assigned'
    }[updateType];

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: `${emoji} Ticket ${actionText}`,
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} **Ticket ${actionText}**\n\n<${ticketUrl}|#${ticketId}>`
        }
      }]
    };

    if (details) {
      const fields: Array<{ title: string; value: string }> = [];

      if (details.assignee) {
        fields.push({ title: 'Assignee', value: details.assignee });
      }

      if (details.status) {
        fields.push({ title: 'Status', value: SlackFormatters.formatStatus(details.status) });
      }

      if (details.priority) {
        fields.push({ title: 'Priority', value: SlackFormatters.formatStatus(details.priority) });
      }

      if (fields.length > 0) {
        reply.blocks.push({
          type: 'section',
          fields: fields.map(field => ({
            type: 'mrkdwn',
            text: `*${field.title}:*\n${field.value}`
          }))
        });
      }

      if (details.comment) {
        reply.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `💬 **Comment:**\n${details.comment}`
          }
        });
      }
    }
    this.messages.push(reply);
    return this;
  }

  /**
   * Add a task update reply
   */
  addTaskUpdateReply(
    taskUrl: string,
    updateType: 'created' | 'updated' | 'completed' | 'assigned',
    details?: {
      assignee?: string;
      status?: string;
      dueDate?: string;
      comment?: string;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const emoji = {
      created: '📋',
      updated: '✏️',
      completed: '✅',
      assigned: '👤'
    }[updateType];

    const actionText = {
      created: 'created',
      updated: 'updated',
      completed: 'completed',
      assigned: 'assigned'
    }[updateType];

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: `${emoji} Task ${actionText}`,
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} **Task ${actionText}**\n\n<${taskUrl}|View Task>`
          }
        }
      ]
    };

    if (details) {
      const fields: Array<{ title: string; value: string }> = [];

      if (details.assignee) {
        fields.push({ title: 'Assignee', value: details.assignee });
      }

      if (details.status) {
        fields.push({ title: 'Status', value: details.status });
      }

      if (details.dueDate) {
        fields.push({ title: 'Due Date', value: SlackFormatters.formatDate(new Date(details.dueDate)) });
      }

      if (fields.length > 0) {
        reply.blocks.push({
          type: 'section',
          fields: fields.map(field => ({
            type: 'mrkdwn',
            text: `*${field.title}:*\n${field.value}`
          }))
        });
      }

      if (details.comment) {
        reply.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `💬 **Comment:**\n${details.comment}`
          }
        });
      }
    }

    this.messages.push(reply);
    return this;
  }

  /**
   * Add an AI analysis reply
   */
  addAIAnalysisReply(
    analysis: {
      summary: string;
      insights: string[];
      recommendations: string[];
      confidence?: number;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: '🤖 AI Analysis',
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🤖 **AI Analysis**\n\n${analysis.summary}`
          }
        }
      ]
    };

    if (analysis.insights.length > 0) {
      const insightsText = analysis.insights.map(insight => `• ${insight}`).join('\n');
      reply.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💡 **Key Insights:**\n${insightsText}`
        }
      });
    }

    if (analysis.recommendations.length > 0) {
      const recommendationsText = analysis.recommendations.map(rec => `• ${rec}`).join('\n');
      reply.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎯 **Recommendations:**\n${recommendationsText}`
        }
      });
    }

    if (analysis.confidence !== undefined) {
      const confidenceBar = '█'.repeat(Math.floor(analysis.confidence * 10)) + '░'.repeat(10 - Math.floor(analysis.confidence * 10));
      reply.blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `🎯 Confidence: ${confidenceBar} ${Math.round(analysis.confidence * 100)}%`
        }]
      });
    }

    this.messages.push(reply);
    return this;
  }

  /**
   * Add a conversation summary reply
   */
  addConversationSummaryReply(
    summary: {
      messageCount: number;
      participantCount: number;
      keyPoints: string[];
      actionItems: string[];
      duration: string;
    }
  ): SlackThreadBuilder {
    if (!this.currentMessage) {
      throw new Error('Must start a thread before adding replies');
    }

    const reply: SlackMessage = {
      channel: this.currentMessage.channel,
      text: '📊 Conversation Summary',
      user: 'bot',
      ts: new Date().getTime().toString(),
      thread_ts: this.currentMessage.ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📊 **Conversation Summary**'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Messages:*\n${summary.messageCount.toString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Participants:*\n${summary.participantCount.toString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${summary.duration}`
            }
          ]
        }
      ]
    };

    if (summary.keyPoints.length > 0) {
      const keyPointsText = summary.keyPoints.map(point => `• ${point}`).join('\n');
      reply.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔑 **Key Points:**\n${keyPointsText}`
        }
      });
    }

    if (summary.actionItems.length > 0) {
      const actionItemsText = summary.actionItems.map(item => `• ${item}`).join('\n');
      reply.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ **Action Items:**\n${actionItemsText}`
        }
      });
    }

    this.messages.push(reply);
    return this;
  }

  /**
   * Get all messages in the thread
   */
  getMessages(): SlackMessage[] {
    return [...this.messages];
  }

  /**
   * Get the initial thread message
   */
  getInitialMessage(): SlackMessage | undefined {
    return this.messages[0];
  }

  /**
   * Get all reply messages
   */
  getReplies(): SlackMessage[] {
    return this.messages.slice(1);
  }

  /**
   * Get the last message in the thread
   */
  getLastMessage(): SlackMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Clear all messages and reset the builder
   */
  reset(): SlackThreadBuilder {
    this.messages = [];
    this.currentMessage = undefined;
    this.threadContext = undefined;
    return this;
  }

  /**
   * Get thread statistics
   */
  getStats(): {
    messageCount: number;
    hasInitialMessage: boolean;
    replyCount: number;
    totalBlocks: number;
  } {
    const totalBlocks = this.messages.reduce((total, msg) => {
      return total + (msg.blocks?.length || 0);
    }, 0);

    return {
      messageCount: this.messages.length,
      hasInitialMessage: this.messages.length > 0,
      replyCount: Math.max(0, this.messages.length - 1),
      totalBlocks
    };
  }

  /**
   * Validate the thread structure
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.messages.length === 0) {
      errors.push('Thread must have at least one message');
    }

    if (this.messages.length > 0 && !this.messages[0].channel) {
      errors.push('Initial message must have a channel');
    }

    // Check that all replies have thread_ts
    for (let i = 1; i < this.messages.length; i++) {
      if (!this.messages[i].thread_ts) {
        errors.push(`Reply message at index ${i} missing thread_ts`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}