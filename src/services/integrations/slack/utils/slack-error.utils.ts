/**
 * @ai-metadata
 * @component: SlackErrorUtils
 * @description: Utility functions for Slack API error handling and type guards
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-utils.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../interfaces/slack-error.interface.ts"]
 * @tests: ["./tests/slack-error-utils.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Shared utility functions for consistent Slack API error handling and type checking across all Slack service modules"
 * 
 * @approvals:
 *   - dev-approved: true
 *   - dev-approved-by: "ai-assistant"
 *   - dev-approved-date: "2025-01-13T10:50:00Z"
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { ErrorCode } from '@slack/web-api';
import type { SlackAPIError, SlackAPIErrorWithContext } from '../interfaces/slack-error.interface';

/**
 * Type guard to check if an error is a Slack platform error
 * @param error - The error to check
 * @returns True if the error is a Slack platform error
 */
export function isSlackPlatformError(error: unknown): error is SlackAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ErrorCode.PlatformError
  );
}

/**
 * Type guard to check if an error is any Slack API error (not just platform errors)
 * @param error - The error to check
 * @returns True if the error is a Slack API error
 */
export function isSlackAPIError(error: unknown): error is SlackAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard to check if an error is a Slack rate limit error
 * @param error - The error to check
 * @returns True if the error is a rate limit error
 */
export function isSlackRateLimitError(error: unknown): error is SlackAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ErrorCode.RateLimitedError
  );
}

/**
 * Type guard to check if an error is a Slack request error
 * @param error - The error to check
 * @returns True if the error is a request error
 */
export function isSlackRequestError(error: unknown): error is SlackAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ErrorCode.RequestError
  );
}

/**
 * Type guard to check if an error is a Slack HTTP error
 * @param error - The error to check
 * @returns True if the error is an HTTP error
 */
export function isSlackHTTPError(error: unknown): error is SlackAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === ErrorCode.HTTPError
  );
}

/**
 * Enhanced error logging for Slack API errors with structured output
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 * @param operation - The operation being performed when error occurred
 */
export function logSlackError(
  error: unknown,
  context: string,
  operation: string
): void {
  const baseLog = {
    context,
    operation,
    timestamp: new Date().toISOString()
  };

  if (isSlackPlatformError(error)) {
    console.error(`❌ Slack Platform Error in ${context}:`, {
      ...baseLog,
      code: error.code,
      error: error.data?.error,
      response_metadata: error.data?.response_metadata
    });
  } else if (isSlackRateLimitError(error)) {
    console.error(`⏱️ Slack Rate Limit Error in ${context}:`, {
      ...baseLog,
      code: error.code,
      retry_after: error.data?.response_metadata?.retry_after,
      error: error.data?.error
    });
  } else if (isSlackAPIError(error)) {
    console.error(`🔌 Slack API Error in ${context}:`, {
      ...baseLog,
      code: error.code,
      message: error.message
    });
  } else {
    console.error(`💥 Unknown Error in ${context}:`, {
      ...baseLog,
      error
    });
  }
}

/**
 * Create a Slack API error with additional context
 * @param error - The original error
 * @param context - Additional context information
 * @returns Enhanced error with context
 */
export function createSlackErrorWithContext(
  error: SlackAPIError,
  context: {
    source: string;
    operation: string;
    metadata?: Record<string, unknown>;
  }
): SlackAPIErrorWithContext {
  return {
    ...error,
    context,
    timestamp: new Date()
  };
}

/**
 * Extract retry delay from Slack rate limit error
 * @param error - The rate limit error
 * @returns Retry delay in seconds, or null if not available
 */
export function getSlackRetryDelay(error: unknown): number | null {
  if (isSlackRateLimitError(error) && error.data?.response_metadata?.retry_after) {
    const retryAfter = error.data.response_metadata.retry_after;
    return typeof retryAfter === 'number' ? retryAfter : null;
  }
  return null;
}

/**
 * Check if a Slack error is recoverable (can be retried)
 * @param error - The error to check
 * @returns True if the error is recoverable
 */
export function isSlackErrorRecoverable(error: unknown): boolean {
  if (isSlackRateLimitError(error) || isSlackHTTPError(error)) {
    return true;
  }
  
  if (isSlackRequestError(error)) {
    // Some request errors are recoverable (network issues)
    return true;
  }
  
  if (isSlackPlatformError(error)) {
    // Platform errors are usually not recoverable
    const errorType = error.data?.error;
    const recoverableErrors = ['channel_not_found', 'not_in_channel'];
    return recoverableErrors.includes(errorType as string);
  }
  
  return false;
}