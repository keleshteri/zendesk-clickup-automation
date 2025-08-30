/**
 * @ai-metadata
 * @component: SlackErrorReporter
 * @description: Utility functions for easy error reporting to Slack across the application
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../interfaces/slack-error-reporting.interface.ts", "../slack-service/slack-error-reporting.service.ts"]
 */

import { SlackErrorReportingService } from '../slack-error-reporting';
import {
  ErrorSeverity,
  ErrorCategory,
  ErrorSource
} from '../interfaces/slack-error-reporting.interface';

/**
 * Global error reporter instance
 */
let globalErrorReporter: SlackErrorReportingService | null = null;

/**
 * Initialize the global error reporter
 * @param errorReportingService - The error reporting service instance
 */
export function initializeErrorReporter(errorReportingService: SlackErrorReportingService): void {
  globalErrorReporter = errorReportingService;
}

/**
 * Get the global error reporter instance
 * @returns The error reporting service instance or null if not initialized
 */
export function getErrorReporter(): SlackErrorReportingService | null {
  return globalErrorReporter;
}

/**
 * Quick error reporting function for application-wide use
 * @param error - The error to report
 * @param options - Additional error reporting options
 */
export async function reportError(
  error: Error | unknown,
  options: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    source?: Partial<ErrorSource>;
    context?: Record<string, any>;
    tags?: string[];
  } = {}
): Promise<void> {
  if (!globalErrorReporter) {
    console.warn('Error reporter not initialized. Error not reported to Slack:', error);
    return;
  }

  const source = {
    service: options.source?.service || 'Unknown',
    method: options.source?.method || 'Unknown',
    file: options.source?.file || 'Unknown',
    line: options.source?.line
  };

  const context = {
    ...options.context
  };

  try {
    await globalErrorReporter.reportError(
      error instanceof Error ? error : new Error(String(error)),
      source,
      context
    );
  } catch (reportingError) {
    console.error('Failed to report error to Slack:', reportingError);
    console.error('Original error:', error);
  }
}

/**
 * Report a critical error that requires immediate attention
 * @param error - The critical error
 * @param source - Error source information
 * @param context - Additional context
 */
export async function reportCriticalError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.UNKNOWN,
    source,
    context,
    tags: ['critical', 'immediate-attention']
  });
}

/**
 * Report an authentication error
 * @param error - The auth error
 * @param source - Error source information
 * @param context - Additional context
 */
export async function reportAuthError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.AUTH,
    source,
    context,
    tags: ['authentication', 'security']
  });
}

/**
 * Report an API error
 * @param error - The API error
 * @param source - Error source information
 * @param apiEndpoint - The API endpoint that failed
 * @param context - Additional context
 */
export async function reportAPIError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  apiEndpoint: string,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.API,
    source,
    context: {
      apiEndpoint,
      ...context
    },
    tags: ['api-error', 'external-service']
  });
}

/**
 * Report a rate limit error
 * @param error - The rate limit error
 * @param source - Error source information
 * @param retryAfter - Retry after duration
 * @param context - Additional context
 */
export async function reportRateLimitError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  retryAfter?: number,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.RATE_LIMIT,
    source,
    context: {
      retryAfter,
      ...context
    },
    tags: ['rate-limit', 'throttling']
  });
}

/**
 * Report a validation error
 * @param error - The validation error
 * @param source - Error source information
 * @param validationField - The field that failed validation
 * @param context - Additional context
 */
export async function reportValidationError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  validationField?: string,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.LOW,
    category: ErrorCategory.VALIDATION,
    source,
    context: {
      validationField,
      ...context
    },
    tags: ['validation', 'input-error']
  });
}

/**
 * Report a network error
 * @param error - The network error
 * @param source - Error source information
 * @param endpoint - The endpoint that failed
 * @param context - Additional context
 */
export async function reportNetworkError(
  error: Error | unknown,
  source: Partial<ErrorSource>,
  endpoint?: string,
  context?: Record<string, any>
): Promise<void> {
  await reportError(error, {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    source,
    context: {
      endpoint,
      ...context
    },
    tags: ['network', 'connectivity']
  });
}

/**
 * Create a decorator for automatic error reporting
 * @param options - Error reporting options
 */
export function withErrorReporting(options: {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  tags?: string[];
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        await reportError(error, {
          severity: options.severity || ErrorSeverity.MEDIUM,
          category: options.category || ErrorCategory.UNKNOWN,
          source: {
            service: target.constructor.name,
            method: propertyKey,
            file: __filename
          },
          context: {
            arguments: args.map((arg, index) => ({ [`arg${index}`]: arg })),
            timestamp: new Date().toISOString()
          },
          tags: options.tags
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Wrap a function with automatic error reporting
 * @param fn - The function to wrap
 * @param options - Error reporting options
 */
export function wrapWithErrorReporting<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    source?: Partial<ErrorSource>;
    tags?: string[];
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await reportError(error, {
        severity: options.severity || ErrorSeverity.MEDIUM,
        category: options.category || ErrorCategory.UNKNOWN,
        source: options.source || {
          service: 'WrappedFunction',
          method: fn.name || 'anonymous',
          file: __filename
        },
        context: {
          arguments: args,
          timestamp: new Date().toISOString()
        },
        tags: options.tags
      });
      throw error;
    }
  }) as T;
}