/**
 * @ai-metadata
 * @component: SlackErrorInterface
 * @description: Slack API error interface definitions based on Node Slack SDK documentation
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-interface.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api"]
 * @tests: ["./tests/slack-error.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Shared error interface for consistent Slack API error handling across all Slack service modules"
 * 
 * @approvals:
 *   - dev-approved: true
 *   - dev-approved-by: "ai-assistant"
 *   - dev-approved-date: "2025-01-13T10:50:00Z"
 *   - code-review-approved: false
 *   - qa-approved: false
 */

/**
 * Slack API error interface based on Node Slack SDK documentation
 * Used for consistent error handling across all Slack service modules
 */
export interface SlackAPIError {
  /** Error code from Slack API (e.g., ErrorCode.PlatformError) */
  code: string;
  
  /** Additional error data from Slack API response */
  data?: {
    /** Specific error message from Slack */
    error?: string;
    /** Response metadata including rate limit info */
    response_metadata?: Record<string, unknown>;
    /** Additional error properties */
    [key: string]: unknown;
  };
  
  /** Human-readable error message */
  message?: string;
  
  /** Original error object if wrapped */
  original?: Error;
}

/**
 * Extended Slack API error with additional context
 * Useful for internal error tracking and debugging
 */
export interface SlackAPIErrorWithContext extends SlackAPIError {
  /** Context about where the error occurred */
  context?: {
    /** Service or component that generated the error */
    source: string;
    /** Operation being performed when error occurred */
    operation: string;
    /** Additional context data */
    metadata?: Record<string, unknown>;
  };
  
  /** Timestamp when error occurred */
  timestamp?: Date;
}