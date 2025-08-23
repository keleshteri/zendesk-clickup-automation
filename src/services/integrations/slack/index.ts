/**
 * @ai-metadata
 * @component: SlackIntegrationModule
 * @description: Main entry point for Slack integration - exports only SlackService for external use
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-integration-module.md
 * @stability: stable
 * @edit-permissions: "full"
 * @method-permissions: {}
 * @dependencies: ["./slack-service.ts"]
 * @tests: ["./tests/slack-integration.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Main entry point for the Slack integration module. Only exports SlackService to maintain modularity and encapsulation."
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
 * Slack Integration Module
 * 
 * This module provides a clean, modular interface for Slack integration.
 * All internal components are encapsulated and only the main SlackService
 * is exported for external use.
 * 
 * Usage:
 * ```typescript
 * import { SlackService } from './services/integrations/slack';
 * 
 * const slackService = new SlackService(env, multiAgentService, taskGenie);
 * await slackService.handleMention(event);
 * ```
 */

// Main service export - the only public interface
export { SlackService } from './slack-service';

// Type exports for external use
export type {
  SlackMessage,
  SlackEvent,
  SlackMessageEvent,
  SlackApiResponse,
  SlackTeamJoinEvent,
  SlackChannelCreatedEvent,
  SlackFileSharedEvent,
  SlackReactionAddedEvent,
  SlackAuthTestResponse,
  SlackAppMentionEvent,
  SlackMemberJoinedChannelEvent,
  SlackEventType,
  TaskGenieContext
} from './types';

// Note: All other internal modules (core/, handlers/, utils/, etc.) 
// are intentionally not exported to maintain encapsulation and modularity.
// External consumers should only interact with SlackService.