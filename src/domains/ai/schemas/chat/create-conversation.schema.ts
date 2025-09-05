
import { z } from 'zod';

/**
 * @ai-metadata
 * @description: Schema for validating conversation creation requests
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["zod"]
 * @review-required: "yes"
 */
/**
 * Schema for creating a new conversation
 */
export const CreateConversationSchema = z.object({
  title: z.string().min(1, 'Conversation title cannot be empty').max(100),
  initialMessage: z.string().min(1, 'Initial message cannot be empty').optional()
});