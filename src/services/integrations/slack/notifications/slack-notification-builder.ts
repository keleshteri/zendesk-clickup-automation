/**
 * @ai-metadata
 * @component: SlackNotificationBuilder
 * @description: Builder class for creating structured Slack notifications with fluent interface
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-notification-builder.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "build": "read-only", "addSection": "allow", "addActions": "allow" }
 * @dependencies: ["../types/slack-message-types.ts", "../../../../types/index.ts", "../utils/slack-emojis.ts", "../utils/slack-formatters.ts", "../utils/slack-constants.ts"]
 * @tests: ["./tests/slack-notification-builder.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core notification builder for Slack messages. Provides fluent interface for constructing complex notification structures."
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

import { SlackBlockType, SlackTextObject, SlackSectionBlock, SlackDividerBlock, SlackContextBlock, SlackActionsBlock, SlackButtonElement } from '../types/slack-message-types';
import { SlackMessage } from '../../../../types/index';
import { SlackEmojis } from '../utils/slack-emojis';
import { SlackFormatters } from '../utils/slack-formatters';
import { SlackConstants } from '../utils/slack-constants';

/**
 * Builder class for creating structured Slack notifications
 * Provides a fluent interface for building complex notification messages
 */
export class SlackNotificationBuilder {
  private blocks: SlackBlockType[] = [];
  private channel: string = '';
  private threadTs?: string;
  private text: string = '';
  private username?: string;
  private iconEmoji?: string;

  /**
   * Reset the builder to start fresh
   */
  reset(): SlackNotificationBuilder {
    this.blocks = [];
    this.channel = '';
    this.threadTs = undefined;
    this.text = '';
    this.username = undefined;
    this.iconEmoji = undefined;
    return this;
  }

  /**
   * Set the target channel
   */
  setChannel(channel: string): SlackNotificationBuilder {
    this.channel = channel;
    return this;
  }

  /**
   * Set thread timestamp for threaded messages
   */
  setThreadTs(threadTs: string): SlackNotificationBuilder {
    this.threadTs = threadTs;
    return this;
  }

  /**
   * Set fallback text for the message
   */
  setText(text: string): SlackNotificationBuilder {
    this.text = text;
    return this;
  }

  /**
   * Set custom username for the bot
   */
  setUsername(username: string): SlackNotificationBuilder {
    this.username = username;
    return this;
  }

  /**
   * Set custom icon emoji
   */
  setIconEmoji(emoji: string): SlackNotificationBuilder {
    this.iconEmoji = emoji;
    return this;
  }

  /**
   * Add a header block with TaskGenie branding
   */
  addTaskGenieHeader(title: string): SlackNotificationBuilder {
    this.blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${SlackEmojis.getAgentEmoji('ai')} ${title}`,
        emoji: true
      }
    });
    return this;
  }

  /**
   * Add a section block with markdown text
   */
  addSection(text: string, fields?: string[]): SlackNotificationBuilder {
    const textObject: SlackTextObject = {
      type: 'mrkdwn',
      text: SlackFormatters.sanitizeText(text)
    };

    const block: SlackSectionBlock = {
      type: 'section',
      text: textObject
    };

    if (fields && fields.length > 0) {
      const fieldObjects: SlackTextObject[] = fields.map(field => ({
        type: 'mrkdwn',
        text: SlackFormatters.sanitizeText(field)
      }));
      block.fields = fieldObjects;
    }

    this.blocks.push(block);
    return this;
  }

  /**
   * Add a section with fields (two-column layout)
   */
  addFieldsSection(fields: Array<{ title: string; value: string; short?: boolean }>): SlackNotificationBuilder {
    const fieldObjects: SlackTextObject[] = fields.map(field => ({
      type: 'mrkdwn',
      text: `*${field.title}:*\n${field.value}`
    }));

    const block: SlackSectionBlock = {
      type: 'section',
      fields: fieldObjects
    };
    
    this.blocks.push(block);
    return this;
  }

  /**
   * Add a divider block
   */
  addDivider(): SlackNotificationBuilder {
    const block: SlackDividerBlock = {
      type: 'divider'
    };
    this.blocks.push(block);
    return this;
  }

  /**
   * Add a context block with small text elements
   */
  addContext(elements: string[]): SlackNotificationBuilder {
    const contextElements: SlackTextObject[] = elements.map(text => ({
      type: 'mrkdwn',
      text: SlackFormatters.sanitizeText(text)
    }));

    const block: SlackContextBlock = {
      type: 'context',
      elements: contextElements
    };
    
    this.blocks.push(block);
    return this;
  }

  /**
   * Add action buttons
   */
  addActions(actions: Array<{
    text: string;
    value: string;
    style?: 'primary' | 'danger';
    url?: string;
  }>): SlackNotificationBuilder {
    const elements: SlackButtonElement[] = actions.map(action => {
      if (action.url) {
        return {
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
            emoji: true
          },
          url: action.url,
          style: action.style
        };
      } else {
        return {
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
            emoji: true
          },
          value: action.value,
          action_id: `action_${action.value}`,
          style: action.style
        };
      }
    });

    const block: SlackActionsBlock = {
      type: 'actions',
      elements
    };
    
    this.blocks.push(block);
    return this;
  }

  /**
   * Add ticket information section
   */
  addTicketInfo(ticketId: string, ticketUrl: string, status?: string, priority?: string): SlackNotificationBuilder {
    const fields = [
      {
        title: 'Ticket ID',
        value: `<${ticketUrl}|#${ticketId}>`
      }
    ];

    if (status) {
      fields.push({
        title: 'Status',
        value: SlackFormatters.formatStatus(status)
      });
    }

    if (priority) {
      fields.push({
        title: 'Priority',
        value: `${SlackEmojis.getPriorityEmoji(priority)} ${priority.toUpperCase()}`
      });
    }

    return this.addFieldsSection(fields);
  }

  /**
   * Add task information section
   */
  addTaskInfo(taskUrl: string, assignee?: string, dueDate?: string): SlackNotificationBuilder {
    const fields = [
      {
        title: 'ClickUp Task',
        value: `<${taskUrl}|View Task>`
      }
    ];

    if (assignee) {
      fields.push({
        title: 'Assignee',
        value: assignee
      });
    }

    if (dueDate) {
      fields.push({
        title: 'Due Date',
        value: SlackFormatters.formatDate(new Date(dueDate))
      });
    }

    return this.addFieldsSection(fields);
  }

  /**
   * Add service status footer
   */
  addServiceStatusFooter(serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }): SlackNotificationBuilder {
    const statusElements = [
      `${serviceStatuses.zendesk ? '🟢' : '🔴'} Zendesk`,
      `${serviceStatuses.clickup ? '🟢' : '🔴'} ClickUp`,
      `${serviceStatuses.ai ? '🟢' : '🔴'} AI Assistant`
    ];

    if (serviceStatuses.zendeskDomain) {
      statusElements.push(`📍 ${serviceStatuses.zendeskDomain}`);
    }

    return this.addContext(statusElements);
  }

  /**
   * Add TaskGenie branding footer
   */
  addBrandingFooter(): SlackNotificationBuilder {
    return this.addContext([
      `${SlackEmojis.getAgentEmoji('ai')} Powered by TaskGenie • ${SlackConstants.VERSION}`
    ]);
  }

  /**
   * Add help instructions
   */
  addHelpInstructions(): SlackNotificationBuilder {
    return this.addSection(
      'Need help? Just mention @TaskGenie followed by your question or type `@TaskGenie help` for available commands! 🤖'
    );
  }

  /**
   * Build the final Slack message
   */
  build(): SlackMessage {
    const message: SlackMessage = {
      channel: this.channel || '',
      text: this.text || 'TaskGenie Notification',
      blocks: this.blocks,
      user: 'taskgenie-bot',
      ts: Date.now().toString()
    };

    if (this.threadTs) {
      message.thread_ts = this.threadTs;
    }

    return message;
  }

  /**
   * Get the current blocks array
   */
  getBlocks(): SlackBlockType[] {
    return [...this.blocks];
  }

  /**
   * Get the current channel
   */
  getChannel(): string {
    return this.channel;
  }

  /**
   * Check if the builder has any content
   */
  hasContent(): boolean {
    return this.blocks.length > 0 || this.text.length > 0;
  }
}