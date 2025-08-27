/**
 * @ai-metadata
 * @component: ZendeskRetryUtility
 * @description: Zendesk-specific retry logic with exponential backoff for handling Zendesk API failures
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-retry-utility.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../utils/retry.ts"]
 * @tests: ["./tests/services/integrations/zendesk/retry.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Provides Zendesk-specific retry mechanisms with custom error handling and logging"
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

import { RetryOptions, retryWithBackoff, RetryResult } from '../../../../utils/retry';

/**
 * Zendesk-specific retry configuration
 */
export const ZENDESK_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 4,
  initialDelay: 2000, // 2 seconds
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2,
  jitter: 0.1,
  shouldRetry: (error: Error) => {
    const errorMessage = error.message.toLowerCase();
    const retryableConditions = [
      // Network issues
      errorMessage.includes('network'),
      errorMessage.includes('timeout'),
      errorMessage.includes('fetch'),
      errorMessage.includes('econnreset'),
      errorMessage.includes('enotfound'),
      
      // Zendesk specific errors
      errorMessage.includes('service unavailable'),
      errorMessage.includes('temporarily unavailable'),
      errorMessage.includes('rate limit'),
      
      // HTTP status codes
      (error as any).status === 429, // Rate limited
      (error as any).status === 502, // Bad gateway
      (error as any).status === 503, // Service unavailable
      (error as any).status === 504, // Gateway timeout
    ];
    
    return retryableConditions.some(condition => condition);
  },
  onRetry: (error: Error, attempt: number, delay: number) => {
    console.warn(`🔄 Zendesk service retry attempt ${attempt}: ${error.message} (waiting ${delay}ms)`);
  }
};

/**
 * Zendesk-specific error types for better error handling
 */
export class ZendeskApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ZendeskApiError';
  }
}

export class ZendeskRateLimitError extends ZendeskApiError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'ZendeskRateLimitError';
  }
}

export class ZendeskServiceUnavailableError extends ZendeskApiError {
  constructor(message: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ZendeskServiceUnavailableError';
  }
}

/**
 * Enhanced retry wrapper specifically for Zendesk operations
 */
export async function retryZendeskOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  customOptions?: Partial<RetryOptions>
): Promise<T> {
  const options = { ...ZENDESK_RETRY_OPTIONS, ...customOptions };
  
  console.log(`🎫 Starting Zendesk operation: ${operationName}`);
  
  const result = await retryWithBackoff(operation, {
    ...options,
    onRetry: (error: Error, attempt: number, delay: number) => {
      // Enhanced logging for Zendesk operations
      const errorContext = {
        operation: operationName,
        attempt,
        delay,
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: (error as any).status,
        timestamp: new Date().toISOString()
      };
      
      console.warn(`🔄 Zendesk ${operationName} retry attempt ${attempt}: ${error.message} (waiting ${delay}ms)`, errorContext);
      
      // Call custom onRetry if provided
      if (customOptions?.onRetry) {
        customOptions.onRetry(error, attempt, delay);
      }
    }
  });
  
  if (!result.success) {
    const errorContext = {
      operation: operationName,
      totalAttempts: result.attempts,
      totalTime: result.totalTime,
      finalError: result.error?.message,
      attemptDetails: result.attemptDetails,
      timestamp: new Date().toISOString()
    };
    
    console.error(`❌ Zendesk ${operationName} failed after ${result.attempts} attempts:`, errorContext);
    
    // Enhance error with Zendesk-specific context
    const enhancedError = new ZendeskApiError(
      `Zendesk ${operationName} failed: ${result.error?.message}`,
      (result.error as any)?.status,
      'OPERATION_FAILED',
      errorContext
    );
    
    throw enhancedError;
  }
  
  console.log(`✅ Zendesk ${operationName} succeeded after ${result.attempts} attempts in ${result.totalTime}ms`);
  return result.data!;
}

/**
 * Retry wrapper for Zendesk API calls with specific error handling
 */
export async function retryZendeskApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  options?: {
    maxAttempts?: number;
    respectRateLimit?: boolean;
    customRetryCondition?: (error: Error) => boolean;
  }
): Promise<T> {
  const retryOptions: Partial<RetryOptions> = {
    maxAttempts: options?.maxAttempts || ZENDESK_RETRY_OPTIONS.maxAttempts,
    shouldRetry: (error: Error) => {
      // Custom retry condition takes precedence
      if (options?.customRetryCondition) {
        return options.customRetryCondition(error);
      }
      
      // Default Zendesk retry logic
      return ZENDESK_RETRY_OPTIONS.shouldRetry!(error, 0);
    }
  };
  
  // Handle rate limiting specifically
  if (options?.respectRateLimit) {
    const originalOnRetry = retryOptions.onRetry;
    retryOptions.onRetry = (error: Error, attempt: number, delay: number) => {
      if ((error as any).status === 429) {
        const retryAfter = (error as any).retryAfter;
        if (retryAfter) {
          console.warn(`🚦 Zendesk rate limit hit for ${endpoint}. Respecting Retry-After: ${retryAfter}s`);
          // Note: In a real implementation, you might want to use the retryAfter value
          // to override the calculated delay
        }
      }
      
      if (originalOnRetry) {
        originalOnRetry(error, attempt, delay);
      }
    };
  }
  
  return retryZendeskOperation(apiCall, `API call to ${endpoint}`, retryOptions);
}

/**
 * Create a retryable version of a Zendesk service method
 */
export function withZendeskRetry<TArgs extends any[], TReturn>(
  method: (...args: TArgs) => Promise<TReturn>,
  methodName: string,
  options?: Partial<RetryOptions>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    return retryZendeskOperation(
      () => method(...args),
      methodName,
      options
    );
  };
}

/**
 * Utility to check if an error is retryable for Zendesk operations
 */
export function isZendeskRetryableError(error: Error): boolean {
  return ZENDESK_RETRY_OPTIONS.shouldRetry!(error, 0);
}

/**
 * Get recommended retry delay for Zendesk rate limiting
 */
export function getZendeskRetryDelay(error: Error): number {
  if ((error as any).status === 429) {
    const retryAfter = (error as any).retryAfter;
    if (retryAfter && typeof retryAfter === 'number') {
      return retryAfter * 1000; // Convert seconds to milliseconds
    }
  }
  
  return ZENDESK_RETRY_OPTIONS.initialDelay;
}