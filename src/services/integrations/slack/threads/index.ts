/**
 * @ai-metadata
 * @component: SlackThreadsIndex
 * @description: Centralizes exports for Slack thread management components including context, builder, and analyzer
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-threads-index.md
 * @stability: stable
 * @edit-permissions: "add-only"
 * @method-permissions: {}
 * @dependencies: ["./slack-thread-context.ts", "./slack-thread-builder.ts", "./slack-thread-analyzer.ts"]
 * @tests: ["./tests/slack-threads-index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Export aggregator for thread management functionality. Low risk as it only manages exports."
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

// Thread Management Classes
export { SlackThreadContext } from './slack-thread-context';
export { SlackThreadBuilder } from './slack-thread-builder';
export { SlackThreadAnalyzer } from './slack-thread-analyzer';

// Thread Analysis Types
export type {
  ThreadAnalysis,
  MessageSentiment,
  ConversationPattern
} from './slack-thread-analyzer';

// Thread Context Types
export type {
  ThreadParticipant,
  ThreadActivity,
  ThreadMetadata
} from './slack-thread-context';