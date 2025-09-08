/**
 * @type: service
 * @domain: slack
 * @purpose: Event deduplication service for Slack webhooks
 * @framework: none
 */

import type { SlackEvent } from '../types/slack.types.js';

/**
 * Event deduplication service to prevent processing duplicate Slack events
 * Uses in-memory cache suitable for Cloudflare Workers
 */
export class EventDeduplicationService {
  private processedEvents: Map<string, number> = new Map();
  private readonly maxCacheSize = 1000;
  private readonly eventTtlMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a unique key for an event
   */
  private generateEventKey(event: SlackEvent, eventTs?: string): string {
    // Use event timestamp, type, user, and channel to create unique key
    const timestamp = event.ts || eventTs || Date.now().toString();
    const type = event.type || 'unknown';
    const user = event.user || 'system';
    const channel = event.channel || 'none';
    
    return `${type}:${user}:${channel}:${timestamp}`;
  }

  /**
   * Check if an event has already been processed
   */
  isDuplicate(event: SlackEvent, eventTs?: string): boolean {
    const eventKey = this.generateEventKey(event, eventTs);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanupExpiredEvents(now);
    
    // Check if event was already processed
    if (this.processedEvents.has(eventKey)) {
      const processedAt = this.processedEvents.get(eventKey)!;
      
      // If event is still within TTL, it's a duplicate
      if (now - processedAt < this.eventTtlMs) {
        return true;
      }
      
      // Remove expired entry
      this.processedEvents.delete(eventKey);
    }
    
    return false;
  }

  /**
   * Mark an event as processed
   */
  markAsProcessed(event: SlackEvent, eventTs?: string): void {
    const eventKey = this.generateEventKey(event, eventTs);
    const now = Date.now();
    
    // Add to cache
    this.processedEvents.set(eventKey, now);
    
    // Prevent memory leaks by limiting cache size
    if (this.processedEvents.size > this.maxCacheSize) {
      this.cleanupOldestEvents();
    }
  }

  /**
   * Clean up expired events from cache
   */
  private cleanupExpiredEvents(now: number): void {
    for (const [key, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp >= this.eventTtlMs) {
        this.processedEvents.delete(key);
      }
    }
  }

  /**
   * Remove oldest events when cache is full
   */
  private cleanupOldestEvents(): void {
    const entries = Array.from(this.processedEvents.entries());
    entries.sort((a, b) => a[1] - b[1]); // Sort by timestamp
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.processedEvents.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.processedEvents.size,
      maxSize: this.maxCacheSize,
      ttlMs: this.eventTtlMs
    };
  }

  /**
   * Clear all cached events (useful for testing)
   */
  clearCache(): void {
    this.processedEvents.clear();
  }
}

// Global instance for Cloudflare Workers
export const eventDeduplicationService = new EventDeduplicationService();