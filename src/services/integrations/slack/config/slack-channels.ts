/**
 * @ai-metadata
 * @component: SlackChannels
 * @description: Channel configuration and routing management for Slack notifications and workflows
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-channels.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "getChannelConfig": "read-only", "getChannelId": "read-only", "getTeamChannels": "read-only", "getChannelForMessage": "read-only", "isMessageTypeAllowed": "read-only", "validateChannelConfig": "allow" }
 * @dependencies: ["../utils/slack-constants.ts"]
 * @tests: ["./tests/slack-channels.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Critical channel routing configuration that determines where different types of notifications are sent. Changes here affect message delivery across the entire Slack integration."
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

import { SlackConstants } from '../utils/slack-constants';

/**
 * Channel configuration for different types of notifications and workflows
 */
export interface ChannelConfig {
  id: string;
  name: string;
  purpose: string;
  isPrivate: boolean;
  allowedMessageTypes: string[];
  defaultThreading: boolean;
  notificationLevel: 'all' | 'mentions' | 'none';
  retentionDays?: number;
}

/**
 * Channel mapping for different workflow types
 */
export interface ChannelMapping {
  ticketCreated: string;
  ticketUpdated: string;
  ticketAssigned: string;
  ticketResolved: string;
  taskCreated: string;
  taskUpdated: string;
  taskCompleted: string;
  systemAlerts: string;
  errors: string;
  general: string;
  aiInsights: string;
  dailyReports: string;
  userWelcome: string;
  help: string;
  announcements: string;
}

/**
 * Team-specific channel configurations
 */
export interface TeamChannels {
  support: ChannelMapping;
  development: ChannelMapping;
  management: ChannelMapping;
  qa: ChannelMapping;
  sales: ChannelMapping;
}

/**
 * Main Slack channels configuration class
 */
export class SlackChannels {
  /**
   * Default channel configurations
   */
  /**
   * Default Slack channel configurations for the automation system.
   * 
   * This configuration serves multiple purposes:
   * - **Type Safety**: Defines the structure and properties for channel configurations
   * - **Documentation**: Shows available channel types and their intended purposes
   * - **Future Flexibility**: Ready for scaling to dedicated channels when needed
   * - **Fallback Configuration**: Provides default settings for channel validation
   * 
   * **Current Usage:**
   * - These are NOT actively used for message routing (environment variables take precedence)
   * - Used for type definitions, validation, and as templates for future channel creation
   * - The actual channels used are defined in .env file (currently all point to #zendesk-clickup-automation)
   * 
   * **Channel Categories:**
   * - Support Team: ticket handling, urgent issues, resolved tickets
   * - Development Team: tasks, deployments, code-related notifications
   * - System Monitoring: alerts, AI insights, system health
   * - General Communication: announcements, help, daily reports
   * 
   * **Properties Explained:**
   * - `id`: Slack channel ID (placeholder values, replace with real IDs when creating channels)
   * - `name`: Channel name without # prefix
   * - `purpose`: Description of channel's intended use
   * - `isPrivate`: Whether channel is private (false = public)
   * - `allowedMessageTypes`: Array of message types that can be sent to this channel
   * - `defaultThreading`: Whether messages should be threaded by default
   * - `notificationLevel`: 'all' (notify everyone) or 'mentions' (only @mentions)
   * - `retentionDays`: Optional message retention period in days
   * 
   * @example
   * ```typescript
   * // Get channel configuration
   * const config = SlackChannels.getChannelConfig('support-tickets');
   * 
   * // Validate channel setup
   * const isValid = SlackChannels.validateChannelConfig(config);
   * 
   * // Get channel ID for messaging
   * const channelId = SlackChannels.getChannelId('dev-tasks');
   * ```
   * 
   * @see {@link ChannelConfig} for detailed property definitions
   * @see {@link SlackService.getTeamChannel} for actual channel resolution logic
   * @see .env file for current active channel mappings
   */
  static readonly DEFAULT_CHANNELS: Record<string, ChannelConfig> = {
    // Support Team Channels
    'support-tickets': {
      id: 'C01234567890',
      name: 'support-tickets',
      purpose: 'New and updated support tickets',
      isPrivate: false,
      allowedMessageTypes: ['ticket_created', 'ticket_updated', 'ticket_assigned'],
      defaultThreading: true,
      notificationLevel: 'all',
      retentionDays: 90
    },
    'support-urgent': {
      id: 'C01234567891',
      name: 'support-urgent',
      purpose: 'Urgent and high-priority tickets',
      isPrivate: false,
      allowedMessageTypes: ['ticket_created', 'ticket_escalated'],
      defaultThreading: false,
      notificationLevel: 'all'
    },
    'support-resolved': {
      id: 'C01234567892',
      name: 'support-resolved',
      purpose: 'Resolved and closed tickets',
      isPrivate: false,
      allowedMessageTypes: ['ticket_resolved', 'ticket_closed'],
      defaultThreading: true,
      notificationLevel: 'mentions',
      retentionDays: 30
    },

    // Development Team Channels
    'dev-tasks': {
      id: 'C01234567893',
      name: 'dev-tasks',
      purpose: 'Development tasks and updates',
      isPrivate: false,
      allowedMessageTypes: ['task_created', 'task_updated', 'task_completed'],
      defaultThreading: true,
      notificationLevel: 'mentions'
    },
    'dev-deployments': {
      id: 'C01234567894',
      name: 'dev-deployments',
      purpose: 'Deployment notifications and status',
      isPrivate: false,
      allowedMessageTypes: ['deployment_started', 'deployment_completed', 'deployment_failed'],
      defaultThreading: false,
      notificationLevel: 'all'
    },

    // System and Monitoring Channels
    'system-alerts': {
      id: 'C01234567895',
      name: 'system-alerts',
      purpose: 'System alerts and monitoring',
      isPrivate: false,
      allowedMessageTypes: ['system_alert', 'system_error', 'system_recovery'],
      defaultThreading: false,
      notificationLevel: 'all'
    },
    'ai-insights': {
      id: 'C01234567896',
      name: 'ai-insights',
      purpose: 'AI analysis and insights',
      isPrivate: false,
      allowedMessageTypes: ['ai_analysis', 'ai_recommendation', 'ai_summary'],
      defaultThreading: true,
      notificationLevel: 'mentions'
    },

    // General and Communication Channels
    'general': {
      id: 'C01234567897',
      name: 'general',
      purpose: 'General team communication',
      isPrivate: false,
      allowedMessageTypes: ['announcement', 'general_message'],
      defaultThreading: false,
      notificationLevel: 'mentions'
    },
    'help': {
      id: 'C01234567898',
      name: 'help',
      purpose: 'Help and support requests',
      isPrivate: false,
      allowedMessageTypes: ['help_request', 'help_response'],
      defaultThreading: true,
      notificationLevel: 'all'
    },
    'daily-reports': {
      id: 'C01234567899',
      name: 'daily-reports',
      purpose: 'Daily summaries and reports',
      isPrivate: false,
      allowedMessageTypes: ['daily_summary', 'weekly_report'],
      defaultThreading: false,
      notificationLevel: 'mentions',
      retentionDays: 60
    }
  };

  /**
   * Team-specific channel mappings
   */
  static readonly TEAM_CHANNELS: TeamChannels = {
    support: {
      ticketCreated: 'support-tickets',
      ticketUpdated: 'support-tickets',
      ticketAssigned: 'support-tickets',
      ticketResolved: 'support-resolved',
      taskCreated: 'support-tickets',
      taskUpdated: 'support-tickets',
      taskCompleted: 'support-resolved',
      systemAlerts: 'system-alerts',
      errors: 'system-alerts',
      general: 'general',
      aiInsights: 'ai-insights',
      dailyReports: 'daily-reports',
      userWelcome: 'general',
      help: 'help',
      announcements: 'general'
    },
    development: {
      ticketCreated: 'dev-tasks',
      ticketUpdated: 'dev-tasks',
      ticketAssigned: 'dev-tasks',
      ticketResolved: 'dev-tasks',
      taskCreated: 'dev-tasks',
      taskUpdated: 'dev-tasks',
      taskCompleted: 'dev-tasks',
      systemAlerts: 'system-alerts',
      errors: 'system-alerts',
      general: 'general',
      aiInsights: 'ai-insights',
      dailyReports: 'daily-reports',
      userWelcome: 'general',
      help: 'help',
      announcements: 'general'
    },
    management: {
      ticketCreated: 'daily-reports',
      ticketUpdated: 'support-urgent',
      ticketAssigned: 'support-tickets',
      ticketResolved: 'daily-reports',
      taskCreated: 'daily-reports',
      taskUpdated: 'dev-tasks',
      taskCompleted: 'daily-reports',
      systemAlerts: 'system-alerts',
      errors: 'system-alerts',
      general: 'general',
      aiInsights: 'ai-insights',
      dailyReports: 'daily-reports',
      userWelcome: 'general',
      help: 'help',
      announcements: 'general'
    },
    qa: {
      ticketCreated: 'support-tickets',
      ticketUpdated: 'support-tickets',
      ticketAssigned: 'support-tickets',
      ticketResolved: 'support-resolved',
      taskCreated: 'dev-tasks',
      taskUpdated: 'dev-tasks',
      taskCompleted: 'dev-tasks',
      systemAlerts: 'system-alerts',
      errors: 'system-alerts',
      general: 'general',
      aiInsights: 'ai-insights',
      dailyReports: 'daily-reports',
      userWelcome: 'general',
      help: 'help',
      announcements: 'general'
    },
    sales: {
      ticketCreated: 'support-tickets',
      ticketUpdated: 'support-tickets',
      ticketAssigned: 'support-tickets',
      ticketResolved: 'support-resolved',
      taskCreated: 'general',
      taskUpdated: 'general',
      taskCompleted: 'general',
      systemAlerts: 'system-alerts',
      errors: 'system-alerts',
      general: 'general',
      aiInsights: 'ai-insights',
      dailyReports: 'daily-reports',
      userWelcome: 'general',
      help: 'help',
      announcements: 'general'
    }
  };

  /**
   * Get channel configuration by name
   */
  static getChannelConfig(channelName: string): ChannelConfig | null {
    return this.DEFAULT_CHANNELS[channelName] || null;
  }

  /**
   * Get channel ID by name
   */
  static getChannelId(channelName: string): string | null {
    const config = this.getChannelConfig(channelName);
    return config?.id || null;
  }

  /**
   * Get channels for a specific team
   */
  static getTeamChannels(team: keyof TeamChannels): ChannelMapping {
    return this.TEAM_CHANNELS[team];
  }

  /**
   * Get appropriate channel for a message type and team
   */
  static getChannelForMessage(
    messageType: keyof ChannelMapping,
    team: keyof TeamChannels = 'support'
  ): string {
    const teamChannels = this.getTeamChannels(team);
    return teamChannels[messageType] || teamChannels.general;
  }

  /**
   * Check if a message type is allowed in a channel
   */
  static isMessageTypeAllowed(channelName: string, messageType: string): boolean {
    const config = this.getChannelConfig(channelName);
    if (!config) return false;
    return config.allowedMessageTypes.includes(messageType);
  }

  /**
   * Get all channels that allow a specific message type
   */
  static getChannelsForMessageType(messageType: string): string[] {
    return Object.entries(this.DEFAULT_CHANNELS)
      .filter(([_, config]) => config.allowedMessageTypes.includes(messageType))
      .map(([name, _]) => name);
  }

  /**
   * Check if threading is enabled for a channel
   */
  static isThreadingEnabled(channelName: string): boolean {
    const config = this.getChannelConfig(channelName);
    return config?.defaultThreading || false;
  }

  /**
   * Get notification level for a channel
   */
  static getNotificationLevel(channelName: string): 'all' | 'mentions' | 'none' {
    const config = this.getChannelConfig(channelName);
    return config?.notificationLevel || 'mentions';
  }

  /**
   * Get all public channels
   */
  static getPublicChannels(): string[] {
    return Object.entries(this.DEFAULT_CHANNELS)
      .filter(([_, config]) => !config.isPrivate)
      .map(([name, _]) => name);
  }

  /**
   * Get all private channels
   */
  static getPrivateChannels(): string[] {
    return Object.entries(this.DEFAULT_CHANNELS)
      .filter(([_, config]) => config.isPrivate)
      .map(([name, _]) => name);
  }

  /**
   * Validate channel configuration
   */
  static validateChannelConfig(config: ChannelConfig): boolean {
    return !!(
      config.id &&
      config.name &&
      config.purpose &&
      Array.isArray(config.allowedMessageTypes) &&
      typeof config.defaultThreading === 'boolean' &&
      ['all', 'mentions', 'none'].includes(config.notificationLevel)
    );
  }

  /**
   * Get channels with retention policies
   */
  static getChannelsWithRetention(): Record<string, number> {
    const result: Record<string, number> = {};
    Object.entries(this.DEFAULT_CHANNELS).forEach(([name, config]) => {
      if (config.retentionDays) {
        result[name] = config.retentionDays;
      }
    });
    return result;
  }
}