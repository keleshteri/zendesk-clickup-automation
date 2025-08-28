/**
 * @ai-metadata
 * @component: ErrorLogger
 * @description: Comprehensive error logging utility for webhook failures and debugging
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/error-logger.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/utils/error-logger.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Provides structured error logging with context for debugging webhook and service failures"
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

import { Context } from 'hono';
import {
  ErrorSeverity,
  ErrorCategory,
  RequestContext,
  ServiceStatus,
  DebuggingContext,
  ErrorLogEntry,
  ErrorLoggerConfig
} from '../interfaces';

export {
  ErrorSeverity,
  ErrorCategory,
  RequestContext,
  ServiceStatus,
  DebuggingContext,
  ErrorLogEntry,
  ErrorLoggerConfig
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorLoggerConfig = {
  maxBodySize: 1000,
  excludeHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-webhook-secret'
  ],
  includeStackTrace: true,
  includeEnvironment: true
};

/**
 * Enhanced error logger class
 */
export class ErrorLogger {
  private config: ErrorLoggerConfig;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Log a comprehensive error with full context
   */
  async logError(
    error: Error,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context?: {
      request?: Context;
      operation?: string;
      metadata?: Record<string, unknown>;
      recoveryActions?: string[];
    }
  ): Promise<ErrorLogEntry> {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    const logEntry: ErrorLogEntry = {
      errorId,
      severity,
      category,
      message: error.message,
      error,
      timestamp,
      metadata: context?.metadata,
      recoveryActions: context?.recoveryActions
    };

    // Add request context if available
    if (context?.request) {
      logEntry.request = await this.extractRequestContext(context.request);
    }

    // Add service status information
    logEntry.serviceStatus = Array.from(this.serviceStatuses.values());

    // Add debugging context
    logEntry.debugging = this.extractDebuggingContext(error, context?.operation);

    // Log the error
    this.outputLog(logEntry);

    return logEntry;
  }

  /**
   * Log webhook-specific errors
   */
  async logWebhookError(
    error: Error,
    context: {
      request: Context;
      webhookType?: string;
      payload?: any;
      signature?: string;
      validationErrors?: string[];
    }
  ): Promise<ErrorLogEntry> {
    const severity = this.determineWebhookErrorSeverity(error);
    const recoveryActions = this.getWebhookRecoveryActions(error, context);

    return await this.logError(error, severity, ErrorCategory.WEBHOOK, {
      request: context.request,
      operation: `webhook_processing_${context.webhookType || 'unknown'}`,
      metadata: {
        webhookType: context.webhookType,
        hasPayload: !!context.payload,
        hasSignature: !!context.signature,
        validationErrors: context.validationErrors,
        payloadSize: context.payload ? JSON.stringify(context.payload).length : 0
      },
      recoveryActions
    });
  }

  /**
   * Log service unavailable errors
   */
  async logServiceUnavailableError(
    error: Error,
    serviceName: string,
    context?: {
      request?: Context;
      lastKnownStatus?: string;
      healthCheckUrl?: string;
      retryAttempts?: number;
    }
  ): Promise<ErrorLogEntry> {
    const recoveryActions = [
      `Check ${serviceName} service status`,
      'Verify network connectivity',
      'Check API credentials',
      'Review rate limiting status',
      context?.healthCheckUrl ? `Visit health check: ${context.healthCheckUrl}` : 'Check service health endpoint'
    ].filter(Boolean);

    return await this.logError(error, ErrorSeverity.HIGH, ErrorCategory.SERVICE_UNAVAILABLE, {
      request: context?.request,
      operation: `${serviceName}_service_call`,
      metadata: {
        serviceName,
        lastKnownStatus: context?.lastKnownStatus,
        healthCheckUrl: context?.healthCheckUrl,
        retryAttempts: context?.retryAttempts
      },
      recoveryActions
    });
  }

  /**
   * Update service status
   */
  updateServiceStatus(status: ServiceStatus): void {
    this.serviceStatuses.set(status.name, {
      ...status,
      timestamp: new Date().toISOString()
    } as ServiceStatus & { timestamp: string });
  }

  /**
   * Get current service statuses
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Extract request context from Hono context
   */
  private async extractRequestContext(c: Context): Promise<RequestContext> {
    const req = c.req;
    
    // Extract headers manually since req.header() doesn't return an iterable
    const rawHeaders: Record<string, string> = {};
    const headerNames = ['user-agent', 'x-forwarded-for', 'x-real-ip', 'authorization', 'content-type', 'x-zendesk-webhook-signature', 'x-zendesk-webhook-timestamp', 'x-zendesk-webhook-id'];
    
    for (const name of headerNames) {
      const value = req.header(name);
      if (value) {
        rawHeaders[name] = value;
      }
    }
    
    const headers = this.sanitizeHeaders(rawHeaders);
    
    let body: string | undefined;
    try {
      const rawBody = await req.text();
      body = rawBody.length > this.config.maxBodySize 
        ? rawBody.substring(0, this.config.maxBodySize) + '... (truncated)'
        : rawBody;
    } catch {
      body = '[Unable to read body]';
    }

    return {
      requestId: this.generateRequestId(),
      method: req.method,
      url: req.url,
      headers,
      body,
      userAgent: headers['user-agent'],
      clientIp: headers['x-forwarded-for'] || headers['x-real-ip'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract debugging context
   */
  private extractDebuggingContext(
    error: Error, 
    operationName?: string
  ): DebuggingContext {
    const context: DebuggingContext = {};

    if (this.config.includeStackTrace && error.stack) {
      context.stackTrace = error.stack;
    }

    if (operationName) {
      context.operation = {
        name: operationName
      };
    }

    if (this.config.includeEnvironment) {
      context.environment = {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal
        }
      };
    }

    return context;
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (this.config.excludeHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Determine webhook error severity
   */
  private determineWebhookErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('signature') || message.includes('authentication')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (message.includes('service unavailable') || message.includes('timeout')) {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get webhook-specific recovery actions
   */
  private getWebhookRecoveryActions(
    error: Error, 
    context: { webhookType?: string; validationErrors?: string[] }
  ): string[] {
    const actions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('signature')) {
      actions.push('Verify webhook secret configuration');
      actions.push('Check webhook signature generation');
    }

    if (message.includes('validation') && context.validationErrors) {
      actions.push('Review payload validation errors');
      actions.push('Check webhook payload format');
    }

    if (message.includes('service unavailable')) {
      actions.push('Check external service status');
      actions.push('Verify network connectivity');
      actions.push('Review rate limiting');
    }

    actions.push('Check webhook configuration');
    actions.push('Review error logs for patterns');
    
    return actions;
  }

  /**
   * Output the log entry
   */
  private outputLog(logEntry: ErrorLogEntry): void {
    const logLevel = this.getLogLevel(logEntry.severity);
    const logMessage = this.formatLogMessage(logEntry);
    
    console[logLevel](logMessage);
    
    // In production, you might want to send to external logging service
    // await this.sendToExternalLogger(logEntry);
  }

  /**
   * Get console log level based on severity
   */
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Format log message for output
   */
  private formatLogMessage(logEntry: ErrorLogEntry): string {
    const emoji = this.getSeverityEmoji(logEntry.severity);
    const summary = `${emoji} [${logEntry.errorId}] ${logEntry.category.toUpperCase()}: ${logEntry.message}`;
    
    const details = {
      errorId: logEntry.errorId,
      severity: logEntry.severity,
      category: logEntry.category,
      timestamp: logEntry.timestamp,
      request: logEntry.request ? {
        method: logEntry.request.method,
        url: logEntry.request.url,
        requestId: logEntry.request.requestId
      } : undefined,
      serviceStatus: logEntry.serviceStatus?.map(s => ({
        service: s.name,
        status: s.status
      })),
      recoveryActions: logEntry.recoveryActions,
      metadata: logEntry.metadata
    };

    return `${summary}\n${JSON.stringify(details, null, 2)}`;
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '❌';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.LOW:
        return 'ℹ️';
      default:
        return '❓';
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Convenience functions for common error types
 */
export const logWebhookError = errorLogger.logWebhookError.bind(errorLogger);
export const logServiceUnavailableError = errorLogger.logServiceUnavailableError.bind(errorLogger);
export const updateServiceStatus = errorLogger.updateServiceStatus.bind(errorLogger);