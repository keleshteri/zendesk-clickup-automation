/**
 * @ai-metadata
 * @component: SlackErrorCategorizer
 * @description: Advanced error categorization and severity assignment utilities for Slack error reporting
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../interfaces/slack-error-reporting.interface.ts"]
 */

import {
  ErrorSeverity,
  ErrorCategory,
  SlackErrorReport
} from '../interfaces/slack-error-reporting.interface';

/**
 * Error pattern matching for automatic categorization
 */
interface ErrorPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  tags?: string[];
}

/**
 * Predefined error patterns for automatic categorization
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // Authentication errors
  {
    pattern: /invalid_auth|unauthorized|authentication.*failed|token.*expired|invalid.*token/i,
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.HIGH,
    tags: ['authentication', 'security']
  },
  {
    pattern: /missing.*token|no.*authorization|access.*denied/i,
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.HIGH,
    tags: ['authorization', 'security']
  },

  // Network errors (more specific patterns first)
  {
    pattern: /network.*timeout|network.*error|connection.*error|dns.*error|socket.*error/i,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    tags: ['network', 'connectivity']
  },
  {
    pattern: /enotfound|econnrefused|econnreset|etimedout/i,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    tags: ['network', 'infrastructure']
  },

  // Rate limiting
  {
    pattern: /rate.*limit|too.*many.*requests|quota.*exceeded|throttle/i,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    tags: ['rate-limit', 'throttling']
  },

  // API errors (general patterns after specific ones)
  {
    pattern: /api.*endpoint.*not.*found|endpoint.*not.*found|api.*not.*found/i,
    category: ErrorCategory.API,
    severity: ErrorSeverity.HIGH,
    tags: ['api', 'endpoint', 'not-found']
  },
  {
    pattern: /api.*error|http.*error|request.*failed|response.*error/i,
    category: ErrorCategory.API,
    severity: ErrorSeverity.MEDIUM,
    tags: ['api', 'external-service']
  },
  {
    pattern: /timeout|connection.*timeout|request.*timeout/i,
    category: ErrorCategory.API,
    severity: ErrorSeverity.MEDIUM,
    tags: ['timeout', 'performance']
  },

  // Validation errors
  {
    pattern: /validation.*error|invalid.*input|bad.*request|malformed/i,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    tags: ['validation', 'input-error']
  },
  {
    pattern: /required.*field|missing.*parameter|invalid.*format/i,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    tags: ['validation', 'schema']
  },

  // Configuration errors
  {
    pattern: /config.*error|configuration.*invalid|missing.*config|env.*var/i,
    category: ErrorCategory.CONFIG,
    severity: ErrorSeverity.HIGH,
    tags: ['configuration', 'setup']
  },

  // Security errors
  {
    pattern: /security.*violation|suspicious.*activity|blocked.*request/i,
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.CRITICAL,
    tags: ['security', 'threat']
  },

  // Bot management errors
  {
    pattern: /bot.*error|slack.*bot|user.*not.*found|channel.*not.*found/i,
    category: ErrorCategory.BOT_MANAGEMENT,
    severity: ErrorSeverity.MEDIUM,
    tags: ['bot', 'slack-api']
  },

  // Messaging errors
  {
    pattern: /message.*failed|send.*error|post.*message|chat.*error/i,
    category: ErrorCategory.MESSAGING,
    severity: ErrorSeverity.MEDIUM,
    tags: ['messaging', 'communication']
  },

  // Event processing errors
  {
    pattern: /event.*error|webhook.*error|callback.*error|handler.*error/i,
    category: ErrorCategory.EVENT_PROCESSING,
    severity: ErrorSeverity.MEDIUM,
    tags: ['events', 'processing']
  }
];

/**
 * HTTP status code to severity mapping
 */
const HTTP_STATUS_SEVERITY_MAP: Record<number, ErrorSeverity> = {
  // 4xx Client errors
  400: ErrorSeverity.LOW,     // Bad Request
  401: ErrorSeverity.HIGH,    // Unauthorized
  403: ErrorSeverity.HIGH,    // Forbidden
  404: ErrorSeverity.MEDIUM,  // Not Found
  409: ErrorSeverity.MEDIUM,  // Conflict
  422: ErrorSeverity.LOW,     // Unprocessable Entity
  429: ErrorSeverity.MEDIUM,  // Too Many Requests
  
  // 5xx Server errors
  500: ErrorSeverity.HIGH,    // Internal Server Error
  502: ErrorSeverity.HIGH,    // Bad Gateway
  503: ErrorSeverity.HIGH,    // Service Unavailable
  504: ErrorSeverity.MEDIUM,  // Gateway Timeout
};

/**
 * Categorize an error based on its message and properties
 * @param error - The error to categorize
 * @returns The categorization result
 */
export function categorizeError(error: Error | unknown): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  tags: string[];
} {
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const httpStatus = getHttpStatus(error);

  console.log(`🔍 categorizeError called with message: "${errorMessage}", code: "${errorCode}", status: ${httpStatus}`);

  // Check for HTTP status code severity
  if (httpStatus && HTTP_STATUS_SEVERITY_MAP[httpStatus]) {
    const severity = HTTP_STATUS_SEVERITY_MAP[httpStatus];
    const category = getCategoryFromHttpStatus(httpStatus);
    console.log(`🔍 HTTP status match: ${httpStatus} -> ${category}/${severity}`);
    return {
      category,
      severity,
      tags: ['http-error', `status-${httpStatus}`]
    };
  }

  // Check against predefined patterns
  for (const pattern of ERROR_PATTERNS) {
    const regex = typeof pattern.pattern === 'string' 
      ? new RegExp(pattern.pattern, 'i')
      : pattern.pattern;
    
    console.log(`🔍 Testing pattern: ${pattern.pattern} against "${errorMessage}"`);
    if (regex.test(errorMessage) || (errorCode && regex.test(errorCode))) {
      console.log(`🔍 Pattern matched for "${errorMessage}": ${pattern.pattern} -> ${pattern.category}`);
      return {
        category: pattern.category,
        severity: pattern.severity,
        tags: pattern.tags || []
      };
    }
  }

  // Default categorization
  console.log(`🔍 No pattern matched for "${errorMessage}", using default: unknown/medium`);
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    tags: ['uncategorized']
  };
}

/**
 * Get error message from various error types
 * @param error - The error object
 * @returns The error message
 */
function getErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    return errorObj.message || errorObj.error || errorObj.description || JSON.stringify(error);
  }
  
  return String(error);
}

/**
 * Get error code from error object
 * @param error - The error object
 * @returns The error code if available
 */
function getErrorCode(error: Error | unknown): string | undefined {
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    return errorObj.code || errorObj.error_code || errorObj.errorCode;
  }
  return undefined;
}

/**
 * Get HTTP status from error object
 * @param error - The error object
 * @returns The HTTP status code if available
 */
function getHttpStatus(error: Error | unknown): number | undefined {
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    return errorObj.status || errorObj.statusCode || errorObj.response?.status;
  }
  return undefined;
}

/**
 * Get category from HTTP status code
 * @param status - HTTP status code
 * @returns The appropriate error category
 */
function getCategoryFromHttpStatus(status: number): ErrorCategory {
  if (status === 401 || status === 403) {
    return ErrorCategory.AUTH;
  }
  if (status === 429) {
    return ErrorCategory.RATE_LIMIT;
  }
  if (status === 400 || status === 422) {
    return ErrorCategory.VALIDATION;
  }
  if (status >= 500) {
    return ErrorCategory.API;
  }
  if (status >= 400) {
    return ErrorCategory.API;
  }
  return ErrorCategory.UNKNOWN;
}

/**
 * Enhance an error report with automatic categorization
 * @param errorReport - The base error report
 * @returns Enhanced error report with categorization
 */
export function enhanceErrorReport(errorReport: Partial<SlackErrorReport>): SlackErrorReport {
  console.log('🔧 enhanceErrorReport called with:', errorReport);
  const categorization = categorizeError(errorReport.error);
  console.log('🔧 categorization result:', categorization);
  
  const defaultError = errorReport.error || new Error('Unknown error');
  const slackError: any = defaultError;
  if (!slackError.code) {
    slackError.code = 'unknown_error';
  }
  
  const now = new Date();
  
  return {
    id: errorReport.id || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: errorReport.timestamp || now,
    error: slackError,
    severity: errorReport.severity || categorization.severity,
    category: (errorReport.category && errorReport.category !== 'unknown') ? errorReport.category : categorization.category,
    source: errorReport.source || {
      service: 'Unknown',
      method: 'Unknown',
      file: 'Unknown'
    },
    context: {
      ...errorReport.context
    },
    message: errorReport.message || slackError.message || 'Unknown error occurred',
    resolved: errorReport.resolved || false,
    resolution: errorReport.resolution,
    occurrenceCount: errorReport.occurrenceCount || 1,
    firstSeen: errorReport.firstSeen || now,
    lastSeen: errorReport.lastSeen || now,
    tags: [
      ...categorization.tags,
      ...(errorReport.tags || [])
    ].filter((tag, index, array) => array.indexOf(tag) === index), // Remove duplicates
    fingerprint: errorReport.fingerprint || `${categorization.category}_${slackError.code}_${slackError.message}`.replace(/[^a-zA-Z0-9_]/g, '_')
  };
}

/**
 * Get severity level description
 * @param severity - The severity level
 * @returns Human-readable severity description
 */
export function getSeverityDescription(severity: ErrorSeverity): string {
  const descriptions: Record<ErrorSeverity, string> = {
    [ErrorSeverity.CRITICAL]: 'Critical - Immediate attention required',
    [ErrorSeverity.HIGH]: 'High - Urgent issue that needs quick resolution',
    [ErrorSeverity.MEDIUM]: 'Medium - Important issue that should be addressed',
    [ErrorSeverity.LOW]: 'Low - Minor issue that can be addressed when convenient',
    [ErrorSeverity.INFO]: 'Info - Informational message for awareness'
  };
  
  return descriptions[severity] || 'Unknown severity level';
}

/**
 * Get category description
 * @param category - The error category
 * @returns Human-readable category description
 */
export function getCategoryDescription(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTH:
      return 'Authentication & Authorization';
    case ErrorCategory.API:
      return 'API & External Service';
    case ErrorCategory.RATE_LIMIT:
      return 'Rate Limiting & Throttling';
    case ErrorCategory.NETWORK:
      return 'Network & Connectivity';
    case ErrorCategory.VALIDATION:
      return 'Input Validation';
    case ErrorCategory.CONFIG:
      return 'Configuration & Setup';
    case ErrorCategory.SECURITY:
      return 'Security & Threats';
    case ErrorCategory.BOT_MANAGEMENT:
      return 'Bot Management';
    case ErrorCategory.MESSAGING:
      return 'Messaging & Communication';
    case ErrorCategory.EVENT_PROCESSING:
      return 'Event Processing';
    case ErrorCategory.UNKNOWN:
    default:
      return 'Unknown Category';
  }
}

/**
 * Get severity emoji for visual representation
 * @param severity - The severity level
 * @returns Emoji representing the severity
 */
export function getSeverityEmoji(severity: ErrorSeverity): string {
  const emojis: Record<ErrorSeverity, string> = {
    [ErrorSeverity.CRITICAL]: '🚨',
    [ErrorSeverity.HIGH]: '⚠️',
    [ErrorSeverity.MEDIUM]: '⚡',
    [ErrorSeverity.LOW]: 'ℹ️',
    [ErrorSeverity.INFO]: '💡'
  };
  
  return emojis[severity] || '❓';
}

/**
 * Get category emoji for visual representation
 * @param category - The error category
 * @returns Emoji representing the category
 */
export function getCategoryEmoji(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTH:
      return '🔐';
    case ErrorCategory.API:
      return '🌐';
    case ErrorCategory.RATE_LIMIT:
      return '⏱️';
    case ErrorCategory.NETWORK:
      return '📡';
    case ErrorCategory.VALIDATION:
      return '✅';
    case ErrorCategory.CONFIG:
      return '⚙️';
    case ErrorCategory.SECURITY:
      return '🛡️';
    case ErrorCategory.BOT_MANAGEMENT:
      return '🤖';
    case ErrorCategory.MESSAGING:
      return '💬';
    case ErrorCategory.EVENT_PROCESSING:
      return '⚡';
    case ErrorCategory.UNKNOWN:
    default:
      return '❓';
  }
}