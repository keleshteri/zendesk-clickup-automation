/**
 * @ai-metadata
 * @component: SlackUtilsIndex
 * @description: Centralized exports for all Slack utility classes and helper functions
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-utils-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-emojis.ts", "./slack-formatters.ts", "./slack-validators.ts", "./slack-constants.ts"]
 * @tests: ["./tests/slack-utils-index.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Main entry point for Slack utilities - provides unified access to all utility functions"
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
 *   - require-dev-approval-for: ["breaking-changes", "export-structure-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Slack utilities module exports
 * Provides centralized access to all utility classes
 */

export { SlackEmojis } from './slack-emojis';
export { SlackFormatters } from './slack-formatters';
export { SlackValidators, type ValidationResult } from './slack-validators';
export { SlackConstants } from './slack-constants';

// Re-export commonly used types and interfaces
// ValidationResult is already exported above with SlackValidators

// Utility type for Slack IDs
export type SlackId = string;
export type UserId = string;
export type ChannelId = string;
export type TeamId = string;
export type Timestamp = string;

// Import the classes for use in SlackUtils
import { SlackFormatters } from './slack-formatters';
import { SlackValidators } from './slack-validators';
import { SlackConstants } from './slack-constants';

// Common utility functions
export const SlackUtils = {
  /**
   * Quick access to commonly used formatters
   */
  format: {
    bold: SlackFormatters.bold,
    italic: SlackFormatters.italic,
    code: SlackFormatters.code,
    link: SlackFormatters.link,
    userMention: SlackFormatters.userMention,
    channelMention: SlackFormatters.channelMention
  },

  /**
   * Quick access to commonly used validators
   */
  validate: {
    userId: SlackValidators.validateUserId,
    channelId: SlackValidators.validateChannelId,
    messageText: SlackValidators.validateMessageText,
    timestamp: SlackValidators.validateTimestamp
  },

  /**
   * Quick access to commonly used emojis
   */
  emoji: {
    success: SlackConstants.EMOJIS.SUCCESS,
    error: SlackConstants.EMOJIS.ERROR,
    warning: SlackConstants.EMOJIS.WARNING,
    info: SlackConstants.EMOJIS.INFO,
    loading: SlackConstants.EMOJIS.LOADING,
    robot: SlackConstants.EMOJIS.ROBOT
  },

  /**
   * Quick access to commonly used constants
   */
  constants: {
    limits: SlackConstants.LIMITS,
    events: SlackConstants.EVENTS,
    colors: SlackConstants.COLORS,
    time: SlackConstants.TIME
  }
};