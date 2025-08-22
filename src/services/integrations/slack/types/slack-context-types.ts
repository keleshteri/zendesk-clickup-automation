/**
 * @ai-metadata
 * @component: SlackContextTypes
 * @description: Type definitions for Slack context-related interfaces and conversation state management
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-context-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/slack-context-types.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines context interfaces for TaskGenie conversations and Slack integration state management"
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
 *   - require-dev-approval-for: ["breaking-changes", "context-structure-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Type definitions for Slack context-related interfaces
 * Provides typing for conversation context and task management
 */

/**
 * Context for TaskGenie conversations in Slack
 * Maintains conversation state and metadata for AI interactions
 */
export interface TaskGenieContext {
  /** Unique identifier for the conversation session */
  session_id: string;
  
  /** Slack channel where the conversation is taking place */
  channel: string;
  
  /** Slack thread timestamp for threaded conversations */
  slack_thread_ts?: string;
  
  /** User ID of the person interacting with TaskGenie */
  user_id: string;
  
  /** Timestamp when the context was created */
  created_at: Date;
  
  /** Timestamp when the context was last updated */
  updated_at: Date;
  
  /** Current conversation state */
  state: 'active' | 'waiting' | 'completed' | 'error';
  
  /** Conversation history and metadata */
  metadata?: {
    /** Previous messages in the conversation */
    messages?: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    
    /** Current task or topic being discussed */
    current_task?: string;
    
    /** Any relevant context from previous interactions */
    context_data?: Record<string, any>;
  };
}

/**
 * Extended context for Slack conversations with additional metadata
 */
export interface SlackConversationContext extends TaskGenieContext {
  /** Slack workspace/team ID */
  team_id: string;
  
  /** Channel information */
  channel_info?: {
    name: string;
    is_private: boolean;
    is_dm: boolean;
  };
  
  /** User information */
  user_info?: {
    name: string;
    real_name?: string;
    email?: string;
    timezone?: string;
  };
  
  /** Integration-specific context */
  integrations?: {
    zendesk?: {
      ticket_id?: string;
      agent_id?: string;
    };
    clickup?: {
      task_id?: string;
      list_id?: string;
      space_id?: string;
    };
  };
}

/**
 * Context manager interface for handling Slack conversations
 */
export interface SlackContextManager {
  /** Create a new conversation context */
  createContext(params: Omit<TaskGenieContext, 'created_at' | 'updated_at'>): Promise<TaskGenieContext>;
  
  /** Get existing context by session ID */
  getContext(sessionId: string): Promise<TaskGenieContext | null>;
  
  /** Update existing context */
  updateContext(sessionId: string, updates: Partial<TaskGenieContext>): Promise<TaskGenieContext>;
  
  /** Delete context */
  deleteContext(sessionId: string): Promise<void>;
  
  /** Get contexts by channel */
  getContextsByChannel(channel: string): Promise<TaskGenieContext[]>;
  
  /** Get contexts by user */
  getContextsByUser(userId: string): Promise<TaskGenieContext[]>;
  
  /** Clean up expired contexts */
  cleanupExpiredContexts(maxAge: number): Promise<number>;
}