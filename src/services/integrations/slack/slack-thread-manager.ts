import { SlackUtils } from './slack-utils.js';
import { Env } from '../../../types/index.js';

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

export interface ThreadMessage {
  messageId: string;
  threadId: string;
  userId: string;
  text: string;
  timestamp: Date;
  messageType: 'user' | 'bot' | 'system';
  metadata?: any;
}

export class SlackThreadManager {
  private env: Env;
  private threadContexts: Map<string, ThreadContext> = new Map();
  private threadMessages: Map<string, ThreadMessage[]> = new Map();
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
   * Create or update thread context
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
  ): ThreadContext {
    const now = new Date();
    const existingThread = this.threadContexts.get(threadId);

    if (existingThread) {
      // Update existing thread
      existingThread.lastActivity = now;
      if (!existingThread.participants.includes(userId)) {
        existingThread.participants.push(userId);
      }
      if (options?.ticketId) existingThread.ticketId = options.ticketId;
      if (options?.taskId) existingThread.taskId = options.taskId;
      if (options?.context) existingThread.context = { ...existingThread.context, ...options.context };
      
      return existingThread;
    }

    // Create new thread
    const threadContext: ThreadContext = {
      threadId,
      channel,
      originalMessage,
      participants: [userId],
      createdAt: now,
      lastActivity: now,
      ticketId: options?.ticketId,
      taskId: options?.taskId,
      context: options?.context
    };

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
    
    const message: ThreadMessage = {
      messageId,
      threadId,
      userId,
      text,
      timestamp: new Date(),
      messageType,
      metadata
    };

    threadMessages.push(message);

    // Keep only the most recent messages
    if (threadMessages.length > this.MAX_THREAD_HISTORY) {
      threadMessages.splice(0, threadMessages.length - this.MAX_THREAD_HISTORY);
    }

    this.threadMessages.set(threadId, threadMessages);

    // Update thread activity
    const threadContext = this.threadContexts.get(threadId);
    if (threadContext) {
      threadContext.lastActivity = new Date();
      if (!threadContext.participants.includes(userId)) {
        threadContext.participants.push(userId);
      }
    }
  }

  /**
   * Get thread context
   */
  getThreadContext(threadId: string): ThreadContext | undefined {
    return this.threadContexts.get(threadId);
  }

  /**
   * Get thread messages
   */
  getThreadMessages(threadId: string, limit?: number): ThreadMessage[] {
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
      history += `**Thread Context:**\n`;
      history += `- Channel: ${context.channel}\n`;
      history += `- Created: ${SlackUtils.formatTimestamp(context.createdAt)}\n`;
      history += `- Participants: ${context.participants.length}\n`;
      if (context.ticketId) history += `- Ticket ID: ${context.ticketId}\n`;
      if (context.taskId) history += `- Task ID: ${context.taskId}\n`;
      history += '\n**Conversation:**\n';
    }

    messages.forEach((message, index) => {
      const userPrefix = message.messageType === 'bot' ? '🤖 TaskGenie' : 
                        message.messageType === 'system' ? '⚙️ System' : 
                        `👤 <@${message.userId}>`;
      
      const timestamp = SlackUtils.formatTimestamp(message.timestamp);
      const truncatedText = SlackUtils.truncateText(message.text, 200);
      
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

    if (updates.ticketId) threadContext.ticketId = updates.ticketId;
    if (updates.taskId) threadContext.taskId = updates.taskId;
    if (updates.context) {
      threadContext.context = { ...threadContext.context, ...updates.context };
    }
    threadContext.lastActivity = new Date();

    return true;
  }

  /**
   * Get all active threads for a channel
   */
  getChannelThreads(channel: string): ThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.channel === channel)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get threads associated with a specific ticket
   */
  getTicketThreads(ticketId: string): ThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.ticketId === ticketId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get threads associated with a specific task
   */
  getTaskThreads(taskId: string): ThreadContext[] {
    return Array.from(this.threadContexts.values())
      .filter(thread => thread.taskId === taskId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
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
      .filter(thread => thread.lastActivity > oneHourAgo).length;
    
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
   * Clean up inactive threads
   */
  private cleanupInactiveThreads(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.THREAD_CLEANUP_HOURS * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    for (const [threadId, context] of this.threadContexts.entries()) {
      if (context.lastActivity < cutoffTime) {
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
    contexts: ThreadContext[];
    messages: { [threadId: string]: ThreadMessage[] };
    exportedAt: Date;
  } {
    const contexts = Array.from(this.threadContexts.values());
    const messages: { [threadId: string]: ThreadMessage[] } = {};
    
    for (const [threadId, threadMessages] of this.threadMessages.entries()) {
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
    contexts: ThreadContext[];
    messages: { [threadId: string]: ThreadMessage[] };
  }): void {
    // Clear existing data
    this.threadContexts.clear();
    this.threadMessages.clear();

    // Import contexts
    data.contexts.forEach(context => {
      this.threadContexts.set(context.threadId, {
        ...context,
        createdAt: new Date(context.createdAt),
        lastActivity: new Date(context.lastActivity)
      });
    });

    // Import messages
    Object.entries(data.messages).forEach(([threadId, messages]) => {
      const processedMessages = messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      this.threadMessages.set(threadId, processedMessages);
    });

    console.log(`📥 Imported ${data.contexts.length} threads with ${Object.keys(data.messages).length} message histories`);
  }
}