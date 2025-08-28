/**
 * @ai-metadata
 * @component: ErrorLoggerInterfaces
 * @description: Interface definitions for error logging and monitoring functionality
 * @last-update: 2025-01-28
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/error-logger-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./middleware-interfaces"]
 * @tests: ["../utils/tests/error-logger.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Error logging and monitoring interfaces for comprehensive error tracking"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { ServiceStatus } from './middleware-interfaces';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  WEBHOOK = 'webhook',
  API = 'api',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Request context information
 */
export interface RequestContext {
  /** Request ID for tracking */
  requestId: string;
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers (sanitized) */
  headers: Record<string, string>;
  /** Request body (truncated if large) */
  body?: string;
  /** User agent */
  userAgent?: string;
  /** Client IP address */
  clientIp?: string;
  /** Request timestamp */
  timestamp: string;
}

// ServiceStatus interface moved to middleware-interfaces.ts to avoid duplication

/**
 * Debugging context
 */
export interface DebuggingContext {
  /** Stack trace */
  stackTrace?: string;
  /** Function/method where error occurred */
  location?: string;
  /** Additional debug information */
  debugInfo?: Record<string, unknown>;
  /** Related operation details */
  operation?: {
    name: string;
    parameters?: Record<string, unknown>;
    duration?: number;
  };
  /** Environment information */
  environment?: {
    nodeVersion?: string;
    platform?: string;
    memory?: {
      used: number;
      total: number;
    };
  };
}

/**
 * Comprehensive error log entry
 */
export interface ErrorLogEntry {
  /** Unique error ID */
  errorId: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Error message */
  message: string;
  /** Original error object */
  error?: Error;
  /** Request context */
  request?: RequestContext;
  /** Service status */
  serviceStatus?: ServiceStatus[];
  /** Debugging context */
  debugging?: DebuggingContext;
  /** Timestamp when error was logged */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Suggested recovery actions */
  recoveryActions?: string[];
  /** Related error IDs */
  relatedErrors?: string[];
}

/**
 * Error logging configuration
 */
export interface ErrorLoggerConfig {
  /** Maximum body size to log (in characters) */
  maxBodySize: number;
  /** Headers to exclude from logging */
  excludeHeaders: string[];
  /** Whether to include stack traces */
  includeStackTrace: boolean;
  /** Whether to include environment info */
  includeEnvironment: boolean;
  /** Custom metadata extractor */
  metadataExtractor?: (error: Error, context?: any) => Record<string, unknown>;
}