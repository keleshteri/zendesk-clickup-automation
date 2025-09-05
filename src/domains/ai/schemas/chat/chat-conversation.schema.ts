import { z } from 'zod';
import { ChatMessageSchema } from "./chat-message.schema";

/**
 * @ai-metadata
 * @description: Schema for validating chat conversation structure
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["./chat-message.schema", "zod"]
 * @review-required: "yes"
 */
/**
 * Schema for validating chat conversation
 */
export const ChatConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Conversation title cannot be empty'),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});