/**
 * @ai-metadata
 * @component: SlackEmojiService
 * @description: Centralized emoji management for Slack messages with categorization and priority indicators
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 */

/**
 * Service responsible for managing emojis used in Slack messages
 * Provides consistent emoji mapping for categories, priorities, and status indicators
 */
export class SlackEmojiService {
  /**
   * Initialize the Slack emoji service with predefined emoji mappings
   */
  constructor() {
    // Emoji mappings are initialized as readonly properties
  }
  private readonly categoryEmojis: Record<string, string> = {
    'technical': '⚙️',
    'bug': '🐛',
    'feature': '✨',
    'support': '🎧',
    'general': '📋',
    'security': '🔒',
    'performance': '⚡',
    'documentation': '📚',
    'testing': '🧪',
    'deployment': '🚀'
  };

  private readonly priorityEmojis: Record<string, string> = {
    'urgent': '🔴',
    'high': '🟠',
    'medium': '🟡',
    'low': '🟢',
    'critical': '🚨',
    'normal': '🔵'
  };

  private readonly statusEmojis: Record<string, string> = {
    'open': '🟢',
    'in_progress': '🟡',
    'pending': '🟠',
    'closed': '🔴',
    'resolved': '✅',
    'cancelled': '❌',
    'on_hold': '⏸️',
    'review': '👀',
    'testing': '🧪',
    'approved': '✅',
    'rejected': '❌'
  };

  private readonly actionEmojis: Record<string, string> = {
    'create': '➕',
    'update': '✏️',
    'delete': '🗑️',
    'assign': '👤',
    'comment': '💬',
    'attach': '📎',
    'link': '🔗',
    'merge': '🔀',
    'sync': '🔄',
    'export': '📤',
    'import': '📥',
    'backup': '💾',
    'restore': '♻️'
  };

  private readonly systemEmojis: Record<string, string> = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'loading': '⏳',
    'completed': '🎉',
    'notification': '🔔',
    'alert': '🚨',
    'maintenance': '🔧',
    'update': '🆙'
  };

  /**
   * Get emoji for a specific category
   * @param category - The category name (e.g., 'technical', 'bug', 'feature')
   * @returns The corresponding emoji or default emoji if category not found
   */
  getCategoryEmoji(category: string): string {
    const normalizedCategory = category.toLowerCase().trim();
    return this.categoryEmojis[normalizedCategory] || this.categoryEmojis['general'];
  }

  /**
   * Get emoji for a specific priority level
   * @param priority - The priority level (e.g., 'urgent', 'high', 'medium', 'low')
   * @returns The corresponding emoji or default emoji if priority not found
   */
  getPriorityEmoji(priority: string): string {
    const normalizedPriority = priority.toLowerCase().trim();
    return this.priorityEmojis[normalizedPriority] || this.priorityEmojis['medium'];
  }

  /**
   * Get emoji for a specific status
   * @param status - The status name (e.g., 'open', 'closed', 'in_progress')
   * @returns The corresponding emoji or default emoji if status not found
   */
  getStatusEmoji(status: string): string {
    const normalizedStatus = status.toLowerCase().trim().replace(/\s+/g, '_');
    return this.statusEmojis[normalizedStatus] || this.statusEmojis['open'];
  }

  /**
   * Get emoji for a specific action
   * @param action - The action name (e.g., 'create', 'update', 'delete')
   * @returns The corresponding emoji or default emoji if action not found
   */
  getActionEmoji(action: string): string {
    const normalizedAction = action.toLowerCase().trim();
    return this.actionEmojis[normalizedAction] || this.actionEmojis['update'];
  }

  /**
   * Get emoji for system message types
   * @param type - The system message type (e.g., 'success', 'error', 'warning')
   * @returns The corresponding emoji or default emoji if type not found
   */
  getSystemEmoji(type: string): string {
    const normalizedType = type.toLowerCase().trim();
    return this.systemEmojis[normalizedType] || this.systemEmojis['info'];
  }

  /**
   * Get all available category emojis
   * @returns Record of all category names and their corresponding emojis
   */
  getAllCategoryEmojis(): Record<string, string> {
    return { ...this.categoryEmojis };
  }

  /**
   * Get all available priority emojis
   * @returns Record of all priority levels and their corresponding emojis
   */
  getAllPriorityEmojis(): Record<string, string> {
    return { ...this.priorityEmojis };
  }

  /**
   * Get all available status emojis
   * @returns Record of all status names and their corresponding emojis
   */
  getAllStatusEmojis(): Record<string, string> {
    return { ...this.statusEmojis };
  }

  /**
   * Get all available action emojis
   * @returns Record of all action names and their corresponding emojis
   */
  getAllActionEmojis(): Record<string, string> {
    return { ...this.actionEmojis };
  }

  /**
   * Get all available system emojis
   * @returns Record of all system message types and their corresponding emojis
   */
  getAllSystemEmojis(): Record<string, string> {
    return { ...this.systemEmojis };
  }

  /**
   * Set or update emoji for a specific category
   * @param category - The category name to update
   * @param emoji - The new emoji to assign
   */
  setCategoryEmoji(category: string, emoji: string): void {
    this.categoryEmojis[category.toLowerCase().trim()] = emoji;
  }

  /**
   * Set or update emoji for a specific priority level
   * @param priority - The priority level to update
   * @param emoji - The new emoji to assign
   */
  setPriorityEmoji(priority: string, emoji: string): void {
    this.priorityEmojis[priority.toLowerCase().trim()] = emoji;
  }

  /**
   * Set or update emoji for a specific status
   * @param status - The status name to update
   * @param emoji - The new emoji to assign
   */
  setStatusEmoji(status: string, emoji: string): void {
    this.statusEmojis[status.toLowerCase().trim().replace(/\s+/g, '_')] = emoji;
  }

  /**
   * Set or update emoji for a specific action
   * @param action - The action name to update
   * @param emoji - The new emoji to assign
   */
  setActionEmoji(action: string, emoji: string): void {
    this.actionEmojis[action.toLowerCase().trim()] = emoji;
  }

  /**
   * Set or update emoji for a specific system message type
   * @param type - The system message type to update
   * @param emoji - The new emoji to assign
   */
  setSystemEmoji(type: string, emoji: string): void {
    this.systemEmojis[type.toLowerCase().trim()] = emoji;
  }

  /**
   * Format a message with appropriate emoji based on type and value
   * @param type - The emoji type to use ('category', 'priority', 'status', 'action', 'system')
   * @param value - The specific value within that type
   * @param message - The message text to format
   * @returns Formatted message with emoji prefix
   */
  formatMessage(type: 'category' | 'priority' | 'status' | 'action' | 'system', value: string, message: string): string {
    let emoji: string;
    
    switch (type) {
      case 'category':
        emoji = this.getCategoryEmoji(value);
        break;
      case 'priority':
        emoji = this.getPriorityEmoji(value);
        break;
      case 'status':
        emoji = this.getStatusEmoji(value);
        break;
      case 'action':
        emoji = this.getActionEmoji(value);
        break;
      case 'system':
        emoji = this.getSystemEmoji(value);
        break;
      default:
        emoji = '📋';
    }
    
    return `${emoji} ${message}`;
  }

  /**
   * Get combined emoji for priority and category
   * @param priority - Optional priority level
   * @param category - Optional category name
   * @returns Combined emoji string with priority and/or category emojis
   */
  getCombinedEmoji(priority?: string, category?: string): string {
    const emojis: string[] = [];
    
    if (priority) {
      emojis.push(this.getPriorityEmoji(priority));
    }
    
    if (category) {
      emojis.push(this.getCategoryEmoji(category));
    }
    
    return emojis.join(' ');
  }
}