/**
 * @ai-metadata
 * @component: SlackErrorReportingService
 * @description: Main error reporting service that orchestrates error tracking, analytics, and alerting
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-service.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../interfaces", "./modules"]
 * @tests: ["./tests/error-reporting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Main orchestrator for error reporting that delegates to specialized modules for analytics, persistence, and alerting"
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
  ISlackErrorReportingService
} from '../interfaces/slack-error-reporting.interface';
import type { SlackAPIError } from '../interfaces/slack-error.interface';
import { ErrorReportingCore } from './modules/error-reporting-core';
import { ErrorAnalytics } from './modules/error-analytics';
import { ErrorPersistence } from './modules/error-persistence';
import { ErrorAlerting } from './modules/error-alerting';
import { ErrorForecasting } from './modules/error-forecasting';
import {
  getErrorReportingConfig,
  validateErrorReportingConfig,
  getConfigSummary
} from '../../../../config/error-reporting.config';

/**
 * Main error reporting service that orchestrates error tracking, analytics, and alerting
 * Delegates specialized functionality to focused modules
 */
export class SlackErrorReportingService implements ISlackErrorReportingService {
  private client: WebClient;
  private env: Env;
  private config: ErrorReportingConfig;
  private messagingService?: any;

  // Specialized modules
  private core: ErrorReportingCore;
  private analytics: ErrorAnalytics;
  private persistence: ErrorPersistence;
  private alerting: ErrorAlerting;
  private forecasting: ErrorForecasting;

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
    
    // Initialize specialized modules
    this.persistence = new ErrorPersistence(env, this.config);
    this.core = new ErrorReportingCore(this.persistence, this.config);
    this.analytics = new ErrorAnalytics(this.persistence);
    this.alerting = new ErrorAlerting(this.persistence, this.config.alerts);
    this.forecasting = new ErrorForecasting(this.persistence, this.analytics);
    
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
    try {
      const errorReport = await this.core.reportError(error, source, context);
      
      // Send alerts if configured
      if (this.alerting.shouldSendAlert(errorReport)) {
        await this.alerting.sendAlert(errorReport);
      }
      
      return errorReport;
    } catch (reportingError) {
      console.error('❌ Failed to report error:', reportingError);
      return this.core.createFallbackErrorReport(error, source, context, reportingError instanceof Error ? reportingError : new Error(String(reportingError)));
    }
  }

  /**
   * Get error reports with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise that resolves to filtered error reports
   */
  async getErrors(filters: ErrorQueryFilters = {}): Promise<SlackErrorReport[]> {
    return this.persistence.getErrors(filters);
  }

  /**
   * Get error statistics for analytics
   * @param timeRange - Optional time range for statistics
   * @returns Promise that resolves to error statistics
   */
  async getStatistics(timeRange?: { from: Date; to: Date }): Promise<ErrorStatistics> {
    return this.analytics.getStatistics(timeRange);
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
    return this.analytics.getRealTimeMetrics();
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
    return this.analytics.getAnalyticsDashboard(timeRange);
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
    const forecastHours = days * 24;
    const results = await this.forecasting.generateForecast({ forecastHours });
    
    // Transform the results to match the expected format
    const forecast = results.length > 0 ? results[0].forecast.map(point => ({
      date: point.timestamp.toISOString().split('T')[0],
      predictedErrors: Math.round(point.predicted),
      confidence: point.confidence
    })) : [];
    
    const recommendations = results.length > 0 ? results[0].recommendations : [];
    
    return { forecast, recommendations };
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
    return this.core.resolveError(errorId, resolution);
  }

  /**
   * Get error by ID
   * @param errorId - The error ID to retrieve
   * @returns Promise that resolves to the error report or null
   */
  async getError(errorId: string): Promise<SlackErrorReport | null> {
    return this.persistence.getError(errorId);
  }

  /**
   * Delete old error reports based on retention policy
   * @returns Promise that resolves to the number of errors cleaned up
   */
  async cleanup(): Promise<number> {
    return this.core.cleanup();
  }

  /**
   * Update error reporting configuration
   * @param config - Partial configuration to update
   * @returns Promise that resolves to true if successful
   */
  async updateConfig(config: Partial<ErrorReportingConfig>): Promise<boolean> {
    this.config = { ...this.config, ...config };
    
    // Update all modules with new config
    this.core.updateConfig(this.config);
    this.alerting.updateConfig(this.config);
    this.persistence.updateConfig(this.config);
    
    return this.persistence.persistConfig(this.config);
  }

  /**
   * Get current configuration
   * @returns Promise that resolves to current configuration
   */
  async getConfig(): Promise<ErrorReportingConfig> {
    return { ...this.config };
  }

  /**
   * Send alert for an error report
   * @param errorReport - Error report to send alert for
   * @returns Promise that resolves to alert success
   */
  async sendAlert(errorReport: SlackErrorReport): Promise<boolean> {
    return this.alerting.sendAlert(errorReport);
  }

  /**
   * Schedule periodic cleanup of old error reports
   */
  private scheduleCleanup(): void {
    if (this.config.retentionDays > 0) {
      // Schedule cleanup every 24 hours
      setInterval(() => {
        this.cleanup().catch(error => {
          console.error('Scheduled cleanup failed:', error);
        });
      }, 24 * 60 * 60 * 1000);
    }
  }
}