/**
 * @ai-metadata
 * @component: SlackCoreModule
 * @description: Internal exports for Slack core services - not exposed externally
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-core-module.md
 * @stability: stable
 * @edit-permissions: "add-only"
 * @method-permissions: {}
 * @dependencies: ["./slack-api-client.ts", "./slack-app-manifest-service.ts", "./slack-message-builder.ts", "./slack-security-service.ts", "./slack-socket-service.ts"]
 * @tests: ["./tests/slack-core.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Internal module for core Slack services. These are implementation details and should not be exposed externally."
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
 * Slack Core Services - Internal Module
 * 
 * This module exports core Slack services for internal use within
 * the Slack integration. These services are implementation details
 * and should not be exposed to external consumers.
 */

// Core API and communication services
export { SlackApiClient } from './slack-api-client';
export { SlackSocketService } from './slack-socket-service';
export type { SocketServiceConfig } from './slack-socket-service';

// Message building and formatting
export { SlackMessageBuilder } from './slack-message-builder';

// App manifest and configuration management
export { SlackAppManifestService } from './slack-app-manifest-service';
export type { 
  AppConfigTemplate, 
  AppDeploymentConfig, 
  AppBackup 
} from './slack-app-manifest-service';

// App manifest client
export { SlackAppManifestClient } from './slack-app-manifest-client';
export type {
  SlackAppManifest,
  SlackAppConfig,
  AppManifestResponse,
  ManifestValidationResult
} from './slack-app-manifest-client';

// Security and verification services
export { SlackSecurityService } from './slack-security-service';
export type {
  TokenRotationConfig,
  SecurityMetrics,
  SecurityAuditEntry
} from './slack-security-service';