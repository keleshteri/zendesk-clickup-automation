/**
 * @ai-metadata
 * @component: EventDeduplicationService
 * @description: Provides event deduplication functionality to prevent duplicate processing
 * @last-update: 2025-01-29
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/event-deduplication.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/event-deduplication.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Event deduplication service to prevent race conditions and duplicate processing"
 */

export interface ProcessedEvent {
  eventId: string;
  eventType: string;
  processedAt: number;
  channel?: string;
  user?: string;
}

export interface EventDeduplicationOptions {
  /** TTL for processed events in milliseconds (default: 5 minutes) */
  ttlMs?: number;
  /** Maximum number of events to track (default: 1000) */
  maxEvents?: number;
}

/**
 * Service for tracking and deduplicating events to prevent duplicate processing
 */
export class EventDeduplicationService {
  private processedEvents: Map<string, ProcessedEvent> = new Map();
  private readonly ttlMs: number;
  private readonly maxEvents: number;
  private lastCleanup: number = Date.now();
  private readonly cleanupIntervalMs: number = 60000; // 1 minute

  constructor(options: EventDeduplicationOptions = {}) {
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000; // 5 minutes default
    this.maxEvents = options.maxEvents ?? 1000;
  }

  /**
   * Check if an event has already been processed
   * @param eventId - Unique identifier for the event
   * @param eventType - Type of the event (e.g., 'app_mention', 'message')
   * @param metadata - Additional event metadata
   * @returns true if event was already processed, false otherwise
   */
  isEventProcessed(eventId: string, eventType: string, metadata?: { channel?: string; user?: string }): boolean {
    this.performPeriodicCleanup();
    
    const key = this.generateEventKey(eventId, eventType);
    const processedEvent = this.processedEvents.get(key);
    
    if (!processedEvent) {
      return false;
    }
    
    // Check if event has expired
    const now = Date.now();
    if (now - processedEvent.processedAt > this.ttlMs) {
      this.processedEvents.delete(key);
      return false;
    }
    
    console.log(`Event already processed: ${eventType}:${eventId} at ${new Date(processedEvent.processedAt).toISOString()}`);
    return true;
  }

  /**
   * Mark an event as processed
   * @param eventId - Unique identifier for the event
   * @param eventType - Type of the event
   * @param metadata - Additional event metadata
   */
  markEventProcessed(eventId: string, eventType: string, metadata?: { channel?: string; user?: string }): void {
    this.performPeriodicCleanup();
    
    const key = this.generateEventKey(eventId, eventType);
    const processedEvent: ProcessedEvent = {
      eventId,
      eventType,
      processedAt: Date.now(),
      channel: metadata?.channel,
      user: metadata?.user
    };
    
    this.processedEvents.set(key, processedEvent);
    
    // Enforce max events limit
    if (this.processedEvents.size > this.maxEvents) {
      this.cleanupOldestEvents();
    }
    
    console.log(`Event marked as processed: ${eventType}:${eventId}`);
  }

  /**
   * Get statistics about processed events
   */
  getStats(): { totalEvents: number; eventTypes: Record<string, number>; oldestEvent?: Date } {
    const eventTypes: Record<string, number> = {};
    let oldestTimestamp = Date.now();
    
    for (const event of this.processedEvents.values()) {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
      if (event.processedAt < oldestTimestamp) {
        oldestTimestamp = event.processedAt;
      }
    }
    
    return {
      totalEvents: this.processedEvents.size,
      eventTypes,
      oldestEvent: this.processedEvents.size > 0 ? new Date(oldestTimestamp) : undefined
    };
  }

  /**
   * Clear all processed events (useful for testing)
   */
  clear(): void {
    this.processedEvents.clear();
    console.log('Event deduplication cache cleared');
  }

  /**
   * Generate a unique key for an event
   */
  private generateEventKey(eventId: string, eventType: string): string {
    return `${eventType}:${eventId}`;
  }

  /**
   * Perform periodic cleanup of expired events
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) {
      return;
    }
    
    this.lastCleanup = now;
    this.cleanupExpiredEvents();
  }

  /**
   * Remove expired events from the cache
   */
  private cleanupExpiredEvents(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, event] of this.processedEvents.entries()) {
      if (now - event.processedAt > this.ttlMs) {
        this.processedEvents.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired events from deduplication cache`);
    }
  }

  /**
   * Remove oldest events when max limit is reached
   */
  private cleanupOldestEvents(): void {
    const eventsToRemove = this.processedEvents.size - this.maxEvents + 100; // Remove extra to avoid frequent cleanup
    
    if (eventsToRemove <= 0) {
      return;
    }
    
    // Sort by processedAt timestamp and remove oldest
    const sortedEvents = Array.from(this.processedEvents.entries())
      .sort(([, a], [, b]) => a.processedAt - b.processedAt)
      .slice(0, eventsToRemove);
    
    for (const [key] of sortedEvents) {
      this.processedEvents.delete(key);
    }
    
    console.log(`Removed ${eventsToRemove} oldest events from deduplication cache`);
  }
}

// Global instance for the application
let globalDeduplicationService: EventDeduplicationService | null = null;

/**
 * Get or create the global event deduplication service instance
 */
export function getEventDeduplicationService(options?: EventDeduplicationOptions): EventDeduplicationService {
  if (!globalDeduplicationService) {
    globalDeduplicationService = new EventDeduplicationService(options);
  }
  return globalDeduplicationService;
}

/**
 * Reset the global event deduplication service (useful for testing)
 */
export function resetEventDeduplicationService(): void {
  globalDeduplicationService = null;
}