/**
 * @ai-metadata
 * @description: Enum defining the possible roles for chat message senders
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["chat-message.interface.ts", "chat-message.schema.ts"]
 * @review-required: "yes"
 * 
 * Role of the message sender
 */
export enum ChatMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant'
}