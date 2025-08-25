/**
 * @ai-metadata
 * @component: SlackErrorReportingService
 * @description: Lightweight wrapper for the modular Slack error reporting system
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-service.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../slack-error-reporting"]
 * @tests: ["./tests/slack-error-reporting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Wrapper that re-exports the modular SlackErrorReportingService for backward compatibility"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

// Re-export the modular SlackErrorReportingService
export {
  SlackErrorReportingService,
  createErrorReportingService,
  DEFAULT_ERROR_REPORTING_CONFIG,
  validateConfig,
  mergeConfig,
  getSystemHealth
} from '../slack-error-reporting';

// Re-export all types for backward compatibility
export type * from '../slack-error-reporting/types';

// Re-export individual modules for advanced usage
export {
  ErrorReportingCore,
  ErrorPersistence,
  ErrorAnalytics,
  ErrorAlerting,
  ErrorForecasting
} from '../slack-error-reporting';