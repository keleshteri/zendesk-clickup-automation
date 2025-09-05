import { z } from 'zod';
import { ChatMessageRole } from '../../enums';

/**
 * @ai-metadata
 * @description: Schema for validating message creation requests
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["../../../enums/chat", "zod"]
 * @review-required: "yes"
 */
/**
 * Schema for creating a new message
 */
export const CreateMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
  role: z.nativeEnum(ChatMessageRole).optional().default(ChatMessageRole.USER)
});