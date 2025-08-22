/**
 * @ai-metadata
 * @component: SlackTypesIndex
 * @description: Centralized exports for all Slack type definitions with type guards and utilities
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-types-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-message-types.ts", "./slack-event-types.ts", "./slack-workflow-types.ts", "./slack-context-types.ts"]
 * @tests: ["./tests/slack-types-index.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Main entry point for Slack type system, provides type guards and utilities for runtime type checking"
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
 *   - require-dev-approval-for: ["breaking-changes", "type-system-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Centralized exports for all Slack type definitions
 * Provides a single entry point for importing Slack-related types
 */

// Message types (base types, no dependencies)
export * from './slack-message-types';

// Event types (depends on message types)
export * from './slack-event-types';

// Workflow types (depends on message and event types)
export * from './slack-workflow-types';

// Context types
export * from './slack-context-types';

// Import types for use in type guards
import type { 
  SlackMessage, 
  SlackBlock, 
  SlackElement, 
  SlackBlockType, 
  SlackElementType, 
  SlackTextObject, 
  SlackOption,
  SlackMessageData 
} from './slack-message-types';
import type { 
  SlackEvent, 
  SlackEventType, 
  SlackUser, 
  SlackChannel, 
  SlackApiResponse, 
  SlackEventWrapper,
  SlackMessageEvent 
} from './slack-event-types';
import type { 
  SlackWorkflow, 
  WorkflowExecutionContext, 
  WorkflowStep 
} from './slack-workflow-types';

// Type guards and utilities for runtime type checking

/**
 * Common type guards for runtime type checking
 */
export const SlackTypeGuards = {
  /**
   * Check if an object is a valid Slack message
   */
  isSlackMessage(obj: any): obj is SlackMessage {
    return obj && (typeof obj.text === 'string' || Array.isArray(obj.blocks));
  },

  /**
   * Check if an object is a valid Slack event
   */
  isSlackEvent(obj: any): obj is SlackEvent {
    return obj && typeof obj.type === 'string' && typeof obj.event_ts === 'string';
  },

  /**
   * Check if an object is a valid Slack user
   */
  isSlackUser(obj: any): obj is SlackUser {
    return obj && typeof obj.id === 'string';
  },

  /**
   * Check if an object is a valid Slack channel
   */
  isSlackChannel(obj: any): obj is SlackChannel {
    return obj && typeof obj.id === 'string';
  },

  /**
   * Check if an object is a valid Slack workflow
   */
  isSlackWorkflow(obj: any): obj is SlackWorkflow {
    return obj && 
           typeof obj.id === 'string' && 
           typeof obj.name === 'string' && 
           typeof obj.version === 'string' && 
           Array.isArray(obj.steps);
  },

  /**
   * Check if an object is a valid workflow execution context
   */
  isWorkflowExecutionContext(obj: any): obj is WorkflowExecutionContext {
    return obj && 
           typeof obj.workflowId === 'string' && 
           typeof obj.executionId === 'string' && 
           typeof obj.status === 'string' && 
           obj.startTime instanceof Date;
  },

  /**
   * Check if an object is a valid Slack block
   */
  isSlackBlock(obj: any): obj is SlackBlock {
    return obj && typeof obj.type === 'string';
  },

  /**
   * Check if an object is a valid Slack element
   */
  isSlackElement(obj: any): obj is SlackElement {
    return obj && typeof obj.type === 'string';
  },

  /**
   * Check if an object is a valid Slack API response
   */
  isSlackApiResponse(obj: any): obj is SlackApiResponse {
    return obj && typeof obj.ok === 'boolean';
  },

  /**
   * Check if an object is a valid Slack event wrapper
   */
  isSlackEventWrapper(obj: any): obj is SlackEventWrapper {
    return obj && 
           typeof obj.token === 'string' && 
           typeof obj.team_id === 'string' && 
           obj.type === 'event_callback' && 
           this.isSlackEvent(obj.event);
  }
};

/**
 * Type utility functions
 */
export const SlackTypeUtils = {
  /**
   * Extract event type from event object
   */
  getEventType<T extends SlackEventType>(event: T): T['type'] {
    return event.type;
  },

  /**
   * Extract block type from block object
   */
  getBlockType<T extends SlackBlockType>(block: T): T['type'] {
    return block.type;
  },

  /**
   * Extract element type from element object
   */
  getElementType<T extends SlackElementType>(element: T): T['type'] {
    return element.type;
  },

  /**
   * Create a type-safe workflow step
   */
  createWorkflowStep(step: Omit<WorkflowStep, 'id' | 'order'>): Omit<WorkflowStep, 'id' | 'order'> {
    return {
      ...step,
      enabled: step.enabled ?? true,
      parameters: step.parameters ?? {},
      retryCount: step.retryCount ?? 0,
      retryDelay: step.retryDelay ?? 1000
    };
  },

  /**
   * Create a type-safe Slack text object
   */
  createTextObject(text: string, type: 'plain_text' | 'mrkdwn' = 'plain_text', emoji?: boolean): SlackTextObject {
    const textObj: SlackTextObject = { type, text };
    if (type === 'plain_text' && emoji !== undefined) {
      textObj.emoji = emoji;
    }
    return textObj;
  },

  /**
   * Create a type-safe Slack option
   */
  createOption(text: string, value: string, description?: string): SlackOption {
    const option: SlackOption = {
      text: this.createTextObject(text),
      value
    };
    if (description) {
      option.description = this.createTextObject(description);
    }
    return option;
  }
};