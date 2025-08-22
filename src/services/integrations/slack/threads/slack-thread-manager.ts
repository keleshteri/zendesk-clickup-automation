/**
 * @ai-metadata
 * @component: SlackThreadManager
 * @description: High-level manager for Slack thread orchestration, storage, and lifecycle management
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-thread-manager.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "createOrUpdateThread": "allow", "addMessageToThread": "allow", "cleanupInactiveThreads": "read-only" }
 * @dependencies: ["./slack-thread-context.ts", "./slack-thread-builder.ts", "./slack-thread-analyzer.ts", "../utils/slack-formatters.ts", "../../../../types/index.ts"]
 * @tests: ["./tests/slack-thread-manager.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Orchestrates thread management using existing thread components. Provides storage, cleanup, and high-level operations."
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

import { SlackThreadContext, ThreadMetadata } from './slack-thread-context';
import { SlackThreadBuilder } from './slack-thread-builder';
import { SlackThreadAnalyzer } from './slack-thread-analyzer';
import { SlackFormatters } from '../utils/slack-formatters';
import { Env, SlackMessage } from '../../../../types/index';

/**
 * Legacy interface for backward compatibility
 * @deprecated Use SlackThreadContext instead
 */
export interface ThreadContext {
  threadId: string;
  channel: string;
  originalMessage: string;
  participants: string[];
  createdAt: Date;
  lastActivity: Date;
  ticketId?: string;
  taskId?: string;
  context?: any;
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use SlackMessage instead
 */
export interface ThreadMessage {
  messageId: string;
  threadId: string;
  userId: string;
  text: string;
  timestamp: Date;
  messageType: 'user' | 'bot' | 'system';
  metadata?: any;
}

/**
 * High-level manager for Slack thread orchestration and lifecycle management
 */
export class SlackThreadManager {
  private env: Env;
  private threadContexts: Map<string, SlackThreadContext> = new Map();
  private threadMessages: Map<string, SlackMessage[]> = new Map();
  private readonly MAX_THREAD_HISTORY = 50; // Maximum messages to keep per thread
  private readonly THREAD_CLEANUP_HOURS = 24; // Hours after which inactive threads are cleaned up

  constructor(env: Env) {
    this.env = env;
    
    // Start cleanup interval (every hour)
    setInterval(() => {
      this.cleanupInactiveThreads();
    }, 60 * 60 * 1000);
  }

  /**
   * Create or update thread context using SlackThreadContext
   */
  createOrUpdateThread(
    threadId: string,
    channel: string,
    originalMessage: string,
    userId: string,
    options?: {
      ticketId?: string;
      taskId?: string;
      context?: any;
    }
  ): SlackThreadContext {
    const existingThread = this.threadContexts.get(threadId);

    if (existingThread) {
      // Update existing thread
      existingThread.addParticipant(userId);
      existingThread.recordActivity('message', userId);
      
      if (options?.ticketId || options?.taskId || options?.context) {
        const metadata: Partial<ThreadMetadata> = {};
        if (options.ticketId) metadata.ticketId = options.ticketId;
        if (options.taskId) metadata.taskId = options.taskId;
        if (options.context) metadata.customData = options.context;
        existingThread.updateMetadata(metadata);
      }
      
      return existingThread;
    }

    // Create new thread using SlackThreadContext
    const threadContext = new SlackThreadContext(
      threadId,
      channel,
      threadId, // Using threadId as parentMessageTs for now
      userId
    );

    // Set metadata if provided
    if (options?.ticketId || options?.taskId || options?.context) {
      const metadata: ThreadMetadata = {
        ticketId: options.ticketId,
        taskId: options.taskId,
        customData: options.context
      };
      threadContext.updateMetadata(metadata);
    }

    this.threadContexts.set(threadId, threadContext);
    this.threadMessages.set(threadId, []);

    return threadContext;
  }

  /**
   * Add message to thread
   */
  addMessageToThread(
    threadId: string,
    messageId: string,
    userId: string,
    text: string,
    messageType: 'user' | 'bot' | 'system' = 'user',
    metadata?: any
  ): void {
    const threadMessages = this.threadMessages.get(threadId) || [];
    
    const message: SlackMessage = {
      user: userId,
      text,
      channel: this.threadContexts.get(threadId)?.channel || '',
      thread_ts: threadId
    };

    threadMessages.push(message);

    // Keep only the most recent messages
    if (threadMessages.length > this.MAX_THREAD_HISTORY) {
      threadMessages.splice(0, threadMessages.length - this.MAX_THREAD_HISTORY);
    }

    this.threadMessages.set(threadId, threadMessages);

    // Update thread context
    const threadContext = this.threadContexts.get(threadId);
    if (threadContext) {
      threadContext.addMessage(message);
      threadContext.addParticipant(userId);
      threadContext.recordActivity('message', userId, { messageType, metadata });
    }
  }

  /**
   * Get thread context (returns SlackThreadContext)
   */
  getThreadContext(threadId: string): SlackThreadContext | undefined {
    return this.threadContexts.get(threadId);
  }

  /**
   * Get thread context in legacy format for backward compatibility
   * @deprecated Use getThreadContext() instead
   */
  getThreadContextLegacy(threadId: string): ThreadContext | undefined {
    const context = this.threadContexts.get(threadId);
    if (!context) return undefined;

    const metadata = context.getMetadata();
    const participants = context.getParticipants();

    return {
      threadId: context.threadId,
      channel: context.channel,
      originalMessage: '', // Not available in new context
      participants: participants.map(p => p.userId),
      createdAt: context.createdAt,
      lastActivity: context.getLastActivity(),
      ticketId: metadata.ticketId,
      taskId: metadata.taskId,
      context: metadata.customData
    };
  }

  /**
   * Get thread messages
   */
  getThreadMessages(threadId: string, limit?: number): SlackMessage[] {
    const messages = this.threadMessages.get(threadId) || [];
    if (limit && limit > 0) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Get thread conversation history as formatted text
   */
  getThreadConversationHistory(threadId: string, limit: number = 10): string {
    const messages = this.getThreadMessages(threadId, limit);
    const context = this.getThreadContext(threadId);
    
    if (messages.length === 0) {
      return 'No conversation history available.';
    }

    let history = '';
    
    if (context) {
      const metadata = context.getMetadata();
      history += `**Thread Context:**\n`;
      history += `- Channel: ${context.channel}\n`;
      history += `- Created: ${SlackFormatters.formatTimestamp(context.createdAt)}\n`;
      history += `- Participants: ${context.getParticipants().length}\n`;
      if (metadata.ticketId) history += `- Ticket ID: ${metadata.ticketId}\n`;
      if (metadata.taskId) history += `- Task ID: ${metadata.taskId}\n`;
      history += '\n**Conversation:**\n';
    }

    messages.forEach((message, index) => {
      const userPrefix = message.user === 'bot' ? '🤖 TaskGenie' : 
                        message.user === 'system' ? '⚙️ System' : 
                        `👤 <@${message.user}>`;
      
      const timestamp = message.ts ? SlackFormatters.formatTimestamp(new Date(parseFloat(message.ts) * 1000)) : 'Unknown';
      const truncatedText = SlackFormatters.truncateText(message.text, 200);
      
      history += `${index + 1}. ${userPrefix} (${timestamp}): ${truncatedText}\n`;
    });

    return history;
  }

  /**
   * Update thread context with ticket or task information
   */
  updateThreadContext(
    threadId: string,
    updates: {
      ticketId?: string;
      taskId?: string;
      context?: any;
    }
  ): boolean {
    const threadContext = this.threadContexts.get(threadId);
    if (!threadContext) {
      return false;
    }

    const metadata: Partial<ThreadMetadata> = {};
    if (updates.ticketId) metadata.ticketId = updates.ticketId;
    if (updates.taskId) metadata.taskId = updates.taskId;
    if (updates.context) metadata.customData = updates.context;
    
    threadContext.updateMetadata(metadata);
    return true;
  }

  /**
   * Get all active threads for a channel
   */
  getChannelThreads(channel: string): SlackThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.channel === channel)
      .sort((a, b) => b.getLastActivity().getTime() - a.getLastActivity().getTime());
  }

  /**
   * Get threads associated with a specific ticket
   */
  getTicketThreads(ticketId: string): SlackThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.getMetadata().ticketId === ticketId)
      .sort((a, b) => b.getLastActivity().getTime() - a.getLastActivity().getTime());
  }

  /**
   * Get threads associated with a specific task
   */
  getTaskThreads(taskId: string): SlackThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.getMetadata().taskId === taskId)
      .sort((a, b) => b.getLastActivity().getTime() - a.getLastActivity().getTime());
  }

  /**
   * Check if a thread exists
   */
  hasThread(threadId: string): boolean {
    return this.threadContexts.has(threadId);
  }

  /**
   * Delete a thread and its messages
   */
  deleteThread(threadId: string): boolean {
    const hasThread = this.threadContexts.has(threadId);
    this.threadContexts.delete(threadId);
    this.threadMessages.delete(threadId);
    return hasThread;
  }

  /**
   * Get thread statistics
   */
  getThreadStats(): {
    totalThreads: number;
    activeThreads: number;
    totalMessages: number;
    averageMessagesPerThread: number;
  } {
    const totalThreads = this.threadContexts.size;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const activeThreads = Array.from(this.threadContexts.values())
      .filter(thread => thread.getLastActivity() > oneHourAgo).length;
    
    const totalMessages = Array.from(this.threadMessages.values())
      .reduce((sum, messages) => sum + messages.length, 0);
    
    const averageMessagesPerThread = totalThreads > 0 ? totalMessages / totalThreads : 0;

    return {
      totalThreads,
      activeThreads,
      totalMessages,
      averageMessagesPerThread: Math.round(averageMessagesPerThread * 100) / 100
    };
  }

  /**
   * Get thread builder for creating threaded messages
   */
  getThreadBuilder(): SlackThreadBuilder {
    return new SlackThreadBuilder();
  }

  /**
   * Get thread analyzer for analyzing conversations
   */
  getThreadAnalyzer(threadId: string): SlackThreadAnalyzer | undefined {
    const context = this.threadContexts.get(threadId);
    if (!context) return undefined;
    return new SlackThreadAnalyzer(context);
  }

  /**
   * Clean up inactive threads
   */
  private cleanupInactiveThreads(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.THREAD_CLEANUP_HOURS * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    for (const [threadId, context] of Array.from(this.threadContexts.entries())) {
      if (context.getLastActivity() < cutoffTime) {
        this.deleteThread(threadId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive threads older than ${this.THREAD_CLEANUP_HOURS} hours`);
    }
  }

  /**
   * Export thread data for backup or analysis
   */
  exportThreadData(): {
    contexts: ReturnType<SlackThreadContext['export']>[];
    messages: { [threadId: string]: SlackMessage[] };
    exportedAt: Date;
  } {
    const contexts = Array.from(this.threadContexts.values()).map(context => context.export());
    const messages: { [threadId: string]: SlackMessage[] } = {};
    
    for (const [threadId, threadMessages] of Array.from(this.threadMessages.entries())) {
      messages[threadId] = threadMessages;
    }

    return {
      contexts,
      messages,
      exportedAt: new Date()
    };
  }

  /**
   * Import thread data from backup
   */
  importThreadData(data: {
    contexts: ReturnType<SlackThreadContext['export']>[];
    messages: { [threadId: string]: SlackMessage[] };
  }): void {
    // Clear existing data
    this.threadContexts.clear();
    this.threadMessages.clear();

    // Import contexts
    data.contexts.forEach(contextData => {
      const context = SlackThreadContext.fromExport(contextData);
      this.threadContexts.set(context.threadId, context);
    });

    // Import messages
    Object.entries(data.messages).forEach(([threadId, messages]) => {
      this.threadMessages.set(threadId, messages);
    });

    console.log(`📥 Imported ${data.contexts.length} threads with ${Object.keys(data.messages).length} message histories`);
  }
}