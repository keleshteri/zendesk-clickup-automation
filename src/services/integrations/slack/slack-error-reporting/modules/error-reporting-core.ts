/**
 * @ai-metadata
 * @component: ErrorReportingCore
 * @description: Core error reporting functionality including error processing, validation, and basic operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-reporting-core.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../../types", "../../interfaces", "./error-persistence"]
 * @tests: ["../tests/error-reporting-core.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Core module that handles error processing, validation, and basic CRUD operations for error reports"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type {
  SlackErrorReport,
  ErrorSource,
  ErrorContext,
  ErrorReportingConfig
} from '../../interfaces/slack-error-reporting.interface';
import { ErrorSeverity, ErrorCategory } from '../../interfaces/slack-error-reporting.interface';
import type { SlackAPIError } from '../../interfaces/slack-error.interface';
import type { ErrorPersistence } from './error-persistence';

/**
 * Core error reporting functionality
 * Handles error processing, validation, and basic operations
 */
export class ErrorReportingCore {
  private persistence: ErrorPersistence;
  private config: ErrorReportingConfig;

  constructor(persistence: ErrorPersistence, config: ErrorReportingConfig) {
    this.persistence = persistence;
    this.config = config;
  }

  /**
   * Process and report a new error
   * @param error - The error to report
   * @param source - Information about where the error occurred
   * @param context - Additional context about the error
   * @returns Promise that resolves to the error report
   */
  async reportError(
    error: SlackAPIError | Error,
    source?: ErrorSource,
    context: Partial<ErrorContext> = {}
  ): Promise<SlackErrorReport> {
    try {
      // Create error report
      const errorReport = this.createErrorReport(error, source, context);
      
      // Validate error report
      this.validateErrorReport(errorReport);
      
      // Check for duplicates
      const existingError = await this.findDuplicateError(errorReport);
      if (existingError) {
        return this.updateDuplicateError(existingError, errorReport);
      }
      
      // Store the error
      await this.persistence.storeError(errorReport);
      
      console.log(`✅ Error reported successfully: ${errorReport.id}`);
      return errorReport;
    } catch (reportingError) {
      console.error('❌ Failed to process error report:', reportingError);
      throw reportingError;
    }
  }

  /**
   * Create an error report from an error object
   * @param error - The error to create a report for
   * @param source - Information about where the error occurred
   * @param context - Additional context about the error
   * @returns The created error report
   */
  private createErrorReport(
    error: SlackAPIError | Error,
    source?: ErrorSource,
    context: Partial<ErrorContext> = {}
  ): SlackErrorReport {
    const timestamp = new Date();
    const errorId = this.generateErrorId(error, timestamp);
    
    // Extract error details
    const { message, stack, name } = this.extractErrorDetails(error);
    const severity = this.determineSeverity(error, context);
    
    // Create base error report
    const errorReport: SlackErrorReport = {
      id: errorId,
      timestamp,
      severity,
      category: this.categorizeError(error),
      source: source || this.inferErrorSource(error, stack),
      context: this.buildErrorContext(context, error),
      error: {
        code: this.extractErrorCode(error) || 'unknown_error',
        message,
        data: {
          error: message
        },
        context: {
          source: source?.service || 'unknown',
          operation: source?.method || 'unknown',
          metadata: {
            name,
            stack
          }
        },
        timestamp
      },
      message,
      resolved: false,
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      tags: this.generateErrorTags(error, source, context),
      fingerprint: this.generateErrorFingerprint(error, source)
    };
    
    // Add Slack-specific details to metadata if it's a Slack API error
    if (this.isSlackAPIError(error)) {
      errorReport.context.metadata = {
        ...errorReport.context.metadata,
        slackApiMethod: error.data?.method || 'unknown',
        slackResponseHeaders: error.data?.response && typeof error.data.response === 'object' && 'headers' in error.data.response ? error.data.response.headers : {},
        slackRetryAfter: error.data?.retryAfter,
        slackRateLimited: error.code === 'slack_webapi_rate_limited'
      };
    }
    
    return errorReport;
  }

  /**
   * Extract error details from an error object
   * @param error - The error to extract details from
   * @returns Extracted error details
   */
  private extractErrorDetails(error: SlackAPIError | Error): {
    message: string;
    stack?: string;
    name: string;
  } {
    return {
      message: error.message || 'Unknown error',
      stack: 'stack' in error ? error.stack : undefined,
      name: 'name' in error ? error.name : error.constructor.name || 'Error'
    };
  }

  /**
   * Extract error code from an error object
   * @param error - The error to extract code from
   * @returns The error code or undefined
   */
  private extractErrorCode(error: SlackAPIError | Error): string | undefined {
    if (this.isSlackAPIError(error)) {
      return error.code;
    }
    return (error as any).code;
  }

  /**
   * Determine the severity of an error
   * @param error - The error to analyze
   * @param context - Additional context
   * @returns The determined severity
   */
  private determineSeverity(
    error: SlackAPIError | Error,
    context: Partial<ErrorContext>
  ): ErrorSeverity {
    // Check if severity is explicitly provided in metadata
    if (context?.metadata?.severity && typeof context.metadata.severity === 'string') {
      return context.metadata.severity as ErrorSeverity;
    }
    
    // Determine severity based on error type and characteristics
    if (this.isSlackAPIError(error)) {
      switch (error.code) {
        case 'slack_webapi_rate_limited':
          return ErrorSeverity.MEDIUM;
        case 'invalid_auth':
        case 'account_inactive':
          return ErrorSeverity.CRITICAL;
        case 'channel_not_found':
        case 'user_not_found':
          return ErrorSeverity.MEDIUM;
        case 'internal_error':
          return ErrorSeverity.CRITICAL;
        default:
          return ErrorSeverity.HIGH;
      }
    }
    
    // For generic errors, use error name/message patterns
    const errorString = `${'name' in error ? error.name : 'Error'} ${error.message}`.toLowerCase();
    
    if (errorString.includes('timeout') || errorString.includes('network')) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (errorString.includes('auth') || errorString.includes('permission')) {
      return ErrorSeverity.CRITICAL;
    }
    
    return ErrorSeverity.HIGH;
  }

  /**
   * Infer error source from error details
   * @param error - The error object
   * @param stack - The error stack trace
   * @returns Inferred error source
   */
  private inferErrorSource(error: SlackAPIError | Error, stack?: string): ErrorSource {
    // Try to extract source from stack trace
    if (stack) {
      const stackLines = stack.split('\n');
      for (const line of stackLines) {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          const [, functionName, fileName, lineNumber] = match;
          return {
            service: this.extractServiceFromPath(fileName),
            method: functionName,
            file: fileName,
            line: parseInt(lineNumber, 10)
          };
        }
      }
    }
    
    // Fallback to basic inference
    return {
      service: this.isSlackAPIError(error) ? 'slack-api' : 'unknown',
      method: 'unknown'
    };
  }

  /**
   * Extract service name from file path
   * @param filePath - The file path to analyze
   * @returns Extracted service name
   */
  private extractServiceFromPath(filePath: string): string {
    const pathParts = filePath.split(/[\/\\]/);
    
    // Look for service indicators in path
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'services' && i + 1 < pathParts.length) {
        return pathParts[i + 1];
      }
    }
    
    // Fallback to filename without extension
    const fileName = pathParts[pathParts.length - 1];
    return fileName.replace(/\.[^.]+$/, '');
  }

  /**
   * Build comprehensive error context
   * @param context - Provided context
   * @param error - The error object
   * @returns Built error context
   */
  private buildErrorContext(
    context: Partial<ErrorContext>,
    error: SlackAPIError | Error
  ): ErrorContext {
    const baseContext: ErrorContext = {
      requestId: context.requestId,
      sessionId: context.sessionId,
      metadata: {
        ...context.metadata,
        ...(this.isSlackAPIError(error) ? {
          slackMethod: error.data?.method,
          slackResponse: error.data?.response
        } : {})
      },
      stackTrace: context.stackTrace,
      userAgent: context.userAgent,
      headers: context.headers,
      payload: context.payload
    };
    
    return baseContext;
  }

  /**
   * Generate tags for an error
   * @param error - The error object
   * @param source - Error source information
   * @param context - Error context
   * @returns Generated tags
   */
  private generateErrorTags(
    error: SlackAPIError | Error,
    source?: ErrorSource,
    context?: Partial<ErrorContext>
  ): string[] {
    const tags: string[] = [];
    
    // Add error type tags
    tags.push(`error-type:${'name' in error ? error.name : 'Error'}`);
    
    if (this.isSlackAPIError(error)) {
      tags.push('slack-api');
      if (error.code) {
        tags.push(`slack-code:${error.code}`);
      }
    }
    
    // Add source tags
    if (source?.service) {
      tags.push(`service:${source.service}`);
    }
    
    // Add metadata tags if available
    if (context?.metadata) {
      Object.entries(context.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          tags.push(`${key}:${value}`);
        }
      });
    }
    
    return tags;
  }

  /**
   * Generate a unique fingerprint for error deduplication
   * @param error - The error object
   * @param source - Error source information
   * @returns Generated fingerprint
   */
  private generateErrorFingerprint(
    error: SlackAPIError | Error,
    source?: ErrorSource
  ): string {
    const components = [
      'name' in error ? error.name : 'Error',
      error.message,
      source?.service || 'unknown',
      source?.method || 'unknown'
    ];
    
    if (this.isSlackAPIError(error) && error.code) {
      components.push(error.code);
    }
    
    return components.join('|');
  }

  /**
   * Generate a unique error ID
   * @param error - The error object
   * @param timestamp - The error timestamp
   * @returns Generated error ID
   */
  private generateErrorId(error: SlackAPIError | Error, timestamp: Date): string {
    const errorHash = this.hashString(error.message + ('stack' in error ? error.stack || '' : ''));
    const timeHash = timestamp.getTime().toString(36);
    return `err_${timeHash}_${errorHash.substring(0, 8)}`;
  }

  /**
   * Simple string hashing function
   * @param str - String to hash
   * @returns Hash value
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if an error is a Slack API error
   * @param error - The error to check
   * @returns True if it's a Slack API error
   */
  private isSlackAPIError(error: any): error is SlackAPIError {
    return error && typeof error.code === 'string' && error.code.startsWith('slack_');
  }

  /**
   * Validate an error report
   * @param errorReport - The error report to validate
   * @throws Error if validation fails
   */
  private validateErrorReport(errorReport: SlackErrorReport): void {
    if (!errorReport.id) {
      throw new Error('Error report must have an ID');
    }
    
    if (!errorReport.error?.message) {
      throw new Error('Error report must have an error message');
    }
    
    if (!errorReport.timestamp) {
      throw new Error('Error report must have a timestamp');
    }
    
    if (!['info', 'warning', 'error', 'critical'].includes(errorReport.severity)) {
      throw new Error('Error report must have a valid severity');
    }
  }

  /**
   * Find duplicate error based on fingerprint
   * @param errorReport - The error report to check for duplicates
   * @returns Promise that resolves to existing error or null
   */
  private async findDuplicateError(
    errorReport: SlackErrorReport
  ): Promise<SlackErrorReport | null> {
    return this.persistence.findErrorByFingerprint(errorReport.fingerprint);
  }

  /**
   * Update an existing error with new occurrence
   * @param existingError - The existing error report
   * @param newError - The new error report
   * @returns Promise that resolves to updated error report
   */
  private async updateDuplicateError(
    existingError: SlackErrorReport,
    newError: SlackErrorReport
  ): Promise<SlackErrorReport> {
    const updatedError: SlackErrorReport = {
      ...existingError,
      occurrenceCount: existingError.occurrenceCount + 1,
      lastSeen: newError.timestamp,
      context: newError.context // Update with latest context
    };
    
    await this.persistence.updateError(updatedError);
    console.log(`✅ Updated duplicate error: ${updatedError.id} (count: ${updatedError.occurrenceCount})`);
    
    return updatedError;
  }

  /**
   * Create a fallback error report when reporting fails
   * @param originalError - The original error that was being reported
   * @param source - Error source information
   * @param context - Error context
   * @param reportingError - The error that occurred during reporting
   * @returns Fallback error report
   */
  createFallbackErrorReport(
    originalError: SlackAPIError | Error,
    source?: ErrorSource,
    context?: Partial<ErrorContext>,
    reportingError?: Error
  ): SlackErrorReport {
    const timestamp = new Date();
    
    const errorMessage = originalError.message || 'Unknown error';
    
    return {
      id: `fallback_${timestamp.getTime()}`,
      timestamp,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UNKNOWN,
      source: source || { service: 'unknown', method: 'unknown' },
      context: {
        metadata: {
          environment: 'unknown',
          reportingError: reportingError?.message,
          fallback: true
        }
      },
      error: {
        code: 'unknown_error',
        message: errorMessage,
        data: {
          error: errorMessage
        },
        context: {
          source: 'error-reporting-core',
          operation: 'createFallbackErrorReport',
          metadata: {
            originalErrorName: 'name' in originalError ? originalError.name || 'Error' : 'Error',
            stack: 'stack' in originalError ? originalError.stack : undefined
          }
        },
        timestamp: timestamp
      },
      message: errorMessage,
      resolved: false,
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      tags: ['fallback', 'reporting-failed'],
      fingerprint: `fallback_${errorMessage}`
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
    const error = await this.persistence.getError(errorId);
    if (!error) {
      return false;
    }
    
    const updatedError: SlackErrorReport = {
      ...error,
      resolution: {
        ...resolution,
        resolvedAt: new Date()
      }
    };
    
    await this.persistence.updateError(updatedError);
    console.log(`✅ Error resolved: ${errorId}`);
    
    return true;
  }

  /**
   * Clean up old error reports based on retention policy
   * @returns Promise that resolves to the number of errors cleaned up
   */
  async cleanup(): Promise<number> {
    if (this.config.retentionDays <= 0) {
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    const deletedCount = await this.persistence.deleteErrorsBefore(cutoffDate);
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old error reports`);
    }
    
    return deletedCount;
  }

  /**
   * Update configuration
   * @param config - New configuration
   */
  updateConfig(config: ErrorReportingConfig): void {
    this.config = config;
  }

  /**
   * Categorize error based on error type and message
   * @param error - The error to categorize
   * @returns Error category
   */
  private categorizeError(error: Error | SlackAPIError): ErrorCategory {
    const message = error.message?.toLowerCase() || '';
    
    // Check for authentication errors
    if (message.includes('unauthorized') || message.includes('invalid_auth') || message.includes('token')) {
      return ErrorCategory.AUTH;
    }
    
    // Check for rate limiting
    if (message.includes('rate_limited') || message.includes('too_many_requests')) {
      return ErrorCategory.RATE_LIMIT;
    }
    
    // Check for network errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    
    // Check for validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    
    // Check for API errors
    if ('code' in error || message.includes('api') || message.includes('slack')) {
      return ErrorCategory.API;
    }
    
    // Default to unknown
    return ErrorCategory.UNKNOWN;
  }
}