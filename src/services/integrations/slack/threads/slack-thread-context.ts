/**
 * @ai-metadata
 * @component: SlackThreadContext
 * @description: Manages the context and state of Slack threads including participants, activities, and metadata
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-thread-context.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "addParticipant": "allow", "recordActivity": "allow", "updateMetadata": "allow", "generateSummary": "read-only" }
 * @dependencies: ["../../../../types/index.ts"]
 * @tests: ["./tests/slack-thread-context.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core thread state management with participant tracking and activity logging. Critical for conversation context."
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

/**
 * Represents the context and state of a Slack thread
 */
export interface ThreadMetadata {
  ticketId?: string;
  taskId?: string;
  workflowId?: string;
  category?: string;
  priority?: string;
  assignee?: string;
  tags?: string[];
  customData?: Record<string, any>;
}

export interface ThreadParticipant {
  userId: string;
  username?: string;
  joinedAt: Date;
  lastActivity: Date;
  messageCount: number;
  role?: 'requester' | 'assignee' | 'observer' | 'admin';
}

export interface ThreadActivity {
  type: 'message' | 'reaction' | 'mention' | 'file_upload' | 'bot_action';
  userId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface ThreadSummary {
  messageCount: number;
  participantCount: number;
  lastActivity: Date;
  duration: number; // in milliseconds
  keyTopics?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Manages the context and state of a Slack thread
 */
export class SlackThreadContext {
  public readonly threadId: string;
  public readonly channel: string;
  public readonly parentMessageTs: string;
  public readonly createdAt: Date;
  
  private _lastActivity: Date;
  private _participants: Map<string, ThreadParticipant> = new Map();
  private _activities: ThreadActivity[] = [];
  private _messages: SlackMessage[] = [];
  private _metadata: ThreadMetadata = {};
  private _isActive: boolean = true;
  private _summary?: ThreadSummary;

  constructor(
    threadId: string,
    channel: string,
    parentMessageTs: string,
    createdBy: string
  ) {
    this.threadId = threadId;
    this.channel = channel;
    this.parentMessageTs = parentMessageTs;
    this.createdAt = new Date();
    this._lastActivity = new Date();
    
    // Add the creator as the first participant
    this.addParticipant(createdBy, 'requester');
  }

  /**
   * Add a participant to the thread
   */
  addParticipant(
    userId: string,
    role: ThreadParticipant['role'] = 'observer',
    username?: string
  ): void {
    const existing = this._participants.get(userId);
    
    if (existing) {
      existing.lastActivity = new Date();
      existing.messageCount += 1;
      if (role && role !== 'observer') {
        existing.role = role;
      }
    } else {
      this._participants.set(userId, {
        userId,
        username,
        joinedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 1,
        role
      });
    }
    
    this.updateLastActivity();
  }

  /**
   * Record an activity in the thread
   */
  recordActivity(
    type: ThreadActivity['type'],
    userId: string,
    details?: Record<string, any>
  ): void {
    this._activities.push({
      type,
      userId,
      timestamp: new Date(),
      details
    });
    
    // Update participant activity
    const participant = this._participants.get(userId);
    if (participant) {
      participant.lastActivity = new Date();
      if (type === 'message') {
        participant.messageCount += 1;
      }
    }
    
    this.updateLastActivity();
    this.invalidateSummary();
  }

  /**
   * Update thread metadata
   */
  updateMetadata(metadata: Partial<ThreadMetadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this.updateLastActivity();
  }

  /**
   * Get thread metadata
   */
  getMetadata(): ThreadMetadata {
    return { ...this._metadata };
  }

  /**
   * Get all participants
   */
  getParticipants(): ThreadParticipant[] {
    return Array.from(this._participants.values());
  }

  /**
   * Get participant by user ID
   */
  getParticipant(userId: string): ThreadParticipant | undefined {
    return this._participants.get(userId);
  }

  /**
   * Get recent activities
   */
  getActivities(limit: number = 50): ThreadActivity[] {
    return this._activities
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if user is a participant
   */
  hasParticipant(userId: string): boolean {
    return this._participants.has(userId);
  }

  /**
   * Get thread age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this._lastActivity.getTime();
  }

  /**
   * Check if thread is considered active
   */
  isActive(): boolean {
    return this._isActive && this.getTimeSinceLastActivity() < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Mark thread as inactive
   */
  markInactive(): void {
    this._isActive = false;
  }

  /**
   * Mark thread as active
   */
  markActive(): void {
    this._isActive = true;
    this.updateLastActivity();
  }

  /**
   * Get thread summary
   */
  getSummary(): ThreadSummary {
    if (!this._summary) {
      this._summary = this.generateSummary();
    }
    return this._summary;
  }

  /**
   * Get all messages in the thread
   */
  getMessages(): SlackMessage[] {
    return [...this._messages];
  }

  /**
   * Add a message to the thread
   */
  addMessage(message: SlackMessage): void {
    this._messages.push(message);
    this.updateLastActivity();
  }

  /**
   * Get last activity timestamp
   */
  getLastActivity(): Date {
    return new Date(this._lastActivity);
  }

  /**
   * Export thread context data
   */
  export(): {
    threadId: string;
    channel: string;
    parentMessageTs: string;
    createdAt: string;
    lastActivity: string;
    participants: (Omit<ThreadParticipant, 'joinedAt' | 'lastActivity'> & {
      joinedAt: string;
      lastActivity: string;
    })[];
    activities: (Omit<ThreadActivity, 'timestamp'> & {
      timestamp: string;
    })[];
    messages: SlackMessage[];
    metadata: ThreadMetadata;
    isActive: boolean;
  } {
    return {
      threadId: this.threadId,
      channel: this.channel,
      parentMessageTs: this.parentMessageTs,
      createdAt: this.createdAt.toISOString(),
      lastActivity: this._lastActivity.toISOString(),
      participants: this.getParticipants().map(p => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
        lastActivity: p.lastActivity.toISOString()
      })),
      activities: this._activities.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString()
      })),
      messages: this._messages,
      metadata: this._metadata,
      isActive: this._isActive
    };
  }

  /**
   * Create thread context from exported data
   */
  static fromExport(data: ReturnType<SlackThreadContext['export']>): SlackThreadContext {
    const context = new SlackThreadContext(
      data.threadId,
      data.channel,
      data.parentMessageTs,
      data.participants[0]?.userId || 'unknown'
    );
    
    // Restore timestamps
    (context as any).createdAt = new Date(data.createdAt);
    context._lastActivity = new Date(data.lastActivity);
    
    // Restore participants
    data.participants.forEach(participant => {
      context._participants.set(participant.userId, {
        ...participant,
        joinedAt: new Date(participant.joinedAt),
        lastActivity: new Date(participant.lastActivity)
      });
    });
    
    // Restore activities
    context._activities = data.activities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }));
    
    // Restore messages
    if (data.messages) {
      context._messages = data.messages;
    }
    
    // Restore metadata and state
    context._metadata = data.metadata;
    context._isActive = data.isActive;
    
    return context;
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this._lastActivity = new Date();
  }

  /**
   * Invalidate cached summary
   */
  private invalidateSummary(): void {
    this._summary = undefined;
  }

  /**
   * Generate thread summary
   */
  private generateSummary(): ThreadSummary {
    const messageActivities = this._activities.filter(a => a.type === 'message');
    const duration = this._lastActivity.getTime() - this.createdAt.getTime();
    
    return {
      messageCount: messageActivities.length,
      participantCount: this._participants.size,
      lastActivity: new Date(this._lastActivity),
      duration,
      keyTopics: this.extractKeyTopics(),
      sentiment: this.analyzeSentiment(),
      urgency: this.analyzeUrgency()
    };
  }

  /**
   * Extract key topics from thread activities
   */
  private extractKeyTopics(): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const topics: string[] = [];
    
    if (this._metadata.category) {
      topics.push(this._metadata.category);
    }
    
    if (this._metadata.tags) {
      topics.push(...this._metadata.tags);
    }
    
    return topics;
  }

  /**
   * Analyze sentiment of thread
   */
  private analyzeSentiment(): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - could be enhanced with AI
    const urgency = this._metadata.priority;
    
    if (urgency === 'high' || urgency === 'critical') {
      return 'negative';
    }
    
    return 'neutral';
  }

  /**
   * Analyze urgency of thread
   */
  private analyzeUrgency(): 'low' | 'medium' | 'high' | 'critical' {
    const priority = this._metadata.priority;
    
    if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
      return priority as 'low' | 'medium' | 'high' | 'critical';
    }
    
    // Analyze based on activity patterns
    const recentActivities = this._activities.filter(
      a => Date.now() - a.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );
    
    if (recentActivities.length > 10) {
      return 'high';
    } else if (recentActivities.length > 5) {
      return 'medium';
    }
    
    return 'low';
  }
}