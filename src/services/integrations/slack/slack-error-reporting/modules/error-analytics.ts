/**
 * @ai-metadata
 * @component: ErrorAnalytics
 * @description: Provides error analytics, statistics, and metrics for monitoring and reporting
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-analytics.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../interfaces", "./error-persistence"]
 * @tests: ["../tests/error-analytics.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Module that analyzes error data to provide insights, statistics, and real-time metrics"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type {
  SlackErrorReport,
  ErrorStatistics
} from '../../interfaces/slack-error-reporting.interface';
import {
  ErrorSeverity,
  ErrorCategory
} from '../../interfaces/slack-error-reporting.interface';
import type { ErrorPersistence } from './error-persistence';

/**
 * Provides error analytics and statistics
 * Analyzes error patterns, trends, and provides insights
 */
export class ErrorAnalytics {
  private persistence: ErrorPersistence;
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(persistence: ErrorPersistence) {
    this.persistence = persistence;
  }

  /**
   * Get comprehensive error statistics
   * @param timeRange - Optional time range for statistics
   * @returns Promise that resolves to error statistics
   */
  async getStatistics(timeRange?: { from: Date; to: Date }): Promise<ErrorStatistics> {
    try {
      const cacheKey = `stats_${timeRange?.from?.getTime()}_${timeRange?.to?.getTime()}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      const filters = timeRange ? { dateRange: { from: timeRange.from, to: timeRange.to } } : {};
      const errors = await this.persistence.getErrors(filters);

      const statistics = this.calculateStatistics(errors, timeRange);
      this.setCachedData(cacheKey, statistics);

      return statistics;
    } catch (error) {
      console.error('❌ Failed to get error statistics:', error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Calculate statistics from error data
   * @param errors - Array of error reports
   * @param timeRange - Optional time range
   * @returns Calculated statistics
   */
  private calculateStatistics(
    errors: SlackErrorReport[],
    timeRange?: { from: Date; to: Date }
  ): ErrorStatistics {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalErrors = errors.length;
    const resolvedErrors = errors.filter(e => e.resolved === true).length;
    const openErrors = errors.filter(e => e.resolved === false).length;

    // Time-based counts
    const last24Hours = errors.filter(e => e.timestamp >= oneDayAgo).length;
    const last7Days = errors.filter(e => e.timestamp >= oneWeekAgo).length;

    // Severity breakdown
    const severityBreakdown = this.calculateSeverityBreakdown(errors);

    // Service breakdown
    const serviceBreakdown = this.calculateServiceBreakdown(errors);

    // Error rate calculation
    const errorRate = this.calculateErrorRate(errors, timeRange);

    // Top errors
    const topErrors = this.getTopErrors(errors);

    // Trends
    const trends = this.calculateTrends(errors);

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(errors);

    return {
      totalErrors,
      bySeverity: severityBreakdown,
      byCategory: categoryBreakdown,
      byService: serviceBreakdown.reduce((acc, item) => {
        acc[item.service] = item.count;
        return acc;
      }, {} as Record<string, number>),
      topErrors,
      trends
    };
  }

  /**
   * Calculate severity breakdown
   * @param errors - Array of error reports
   * @returns Severity breakdown
   */
  private calculateSeverityBreakdown(errors: SlackErrorReport[]): Record<ErrorSeverity, number> {
    const breakdown: Record<ErrorSeverity, number> = {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.INFO]: 0
    };

    for (const error of errors) {
      breakdown[error.severity]++;
    }

    return breakdown;
  }

  /**
   * Calculate service breakdown
   * @param errors - Array of error reports
   * @returns Service breakdown
   */
  private calculateServiceBreakdown(errors: SlackErrorReport[]): Array<{
    service: string;
    count: number;
    percentage: number;
  }> {
    const serviceCounts = new Map<string, number>();

    for (const error of errors) {
      const service = error.source.service;
      serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
    }

    const total = errors.length;
    return Array.from(serviceCounts.entries())
      .map(([service, count]) => ({
        service,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate error rate over time
   * @param errors - Array of error reports
   * @param timeRange - Optional time range
   * @returns Error rate data
   */
  private calculateErrorRate(
    errors: SlackErrorReport[],
    timeRange?: { from: Date; to: Date }
  ): Array<{ timestamp: Date; count: number; rate: number }> {
    if (errors.length === 0) {
      return [];
    }

    const now = new Date();
    const start = timeRange?.from || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = timeRange?.to || now;

    // Create hourly buckets
    const buckets = new Map<number, number>();
    const hourMs = 60 * 60 * 1000;

    // Initialize buckets
    for (let time = start.getTime(); time <= end.getTime(); time += hourMs) {
      const bucketKey = Math.floor(time / hourMs);
      buckets.set(bucketKey, 0);
    }

    // Fill buckets with error counts
    for (const error of errors) {
      if (error.timestamp >= start && error.timestamp <= end) {
        const bucketKey = Math.floor(error.timestamp.getTime() / hourMs);
        buckets.set(bucketKey, (buckets.get(bucketKey) || 0) + 1);
      }
    }

    // Convert to rate data
    return Array.from(buckets.entries())
      .map(([bucketKey, count]) => {
        const timestamp = new Date(bucketKey * hourMs);
        const rate = count; // Errors per hour
        return { timestamp, count, rate };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get top errors by occurrence count
   * @param errors - Array of error reports
   * @returns Top errors
   */
  private getTopErrors(errors: SlackErrorReport[]): Array<{
    message: string;
    count: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }> {
    const errorGroups = new Map<string, {
      message: string;
      count: number;
      category: ErrorCategory;
      severity: ErrorSeverity;
    }>();

    for (const error of errors) {
      const existing = errorGroups.get(error.fingerprint);
      if (existing) {
        existing.count += error.occurrenceCount;
        existing.severity = error.severity; // Use latest severity
        existing.category = error.category; // Use latest category
      } else {
        errorGroups.set(error.fingerprint, {
          message: error.error.message,
          count: error.occurrenceCount,
          category: error.category,
          severity: error.severity
        });
      }
    }

    return Array.from(errorGroups.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate error breakdown by category
   * @param errors - Array of error reports
   * @returns Category breakdown
   */
  private calculateCategoryBreakdown(errors: SlackErrorReport[]): Record<ErrorCategory, number> {
    const breakdown: Record<ErrorCategory, number> = {
      [ErrorCategory.AUTH]: 0,
      [ErrorCategory.API]: 0,
      [ErrorCategory.RATE_LIMIT]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.CONFIG]: 0,
      [ErrorCategory.SECURITY]: 0,
      [ErrorCategory.BOT_MANAGEMENT]: 0,
      [ErrorCategory.MESSAGING]: 0,
      [ErrorCategory.EVENT_PROCESSING]: 0,
      [ErrorCategory.UNKNOWN]: 0
    };
    
    errors.forEach(error => {
      breakdown[error.category] = (breakdown[error.category] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Calculate error trends
   * @param errors - Array of error reports
   * @returns Trend data
   */
  private calculateTrends(errors: SlackErrorReport[]): Array<{
    timestamp: Date;
    count: number;
    severity: ErrorSeverity;
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentErrors = errors.filter(e => e.timestamp >= sevenDaysAgo);

    // Daily trends (last 7 days)
    const dailyTrends = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyTrends.set(dateKey, 0);
    }

    // Hourly trends (last 24 hours)
    const hourlyTrends = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyTrends.set(i, 0);
    }

    // Weekly trends (last 4 weeks)
    const weeklyTrends = new Map<string, number>();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = this.getWeekKey(weekStart);
      weeklyTrends.set(weekKey, 0);
    }

    // Fill trends with actual data
    for (const error of recentErrors) {
      // Daily
      const dateKey = error.timestamp.toISOString().split('T')[0];
      if (dailyTrends.has(dateKey)) {
        dailyTrends.set(dateKey, dailyTrends.get(dateKey)! + 1);
      }

      // Hourly
      const hour = error.timestamp.getHours();
      hourlyTrends.set(hour, (hourlyTrends.get(hour) || 0) + 1);

      // Weekly
      const weekKey = this.getWeekKey(error.timestamp);
      if (weeklyTrends.has(weekKey)) {
        weeklyTrends.set(weekKey, weeklyTrends.get(weekKey)! + 1);
      }
    }

    // Convert daily trends to the expected format
    const trends = Array.from(dailyTrends.entries())
      .map(([date, count]) => ({
        timestamp: new Date(date),
        count,
        severity: ErrorSeverity.INFO // Default severity for trend data
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return trends;
  }

  /**
   * Get week key for grouping
   * @param date - Date to get week key for
   * @returns Week key string
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number of the year
   * @param date - Date to get week number for
   * @returns Week number
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get real-time error metrics
   * @returns Promise that resolves to real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    currentErrorRate: number;
    averageResponseTime: number;
    activeErrors: number;
    criticalErrors: number;
    lastHourErrors: number;
    errorRateChange: number;
  }> {
    try {
      const cacheKey = 'realtime_metrics';
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Get recent errors
      const lastHourErrors = await this.persistence.getErrors({
        dateRange: {
          from: oneHourAgo,
          to: now
        }
      });

      const previousHourErrors = await this.persistence.getErrors({
        dateRange: {
          from: twoHoursAgo,
          to: oneHourAgo
        }
      });

      const activeErrors = await this.persistence.getErrors({
        resolved: false
      });

      const criticalErrors = await this.persistence.getErrors({
        severity: [ErrorSeverity.CRITICAL],
        resolved: false
      });

      // Calculate metrics
      const currentErrorRate = lastHourErrors.length; // Errors per hour
      const previousErrorRate = previousHourErrors.length;
      const errorRateChange = previousErrorRate > 0 
        ? ((currentErrorRate - previousErrorRate) / previousErrorRate) * 100 
        : 0;

      const averageResponseTime = this.calculateAverageResponseTime(lastHourErrors);

      const metrics = {
        currentErrorRate,
        averageResponseTime,
        activeErrors: activeErrors.length,
        criticalErrors: criticalErrors.length,
        lastHourErrors: lastHourErrors.length,
        errorRateChange
      };

      this.setCachedData(cacheKey, metrics, 60000); // Cache for 1 minute
      return metrics;
    } catch (error) {
      console.error('❌ Failed to get real-time metrics:', error);
      return {
        currentErrorRate: 0,
        averageResponseTime: 0,
        activeErrors: 0,
        criticalErrors: 0,
        lastHourErrors: 0,
        errorRateChange: 0
      };
    }
  }

  /**
   * Calculate average response time from errors
   * @param errors - Array of error reports
   * @returns Average response time in milliseconds
   */
  private calculateAverageResponseTime(errors: SlackErrorReport[]): number {
    const responseTimes = errors
      .map(e => e.context.metadata?.responseTime as number)
      .filter((time): time is number => typeof time === 'number');

    if (responseTimes.length === 0) {
      return 0;
    }

    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / responseTimes.length;
  }

  /**
   * Get analytics dashboard data
   * @param timeRange - Time range for analytics
   * @returns Promise that resolves to dashboard data
   */
  async getAnalyticsDashboard(timeRange: { from: Date; to: Date }): Promise<{
    overview: ErrorStatistics;
    realTimeMetrics: {
      currentErrorRate: number;
      averageResponseTime: number;
      activeErrors: number;
      criticalErrors: number;
      lastHourErrors: number;
      errorRateChange: number;
    };
    errorPatterns: Array<{
      pattern: string;
      count: number;
      severity: string;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    serviceHealth: Array<{
      service: string;
      errorCount: number;
      errorRate: number;
      availability: number;
      status: 'healthy' | 'warning' | 'critical';
    }>;
    resolutionMetrics: {
      averageResolutionTime: number;
      resolutionRate: number;
      unresolvedErrors: number;
    };
  }> {
    try {
      const [overview, realTimeMetrics, errorPatterns, serviceHealth, resolutionMetrics] = await Promise.all([
        this.getStatistics(timeRange),
        this.getRealTimeMetrics(),
        this.getErrorPatterns(timeRange),
        this.getServiceHealth(timeRange),
        this.getResolutionMetrics(timeRange)
      ]);

      return {
        overview,
        realTimeMetrics,
        errorPatterns,
        serviceHealth,
        resolutionMetrics
      };
    } catch (error) {
      console.error('❌ Failed to get analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Get error patterns analysis
   * @param timeRange - Time range for analysis
   * @returns Promise that resolves to error patterns
   */
  private async getErrorPatterns(timeRange: { from: Date; to: Date }): Promise<Array<{
    pattern: string;
    count: number;
    severity: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>> {
    const errors = await this.persistence.getErrors({ dateRange: timeRange });
    const patterns = new Map<string, {
      count: number;
      severity: ErrorSeverity;
      timestamps: Date[];
    }>();

    // Group errors by pattern (fingerprint)
    for (const error of errors) {
      const existing = patterns.get(error.fingerprint);
      if (existing) {
        existing.count += error.occurrenceCount;
        existing.timestamps.push(error.timestamp);
      } else {
        patterns.set(error.fingerprint, {
          count: error.occurrenceCount,
          severity: error.severity,
          timestamps: [error.timestamp]
        });
      }
    }

    // Calculate trends and return top patterns
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        severity: data.severity,
        trend: this.calculateTrend(data.timestamps, timeRange)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate trend for a set of timestamps
   * @param timestamps - Array of timestamps
   * @param timeRange - Time range for analysis
   * @returns Trend direction
   */
  private calculateTrend(
    timestamps: Date[],
    timeRange: { from: Date; to: Date }
  ): 'increasing' | 'decreasing' | 'stable' {
    if (timestamps.length < 2) {
      return 'stable';
    }

    const duration = timeRange.to.getTime() - timeRange.from.getTime();
    const midpoint = timeRange.from.getTime() + duration / 2;

    const firstHalf = timestamps.filter(t => t.getTime() < midpoint).length;
    const secondHalf = timestamps.filter(t => t.getTime() >= midpoint).length;

    const threshold = 0.2; // 20% change threshold
    const change = (secondHalf - firstHalf) / Math.max(firstHalf, 1);

    if (change > threshold) {
      return 'increasing';
    } else if (change < -threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Get service health metrics
   * @param timeRange - Time range for analysis
   * @returns Promise that resolves to service health data
   */
  private async getServiceHealth(timeRange: { from: Date; to: Date }): Promise<Array<{
    service: string;
    errorCount: number;
    errorRate: number;
    availability: number;
    status: 'healthy' | 'warning' | 'critical';
  }>> {
    const errors = await this.persistence.getErrors({ dateRange: timeRange });
    const services = new Map<string, {
      errorCount: number;
      criticalErrors: number;
    }>();

    // Group errors by service
    for (const error of errors) {
      const service = error.source.service;
      const existing = services.get(service);
      if (existing) {
        existing.errorCount += error.occurrenceCount;
        if (error.severity === 'critical') {
          existing.criticalErrors += error.occurrenceCount;
        }
      } else {
        services.set(service, {
          errorCount: error.occurrenceCount,
          criticalErrors: error.severity === 'critical' ? error.occurrenceCount : 0
        });
      }
    }

    // Calculate health metrics
    return Array.from(services.entries())
      .map(([service, data]) => {
        const errorRate = data.errorCount; // Simplified: errors per time period
        const availability = Math.max(0, 100 - (data.criticalErrors * 10)); // Simplified calculation
        
        let status: 'healthy' | 'warning' | 'critical';
        if (data.criticalErrors > 0 || availability < 90) {
          status = 'critical';
        } else if (data.errorCount > 10 || availability < 95) {
          status = 'warning';
        } else {
          status = 'healthy';
        }

        return {
          service,
          errorCount: data.errorCount,
          errorRate,
          availability,
          status
        };
      })
      .sort((a, b) => b.errorCount - a.errorCount);
  }

  /**
   * Get resolution metrics
   * @param timeRange - Time range for analysis
   * @returns Promise that resolves to resolution metrics
   */
  private async getResolutionMetrics(timeRange: { from: Date; to: Date }): Promise<{
    averageResolutionTime: number;
    resolutionRate: number;
    unresolvedErrors: number;
  }> {
    const errors = await this.persistence.getErrors({ dateRange: timeRange });
    const resolvedErrors = errors.filter(e => e.resolved && e.resolution?.resolvedAt);
    const unresolvedErrors = errors.filter(e => !e.resolved).length;

    // Calculate average resolution time
    let totalResolutionTime = 0;
    for (const error of resolvedErrors) {
      if (error.resolution?.resolvedAt) {
        const resolutionTime = error.resolution.resolvedAt.getTime() - error.firstSeen.getTime();
        totalResolutionTime += resolutionTime;
      }
    }

    const averageResolutionTime = resolvedErrors.length > 0 
      ? totalResolutionTime / resolvedErrors.length 
      : 0;

    const resolutionRate = errors.length > 0 
      ? (resolvedErrors.length / errors.length) * 100 
      : 0;

    return {
      averageResolutionTime,
      resolutionRate,
      unresolvedErrors
    };
  }

  /**
   * Get empty statistics object
   * @returns Empty statistics
   */
  private getEmptyStatistics(): ErrorStatistics {
    return {
      totalErrors: 0,
      bySeverity: {
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.INFO]: 0
      },
      byCategory: {
        [ErrorCategory.AUTH]: 0,
        [ErrorCategory.API]: 0,
        [ErrorCategory.RATE_LIMIT]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.CONFIG]: 0,
        [ErrorCategory.SECURITY]: 0,
        [ErrorCategory.BOT_MANAGEMENT]: 0,
        [ErrorCategory.MESSAGING]: 0,
        [ErrorCategory.EVENT_PROCESSING]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      byService: {},
      topErrors: [],
      trends: []
    };
  }

  /**
   * Get cached data if available and not expired
   * @param key - Cache key
   * @returns Cached data or null
   */
  private getCachedData(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Optional TTL override
   */
  private setCachedData(key: string, data: any, ttl?: number): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up expired cache entries
    setTimeout(() => {
      this.cleanupCache();
    }, ttl || this.CACHE_TTL);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.metricsCache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.metricsCache.delete(key);
      }
    }
  }
}