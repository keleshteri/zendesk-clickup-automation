/**
 * @ai-metadata
 * @component: SlackUtilities
 * @description: Additional utility functions for Slack integration that don't fit in other modules
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-utilities.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-constants.ts"]
 * @tests: ["./tests/slack-utilities.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Utility functions for ticket extraction, team mapping, and message blocks - supplements the main formatter classes"
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
 *   - require-dev-approval-for: ["team-mapping-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { SlackConstants } from './slack-constants';
import { SlackEmojis } from './slack-emojis';

/**
 * Additional utility functions for Slack integration
 * Contains functions that don't fit in the main formatter classes
 */
export class SlackUtilities {
  /**
   * Extract ticket ID from text using various patterns
   */
  static extractTicketId(text: string): string | null {
    if (!text) return null;
    
    // Common ticket ID patterns
    const patterns = [
      /(?:ticket|#)\s*(\d+)/i,           // "ticket 123" or "#123"
      /\b(\d{4,})\b/,                   // 4+ digit numbers
      /[A-Z]{2,}-\d+/i,                 // "ABC-123" format
      /\[(\d+)\]/,                      // "[123]" format
      /ID[:\s]*(\d+)/i                  // "ID: 123" format
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return null;
  }

  /**
   * Get appropriate Slack channel for a team based on environment
   */
  static getTeamChannel(team: string, env: any): string {
    // Default channels by environment
    const defaultChannels = {
      production: SlackConstants.DEFAULTS.CHANNEL,
      staging: 'testing',
      development: 'testing'
    };

    // Team-specific channel mappings
    const teamChannels: Record<string, Record<string, string>> = {
      'support': {
        production: '#support-team',
        staging: '#support-staging',
        development: '#support-dev'
      },
      'engineering': {
        production: '#engineering',
        staging: '#eng-staging', 
        development: '#eng-dev'
      },
      'product': {
        production: '#product-team',
        staging: '#product-staging',
        development: '#product-dev'
      },
      'qa': {
        production: '#qa-team',
        staging: '#qa-staging',
        development: '#qa-dev'
      },
      'devops': {
        production: '#devops',
        staging: '#devops-staging',
        development: '#devops-dev'
      }
    };

    const environment = env?.ENVIRONMENT || 'development';
    const normalizedTeam = team?.toLowerCase() || 'general';
    
    // Return team-specific channel or default
    return teamChannels[normalizedTeam]?.[environment] || 
           defaultChannels[environment as keyof typeof defaultChannels] || 
           SlackConstants.DEFAULTS.CHANNEL;
  }

  /**
   * Format AI provider name with appropriate styling
   */
  static formatAIProvider(provider?: string): string {
    if (!provider) return 'Unknown Provider';
    
    const providerMap: Record<string, string> = {
      'openai': '🤖 OpenAI',
      'anthropic': '🧠 Anthropic',
      'claude': '🧠 Claude',
      'gpt': '🤖 GPT',
      'gemini': '💎 Gemini',
      'palm': '🌴 PaLM',
      'cohere': '🔮 Cohere',
      'huggingface': '🤗 Hugging Face'
    };
    
    const normalized = provider.toLowerCase();
    return providerMap[normalized] || `🤖 ${provider}`;
  }

  /**
   * Format service status with appropriate emoji and text
   */
  static formatServiceStatus(isOnline: boolean): string {
    return isOnline ? '🟢 Online' : '🔴 Offline';
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
   * Create loading message block
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
   * Create divider block
   */
  static createDivider(): any {
    return {
      type: 'divider'
    };
  }

  /**
   * Create fields section block
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
   * Escape Slack markdown characters
   */
  static escapeSlackMarkdown(text: string): string {
    if (!text) return '';
    
    // Escape special Slack markdown characters
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/~/g, '\\~');
  }
}