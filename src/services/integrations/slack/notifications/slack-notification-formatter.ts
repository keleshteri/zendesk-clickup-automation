/**
 * @ai-metadata
 * @component: SlackNotificationFormatter
 * @description: Provides pre-built notification templates for common use cases and message formatting
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-notification-formatter.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "formatTaskCreationNotification": "allow", "formatErrorNotification": "allow", "formatSuccessNotification": "allow" }
 * @dependencies: ["../../../../types/index.ts", "./slack-notification-builder.ts", "../utils/slack-emojis.ts", "../utils/slack-formatters.ts"]
 * @tests: ["./tests/slack-notification-formatter.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Template-based notification formatter for common Slack message patterns. Critical for consistent user experience."
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
import { SlackNotificationBuilder } from './slack-notification-builder';
import { SlackEmojis } from '../utils/slack-emojis';
import { SlackFormatters } from '../utils/slack-formatters';

/**
 * Provides pre-built notification templates for common use cases
 */
export class SlackNotificationFormatter {
  private builder: SlackNotificationBuilder;

  constructor() {
    this.builder = new SlackNotificationBuilder();
  }

  /**
   * Format task creation notification
   */
  formatTaskCreationNotification(
    channel: string,
    ticketId: string,
    ticketUrl: string,
    clickupTaskUrl: string,
    assigneeName?: string
  ): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setText('🧞 TaskGenie - Task Created')
      .addTaskGenieHeader('Task Created Successfully!')
      .addSection('Hi @here! 👋\n\nI\'ve created a task for this Zendesk ticket.')
      .addTicketInfo(ticketId, ticketUrl)
      .addTaskInfo(clickupTaskUrl, assigneeName)
      .addHelpInstructions()
      .addBrandingFooter()
      .build();
  }

  /**
   * Format TaskGenie introduction message
   */
  formatIntroductionMessage(
    channel: string,
    serviceStatuses: {
      zendesk: boolean;
      clickup: boolean;
      ai: boolean;
      zendeskDomain?: string;
    }
  ): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setText('🧞 TaskGenie has joined the channel!')
      .addTaskGenieHeader('TaskGenie has joined!')
      .addSection('Hi everyone! 👋\n\nI\'m *TaskGenie*, your AI-powered task automation assistant. I\'m here to help streamline your workflow between Zendesk and ClickUp!')
      .addSection('*🎯 What I can do for you:*\n• 🎫 Automatically create ClickUp tasks from Zendesk tickets\n• 📋 Provide AI-powered ticket summaries and analysis\n• 📊 Generate insights and analytics reports\n• 🔍 Help you search and find tickets\n• 🤖 Answer questions about your tickets and tasks\n• 🔗 Keep everything connected with smart automation')
      .addSection('*💬 How to interact with me:*\n• Mention me with `@TaskGenie` followed by your question\n• Ask for help: `@TaskGenie help`\n• List open tickets: `@TaskGenie list tickets`\n• Get ticket summaries: `@TaskGenie summarize ticket #27`\n• Check status: `@TaskGenie status ticket #27`\n• Get analytics: `@TaskGenie analytics`')
      .addSection('🚀 *Ready to boost your productivity?* Just mention @TaskGenie and I\'ll assist!')
      .addServiceStatusFooter(serviceStatuses)
      .addBrandingFooter()
      .build();
  }

  /**
   * Format user welcome message
   */
  formatUserWelcomeMessage(
    channel: string,
    user: string,
    serviceStatuses: {
      zendesk: boolean;
      clickup: boolean;
      ai: boolean;
      zendeskDomain?: string;
    }
  ): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setText('🧞 Welcome to TaskGenie!')
      .addTaskGenieHeader('Welcome to TaskGenie!')
      .addSection(`Welcome <@${user}>! 👋\n\nI\'m *TaskGenie*, your AI-powered assistant for Zendesk and ClickUp integration.`)
      .addSection('*🚀 Quick Start:*\n• Mention me with `@TaskGenie help` to see all commands\n• Ask me to summarize tickets or create tasks\n• I can provide AI insights and analytics\n• Just ask me questions in natural language!')
      .addServiceStatusFooter(serviceStatuses)
      .addBrandingFooter()
      .build();
  }

  /**
   * Format help message
   */
  formatHelpMessage(channel: string, isAiAvailable: boolean): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setText('🧞 TaskGenie Help')
      .addTaskGenieHeader('Available Commands')
      .addSection('*📋 Ticket Management:*\n• `@TaskGenie list tickets` - Show open tickets\n• `@TaskGenie summarize ticket #123` - Get ticket summary\n• `@TaskGenie analyze ticket #123` - Deep ticket analysis\n• `@TaskGenie status ticket #123` - Check ticket status')
      .addSection('*📊 Analytics & Insights:*\n• `@TaskGenie analytics` - Generate reports\n• `@TaskGenie insights` - Get AI insights')
      .addSection('*🔧 Task Management:*\n• `@TaskGenie create task from ticket #123` - Create ClickUp task')
      .addSection('*❓ General:*\n• `@TaskGenie help` - Show this help message\n• `@TaskGenie status` - Check system status')
      .addSection('*💡 Tips:*\n• You can use `/` or `#` prefixes: `/help`, `#analyze`\n• Ask natural questions: "What\'s the status of ticket 123?"\n• I understand context in threads!')
      .addContext([isAiAvailable ? '🤖 AI Assistant: Available' : '🤖 AI Assistant: Unavailable'])
      .addBrandingFooter()
      .build();
  }

  /**
   * Format command help message
   */
  formatCommandHelpMessage(channel: string, threadTs: string, isAiAvailable: boolean): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setThreadTs(threadTs)
      .setText('🧞 TaskGenie Commands')
      .addTaskGenieHeader('Available Commands')
      .addSection('*Command Formats:*\n\n*Slash Commands:*\n• `/help` - Show help\n• `/status` - System status\n• `/analyze ticket 123` - Analyze ticket\n• `/summarize ticket 123` - Summarize ticket\n• `/list tickets` - List tickets\n• `/analytics` - Generate analytics\n• `/create task from ticket 123` - Create task')
      .addSection('*Hashtag Commands:*\n• `#help` - Show help\n• `#status` - System status\n• `#analyze ticket 123` - Analyze ticket')
      .addSection('*Natural Language:*\n• "What\'s the status of ticket 123?"\n• "Summarize ticket 456"\n• "Create a task for ticket 789"')
      .addContext([isAiAvailable ? '🤖 AI Assistant: Available' : '🤖 AI Assistant: Unavailable'])
      .build();
  }

  /**
   * Format intelligent notification
   */
  formatIntelligentNotification(
    channel: string,
    ticketData: {
      id: string;
      url: string;
      subject: string;
      priority: string;
      status: string;
      requester: string;
      assignee?: string;
      tags?: string[];
    },
    aiInsights?: {
      summary: string;
      urgency: string;
      category: string;
      sentiment: string;
      suggestedActions: string[];
    }
  ): SlackMessage {
    this.builder
      .reset()
      .setChannel(channel)
      .setText(`${SlackEmojis.getUrgencyEmoji('neutral', ticketData.priority)} New Ticket Alert`)
      .addTaskGenieHeader('Intelligent Ticket Alert')
      .addSection(`${SlackEmojis.getUrgencyEmoji('neutral', ticketData.priority)} **New ticket requires attention**\n\n*Subject:* ${ticketData.subject}\n*Requester:* ${ticketData.requester}`);

    // Add ticket information
    this.builder.addTicketInfo(ticketData.id, ticketData.url, ticketData.status, ticketData.priority);

    // Add AI insights if available
    if (aiInsights) {
      this.builder
        .addDivider()
        .addSection(`🤖 **AI Analysis:**\n${aiInsights.summary}`)
        .addFieldsSection([
          { title: 'Urgency', value: SlackFormatters.formatUrgency(aiInsights.urgency) },
          { title: 'Category', value: SlackFormatters.formatCategory(aiInsights.category) },
          { title: 'Sentiment', value: SlackFormatters.formatSentiment(aiInsights.sentiment) }
        ]);

      if (aiInsights.suggestedActions.length > 0) {
        this.builder.addSection(`💡 **Suggested Actions:**\n${aiInsights.suggestedActions.map(action => `• ${action}`).join('\n')}`);
      }
    }

    // Add action buttons
    this.builder.addActions([
      {
        text: '📋 Create Task',
        value: `create_task_${ticketData.id}`,
        style: 'primary'
      },
      {
        text: '🔍 View Ticket',
        value: `view_ticket_${ticketData.id}`,
        url: ticketData.url
      },
      {
        text: '📊 Analyze',
        value: `analyze_ticket_${ticketData.id}`
      }
    ]);

    return this.builder.addBrandingFooter().build();
  }

  /**
   * Format daily insights notification
   */
  formatDailyInsights(
    channel: string,
    insights: {
      totalTickets: number;
      openTickets: number;
      resolvedTickets: number;
      avgResponseTime: string;
      topCategories: Array<{ name: string; count: number }>;
      urgentTickets: number;
    }
  ): SlackMessage {
    this.builder
      .reset()
      .setChannel(channel)
      .setText('📊 Daily Insights Report')
      .addTaskGenieHeader('Daily Insights Report')
      .addSection(`📈 **Today's Performance Overview**\n\nHere's your daily summary of ticket activity and key metrics.`);

    // Add metrics
    this.builder.addFieldsSection([
      { title: 'Total Tickets', value: insights.totalTickets.toString() },
      { title: 'Open Tickets', value: insights.openTickets.toString() },
      { title: 'Resolved Today', value: insights.resolvedTickets.toString() },
      { title: 'Avg Response Time', value: insights.avgResponseTime },
      { title: 'Urgent Tickets', value: `${insights.urgentTickets} ${SlackEmojis.getUrgencyEmoji('neutral', 'high')}` }
    ]);

    // Add top categories
    if (insights.topCategories.length > 0) {
      const categoriesText = insights.topCategories
        .map(cat => `• ${cat.name}: ${cat.count} tickets`)
        .join('\n');
      this.builder.addSection(`📋 **Top Categories:**\n${categoriesText}`);
    }

    return this.builder
      .addSection('💡 *Need detailed analytics? Ask me for `@TaskGenie analytics` for comprehensive reports!*')
      .addBrandingFooter()
      .build();
  }

  /**
   * Format error notification
   */
  formatErrorNotification(
    channel: string,
    error: {
      title: string;
      message: string;
      details?: string;
      timestamp: string;
    },
    threadTs?: string
  ): SlackMessage {
    this.builder
      .reset()
      .setChannel(channel)
      .setText(`❌ Error: ${error.title}`)
      .addSection(`❌ **Error Occurred**\n\n*${error.title}*\n${error.message}`);

    if (threadTs) {
      this.builder.setThreadTs(threadTs);
    }

    if (error.details) {
      this.builder.addSection(`🔍 **Details:**\n\`\`\`${error.details}\`\`\``);
    }

    return this.builder
      .addContext([`⏰ ${error.timestamp}`])
      .build();
  }

  /**
   * Format success notification
   */
  formatSuccessNotification(
    channel: string,
    success: {
      title: string;
      message: string;
      details?: string;
    },
    threadTs?: string
  ): SlackMessage {
    this.builder
      .reset()
      .setChannel(channel)
      .setText(`✅ ${success.title}`)
      .addSection(`✅ **${success.title}**\n\n${success.message}`);

    if (threadTs) {
      this.builder.setThreadTs(threadTs);
    }

    if (success.details) {
      this.builder.addSection(`📋 **Details:**\n${success.details}`);
    }

    return this.builder.addBrandingFooter().build();
  }

  /**
   * Format system status notification
   */
  formatSystemStatusNotification(
    channel: string,
    serviceStatuses: {
      zendesk: boolean;
      clickup: boolean;
      ai: boolean;
      zendeskDomain?: string;
    }
  ): SlackMessage {
    return this.builder
      .reset()
      .setChannel(channel)
      .setText('🔧 System Status')
      .addTaskGenieHeader('System Status')
      .addSection('📊 **Current Service Status:**')
      .addServiceStatusFooter(serviceStatuses)
      .addBrandingFooter()
      .build();
  }
}