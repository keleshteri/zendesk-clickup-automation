import { z } from 'zod';
import { ChatMessageRole } from '../../../enums/chat';

/**
 * @ai-metadata
 * @description: Schema for validating chat message structure
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["../../../enums/chat", "zod"]
 * @review-required: "yes"
 */
/**
 * Schema for validating chat message
 */
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.nativeEnum(ChatMessageRole),
  content: z.string().min(1, "Message content cannot be empty"),
  timestamp: z.string().datetime(),
});
