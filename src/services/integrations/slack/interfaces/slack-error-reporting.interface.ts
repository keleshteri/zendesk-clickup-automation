/**
 * @ai-metadata
 * @component: SlackErrorReportingInterface
 * @description: Comprehensive error reporting interfaces for centralized Slack error tracking and analytics
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-interface.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./slack-error.interface.ts"]
 * @tests: ["./tests/slack-error-reporting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Extended error reporting interfaces for comprehensive error tracking, analytics, and centralized logging across the Slack integration"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type { SlackAPIError, SlackAPIErrorWithContext } from './slack-error.interface';

/**
 * Error severity levels for categorizing error impact
 */
export enum ErrorSeverity {
  /** Critical errors that break core functionality */
  CRITICAL = 'critical',
  /** High priority errors that impact user experience */
  HIGH = 'high',
  /** Medium priority errors with workarounds available */
  MEDIUM = 'medium',
  /** Low priority errors that don't impact functionality */
  LOW = 'low',
  /** Informational warnings */
  INFO = 'info'
}

/**
 * Error categories for organizing different types of errors
 */
export enum ErrorCategory {
  /** Authentication and authorization errors */
  AUTH = 'auth',
  /** API communication errors */
  API = 'api',
  /** Rate limiting errors */
  RATE_LIMIT = 'rate_limit',
  /** Network connectivity errors */
  NETWORK = 'network',
  /** Data validation errors */
  VALIDATION = 'validation',
  /** Configuration errors */
  CONFIG = 'config',
  /** Security-related errors */
  SECURITY = 'security',
  /** Bot management errors */
  BOT_MANAGEMENT = 'bot_management',
  /** Message handling errors */
  MESSAGING = 'messaging',
  /** Event processing errors */
  EVENT_PROCESSING = 'event_processing',
  /** Unknown or uncategorized errors */
  UNKNOWN = 'unknown'
}

/**
 * Error source information for tracking where errors originate
 */
export interface ErrorSource {
  /** Service or component where the error occurred */
  service: string;
  /** Specific method or function where the error occurred */
  method: string;
  /** File path where the error occurred */
  file?: string;
  /** Line number where the error occurred */
  line?: number;
  /** User ID if the error is user-specific */
  userId?: string;
  /** Channel ID if the error is channel-specific */
  channelId?: string;
  /** Team/workspace ID if applicable */
  teamId?: string;
}

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  /** Request ID for tracing */
  requestId?: string;
  /** Session ID for user session tracking */
  sessionId?: string;
  /** Additional metadata about the error */
  metadata?: Record<string, unknown>;
  /** Stack trace if available */
  stackTrace?: string;
  /** User agent or client information */
  userAgent?: string;
  /** Request headers that might be relevant */
  headers?: Record<string, string>;
  /** Request body or payload that caused the error */
  payload?: unknown;
}

/**
 * Comprehensive error report structure
 */
export interface SlackErrorReport {
  /** Unique identifier for the error report */
  id: string;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Source information */
  source: ErrorSource;
  /** Error context */
  context: ErrorContext;
  /** The original Slack API error */
  error: SlackAPIErrorWithContext;
  /** Human-readable error message */
  message: string;
  /** Whether the error was resolved automatically */
  resolved: boolean;
  /** Resolution details if resolved */
  resolution?: {
    /** How the error was resolved */
    method: 'retry' | 'fallback' | 'manual' | 'ignored';
    /** Timestamp when resolved */
    resolvedAt: Date;
    /** Details about the resolution */
    details?: string;
  };
  /** Number of times this error has occurred */
  occurrenceCount: number;
  /** First time this error was seen */
  firstSeen: Date;
  /** Last time this error was seen */
  lastSeen: Date;
  /** Tags for categorization and filtering */
  tags: string[];
}

/**
 * Error statistics for analytics
 */
export interface ErrorStatistics {
  /** Total number of errors in the time period */
  totalErrors: number;
  /** Errors grouped by severity */
  bySeverity: Record<ErrorSeverity, number>;
  /** Errors grouped by category */
  byCategory: Record<ErrorCategory, number>;
  /** Errors grouped by service */
  byService: Record<string, number>;
  /** Most common errors */
  topErrors: Array<{
    message: string;
    count: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }>;
  /** Error trends over time */
  trends: Array<{
    timestamp: Date;
    count: number;
    severity: ErrorSeverity;
  }>;
}

/**
 * Error query filters for retrieving specific errors
 */
export interface ErrorQueryFilters {
  /** Filter by severity levels */
  severity?: ErrorSeverity[];
  /** Filter by categories */
  category?: ErrorCategory[];
  /** Filter by services */
  service?: string[];
  /** Filter by user ID */
  userId?: string;
  /** Filter by channel ID */
  channelId?: string;
  /** Filter by team ID */
  teamId?: string;
  /** Filter by date range */
  dateRange?: {
    from: Date;
    to: Date;
  };
  /** Filter by resolved status */
  resolved?: boolean;
  /** Filter by tags */
  tags?: string[];
  /** Text search in error messages */
  search?: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Error alert configuration
 */
export interface ErrorAlertConfig {
  /** Whether alerts are enabled */
  enabled: boolean;
  /** Severity levels that trigger alerts */
  severityThreshold: ErrorSeverity;
  /** Categories that trigger alerts */
  categories: ErrorCategory[];
  /** Rate limit for alerts (max alerts per time period) */
  rateLimit: {
    maxAlerts: number;
    timeWindow: number; // in minutes
  };
  /** Slack channels to send alerts to */
  alertChannels: string[];
  /** Whether to include error details in alerts */
  includeDetails: boolean;
}

/**
 * Error reporting service configuration
 */
export interface ErrorReportingConfig {
  /** Whether error reporting is enabled */
  enabled: boolean;
  /** Maximum number of errors to store */
  maxStoredErrors: number;
  /** How long to keep error reports (in days) */
  retentionDays: number;
  /** Whether to automatically resolve certain error types */
  autoResolve: {
    enabled: boolean;
    categories: ErrorCategory[];
    maxAge: number; // in hours
  };
  /** Alert configuration */
  alerts: ErrorAlertConfig;
  /** Whether to send error reports to external services */
  externalReporting: {
    enabled: boolean;
    services: string[];
  };
}

/**
 * Interface for error reporting service implementations
 */
export interface ISlackErrorReportingService {
  /** Report a new error */
  reportError(error: SlackAPIError | Error, source: ErrorSource, context?: Partial<ErrorContext>): Promise<SlackErrorReport>;
  /** Report an error with minimal parameters (for convenience in tests) */
  reportError(error: SlackAPIError | Error): Promise<SlackErrorReport>;
  
  /** Get error reports with optional filtering */
  getErrors(filters?: ErrorQueryFilters): Promise<SlackErrorReport[]>;
  
  /** Get error statistics */
  getStatistics(timeRange?: { from: Date; to: Date }): Promise<ErrorStatistics>;
  
  /** Mark an error as resolved */
  resolveError(errorId: string, resolution: SlackErrorReport['resolution']): Promise<boolean>;
  
  /** Get error by ID */
  getError(errorId: string): Promise<SlackErrorReport | null>;
  
  /** Delete old error reports based on retention policy */
  cleanup(): Promise<number>;
  
  /** Update error reporting configuration */
  updateConfig(config: Partial<ErrorReportingConfig>): Promise<boolean>;
  
  /** Get current configuration */
  getConfig(): Promise<ErrorReportingConfig>;
  
  /** Send error alerts to configured channels */
  sendAlert(errorReport: SlackErrorReport): Promise<boolean>;
}