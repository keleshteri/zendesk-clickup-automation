/**
 * @ai-metadata
 * @component: SlackFormatters
 * @description: Comprehensive utility class for Slack text formatting, validation, and sanitization
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-formatters.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/slack-formatters.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core formatting utilities for all Slack message content - affects message appearance"
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
 *   - require-dev-approval-for: ["breaking-changes", "formatting-logic-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Utility class for Slack text formatting, validation, and sanitization
 * Provides consistent formatting across all Slack messages
 */
export class SlackFormatters {
  /**
   * Format text with Slack markdown
   */
  static bold(text: string): string {
    return `*${text}*`;
  }

  static italic(text: string): string {
    return `_${text}_`;
  }

  static code(text: string): string {
    return `\`${text}\``;
  }

  static codeBlock(text: string, language?: string): string {
    const lang = language ? language : '';
    return `\`\`\`${lang}\n${text}\n\`\`\``;
  }

  static strikethrough(text: string): string {
    return `~${text}~`;
  }

  static quote(text: string): string {
    return `> ${text}`;
  }

  /**
   * Format links
   */
  static link(url: string, text?: string): string {
    return text ? `<${url}|${text}>` : `<${url}>`;
  }

  static userMention(userId: string): string {
    return `<@${userId}>`;
  }

  static channelMention(channelId: string): string {
    return `<#${channelId}>`;
  }

  static userGroupMention(groupId: string): string {
    return `<!subteam^${groupId}>`;
  }

  /**
   * Format special mentions
   */
  static mentionEveryone(): string {
    return '<!everyone>';
  }

  static mentionChannel(): string {
    return '<!channel>';
  }

  static mentionHere(): string {
    return '<!here>';
  }

  /**
   * Format dates and times
   */
  static formatDate(date: Date, format?: string): string {
    const timestamp = Math.floor(date.getTime() / 1000);
    const formatStr = format || '{date_short}';
    return `<!date^${timestamp}^${formatStr}|${date.toLocaleDateString()}>`;
  }

  static formatDateTime(date: Date): string {
    const timestamp = Math.floor(date.getTime() / 1000);
    return `<!date^${timestamp}^{date_short} at {time}|${date.toLocaleString()}>`;
  }

  static formatRelativeTime(date: Date): string {
    const timestamp = Math.floor(date.getTime() / 1000);
    return `<!date^${timestamp}^{date_short_pretty}|${date.toLocaleDateString()}>`;
  }

  static formatTimestamp(date?: Date): string {
    const targetDate = date || new Date();
    return targetDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Text sanitization and validation
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      // Escape special Slack characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Remove or replace problematic characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
      .trim();
  }

  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static removeMarkdown(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*([^*]+)\*/g, '$1') // Bold
      .replace(/_([^_]+)_/g, '$1') // Italic
      .replace(/~([^~]+)~/g, '$1') // Strikethrough
      .replace(/`([^`]+)`/g, '$1') // Code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/> (.+)/g, '$1') // Quotes
      .replace(/<([^|>]+)\|([^>]+)>/g, '$2') // Links with text
      .replace(/<([^>]+)>/g, '$1'); // Simple links
  }

  /**
   * Validation methods
   */
  static isValidSlackId(id: string): boolean {
    // Slack IDs typically start with a letter and contain alphanumeric characters
    return /^[A-Z][A-Z0-9]{8,}$/.test(id);
  }

  static isValidUserId(userId: string): boolean {
    return /^U[A-Z0-9]{8,}$/.test(userId);
  }

  static isValidChannelId(channelId: string): boolean {
    return /^C[A-Z0-9]{8,}$/.test(channelId);
  }

  static isValidTeamId(teamId: string): boolean {
    return /^T[A-Z0-9]{8,}$/.test(teamId);
  }

  static isValidTimestamp(timestamp: string): boolean {
    return /^\d{10}\.\d{6}$/.test(timestamp);
  }

  /**
   * Message length validation
   */
  static validateMessageLength(text: string): { isValid: boolean; length: number; maxLength: number } {
    const maxLength = 4000; // Slack's message limit
    const length = text.length;
    
    return {
      isValid: length <= maxLength,
      length,
      maxLength
    };
  }

  /**
   * Format lists and tables
   */
  static formatList(items: string[], ordered: boolean = false): string {
    return items
      .map((item, index) => {
        const prefix = ordered ? `${index + 1}. ` : '• ';
        return `${prefix}${item}`;
      })
      .join('\n');
  }

  static formatTable(headers: string[], rows: string[][]): string {
    if (!headers.length || !rows.length) return '';
    
    // Calculate column widths
    const colWidths = headers.map((header, index) => {
      const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
      return Math.max(header.length, maxRowWidth);
    });
    
    // Format header
    const headerRow = headers
      .map((header, index) => header.padEnd(colWidths[index]))
      .join(' | ');
    
    const separator = colWidths
      .map(width => '-'.repeat(width))
      .join('-|-');
    
    // Format rows
    const dataRows = rows
      .map(row => 
        row.map((cell, index) => (cell || '').padEnd(colWidths[index]))
           .join(' | ')
      )
      .join('\n');
    
    return `\`\`\`\n${headerRow}\n${separator}\n${dataRows}\n\`\`\``;
  }

  /**
   * Format key-value pairs
   */
  static formatKeyValue(data: Record<string, any>, options?: {
    bold?: boolean;
    separator?: string;
    filter?: (key: string, value: any) => boolean;
  }): string {
    const { bold = true, separator = ': ', filter } = options || {};
    
    return Object.entries(data)
      .filter(([key, value]) => filter ? filter(key, value) : true)
      .map(([key, value]) => {
        const formattedKey = bold ? this.bold(key) : key;
        const formattedValue = value !== null && value !== undefined ? String(value) : 'N/A';
        return `${formattedKey}${separator}${formattedValue}`;
      })
      .join('\n');
  }

  /**
   * Format progress indicators
   */
  static formatProgressBar(progress: number, width: number = 10, filled: string = '█', empty: string = '░'): string {
    const filledWidth = Math.round(progress * width);
    const emptyWidth = width - filledWidth;
    
    return filled.repeat(filledWidth) + empty.repeat(emptyWidth);
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Format numbers and currencies
   */
  static formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat('en-US', options).format(num);
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format urgency level with appropriate styling
   */
  static formatUrgency(urgency: string): string {
    const urgencyMap: Record<string, string> = {
      'low': '🟢 Low',
      'normal': '🟡 Normal',
      'medium': '🟡 Medium',
      'high': '🟠 High',
      'urgent': '🔴 Urgent',
      'critical': '🚨 Critical'
    };
    return urgencyMap[urgency.toLowerCase()] || `📋 ${urgency}`;
  }

  /**
   * Format category with appropriate emoji
   */
  static formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'technical': '🔧 Technical',
      'billing': '💳 Billing',
      'general': '📋 General',
      'account': '👤 Account',
      'bug': '🐛 Bug Report',
      'feature': '✨ Feature Request',
      'support': '🆘 Support',
      'integration': '🔗 Integration'
    };
    return categoryMap[category.toLowerCase()] || `📂 ${category}`;
  }

  /**
   * Format sentiment with appropriate emoji
   */
  static formatSentiment(sentiment: string): string {
    const sentimentMap: Record<string, string> = {
      'positive': '😊 Positive',
      'happy': '😊 Happy',
      'satisfied': '😊 Satisfied',
      'neutral': '😐 Neutral',
      'negative': '😞 Negative',
      'frustrated': '😤 Frustrated',
      'angry': '😠 Angry',
      'upset': '😔 Upset'
    };
    return sentimentMap[sentiment.toLowerCase()] || `💭 ${sentiment}`;
  }

  /**
   * Format durations
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format file sizes
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format error messages
   */
  static formatError(error: Error | string, includeStack: boolean = false): string {
    if (typeof error === 'string') {
      return this.code(error);
    }
    
    let formatted = `${this.bold('Error:')} ${error.message}`;
    
    if (includeStack && error.stack) {
      formatted += `\n${this.codeBlock(error.stack)}`;
    }
    
    return formatted;
  }

  /**
   * Format JSON data
   */
  static formatJson(data: any, pretty: boolean = true): string {
    try {
      const jsonString = pretty 
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
      
      return this.codeBlock(jsonString, 'json');
    } catch (error) {
      return this.formatError('Invalid JSON data');
    }
  }

  /**
   * Format status indicators
   */
  static formatStatus(status: string, emoji?: string): string {
    const statusText = status.toUpperCase();
    return emoji ? `${emoji} ${this.bold(statusText)}` : this.bold(statusText);
  }

  /**
   * Format badges
   */
  static formatBadge(text: string, color?: 'success' | 'warning' | 'error' | 'info'): string {
    const colorEmojis = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };
    
    const emoji = color ? colorEmojis[color] : '';
    return emoji ? `${emoji} ${this.bold(text)}` : this.bold(text);
  }

  /**
   * Create TaskGenie footer with token usage and AI provider info
   */
  static createTaskGenieFooter(tokenUsage?: any, aiProvider?: string): string {
    let footerText = `🤖 TaskGenie`;
    
    if (tokenUsage) {
      footerText += ` | Tokens: ${tokenUsage.total || 0}`;
    }
    
    if (aiProvider) {
      footerText += ` | ${aiProvider}`;
    }
    
    footerText += ` | ${this.formatTimestamp()}`;
    
    return footerText;
  }

  /**
   * Create a header block for Slack messages
   */
  static createHeader(text: string) {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: text
      }
    };
  }

  /**
   * Create a context footer block with AI availability status
   */
  static createContextFooter(aiAvailable: boolean) {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: aiAvailable ? '✅ AI Service Available' : '❌ AI Service Unavailable'
        }
      ]
    };
  }

  /**
   * Create a branding footer block
   */
  static createBrandingFooter() {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🤖 *TaskGenie* - Your AI-powered Zendesk & ClickUp assistant'
        }
      ]
    };
  }

  /**
   * Create a service status footer block
   */
  static createServiceStatusFooter(serviceStatuses: {
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }) {
    const statusElements = [
      `${serviceStatuses.zendesk ? '🟢' : '🔴'} Zendesk`,
      `${serviceStatuses.clickup ? '🟢' : '🔴'} ClickUp`,
      `${serviceStatuses.ai ? '🟢' : '🔴'} AI Assistant`
    ];

    if (serviceStatuses.zendeskDomain) {
      statusElements[0] += ` (${serviceStatuses.zendeskDomain})`;
    }

    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: statusElements.join(' | ')
        }
      ]
    };
  }

  /**
   * Format token usage information
   */
  static formatTokenUsage(tokenUsage: any): string {
    if (!tokenUsage) return 'N/A';
    
    const total = tokenUsage.total || 0;
    const input = tokenUsage.input || 0;
    const output = tokenUsage.output || 0;
    
    return `${total} (${input}+${output})`;
  }
}