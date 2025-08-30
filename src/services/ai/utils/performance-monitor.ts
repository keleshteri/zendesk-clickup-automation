/**
 * @ai-metadata
 * @component: PerformanceMonitor
 * @description: Performance monitoring and optimization utilities for AI services with metrics tracking
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/performance-monitor.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/performance-monitor.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Utility for monitoring and optimizing AI service performance with detailed metrics"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  inputSize?: number;
  outputSize?: number;
  tokenCount?: number;
  retryCount?: number;
  cacheHit?: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalTokens: number;
  cacheHitRate: number;
  errorRate: number;
  operationBreakdown: Record<string, {
    count: number;
    averageDuration: number;
    successRate: number;
  }>;
}

export interface PerformanceThresholds {
  maxDuration: number;
  maxTokens: number;
  maxRetries: number;
  minSuccessRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private activeOperations: Map<string, PerformanceMetrics> = new Map();
  private thresholds: PerformanceThresholds = {
    maxDuration: 30000, // 30 seconds
    maxTokens: 4000,
    maxRetries: 3,
    minSuccessRate: 0.95
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring an operation
   */
  startOperation(
    operationName: string, 
    metadata?: Record<string, any>
  ): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetrics = {
      operationName,
      startTime: Date.now(),
      success: false,
      metadata
    };

    this.activeOperations.set(operationId, metric);
    return operationId;
  }

  /**
   * End monitoring an operation
   */
  endOperation(
    operationId: string,
    success: boolean,
    options?: {
      errorMessage?: string;
      inputSize?: number;
      outputSize?: number;
      tokenCount?: number;
      retryCount?: number;
      cacheHit?: boolean;
    }
  ): PerformanceMetrics | null {
    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      console.warn(`Performance metric not found for operation: ${operationId}`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    
    if (options) {
      Object.assign(metric, options);
    }

    this.metrics.push(metric);
    this.activeOperations.delete(operationId);

    // Check for performance issues
    this.checkPerformanceThresholds(metric);

    return metric;
  }

  /**
   * Monitor an async operation with automatic timing
   */
  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = this.startOperation(operationName, metadata);
    
    try {
      const result = await operation();
      
      this.endOperation(operationId, true, {
        outputSize: typeof result === 'string' ? result.length : JSON.stringify(result).length
      });
      
      return result;
    } catch (error) {
      this.endOperation(operationId, false, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): PerformanceStats {
    const cutoffTime = timeWindow ? Date.now() - timeWindow : 0;
    const relevantMetrics = this.metrics.filter(m => m.startTime >= cutoffTime);

    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalTokens: 0,
        cacheHitRate: 0,
        errorRate: 0,
        operationBreakdown: {}
      };
    }

    const successfulOps = relevantMetrics.filter(m => m.success);
    const durations = relevantMetrics.map(m => m.duration || 0);
    const tokens = relevantMetrics.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
    const cacheHits = relevantMetrics.filter(m => m.cacheHit).length;

    // Calculate operation breakdown
    const operationBreakdown: Record<string, any> = {};
    for (const metric of relevantMetrics) {
      if (!operationBreakdown[metric.operationName]) {
        operationBreakdown[metric.operationName] = {
          count: 0,
          totalDuration: 0,
          successCount: 0
        };
      }
      
      const breakdown = operationBreakdown[metric.operationName];
      breakdown.count++;
      breakdown.totalDuration += metric.duration || 0;
      if (metric.success) breakdown.successCount++;
    }

    // Calculate averages for breakdown
    for (const [opName, data] of Object.entries(operationBreakdown)) {
      operationBreakdown[opName] = {
        count: data.count,
        averageDuration: data.totalDuration / data.count,
        successRate: data.successCount / data.count
      };
    }

    return {
      totalOperations: relevantMetrics.length,
      successfulOperations: successfulOps.length,
      failedOperations: relevantMetrics.length - successfulOps.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalTokens: tokens,
      cacheHitRate: relevantMetrics.length > 0 ? cacheHits / relevantMetrics.length : 0,
      errorRate: relevantMetrics.length > 0 ? (relevantMetrics.length - successfulOps.length) / relevantMetrics.length : 0,
      operationBreakdown
    };
  }

  /**
   * Get recent performance issues
   */
  getPerformanceIssues(timeWindow: number = 3600000): Array<{
    type: string;
    message: string;
    metric: PerformanceMetrics;
    severity: 'low' | 'medium' | 'high';
  }> {
    const cutoffTime = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.startTime >= cutoffTime);
    const issues: Array<any> = [];

    for (const metric of recentMetrics) {
      // Check duration threshold
      if (metric.duration && metric.duration > this.thresholds.maxDuration) {
        issues.push({
          type: 'slow_operation',
          message: `Operation '${metric.operationName}' took ${metric.duration}ms (threshold: ${this.thresholds.maxDuration}ms)`,
          metric,
          severity: metric.duration > this.thresholds.maxDuration * 2 ? 'high' : 'medium'
        });
      }

      // Check token usage
      if (metric.tokenCount && metric.tokenCount > this.thresholds.maxTokens) {
        issues.push({
          type: 'high_token_usage',
          message: `Operation '${metric.operationName}' used ${metric.tokenCount} tokens (threshold: ${this.thresholds.maxTokens})`,
          metric,
          severity: metric.tokenCount > this.thresholds.maxTokens * 1.5 ? 'high' : 'medium'
        });
      }

      // Check retry count
      if (metric.retryCount && metric.retryCount > this.thresholds.maxRetries) {
        issues.push({
          type: 'excessive_retries',
          message: `Operation '${metric.operationName}' required ${metric.retryCount} retries (threshold: ${this.thresholds.maxRetries})`,
          metric,
          severity: 'high'
        });
      }

      // Check for failures
      if (!metric.success) {
        issues.push({
          type: 'operation_failure',
          message: `Operation '${metric.operationName}' failed: ${metric.errorMessage || 'Unknown error'}`,
          metric,
          severity: 'medium'
        });
      }
    }

    return issues;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const stats = this.getStats(3600000); // Last hour
    const recommendations: Array<any> = [];

    // Check error rate
    if (stats.errorRate > 1 - this.thresholds.minSuccessRate) {
      recommendations.push({
        type: 'high_error_rate',
        message: `Error rate is ${(stats.errorRate * 100).toFixed(1)}% (threshold: ${((1 - this.thresholds.minSuccessRate) * 100).toFixed(1)}%). Consider implementing better error handling and retry logic.`,
        priority: 'high'
      });
    }

    // Check average duration
    if (stats.averageDuration > this.thresholds.maxDuration * 0.7) {
      recommendations.push({
        type: 'slow_operations',
        message: `Average operation duration is ${stats.averageDuration.toFixed(0)}ms. Consider optimizing prompts or implementing caching.`,
        priority: 'medium'
      });
    }

    // Check cache hit rate
    if (stats.cacheHitRate < 0.3 && stats.totalOperations > 10) {
      recommendations.push({
        type: 'low_cache_hit_rate',
        message: `Cache hit rate is ${(stats.cacheHitRate * 100).toFixed(1)}%. Consider implementing or improving caching strategies.`,
        priority: 'medium'
      });
    }

    // Check token usage
    if (stats.totalTokens > this.thresholds.maxTokens * stats.totalOperations * 0.8) {
      recommendations.push({
        type: 'high_token_usage',
        message: 'High token usage detected. Consider optimizing prompts or implementing prompt compression.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(maxAge: number = 86400000): void { // 24 hours default
    const cutoffTime = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.startTime >= cutoffTime);
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'operationName', 'startTime', 'duration', 'success', 
        'errorMessage', 'inputSize', 'outputSize', 'tokenCount', 
        'retryCount', 'cacheHit'
      ];
      
      const rows = this.metrics.map(m => [
        m.operationName,
        new Date(m.startTime).toISOString(),
        m.duration || 0,
        m.success,
        m.errorMessage || '',
        m.inputSize || 0,
        m.outputSize || 0,
        m.tokenCount || 0,
        m.retryCount || 0,
        m.cacheHit || false
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Check if a metric exceeds performance thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const issues: string[] = [];

    if (metric.duration && metric.duration > this.thresholds.maxDuration) {
      issues.push(`Duration exceeded: ${metric.duration}ms > ${this.thresholds.maxDuration}ms`);
    }

    if (metric.tokenCount && metric.tokenCount > this.thresholds.maxTokens) {
      issues.push(`Token count exceeded: ${metric.tokenCount} > ${this.thresholds.maxTokens}`);
    }

    if (metric.retryCount && metric.retryCount > this.thresholds.maxRetries) {
      issues.push(`Retry count exceeded: ${metric.retryCount} > ${this.thresholds.maxRetries}`);
    }

    if (issues.length > 0) {
      console.warn(`Performance threshold violations for ${metric.operationName}:`, issues);
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();