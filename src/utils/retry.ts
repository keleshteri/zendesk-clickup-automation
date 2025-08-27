/**
 * @ai-metadata
 * @component: RetryUtility
 * @description: Retry logic with exponential backoff for handling temporary service failures
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/retry-utility.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/utils/retry.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Provides retry mechanisms with exponential backoff for external service calls"
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

/**
 * Configuration options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Jitter factor to add randomness (0-1) */
  jitter: number;
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback for retry attempts */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Final error if all attempts failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent retrying */
  totalTime: number;
  /** Details of each attempt */
  attemptDetails: Array<{
    attempt: number;
    error?: string;
    delay: number;
    timestamp: string;
  }>;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: 0.1,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx status codes
    const retryableErrors = [
      'network',
      'timeout',
      'fetch',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword)) ||
           (error as any).status >= 500;
  }
};



/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  options: RetryOptions
): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitterAmount = cappedDelay * options.jitter * Math.random();
  const finalDelay = cappedDelay + jitterAmount;
  
  return Math.round(finalDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  const attemptDetails: RetryResult<T>['attemptDetails'] = [];
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${config.maxAttempts}`);
      
      const result = await operation();
      
      attemptDetails.push({
        attempt,
        delay: 0,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Operation succeeded on attempt ${attempt}`);
      
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
        attemptDetails
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const shouldRetry = config.shouldRetry ? config.shouldRetry(lastError, attempt) : true;
      const isLastAttempt = attempt === config.maxAttempts;
      
      if (!shouldRetry || isLastAttempt) {
        attemptDetails.push({
          attempt,
          error: lastError.message,
          delay: 0,
          timestamp: new Date().toISOString()
        });
        
        console.error(`❌ Operation failed after ${attempt} attempts: ${lastError.message}`);
        break;
      }
      
      const delay = calculateDelay(attempt, config);
      
      attemptDetails.push({
        attempt,
        error: lastError.message,
        delay,
        timestamp: new Date().toISOString()
      });
      
      if (config.onRetry) {
        config.onRetry(lastError, attempt, delay);
      }
      
      console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError!,
    attempts: config.maxAttempts,
    totalTime: Date.now() - startTime,
    attemptDetails
  };
}



/**
 * Create a retryable version of any async function
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: Partial<RetryOptions> = {}
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const result = await retryWithBackoff(() => fn(...args), options);
    
    if (!result.success) {
      throw result.error;
    }
    
    return result.data!;
  };
}