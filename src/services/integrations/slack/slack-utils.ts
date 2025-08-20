import { Env } from '../../../types/index.js';
import packageJson from '../../../../package.json';

export class SlackUtils {
  /**
   * Format service status indicators
   */
  static formatServiceStatus(isOnline: boolean): string {
    return isOnline ? '🟢' : '🔴';
  }

  /**
   * Format timestamp for Slack messages
   */
  static formatTimestamp(date?: Date): string {
    return (date || new Date()).toLocaleString();
  }

  /**
   * Create context footer for messages
   */
  static createContextFooter(aiAvailable: boolean): any {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${aiAvailable ? '🟢 AI Working' : '🔴 AI Offline'} | TaskGenie v${packageJson.version} | ${this.formatTimestamp()}`
        }
      ]
    };
  }

  /**
   * Create service status footer
   */
  static createServiceStatusFooter(serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }): any {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${this.formatServiceStatus(serviceStatuses.zendesk)} Zendesk${serviceStatuses.zendeskDomain ? ` (${serviceStatuses.zendeskDomain})` : ''} | ${this.formatServiceStatus(serviceStatuses.clickup)} ClickUp | ${this.formatServiceStatus(serviceStatuses.ai)} AI Provider`
        }
      ]
    };
  }

  /**
   * Create team branding footer
   */
  static createBrandingFooter(): any {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🤖 TaskGenie v${packageJson.version} • Made by 2DC Team • Powered by AI`
        }
      ]
    };
  }

  /**
   * Extract ticket ID from text
   */
  static extractTicketId(text: string): string | null {
    // Match patterns like "ticket 123", "#123", "ticket #123"
    const patterns = [
      /ticket\s*#?(\d+)/i,
      /#(\d+)/,
      /\b(\d{2,})\b/ // At least 2 digits
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Create error message block
   */
  static createErrorMessage(message: string): any {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ ${message}`
      }
    };
  }

  /**
   * Create success message block
   */
  static createSuccessMessage(message: string): any {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ ${message}`
      }
    };
  }

  /**
   * Create info message block
   */
  static createInfoMessage(message: string): any {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `ℹ️ ${message}`
      }
    };
  }

  /**
   * Create warning message block
   */
  static createWarningMessage(message: string): any {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `⚠️ ${message}`
      }
    };
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Escape special characters for Slack markdown
   */
  static escapeSlackMarkdown(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Create divider block
   */
  static createDivider(): any {
    return {
      type: 'divider'
    };
  }

  /**
   * Create header block
   */
  static createHeader(text: string): any {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: text
      }
    };
  }

  /**
   * Create section with fields
   */
  static createFieldsSection(fields: Array<{ title: string; value: string; short?: boolean }>): any {
    return {
      type: 'section',
      fields: fields.map(field => ({
        type: 'mrkdwn',
        text: `*${field.title}:*\n${field.value}`
      }))
    };
  }

  /**
   * Validate Slack channel ID format
   */
  static isValidChannelId(channelId: string): boolean {
    return /^[CD][A-Z0-9]{8,}$/.test(channelId);
  }

  /**
   * Validate Slack user ID format
   */
  static isValidUserId(userId: string): boolean {
    return /^[UW][A-Z0-9]{8,}$/.test(userId);
  }

  /**
   * Validate Slack timestamp format
   */
  static isValidTimestamp(timestamp: string): boolean {
    return /^\d{10}\.\d{6}$/.test(timestamp);
  }

  /**
   * Create loading message
   */
  static createLoadingMessage(action: string): any {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🔄 ${action}...`
      }
    };
  }

  /**
   * Format token usage information
   */
  static formatTokenUsage(tokenUsage?: { input_tokens: number; output_tokens: number; total_tokens: number }): string {
    if (!tokenUsage) return '';
    return `:moneybag: input tokens: ${tokenUsage.input_tokens} | output tokens: ${tokenUsage.output_tokens} | cost: $0.00000`;
  }

  /**
   * Create AI provider indicator
   */
  static formatAIProvider(provider?: string): string {
    if (!provider) return '';
    return `provider: ${provider}`;
  }

  /**
   * Create complete TaskGenie footer with version and token usage
   */
  static createTaskGenieFooter(tokenUsage?: { input_tokens: number; output_tokens: number; total_tokens: number }, provider?: string): string {
    if (!tokenUsage || !provider) {
      return `:robot_face: TaskGenie v${packageJson.version}`;
    }
    return `:robot_face: TaskGenie v${packageJson.version} :moneybag: input tokens: ${tokenUsage.input_tokens} | output tokens: ${tokenUsage.output_tokens} | cost: $0.00000 | provider: ${provider}`;
  }

  /**
   * Get emoji for ticket category
   */
  static getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'technical': '🔧',
      'billing': '💰',
      'general': '📝',
      'account': '👤',
      'bug': '🐛',
      'feature': '✨'
    };
    return emojiMap[category.toLowerCase()] || '📝';
  }

  /**
   * Get emoji for sentiment/urgency
   */
  static getUrgencyEmoji(sentiment: string, priority?: string): string {
    const s = (sentiment || '').trim().toLowerCase();
    const p = (priority || '').trim().toLowerCase();
    if (p === 'urgent' || s === 'angry') return '🚨';
    if (p === 'high' || s === 'frustrated') return '⚠️';
    if (s === 'happy') return '😊';
    return '📋';
  }

  /**
   * Get team channel based on team type
   */
  static getTeamChannel(team: string, env: Env): string {
    // Default to #zendesk-clickup-automation for all notifications
    const defaultChannel = '#zendesk-clickup-automation';
    const key = (team || '').trim().toLowerCase();
    
    const channelMap: Record<string, string> = {
      'development': env.SLACK_DEVELOPMENT_CHANNEL || defaultChannel,
      'support': env.SLACK_SUPPORT_CHANNEL || defaultChannel,
      'billing': env.SLACK_BILLING_CHANNEL || defaultChannel,
      'management': env.SLACK_MANAGEMENT_CHANNEL || defaultChannel
    };
    
    return channelMap[key] || env.SLACK_DEFAULT_CHANNEL || defaultChannel;
  }

  /**
   * Get alert emoji based on severity
   */
  static getAlertEmoji(severity: string): string {
    const level = (severity || '').trim().toLowerCase();
    const emojiMap: Record<string, string> = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojiMap[level] || '⚪';
  }
}