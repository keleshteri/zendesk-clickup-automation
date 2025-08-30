/**
 * @ai-metadata
 * @component: DuplicateEventMonitor
 * @description: Monitors and tracks duplicate event detection for debugging and analytics
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/duplicate-event-monitor.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Monitoring service for tracking duplicate event patterns and providing analytics"
 */

/**
 * Interface for duplicate event statistics
 */
export interface DuplicateEventStats {
  /** Total number of events processed */
  totalEvents: number;
  /** Number of duplicate events detected */
  duplicateEvents: number;
  /** Duplicate rate as a percentage */
  duplicateRate: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** Duplicates by type */
  duplicatesByType: Record<string, number>;
  /** Recent duplicate events (last 100) */
  recentDuplicates: DuplicateEventInfo[];
  /** Time window for statistics */
  timeWindowMs: number;
  /** Statistics collection start time */
  startTime: number;
}

/**
 * Interface for duplicate event information
 */
export interface DuplicateEventInfo {
  /** Event key that was duplicated */
  eventKey: string;
  /** Event type */
  eventType: string;
  /** Timestamp when duplicate was detected */
  detectedAt: number;
  /** Additional context about the event */
  context?: Record<string, any>;
  /** Source of the duplicate detection (deduplication, processing-lock, etc.) */
  source: 'deduplication' | 'processing-lock' | 'route-level' | 'other';
}

/**
 * Interface for monitoring options
 */
export interface MonitoringOptions {
  /** Maximum number of recent duplicates to keep in memory (default: 100) */
  maxRecentDuplicates?: number;
  /** Time window for statistics in milliseconds (default: 24 hours) */
  timeWindowMs?: number;
  /** Whether to log duplicate events to console (default: true) */
  logDuplicates?: boolean;
  /** Whether to log statistics periodically (default: false) */
  logStatsPeriodically?: boolean;
  /** Interval for periodic stats logging in milliseconds (default: 1 hour) */
  statsLogIntervalMs?: number;
}

/**
 * Service for monitoring duplicate event detection
 */
export class DuplicateEventMonitor {
  private totalEvents: number = 0;
  private duplicateEvents: number = 0;
  private eventsByType: Map<string, number> = new Map();
  private duplicatesByType: Map<string, number> = new Map();
  private recentDuplicates: DuplicateEventInfo[] = [];
  private readonly maxRecentDuplicates: number;
  private readonly timeWindowMs: number;
  private readonly logDuplicates: boolean;
  private readonly logStatsPeriodically: boolean;
  private readonly startTime: number;
  private statsLogTimer?: NodeJS.Timeout;

  constructor(options: MonitoringOptions = {}) {
    this.maxRecentDuplicates = options.maxRecentDuplicates || 100;
    this.timeWindowMs = options.timeWindowMs || 24 * 60 * 60 * 1000; // 24 hours
    this.logDuplicates = options.logDuplicates !== false;
    this.logStatsPeriodically = options.logStatsPeriodically || false;
    this.startTime = Date.now();

    if (this.logStatsPeriodically) {
      const intervalMs = options.statsLogIntervalMs || 60 * 60 * 1000; // 1 hour
      this.statsLogTimer = setInterval(() => {
        this.logCurrentStats();
      }, intervalMs);
    }
  }

  /**
   * Record a processed event
   * @param eventKey - Unique identifier for the event
   * @param eventType - Type of the event
   * @param context - Additional context about the event
   */
  recordEvent(eventKey: string, eventType: string, context?: Record<string, any>): void {
    this.totalEvents++;
    
    const currentCount = this.eventsByType.get(eventType) || 0;
    this.eventsByType.set(eventType, currentCount + 1);

    if (this.logDuplicates) {
      console.log(`[DuplicateEventMonitor] Event processed: ${eventType} (${eventKey})`);
    }
  }

  /**
   * Record a duplicate event detection
   * @param eventKey - Unique identifier for the event
   * @param eventType - Type of the event
   * @param source - Source of the duplicate detection
   * @param context - Additional context about the event
   */
  recordDuplicate(
    eventKey: string,
    eventType: string,
    source: DuplicateEventInfo['source'],
    context?: Record<string, any>
  ): void {
    this.duplicateEvents++;
    
    const currentCount = this.duplicatesByType.get(eventType) || 0;
    this.duplicatesByType.set(eventType, currentCount + 1);

    const duplicateInfo: DuplicateEventInfo = {
      eventKey,
      eventType,
      detectedAt: Date.now(),
      context,
      source
    };

    // Add to recent duplicates list
    this.recentDuplicates.push(duplicateInfo);
    
    // Maintain maximum size
    if (this.recentDuplicates.length > this.maxRecentDuplicates) {
      this.recentDuplicates.shift();
    }

    if (this.logDuplicates) {
      console.warn(`[DuplicateEventMonitor] Duplicate detected: ${eventType} (${eventKey}) - Source: ${source}`);
    }
  }

  /**
   * Get current duplicate event statistics
   * @returns Current statistics
   */
  getStats(): DuplicateEventStats {
    const duplicateRate = this.totalEvents > 0 ? (this.duplicateEvents / this.totalEvents) * 100 : 0;

    return {
      totalEvents: this.totalEvents,
      duplicateEvents: this.duplicateEvents,
      duplicateRate: Math.round(duplicateRate * 100) / 100, // Round to 2 decimal places
      eventsByType: Object.fromEntries(this.eventsByType),
      duplicatesByType: Object.fromEntries(this.duplicatesByType),
      recentDuplicates: [...this.recentDuplicates],
      timeWindowMs: this.timeWindowMs,
      startTime: this.startTime
    };
  }

  /**
   * Get duplicate events for a specific type
   * @param eventType - Type of events to filter by
   * @returns Array of duplicate events for the specified type
   */
  getDuplicatesForType(eventType: string): DuplicateEventInfo[] {
    return this.recentDuplicates.filter(duplicate => duplicate.eventType === eventType);
  }

  /**
   * Get duplicate events from a specific source
   * @param source - Source to filter by
   * @returns Array of duplicate events from the specified source
   */
  getDuplicatesFromSource(source: DuplicateEventInfo['source']): DuplicateEventInfo[] {
    return this.recentDuplicates.filter(duplicate => duplicate.source === source);
  }

  /**
   * Check if duplicate rate is above a threshold
   * @param threshold - Threshold percentage (0-100)
   * @returns true if duplicate rate is above threshold
   */
  isDuplicateRateHigh(threshold: number = 10): boolean {
    const stats = this.getStats();
    return stats.duplicateRate > threshold;
  }

  /**
   * Log current statistics to console
   */
  logCurrentStats(): void {
    const stats = this.getStats();
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = Math.round(uptimeMs / (60 * 60 * 1000) * 100) / 100;

    console.log(`[DuplicateEventMonitor] Statistics (${uptimeHours}h uptime):`);
    console.log(`  Total Events: ${stats.totalEvents}`);
    console.log(`  Duplicate Events: ${stats.duplicateEvents}`);
    console.log(`  Duplicate Rate: ${stats.duplicateRate}%`);
    console.log(`  Events by Type:`, stats.eventsByType);
    console.log(`  Duplicates by Type:`, stats.duplicatesByType);
    
    if (stats.duplicateRate > 5) {
      console.warn(`[DuplicateEventMonitor] High duplicate rate detected: ${stats.duplicateRate}%`);
    }
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.totalEvents = 0;
    this.duplicateEvents = 0;
    this.eventsByType.clear();
    this.duplicatesByType.clear();
    this.recentDuplicates = [];
    console.log('[DuplicateEventMonitor] Statistics reset');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.statsLogTimer) {
      clearInterval(this.statsLogTimer);
      this.statsLogTimer = undefined;
    }
  }

  /**
   * Export statistics as JSON string
   * @returns JSON string of current statistics
   */
  exportStats(): string {
    return JSON.stringify(this.getStats(), null, 2);
  }

  /**
   * Generate a summary report
   * @returns Human-readable summary report
   */
  generateReport(): string {
    const stats = this.getStats();
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = Math.round(uptimeMs / (60 * 60 * 1000) * 100) / 100;

    let report = `Duplicate Event Monitor Report\n`;
    report += `================================\n`;
    report += `Uptime: ${uptimeHours} hours\n`;
    report += `Total Events Processed: ${stats.totalEvents}\n`;
    report += `Duplicate Events Detected: ${stats.duplicateEvents}\n`;
    report += `Duplicate Rate: ${stats.duplicateRate}%\n\n`;

    report += `Events by Type:\n`;
    for (const [type, count] of Object.entries(stats.eventsByType)) {
      report += `  ${type}: ${count}\n`;
    }

    report += `\nDuplicates by Type:\n`;
    for (const [type, count] of Object.entries(stats.duplicatesByType)) {
      report += `  ${type}: ${count}\n`;
    }

    if (stats.recentDuplicates.length > 0) {
      report += `\nRecent Duplicates (last ${Math.min(5, stats.recentDuplicates.length)}):\n`;
      const recentFive = stats.recentDuplicates.slice(-5);
      for (const duplicate of recentFive) {
        const date = new Date(duplicate.detectedAt).toISOString();
        report += `  ${date} - ${duplicate.eventType} (${duplicate.source})\n`;
      }
    }

    return report;
  }
}

/**
 * Global duplicate event monitor instance
 */
let globalDuplicateEventMonitor: DuplicateEventMonitor | null = null;

/**
 * Get the global duplicate event monitor instance
 * @param options - Optional configuration for the monitor
 * @returns DuplicateEventMonitor instance
 */
export function getDuplicateEventMonitor(options?: MonitoringOptions): DuplicateEventMonitor {
  if (!globalDuplicateEventMonitor) {
    globalDuplicateEventMonitor = new DuplicateEventMonitor(options);
  }
  return globalDuplicateEventMonitor;
}