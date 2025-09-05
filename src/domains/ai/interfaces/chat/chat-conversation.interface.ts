import { ChatMessage } from "./chat-message.interface";

/**
 * @ai-metadata
 * @description: Interface defining the structure of a chat conversation
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["./chat-message.interface.ts", "../types/chat/schema/chat-conversation.schema.ts"]
 * @review-required: "yes"
 * 
 * Chat conversation structure
 */
export interface ChatConversation {
  /** Unique identifier for the conversation */
  id: string;
  /** Title of the conversation */
  title: string;
  /** Messages in the conversation */
  messages: ChatMessage[];
  /** Timestamp when the conversation was created */
  createdAt: string;
  /** Timestamp when the conversation was last updated */
  updatedAt: string;
}