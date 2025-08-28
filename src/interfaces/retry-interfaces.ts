/**
 * @ai-metadata
 * @component: RetryInterfaces
 * @description: Interface definitions for retry mechanism functionality
 * @last-update: 2025-01-28
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/retry-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["../utils/tests/retry.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Retry pattern interfaces for resilient operation execution"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

/**
 * Configuration options for retry operations
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