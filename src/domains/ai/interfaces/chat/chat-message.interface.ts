import { ChatMessageRole } from "../../enums/chat";

/**
 * @ai-metadata
 * @description: Interface defining the structure of a chat message
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["../../enums/chat/chat-message-role.enum.ts", "../types/chat/schema/chat-message.schema.ts"]
 * @review-required: "yes"
 * 
 * Chat message structure
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: ChatMessageRole;
  /** Content of the message */
  content: string;
  /** Timestamp when the message was created */
  timestamp: string;
}