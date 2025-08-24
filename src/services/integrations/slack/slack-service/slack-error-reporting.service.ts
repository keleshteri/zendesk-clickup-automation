/**
 * @ai-metadata
 * @component: SlackErrorReportingService
 * @description: Comprehensive error reporting service for centralized Slack error tracking, analytics, and alerting
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-service.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../interfaces", "../utils"]
 * @tests: ["./tests/slack-error-reporting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central error reporting service that provides comprehensive error tracking, analytics, persistence, and alerting for all Slack integration errors"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../../types';
import type {
  SlackErrorReport,
  ErrorSource,
  ErrorContext,
  ErrorStatistics,
  ErrorQueryFilters,
  ErrorReportingConfig,
  ErrorAlertConfig,
  ISlackErrorReportingService
} from '../interfaces/slack-error-reporting.interface';
import { ErrorCategory, ErrorSeverity } from '../interfaces/slack-error-reporting.interface';
import type { SlackAPIError, SlackAPIErrorWithContext } from '../interfaces/slack-error.interface';
import {
  isSlackAPIError,
  isSlackRateLimitError,
  isSlackPlatformError,
  createSlackErrorWithContext,
  logSlackError
} from '../utils/slack-error.utils';
import {
  enhanceErrorReport,
  getSeverityDescription,
  getCategoryDescription,
  getSeverityEmoji,
  getCategoryEmoji
} from '../utils/slack-error-categorizer.util';
import {
  getErrorReportingConfig,
  validateErrorReportingConfig,
  getConfigSummary
} from '../../../../config/error-reporting.config';

/**
 * Comprehensive error reporting service for Slack integration
 * Provides centralized error tracking, analytics, persistence, and alerting
 */
export class SlackErrorReportingService implements ISlackErrorReportingService {
  private client: WebClient;
  private env: Env;
  private config: ErrorReportingConfig;
  private messagingService?: any;
  private errorStore: Map<string, SlackErrorReport> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private alertCounts = new Map<string, number>();

  /**
   * Initialize the error reporting service
   * @param client - The Slack WebClient instance
   * @param env - Environment configuration
   * @param config - Optional custom configuration (overrides environment-based config)
   * @param messagingService - Optional messaging service for notifications
   */
  constructor(
    client: WebClient, 
    env: Env, 
    config?: ErrorReportingConfig,
    messagingService?: any
  ) {
    this.client = client;
    this.env = env;
    this.messagingService = messagingService;
    
    // Get configuration from environment or use provided config
    this.config = config || getErrorReportingConfig(env);
    
    // Validate configuration
    const validationErrors = validateErrorReportingConfig(this.config);
    if (validationErrors.length > 0) {
      console.warn('Error reporting configuration validation warnings:', validationErrors);
    }
    
    // Log configuration summary
    console.log('Error reporting service initialized with configuration:\n' + getConfigSummary(this.config));
    
    // Initialize cleanup interval
    this.scheduleCleanup();
  }

  /**
   * Report a new error to the centralized error tracking system
   * @param error - The error to report (Slack API error or generic Error)
   * @param source - Information about where the error occurred (optional for test convenience)
   * @param context - Additional context about the error
   * @returns Promise that resolves to the error report
   */
  async reportError(
    error: SlackAPIError | Error,
    source?: ErrorSource,
    context: Partial<ErrorContext> = {}
  ): Promise<SlackErrorReport> {
    console.log('🔥 reportError called with:', { error: error.message, source, context });
    // Default source for single-parameter calls (used in tests)
    const defaultSource: ErrorSource = {
      service: 'test',
      method: 'unknown',
      file: 'test',
      line: 0
    };
    
    const actualSource = source || defaultSource;
    console.log('🚀 reportError called with:', { error, source: actualSource, context });
    try {
      // Convert to SlackAPIErrorWithContext if needed
      const slackError = this.normalizeError(error, actualSource, context);
      console.log('🚀 slackError normalized:', slackError);
      
      // Generate unique error ID
      const errorId = this.generateErrorId(slackError, actualSource);
      
      // Check if this is a duplicate error
      const existingError = this.errorStore.get(errorId);
      if (existingError) {
        return this.updateExistingError(existingError, slackError);
      }
      
      // Create initial error report
      const initialReport: SlackErrorReport = {
        id: errorId,
        timestamp: new Date(),
        severity: ErrorSeverity.MEDIUM, // Will be enhanced
        category: ErrorCategory.UNKNOWN, // Will be enhanced
        source: actualSource,
        context: this.enrichContext(context),
        error: slackError,
        message: this.generateErrorMessage(slackError, actualSource),
        resolved: false,
        occurrenceCount: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        tags: []
      };
      
      // Enhance error report with automatic categorization
      console.log('🚀 Before enhanceErrorReport:', { category: initialReport.category, severity: initialReport.severity, message: initialReport.message });
      const enhancedReport = enhanceErrorReport(initialReport);
      console.log('🚀 After enhanceErrorReport:', { category: enhancedReport.category, severity: enhancedReport.severity });
      
      // Store the error report
      this.errorStore.set(errorId, enhancedReport);
      
      // Persist to KV storage if available
      await this.persistError(enhancedReport);
      
      // Update statistics cache
      await this.updateStatisticsCache(enhancedReport);
      
      // Log the error
      this.logError(enhancedReport);
      
      // Send alerts if configured
      if (this.shouldSendAlert(enhancedReport)) {
        await this.sendAlert(enhancedReport);
      }
      
      return enhancedReport;
    } catch (reportingError) {
      // Fallback logging if error reporting itself fails
      console.error('❌ Failed to report error:', reportingError);
      console.error('❌ Error stack:', reportingError instanceof Error ? reportingError.stack : 'No stack');
      console.error('Original error:', error);
      // Return a minimal error report for the failure case
      const now = new Date();
      return {
        id: 'error-reporting-failed',
        timestamp: now,
        error: { name: 'ReportingError', message: 'Failed to report error', stack: '', code: 'REPORTING_ERROR' },
        category: ErrorCategory.CONFIG,
        severity: ErrorSeverity.CRITICAL,
        source,
        context: this.enrichContext(context),
        message: 'Failed to report error',
        resolved: false,
        occurrenceCount: 1,
        firstSeen: now,
        lastSeen: now,
        tags: ['error-reporting-failure']
      } as SlackErrorReport;
    }
  }

  /**
   * Get error reports with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise that resolves to filtered error reports
   */
  async getErrors(filters: ErrorQueryFilters = {}): Promise<SlackErrorReport[]> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      // Fallback to in-memory store if KV is not available
      return this.getErrorsFromMemory(filters);
    }

    try {
      let errors: SlackErrorReport[] = [];
      
      // Use indexes for efficient querying when possible
      if (filters.severity?.length || filters.category?.length || filters.service?.length) {
        errors = await this.getErrorsFromIndexes(filters);
      } else {
        // Full scan for complex queries
        errors = await this.getAllErrorsFromKV();
      }

      // Apply remaining filters
      errors = this.applyFilters(errors, filters);

      // Sort by timestamp (newest first)
      errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      if (filters.offset) {
        errors = errors.slice(filters.offset);
      }

      if (filters.limit) {
        errors = errors.slice(0, filters.limit);
      }

      return errors;
    } catch (error) {
      console.error('Failed to get errors from KV storage:', error);
      // Fallback to in-memory store
      return this.getErrorsFromMemory(filters);
    }
  }

  /**
   * Get error statistics for analytics
   * @param timeRange - Optional time range for statistics
   * @returns Promise that resolves to error statistics
   */
  async getStatistics(timeRange?: { from: Date; to: Date }): Promise<ErrorStatistics> {
    let errors = Array.from(this.errorStore.values());
    
    // Filter by time range if provided
    if (timeRange) {
      errors = errors.filter(error => 
        error.timestamp >= timeRange.from &&
        error.timestamp <= timeRange.to
      );
    }
    
    // Calculate statistics
    const totalErrors = errors.length;
    
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<ErrorSeverity, number>);
    
    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<ErrorCategory, number>);
    
    const byService = errors.reduce((acc, error) => {
      acc[error.source.service] = (acc[error.source.service] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<string, number>);
    
    // Get top errors
    const topErrors = errors
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10)
      .map(error => ({
        message: error.message,
        count: error.occurrenceCount,
        category: error.category,
        severity: error.severity
      }));
    
    // Generate trends (simplified - group by hour)
    const trends = this.generateTrends(errors, timeRange);
    
    return {
      totalErrors,
      bySeverity,
      byCategory,
      byService,
      topErrors,
      trends
    };
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
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const recentErrors = await this.getErrors({
       dateRange: { from: oneHourAgo, to: now }
     });
     
     const previousHourErrors = await this.getErrors({
       dateRange: { from: twoHoursAgo, to: oneHourAgo }
     });
    
    const activeErrors = recentErrors.filter(error => !error.resolved).length;
     const criticalErrors = recentErrors.filter(error => error.severity === 'critical').length;
    const lastHourErrors = recentErrors.length;
    const previousHourCount = previousHourErrors.length;
    
    const errorRateChange = previousHourCount > 0 
      ? ((lastHourErrors - previousHourCount) / previousHourCount) * 100
      : lastHourErrors > 0 ? 100 : 0;
    
    // Calculate average response time (simplified)
     const responseTimes = recentErrors
       .map(error => error.context.metadata?.responseTime)
       .filter(time => time !== undefined) as number[];
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    return {
      currentErrorRate: lastHourErrors / 60, // errors per minute
      averageResponseTime,
      activeErrors,
      criticalErrors,
      lastHourErrors,
      errorRateChange
    };
  }

  /**
   * Get error analytics dashboard data
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
      severity: ErrorSeverity;
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
    const [overview, realTimeMetrics, errors] = await Promise.all([
       this.getStatistics(timeRange),
       this.getRealTimeMetrics(),
       this.getErrors({ dateRange: timeRange })
     ]);
    
    // Analyze error patterns
    const errorPatterns = this.analyzeErrorPatterns(errors);
    
    // Calculate service health
    const serviceHealth = this.calculateServiceHealth(errors, timeRange);
    
    // Calculate resolution metrics
    const resolutionMetrics = this.calculateResolutionMetrics(errors);
    
    return {
      overview,
      realTimeMetrics,
      errorPatterns,
      serviceHealth,
      resolutionMetrics
    };
  }

  /**
   * Get error forecasting data
   * @param days - Number of days to forecast
   * @returns Promise that resolves to forecasting data
   */
  async getErrorForecast(days: number = 7): Promise<{
    forecast: Array<{
      date: string;
      predictedErrors: number;
      confidence: number;
    }>;
    recommendations: string[];
  }> {
    const now = new Date();
    const pastDays = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const historicalErrors = await this.getErrors({
       dateRange: { from: pastDays, to: now }
     });
    
    // Simple linear regression for forecasting
    const dailyErrorCounts = this.groupErrorsByDay(historicalErrors);
    const forecast = this.generateForecast(dailyErrorCounts, days);
    const recommendations = this.generateRecommendations(historicalErrors, forecast);
    
    return {
      forecast,
      recommendations
    };
  }

  /**
   * Mark an error as resolved
   * @param errorId - The ID of the error to resolve
   * @param resolution - Resolution details
   * @returns Promise that resolves to true if successful
   */
  async resolveError(
    errorId: string,
    resolution: SlackErrorReport['resolution']
  ): Promise<boolean> {
    const error = this.errorStore.get(errorId);
    if (!error) {
      return false;
    }
    
    error.resolved = true;
    error.resolution = {
      ...resolution,
      resolvedAt: new Date()
    };
    
    // Update in storage
    await this.persistError(error);
    
    return true;
  }

  /**
   * Get error by ID
   * @param errorId - The error ID to retrieve
   * @returns Promise that resolves to the error report or null
   */
  async getError(errorId: string): Promise<SlackErrorReport | null> {
    // Try KV storage first
    if (this.env.SLACK_ERROR_REPORTS) {
      try {
        const errorData = await this.env.SLACK_ERROR_REPORTS.get(`error:${errorId}`);
        if (errorData) {
          return JSON.parse(errorData);
        }
      } catch (error) {
        console.error(`Failed to get error ${errorId} from KV storage:`, error);
      }
    }
    
    // Fallback to in-memory store
    return this.errorStore.get(errorId) || null;
  }

  /**
   * Delete old error reports based on retention policy
   * @returns Promise that resolves to the number of errors cleaned up
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    let cleanedCount = 0;
    
    // Clean up in-memory store
    for (const [errorId, error] of this.errorStore.entries()) {
      if (error.timestamp < cutoffDate) {
        this.errorStore.delete(errorId);
        await this.deletePersistedError(errorId);
        cleanedCount++;
      }
    }
    
    // Clean up alert cooldowns
    const now = new Date();
    for (const [key, cooldownEnd] of this.alertCooldowns.entries()) {
      if (now > cooldownEnd) {
        this.alertCooldowns.delete(key);
      }
    }
    
    // Clean up persisted errors and indexes
    if (this.env.SLACK_ERROR_REPORTS) {
      try {
        // Clean up main error records
        const errorList = await this.env.SLACK_ERROR_REPORTS.list({ prefix: 'error:' });
        for (const key of errorList.keys) {
          const errorData = await this.env.SLACK_ERROR_REPORTS.get(key.name);
          if (errorData) {
            try {
              const error: SlackErrorReport = JSON.parse(errorData);
              if (error.timestamp < cutoffDate) {
                await this.deletePersistedError(error.id);
                cleanedCount++;
              }
            } catch (parseError) {
              // Delete corrupted data
              await this.env.SLACK_ERROR_REPORTS.delete(key.name);
              cleanedCount++;
            }
          }
        }
        
        // Clean up orphaned indexes
        await this.cleanupOrphanedIndexes(cutoffDate);
        
      } catch (error) {
        console.error('Failed to cleanup persisted errors:', error);
      }
    }
    
    // Also clean up resolved errors if auto-resolve is enabled
    if (this.config?.autoResolve?.enabled) {
      const autoResolveCutoff = new Date();
      autoResolveCutoff.setHours(autoResolveCutoff.getHours() - this.config.autoResolve.maxAge);
      
      for (const [errorId, error] of this.errorStore.entries()) {
        if (
          !error.resolved &&
          error.timestamp < autoResolveCutoff &&
          this.config.autoResolve.categories.includes(error.category)
        ) {
          await this.resolveError(errorId, {
            method: 'manual',
            resolvedAt: new Date(),
            details: 'Auto-resolved due to age and category'
          });
        }
      }
    }
    
    return cleanedCount;
  }

  /**
   * Update error reporting configuration
   * @param config - Partial configuration to update
   * @returns Promise that resolves to true if successful
   */
  async updateConfig(config: Partial<ErrorReportingConfig>): Promise<boolean> {
    this.config = { ...this.config, ...config };
    
    // Persist configuration if KV is available
    if (this.env.SLACK_ERROR_REPORTS) {
      try {
        await this.env.SLACK_ERROR_REPORTS.put(
          'error-reporting-config',
          JSON.stringify(this.config)
        );
      } catch (error) {
        console.error('Failed to persist error reporting config:', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get current configuration
   * @returns Promise that resolves to current configuration
   */
  async getConfig(): Promise<ErrorReportingConfig> {
    return { ...this.config };
  }

  /**
   * Check if error should trigger an alert
   */
  private shouldAlert(errorReport: SlackErrorReport, alertConfig: ErrorAlertConfig): boolean {
    // Check severity threshold
    const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
    const errorSeverityIndex = severityLevels.indexOf(errorReport.severity);
    const thresholdIndex = severityLevels.indexOf(alertConfig.severityThreshold);
    
    if (errorSeverityIndex < thresholdIndex) {
      return false;
    }
    
    // Check if category is in alert categories
    if (alertConfig.categories.length > 0 && !alertConfig.categories.includes(errorReport.category)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if alerts are rate limited
   */
  private async isRateLimited(rateLimit: ErrorAlertConfig['rateLimit']): Promise<boolean> {
    try {
      const now = Date.now();
      const windowStart = now - (rateLimit.timeWindow * 60 * 1000);
      const alertKey = `alert_count:${Math.floor(windowStart / (rateLimit.timeWindow * 60 * 1000))}`;
      
      if (this.env?.SLACK_ERROR_REPORTS) {
        const currentCount = await this.env.SLACK_ERROR_REPORTS.get(alertKey);
        const count = currentCount ? parseInt(currentCount) : 0;
        
        return count >= rateLimit.maxAlerts;
      }
      
      // Fallback to in-memory rate limiting
      const memoryKey = `alert_${Math.floor(now / (rateLimit.timeWindow * 60 * 1000))}`;
      const memoryCount = this.alertCounts.get(memoryKey) || 0;
      
      return memoryCount >= rateLimit.maxAlerts;
    } catch (error) {
       console.warn(`Rate limit check failed: ${error}`);
       return false;
     }
  }

  /**
   * Record that an alert was sent
   */
  private async recordAlertSent(): Promise<void> {
    try {
      const now = Date.now();
      const rateLimit = this.config.alerts.rateLimit;
      const windowStart = now - (rateLimit.timeWindow * 60 * 1000);
      const alertKey = `alert_count:${Math.floor(windowStart / (rateLimit.timeWindow * 60 * 1000))}`;
      
      if (this.env?.SLACK_ERROR_REPORTS) {
        const currentCount = await this.env.SLACK_ERROR_REPORTS.get(alertKey);
        const count = currentCount ? parseInt(currentCount) + 1 : 1;
        
        await this.env.SLACK_ERROR_REPORTS.put(
          alertKey, 
          count.toString(), 
          { expirationTtl: rateLimit.timeWindow * 60 + 300 } // Extra 5 minutes buffer
        );
      } else {
        // Fallback to in-memory tracking
        const memoryKey = `alert_${Math.floor(now / (rateLimit.timeWindow * 60 * 1000))}`;
        const memoryCount = this.alertCounts.get(memoryKey) || 0;
        this.alertCounts.set(memoryKey, memoryCount + 1);
        
        // Clean up old entries
        this.cleanupAlertCounts();
      }
    } catch (error) {
       console.warn(`Failed to record alert: ${error}`);
     }
  }

  /**
   * Send alert to specific Slack channel
   */
  private async sendAlertToChannel(
    errorReport: SlackErrorReport, 
    channel: string, 
    includeDetails: boolean
  ): Promise<boolean> {
    try {
      const alertMessage = this.formatAlertMessage(errorReport, includeDetails);
       
       if (this.messagingService) {
         await this.messagingService.sendMessage({
           channel,
           text: alertMessage.text,
           blocks: alertMessage.blocks
         });
       } else {
         // Fallback to direct client usage
         await this.client.chat.postMessage({
           channel,
           text: alertMessage.text,
           blocks: alertMessage.blocks
         });
       }
      
      return true;
    } catch (error) {
       console.error(`Failed to send alert to channel ${channel}: ${error}`);
       return false;
     }
  }

  /**
   * Format alert message for Slack
   */
  private formatAlertMessage(errorReport: SlackErrorReport, includeDetails: boolean) {
    const severityEmoji = getSeverityEmoji(errorReport.severity);
    const categoryEmoji = getCategoryEmoji(errorReport.category);
    const severityDesc = getSeverityDescription(errorReport.severity);
    const categoryDesc = getCategoryDescription(errorReport.category);
    
    const text = `🚨 *Error Alert* ${severityEmoji}\n` +
      `*Severity:* ${severityDesc} (${errorReport.severity})\n` +
      `*Category:* ${categoryDesc} (${errorReport.category})\n` +
      `*Service:* ${errorReport.source.service}\n` +
      `*Message:* ${errorReport.message}`;
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Error Alert ${severityEmoji}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${severityDesc}`
          },
          {
            type: 'mrkdwn',
            text: `*Category:*\n${categoryDesc}`
          },
          {
            type: 'mrkdwn',
            text: `*Service:*\n${errorReport.source.service}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${errorReport.timestamp.toISOString()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Message:*\n\`\`\`${errorReport.message}\`\`\``
        }
      }
    ];
    
    if (includeDetails) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n` +
            `• Method: ${errorReport.source.method}\n` +
            `• File: ${errorReport.source.file || 'Unknown'}\n` +
            `• Occurrence Count: ${errorReport.occurrenceCount}\n` +
            `• First Seen: ${errorReport.firstSeen.toISOString()}\n` +
            `• Error ID: \`${errorReport.id}\``
        }
      });
      
      if (errorReport.context.stackTrace) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Stack Trace:*\n\`\`\`${errorReport.context.stackTrace.substring(0, 500)}${errorReport.context.stackTrace.length > 500 ? '...' : ''}\`\`\``
          }
        });
      }
    }
    
    return { text, blocks };
  }

  /**
   * Clean up old alert count entries from memory
   */
  private cleanupAlertCounts(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, timestamp] of this.alertCounts.entries()) {
      if (now - timestamp > maxAge) {
        this.alertCounts.delete(key);
      }
    }
  }

  /**
   * Send error alerts to configured channels
   * @param errorReport - The error report to send alerts for
   * @returns Promise that resolves to true if successful
   */
  async sendAlert(errorReport: SlackErrorReport): Promise<boolean> {
    try {
      const config = await this.getConfig();
      
      // Check if alerts are enabled
      if (!config.alerts.enabled) {
        return false;
      }
      
      // Check if error meets alert criteria
      if (!this.shouldAlert(errorReport, config.alerts)) {
        return false;
      }
      
      // Check rate limiting
       if (await this.isRateLimited(config.alerts.rateLimit)) {
         console.warn('Alert rate limit exceeded, skipping alert');
         return false;
       }
      
      // Send alert to configured channels
      const alertPromises = config.alerts.alertChannels.map(channel => 
        this.sendAlertToChannel(errorReport, channel, config.alerts.includeDetails)
      );
      
      const results = await Promise.allSettled(alertPromises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      
      // Record alert sent
      await this.recordAlertSent();
      
      return successCount > 0;
    } catch (error) {
       console.error(`Failed to send alert: ${error}`);
       return false;
     }
  }

  // Private helper methods

  private normalizeError(
    error: SlackAPIError | Error,
    source: ErrorSource,
    context: Partial<ErrorContext>
  ): SlackAPIErrorWithContext {
    if (isSlackAPIError(error)) {
      return createSlackErrorWithContext(error, {
        source: source.service,
        operation: source.method,
        metadata: context.metadata
      });
    }
    
    // Convert generic Error to SlackAPIError format
    return {
      code: 'generic_error',
      message: error.message,
      original: error,
      context: {
        source: source.service,
        operation: source.method,
        metadata: context.metadata
      },
      timestamp: new Date()
    };
  }





  private generateErrorId(error: SlackAPIErrorWithContext, source: ErrorSource): string {
    const errorSignature = `${source.service}-${source.method}-${error.code}-${error.message?.substring(0, 50) || 'unknown'}`;
    return btoa(errorSignature).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private updateExistingError(
    existingError: SlackErrorReport,
    newError: SlackAPIErrorWithContext
  ): SlackErrorReport {
    existingError.occurrenceCount++;
    existingError.lastSeen = new Date();
    existingError.error = newError;
    
    return existingError;
  }

  private enrichContext(context: Partial<ErrorContext>): ErrorContext {
    return {
      requestId: context.requestId || this.generateRequestId(),
      sessionId: context.sessionId,
      metadata: context.metadata || {},
      stackTrace: context.stackTrace,
      userAgent: context.userAgent,
      headers: context.headers,
      payload: context.payload
    };
  }

  private generateErrorMessage(
    error: SlackAPIErrorWithContext,
    source: ErrorSource
  ): string {
    return `${source.service}.${source.method}: ${error.message || error.code || 'Unknown error'}`;
  }



  private async persistError(errorReport: SlackErrorReport): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }
    
    try {
      const errorKey = `error:${errorReport.id}`;
      const errorData = JSON.stringify(errorReport);
      
      // Store the main error record
      await this.env.SLACK_ERROR_REPORTS.put(errorKey, errorData, {
        metadata: {
          severity: errorReport.severity,
          category: errorReport.category,
          timestamp: errorReport.timestamp,
          service: errorReport.source.service,
          resolved: !!errorReport.resolution
        }
      });
      
      // Create indexes for efficient querying
      await this.createErrorIndexes(errorReport);
      
    } catch (error) {
      console.error('Failed to persist error report:', error);
    }
  }

  private async deletePersistedError(errorId: string): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }
    
    try {
      // Get error data before deletion for index cleanup
      const errorData = await this.env.SLACK_ERROR_REPORTS.get(`error:${errorId}`);
      
      // Delete main error record
      await this.env.SLACK_ERROR_REPORTS.delete(`error:${errorId}`);
      
      // Clean up indexes
      if (errorData) {
        const errorReport: SlackErrorReport = JSON.parse(errorData);
        await this.removeErrorFromIndexes(errorReport);
      }
      
    } catch (error) {
      console.error('Failed to delete persisted error:', error);
    }
  }

  private logError(errorReport: SlackErrorReport): void {
    const logLevel = this.getLogLevel(errorReport.severity);
    const severityText = errorReport.severity ? errorReport.severity.toUpperCase() : 'UNKNOWN';
    const logMessage = `[${severityText}] ${errorReport.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorReport);
        break;
      case 'warn':
        console.warn(logMessage, errorReport);
        break;
      case 'info':
        console.info(logMessage, errorReport);
        break;
      default:
        console.log(logMessage, errorReport);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      case ErrorSeverity.INFO:
        return 'info';
      default:
        return 'log';
    }
  }

  private shouldSendAlert(errorReport: SlackErrorReport): boolean {
    if (!this.config.alerts.enabled) {
      return false;
    }
    
    // Check severity threshold
    const severityLevels = [ErrorSeverity.INFO, ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];
    const errorSeverityIndex = severityLevels.indexOf(errorReport.severity);
    const thresholdIndex = severityLevels.indexOf(this.config.alerts.severityThreshold);
    
    if (errorSeverityIndex < thresholdIndex) {
      return false;
    }
    
    // Check category filter
    if (!this.config.alerts.categories.includes(errorReport.category)) {
      return false;
    }
    
    return true;
  }



  private generateTrends(
    errors: SlackErrorReport[],
    timeRange?: { from: Date; to: Date }
  ): ErrorStatistics['trends'] {
    const trends: ErrorStatistics['trends'] = [];
    
    // Group errors by hour
    const hourlyGroups = new Map<string, { count: number; severity: ErrorSeverity }>();
    
    for (const error of errors) {
      const hourKey = new Date(error.timestamp.getFullYear(), error.timestamp.getMonth(), error.timestamp.getDate(), error.timestamp.getHours()).toISOString();
      
      const existing = hourlyGroups.get(hourKey);
      if (existing) {
        existing.count += error.occurrenceCount;
        // Keep the highest severity
        if (this.compareSeverity(error.severity, existing.severity) > 0) {
          existing.severity = error.severity;
        }
      } else {
        hourlyGroups.set(hourKey, {
          count: error.occurrenceCount,
          severity: error.severity
        });
      }
    }
    
    // Convert to trends array
    for (const [hourKey, data] of hourlyGroups.entries()) {
      trends.push({
        timestamp: new Date(hourKey),
        count: data.count,
        severity: data.severity
      });
    }
    
    // Sort by timestamp
    trends.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return trends;
  }

  private compareSeverity(a: ErrorSeverity, b: ErrorSeverity): number {
    const severityOrder = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.LOW]: 1,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.CRITICAL]: 4
    };
    
    return severityOrder[a] - severityOrder[b];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }



  private scheduleCleanup(): void {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Error during scheduled cleanup:', error);
      });
    }, 24 * 60 * 60 * 1000);
  }

  // Index management methods for efficient KV querying

  private async createErrorIndexes(errorReport: SlackErrorReport): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }

    try {
      const timestamp = errorReport.timestamp.toISOString();
      
      // Create severity index
      const severityKey = `index:severity:${errorReport.severity}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.put(severityKey, errorReport.id);
      
      // Create category index
      const categoryKey = `index:category:${errorReport.category}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.put(categoryKey, errorReport.id);
      
      // Create service index
      const serviceKey = `index:service:${errorReport.source.service}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.put(serviceKey, errorReport.id);
      
      // Create timestamp index for range queries
      const timestampKey = `index:timestamp:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.put(timestampKey, errorReport.id);
      
    } catch (error) {
      console.error('Failed to create error indexes:', error);
    }
  }

  private async removeErrorFromIndexes(errorReport: SlackErrorReport): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }

    try {
      const timestamp = errorReport.timestamp.toISOString();
      
      // Remove from severity index
      const severityKey = `index:severity:${errorReport.severity}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.delete(severityKey);
      
      // Remove from category index
      const categoryKey = `index:category:${errorReport.category}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.delete(categoryKey);
      
      // Remove from service index
      const serviceKey = `index:service:${errorReport.source.service}:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.delete(serviceKey);
      
      // Remove from timestamp index
      const timestampKey = `index:timestamp:${timestamp}:${errorReport.id}`;
      await this.env.SLACK_ERROR_REPORTS.delete(timestampKey);
      
    } catch (error) {
      console.error('Failed to remove error from indexes:', error);
    }
  }

  private async getErrorsFromIndexes(filters: ErrorQueryFilters): Promise<SlackErrorReport[]> {
    const errorIds = new Set<string>();
    
    // Query by severity
    if (filters.severity?.length) {
      for (const severity of filters.severity) {
        const severityIds = await this.getErrorIdsFromIndex('severity', severity);
        severityIds.forEach(id => errorIds.add(id));
      }
    }
    
    // Query by category
    if (filters.category?.length) {
      for (const category of filters.category) {
        const categoryIds = await this.getErrorIdsFromIndex('category', category);
        if (errorIds.size === 0) {
          categoryIds.forEach(id => errorIds.add(id));
        } else {
          // Intersection with existing results
          const intersection = categoryIds.filter(id => errorIds.has(id));
          errorIds.clear();
          intersection.forEach(id => errorIds.add(id));
        }
      }
    }
    
    // Query by service
    if (filters.service?.length) {
      for (const service of filters.service) {
        const serviceIds = await this.getErrorIdsFromIndex('service', service);
        if (errorIds.size === 0) {
          serviceIds.forEach(id => errorIds.add(id));
        } else {
          // Intersection with existing results
          const intersection = serviceIds.filter(id => errorIds.has(id));
          errorIds.clear();
          intersection.forEach(id => errorIds.add(id));
        }
      }
    }
    
    // Fetch actual error reports
    const errors: SlackErrorReport[] = [];
    for (const errorId of errorIds) {
      const errorData = await this.env.SLACK_ERROR_REPORTS!.get(`error:${errorId}`);
      if (errorData) {
        try {
          const errorReport: SlackErrorReport = JSON.parse(errorData);
          errors.push(errorReport);
        } catch (parseError) {
          console.error(`Failed to parse error report ${errorId}:`, parseError);
        }
      }
    }
    
    return errors;
  }

  private async getErrorIdsFromIndex(indexType: string, value: string): Promise<string[]> {
    const prefix = `index:${indexType}:${value}:`;
    const list = await this.env.SLACK_ERROR_REPORTS!.list({ prefix });
    
    return list.keys.map(key => key.name.split(':').pop()!).filter(Boolean);
  }

  private async getAllErrorsFromKV(): Promise<SlackErrorReport[]> {
    const list = await this.env.SLACK_ERROR_REPORTS!.list({ prefix: 'error:' });
    const errors: SlackErrorReport[] = [];
    
    for (const key of list.keys) {
      const errorData = await this.env.SLACK_ERROR_REPORTS!.get(key.name);
      if (errorData) {
        try {
          const errorReport: SlackErrorReport = JSON.parse(errorData);
          errors.push(errorReport);
        } catch (parseError) {
          console.error(`Failed to parse error report ${key.name}:`, parseError);
        }
      }
    }
    
    return errors;
  }

  private getErrorsFromMemory(filters: ErrorQueryFilters): SlackErrorReport[] {
    let errors = Array.from(this.errorStore.values());
    
    // Apply filters
    errors = this.applyFilters(errors, filters);
    
    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    if (filters.offset) {
      errors = errors.slice(filters.offset);
    }
    
    if (filters.limit) {
      errors = errors.slice(0, filters.limit);
    }
    
    return errors;
  }

  private applyFilters(errors: SlackErrorReport[], filters: ErrorQueryFilters): SlackErrorReport[] {
    // Apply filters
    if (filters.severity?.length) {
      errors = errors.filter(error => filters.severity!.includes(error.severity));
    }
    
    if (filters.category?.length) {
      errors = errors.filter(error => filters.category!.includes(error.category));
    }
    
    if (filters.service?.length) {
      errors = errors.filter(error => filters.service!.includes(error.source.service));
    }
    
    if (filters.userId) {
      errors = errors.filter(error => error.source.userId === filters.userId);
    }
    
    if (filters.channelId) {
      errors = errors.filter(error => error.source.channelId === filters.channelId);
    }
    
    if (filters.teamId) {
      errors = errors.filter(error => error.source.teamId === filters.teamId);
    }
    
    if (filters.dateRange) {
      errors = errors.filter(error => 
        error.timestamp >= filters.dateRange!.from &&
        error.timestamp <= filters.dateRange!.to
      );
    }
    
    if (filters.resolved !== undefined) {
      errors = errors.filter(error => error.resolved === filters.resolved);
    }
    
    if (filters.tags?.length) {
      errors = errors.filter(error => 
        filters.tags!.some(tag => error.tags.includes(tag))
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      errors = errors.filter(error => 
        error.message.toLowerCase().includes(searchLower) ||
        error.error.message?.toLowerCase().includes(searchLower)
      );
    }
    
    return errors;
  }

  /**
   * Update statistics cache with new error report
   * @param errorReport - The error report to add to statistics
   */
  private async updateStatisticsCache(errorReport: SlackErrorReport): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }

    try {
      // Update daily statistics
      const dateKey = errorReport.timestamp.toISOString().split('T')[0];
      const statsKey = `stats:daily:${dateKey}`;
      
      const existingStats = await this.env.SLACK_ERROR_REPORTS.get(statsKey);
      let dailyStats = existingStats ? JSON.parse(existingStats) : {
        date: dateKey,
        totalErrors: 0,
        bySeverity: {},
        byCategory: {},
        byService: {}
      };
      
      dailyStats.totalErrors += errorReport.occurrenceCount;
      dailyStats.bySeverity[errorReport.severity] = (dailyStats.bySeverity[errorReport.severity] || 0) + errorReport.occurrenceCount;
      dailyStats.byCategory[errorReport.category] = (dailyStats.byCategory[errorReport.category] || 0) + errorReport.occurrenceCount;
      dailyStats.byService[errorReport.source.service] = (dailyStats.byService[errorReport.source.service] || 0) + errorReport.occurrenceCount;
      
      await this.env.SLACK_ERROR_REPORTS.put(statsKey, JSON.stringify(dailyStats));
      
    } catch (error) {
      console.error('Failed to update statistics cache:', error);
    }
  }

  /**
   * Clean up orphaned indexes that no longer have corresponding error records
   * @param cutoffDate - Date before which to clean up indexes
   */
  private async cleanupOrphanedIndexes(cutoffDate: Date): Promise<void> {
    if (!this.env.SLACK_ERROR_REPORTS) {
      return;
    }

    try {
      const indexPrefixes = ['index:severity:', 'index:category:', 'index:service:', 'index:timestamp:'];
      
      for (const prefix of indexPrefixes) {
        const indexList = await this.env.SLACK_ERROR_REPORTS.list({ prefix });
        
        for (const key of indexList.keys) {
          // Extract timestamp from index key
          const keyParts = key.name.split(':');
          if (keyParts.length >= 4) {
            try {
              const timestamp = new Date(keyParts[2]);
              if (timestamp < cutoffDate) {
                await this.env.SLACK_ERROR_REPORTS.delete(key.name);
              }
            } catch (dateError) {
              // Delete malformed index keys
              await this.env.SLACK_ERROR_REPORTS.delete(key.name);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to cleanup orphaned indexes:', error);
    }
  }

  // Analytics helper methods

  /**
   * Analyze error patterns to identify common issues
   * @param errors - Array of error reports to analyze
   * @returns Array of error patterns with trends
   */
  private analyzeErrorPatterns(errors: SlackErrorReport[]): Array<{
    pattern: string;
    count: number;
    severity: ErrorSeverity;
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const patterns = new Map<string, {
      count: number;
      severity: ErrorSeverity;
      timestamps: Date[];
    }>();

    // Group errors by pattern (simplified - using error code + category)
    for (const error of errors) {
      const pattern = `${error.error.code}-${error.category}`;
      const existing = patterns.get(pattern);
      
      if (existing) {
        existing.count += error.occurrenceCount;
        existing.timestamps.push(error.timestamp);
        // Keep highest severity
        if (this.compareSeverity(error.severity, existing.severity) > 0) {
          existing.severity = error.severity;
        }
      } else {
        patterns.set(pattern, {
          count: error.occurrenceCount,
          severity: error.severity,
          timestamps: [error.timestamp]
        });
      }
    }

    // Calculate trends and format results
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        severity: data.severity,
        trend: this.calculateTrend(data.timestamps)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 patterns
  }

  /**
   * Calculate service health metrics
   * @param errors - Array of error reports
   * @param timeRange - Time range for calculations
   * @returns Array of service health metrics
   */
  private calculateServiceHealth(errors: SlackErrorReport[], timeRange: { from: Date; to: Date }): Array<{
    service: string;
    errorCount: number;
    errorRate: number;
    availability: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const serviceMetrics = new Map<string, {
      errorCount: number;
      totalRequests: number;
    }>();

    // Group errors by service
    for (const error of errors) {
      const service = error.source.service;
      const existing = serviceMetrics.get(service);
      
      if (existing) {
        existing.errorCount += error.occurrenceCount;
        existing.totalRequests += error.occurrenceCount; // Simplified
      } else {
        serviceMetrics.set(service, {
          errorCount: error.occurrenceCount,
          totalRequests: error.occurrenceCount * 10 // Estimated total requests
        });
      }
    }

    return Array.from(serviceMetrics.entries()).map(([service, metrics]) => {
      const errorRate = metrics.errorCount / metrics.totalRequests;
      const availability = Math.max(0, (1 - errorRate) * 100);
      
      let status: 'healthy' | 'warning' | 'critical';
      if (availability >= 99.5) {
        status = 'healthy';
      } else if (availability >= 95) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      return {
        service,
        errorCount: metrics.errorCount,
        errorRate: errorRate * 100,
        availability,
        status
      };
    }).sort((a, b) => b.errorCount - a.errorCount);
  }

  /**
   * Calculate resolution metrics
   * @param errors - Array of error reports
   * @returns Resolution metrics
   */
  private calculateResolutionMetrics(errors: SlackErrorReport[]): {
    averageResolutionTime: number;
    resolutionRate: number;
    unresolvedErrors: number;
  } {
    const resolvedErrors = errors.filter(error => error.resolved && error.resolution?.resolvedAt);
    const unresolvedErrors = errors.filter(error => !error.resolved).length;
    
    let totalResolutionTime = 0;
    for (const error of resolvedErrors) {
      if (error.resolution?.resolvedAt) {
        const resolutionTime = error.resolution.resolvedAt.getTime() - error.firstSeen.getTime();
        totalResolutionTime += resolutionTime;
      }
    }

    const averageResolutionTime = resolvedErrors.length > 0 
      ? totalResolutionTime / resolvedErrors.length / (1000 * 60 * 60) // Convert to hours
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
   * Calculate trend for a series of timestamps
   * @param timestamps - Array of timestamps
   * @returns Trend direction
   */
  private calculateTrend(timestamps: Date[]): 'increasing' | 'decreasing' | 'stable' {
    if (timestamps.length < 2) {
      return 'stable';
    }

    // Sort timestamps
    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const midpoint = Math.floor(sorted.length / 2);
    
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, ts) => sum + ts.getTime(), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, ts) => sum + ts.getTime(), 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    const threshold = 60 * 60 * 1000; // 1 hour threshold
    
    if (difference > threshold) {
      return 'increasing';
    } else if (difference < -threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Group errors by day for forecasting
   * @param errors - Array of error reports
   * @returns Map of daily error counts
   */
  private groupErrorsByDay(errors: SlackErrorReport[]): Map<string, number> {
    const dailyCounts = new Map<string, number>();
    
    for (const error of errors) {
      const dateKey = error.timestamp.toISOString().split('T')[0];
      const existing = dailyCounts.get(dateKey) || 0;
      dailyCounts.set(dateKey, existing + error.occurrenceCount);
    }
    
    return dailyCounts;
  }

  /**
   * Generate error forecast using simple linear regression
   * @param dailyCounts - Historical daily error counts
   * @param days - Number of days to forecast
   * @returns Forecast data
   */
  private generateForecast(dailyCounts: Map<string, number>, days: number): Array<{
    date: string;
    predictedErrors: number;
    confidence: number;
  }> {
    const dataPoints = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ x: new Date(date).getTime(), y: count }))
      .sort((a, b) => a.x - b.x);
    
    if (dataPoints.length < 2) {
      // Not enough data for forecasting
      return [];
    }

    // Simple linear regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
    const residualSumSquares = dataPoints.reduce((sum, point) => {
      const predicted = slope * point.x + intercept;
      return sum + Math.pow(point.y - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    // Generate forecast
    const forecast: Array<{ date: string; predictedErrors: number; confidence: number }> = [];
    const lastDate = new Date(Math.max(...dataPoints.map(p => p.x)));
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedErrors = Math.max(0, Math.round(slope * forecastDate.getTime() + intercept));
      const confidence = Math.max(0, Math.min(100, rSquared * 100));
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedErrors,
        confidence
      });
    }
    
    return forecast;
  }

  /**
   * Generate recommendations based on error analysis
   * @param errors - Historical errors
   * @param forecast - Forecast data
   * @returns Array of recommendations
   */
  private generateRecommendations(errors: SlackErrorReport[], forecast: Array<{ predictedErrors: number }>): string[] {
    const recommendations: string[] = [];
    
    // Analyze error patterns
     const criticalErrors = errors.filter(error => error.severity === 'critical');
     const rateLimitErrors = errors.filter(error => error.category === 'rate_limit');
     const networkErrors = errors.filter(error => error.category === 'network');
    
    if (criticalErrors.length > 0) {
       recommendations.push(`Address ${criticalErrors.length} critical errors immediately to prevent service degradation`);
     }
     
     if (rateLimitErrors.length > errors.length * 0.3) {
       recommendations.push('Consider implementing exponential backoff and request throttling to reduce rate limit errors');
     }
     
     if (networkErrors.length > errors.length * 0.2) {
       recommendations.push('Investigate network connectivity issues and implement retry mechanisms');
     }
    
    // Forecast-based recommendations
    const avgForecastErrors = forecast.reduce((sum, f) => sum + f.predictedErrors, 0) / forecast.length;
    const currentAvg = errors.length / 7; // Assuming 7 days of data
    
    if (avgForecastErrors > currentAvg * 1.2) {
      recommendations.push('Error rate is predicted to increase. Consider proactive monitoring and scaling');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Error patterns are stable. Continue current monitoring practices');
    }
    
    return recommendations;
  }
}