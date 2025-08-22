/**
 * @ai-metadata
 * @component: SlackHandlersIndex
 * @description: Centralized exports and factory for all Slack event and command handlers
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-handlers-index.md
 * @stability: stable
 * @edit-permissions: "add-only"
 * @method-permissions: {}
 * @dependencies: ["./slack-workflow-handler.ts", "./slack-mention-handler.ts", "./slack-command-handler.ts"]
 * @tests: ["./tests/slack-handlers-index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export module for Slack handlers. Changes here affect the public API of the handlers module."
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
 * Slack Handlers - Centralized exports for all Slack event and command handlers
 * 
 * This module provides specialized handlers for different aspects of Slack integration:
 * - SlackWorkflowHandler: Manages complex workflow operations and orchestration
 * - SlackMentionHandler: Handles mentions, team notifications, and escalation logic
 * - SlackCommandHandler: Processes slash commands, hashtag commands, and keyword triggers
 */

import { SlackWorkflowHandler } from './slack-workflow-handler';
import { SlackMentionHandler } from './slack-mention-handler';
import { SlackCommandHandler } from './slack-command-handler';

export { SlackWorkflowHandler, SlackMentionHandler, SlackCommandHandler };

// Re-export types and interfaces
export type {
  // Workflow types
  WorkflowStep,
  WorkflowCondition,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowTrigger,
  WorkflowSettings,
  WorkflowExecution
} from './slack-workflow-handler';

export type {
  MentionEvent,
  MentionContext,
  MentionRule,
  MentionCondition,
  MentionAction,
  TeamMention,
  MentionNotification
} from './slack-mention-handler';

export type {
  SlackCommand,
  CommandDefinition,
  CommandPermission,
  CommandOptions,
  CommandHandler,
  CommandContext,
  CommandResponse,
  SlackUser,
  SlackChannel,
  CommandExecution,
  CommandMetrics
} from './slack-command-handler';

/**
 * Handler configuration interface
 */
export interface SlackHandlerConfig {
  workflow: {
    maxConcurrentWorkflows: number;
    defaultTimeout: number;
    enableMetrics: boolean;
  };
  mention: {
    enableTeamMentions: boolean;
    escalationTimeout: number;
    maxMentionsPerMessage: number;
  };
  command: {
    enableSlashCommands: boolean;
    enableHashtagCommands: boolean;
    enableKeywordCommands: boolean;
    defaultCooldown: number;
  };
}

/**
 * Default handler configuration
 */
export const DEFAULT_HANDLER_CONFIG: SlackHandlerConfig = {
  workflow: {
    maxConcurrentWorkflows: 100,
    defaultTimeout: 300000, // 5 minutes
    enableMetrics: true
  },
  mention: {
    enableTeamMentions: true,
    escalationTimeout: 1800000, // 30 minutes
    maxMentionsPerMessage: 10
  },
  command: {
    enableSlashCommands: true,
    enableHashtagCommands: true,
    enableKeywordCommands: false,
    defaultCooldown: 5 // seconds
  }
};

/**
 * Handler factory for creating configured handler instances
 */
export class SlackHandlerFactory {
  static createWorkflowHandler(
    apiClient: any,
    messageBuilder: any,
    config?: Partial<SlackHandlerConfig['workflow']>
  ): SlackWorkflowHandler {
    return new SlackWorkflowHandler(apiClient, messageBuilder);
  }
  
  static createMentionHandler(
    apiClient: any,
    messageBuilder: any,
    config?: Partial<SlackHandlerConfig['mention']>
  ): SlackMentionHandler {
    return new SlackMentionHandler(apiClient, messageBuilder);
  }
  
  static createCommandHandler(
    apiClient: any,
    messageBuilder: any,
    config?: Partial<SlackHandlerConfig['command']>
  ): SlackCommandHandler {
    return new SlackCommandHandler(apiClient, messageBuilder);
  }
  
  static createAllHandlers(
    apiClient: any,
    messageBuilder: any,
    config?: Partial<SlackHandlerConfig>
  ) {
    const mergedConfig = {
      ...DEFAULT_HANDLER_CONFIG,
      ...config
    };
    
    return {
      workflow: this.createWorkflowHandler(apiClient, messageBuilder, mergedConfig.workflow),
      mention: this.createMentionHandler(apiClient, messageBuilder, mergedConfig.mention),
      command: this.createCommandHandler(apiClient, messageBuilder, mergedConfig.command)
    };
  }
}