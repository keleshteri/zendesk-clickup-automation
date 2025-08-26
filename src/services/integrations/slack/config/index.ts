/**
 * @ai-metadata
 * @component: SlackConfigModule
 * @description: Barrel exports for Slack service configuration module
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-service.config"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Export module for Slack service configuration patterns"
 */

export {
  SlackConfigBuilder,
  createSlackConfig,
  DEFAULT_SLACK_CONFIG,
  type SlackServiceConfig,
  type SlackWebClientConfig,
  type SlackMessagingConfig,
  type SlackBotManagerConfig,
  type SlackEventHandlerConfig,
  type SlackSecurityConfig,
  type SlackErrorReportingConfig,
  type SlackDevelopmentConfig,
  type SlackPerformanceConfig,
  type SlackRetryConfig,
  type ConfigValidationResult
} from './slack-service.config';