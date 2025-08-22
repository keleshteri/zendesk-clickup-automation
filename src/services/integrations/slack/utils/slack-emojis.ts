/**
 * @ai-metadata
 * @component: SlackEmojis
 * @description: Centralized emoji mapping for consistent Slack message formatting with semantic selection
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-emojis.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/slack-emojis.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Emoji utility class for contextual emoji selection in Slack messages"
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
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Centralized emoji mapping for consistent Slack message formatting
 * Provides semantic emoji selection based on context
 */
export class SlackEmojis {
  /**
   * Get urgency emoji based on sentiment and priority
   */
  static getUrgencyEmoji(sentiment: string, priority: string): string {
    // High priority overrides sentiment
    if (priority === 'urgent') return '🚨';
    if (priority === 'high') return '⚡';
    
    // Sentiment-based for normal/low priority
    switch (sentiment.toLowerCase()) {
      case 'negative':
      case 'angry':
      case 'frustrated':
        return '😰';
      case 'positive':
      case 'happy':
      case 'satisfied':
        return '😊';
      case 'neutral':
      default:
        return priority === 'low' ? '🟢' : '📋';
    }
  }

  /**
   * Get category emoji for ticket classification
   */
  static getCategoryEmoji(category: string): string {
    const categoryMap: Record<string, string> = {
      // Technical categories
      'technical': '🔧',
      'bug': '🐛',
      'feature': '✨',
      'integration': '🔗',
      'api': '⚙️',
      'performance': '⚡',
      'security': '🔒',
      'database': '🗄️',
      'infrastructure': '🏗️',
      'deployment': '🚀',
      
      // Business categories
      'billing': '💳',
      'account': '👤',
      'subscription': '📋',
      'payment': '💰',
      'invoice': '🧾',
      'refund': '💸',
      
      // Support categories
      'support': '🎧',
      'question': '❓',
      'help': '🆘',
      'training': '📚',
      'documentation': '📖',
      'tutorial': '🎯',
      
      // Product categories
      'product': '📦',
      'feedback': '💭',
      'suggestion': '💡',
      'enhancement': '⬆️',
      'ui': '🎨',
      'ux': '👥',
      
      // General categories
      'general': '📋',
      'other': '📄',
      'misc': '🔀',
      'unknown': '❔'
    };
    
    return categoryMap[category.toLowerCase()] || '📋';
  }

  /**
   * Get priority emoji
   */
  static getPriorityEmoji(priority: string): string {
    const priorityMap: Record<string, string> = {
      'urgent': '🚨',
      'high': '🔴',
      'medium': '🟡',
      'normal': '🟡',
      'low': '🟢'
    };
    
    return priorityMap[priority.toLowerCase()] || '🟡';
  }

  /**
   * Get agent type emoji
   */
  static getAgentEmoji(agentType: string): string {
    const agentMap: Record<string, string> = {
      'technical': '🔧',
      'customer-success': '🤝',
      'customer-support': '🎧',
      'product': '📦',
      'sales': '💼',
      'billing': '💳',
      'security': '🔒',
      'devops': '⚙️',
      'qa': '🧪',
      'design': '🎨',
      'marketing': '📢',
      'management': '👔',
      'ai': '🤖',
      'bot': '🤖'
    };
    
    return agentMap[agentType.toLowerCase()] || '🤖';
  }

  /**
   * Get status emoji for various states
   */
  static getStatusEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      // Task/Ticket statuses
      'new': '🆕',
      'open': '📂',
      'in-progress': '🔄',
      'pending': '⏳',
      'waiting': '⏸️',
      'blocked': '🚫',
      'resolved': '✅',
      'closed': '🔒',
      'cancelled': '❌',
      
      // Service statuses
      'online': '🟢',
      'offline': '🔴',
      'degraded': '🟡',
      'maintenance': '🔧',
      'error': '❌',
      'warning': '⚠️',
      'success': '✅',
      'info': 'ℹ️',
      
      // Workflow statuses
      'started': '▶️',
      'paused': '⏸️',
      'stopped': '⏹️',
      'completed': '🏁',
      'failed': '💥'
    };
    
    return statusMap[status.toLowerCase()] || '📋';
  }

  /**
   * Get service status emoji (boolean)
   */
  static getServiceStatusEmoji(isOnline: boolean): string {
    return isOnline ? '🟢' : '🔴';
  }

  /**
   * Get team emoji for different teams
   */
  static getTeamEmoji(team: string): string {
    const teamMap: Record<string, string> = {
      'engineering': '⚙️',
      'frontend': '🎨',
      'backend': '🔧',
      'devops': '🚀',
      'qa': '🧪',
      'design': '🎨',
      'product': '📦',
      'support': '🎧',
      'sales': '💼',
      'marketing': '📢',
      'billing': '💳',
      'security': '🔒',
      'data': '📊',
      'analytics': '📈',
      'mobile': '📱',
      'web': '🌐'
    };
    
    return teamMap[team.toLowerCase()] || '👥';
  }

  /**
   * Get action emoji for different actions
   */
  static getActionEmoji(action: string): string {
    const actionMap: Record<string, string> = {
      'create': '➕',
      'update': '✏️',
      'delete': '🗑️',
      'assign': '👤',
      'reassign': '🔄',
      'escalate': '⬆️',
      'resolve': '✅',
      'close': '🔒',
      'reopen': '🔓',
      'comment': '💬',
      'mention': '📢',
      'notify': '🔔',
      'remind': '⏰',
      'approve': '✅',
      'reject': '❌',
      'review': '👀',
      'test': '🧪',
      'deploy': '🚀',
      'rollback': '⏪'
    };
    
    return actionMap[action.toLowerCase()] || '🔄';
  }

  /**
   * Get alert emoji based on severity
   */
  static getAlertEmoji(severity: string): string {
    const severityMap: Record<string, string> = {
      'critical': '🚨',
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢',
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
      'success': '✅'
    };
    
    return severityMap[severity.toLowerCase()] || 'ℹ️';
  }

  /**
   * Get time-based emoji
   */
  static getTimeEmoji(timeContext: string): string {
    const timeMap: Record<string, string> = {
      'now': '🔥',
      'urgent': '⚡',
      'today': '📅',
      'tomorrow': '📆',
      'week': '📊',
      'month': '🗓️',
      'overdue': '🚨',
      'deadline': '⏰',
      'scheduled': '📋',
      'recurring': '🔄'
    };
    
    return timeMap[timeContext.toLowerCase()] || '⏰';
  }

  /**
   * Get integration emoji for different services
   */
  static getIntegrationEmoji(service: string): string {
    const serviceMap: Record<string, string> = {
      'zendesk': '🎧',
      'clickup': '📋',
      'slack': '💬',
      'github': '🐙',
      'jira': '🔷',
      'trello': '📌',
      'asana': '🔺',
      'notion': '📝',
      'discord': '🎮',
      'teams': '👥',
      'email': '📧',
      'sms': '📱',
      'webhook': '🔗',
      'api': '⚙️'
    };
    
    return serviceMap[service.toLowerCase()] || '🔗';
  }

  /**
   * Get confidence level emoji
   */
  static getConfidenceEmoji(confidence: number): string {
    if (confidence >= 0.9) return '🎯'; // Very high confidence
    if (confidence >= 0.8) return '✅'; // High confidence
    if (confidence >= 0.7) return '👍'; // Good confidence
    if (confidence >= 0.6) return '🤔'; // Medium confidence
    if (confidence >= 0.5) return '⚠️'; // Low confidence
    return '❓'; // Very low confidence
  }

  /**
   * Get progress emoji based on percentage
   */
  static getProgressEmoji(progress: number): string {
    if (progress >= 1.0) return '🏁'; // Complete
    if (progress >= 0.8) return '🔥'; // Almost done
    if (progress >= 0.6) return '⚡'; // Good progress
    if (progress >= 0.4) return '🔄'; // In progress
    if (progress >= 0.2) return '🚀'; // Getting started
    return '📋'; // Just started
  }

  /**
   * Get mood emoji for sentiment analysis
   */
  static getMoodEmoji(sentiment: string, intensity?: number): string {
    const baseEmojis: Record<string, string[]> = {
      'positive': ['🙂', '😊', '😄', '🤩'],
      'negative': ['😐', '😕', '😞', '😡'],
      'neutral': ['😐', '🤔', '😶', '😑']
    };
    
    const emojis = baseEmojis[sentiment.toLowerCase()] || baseEmojis['neutral'];
    const index = intensity ? Math.min(Math.floor(intensity * emojis.length), emojis.length - 1) : 0;
    
    return emojis[index];
  }
}