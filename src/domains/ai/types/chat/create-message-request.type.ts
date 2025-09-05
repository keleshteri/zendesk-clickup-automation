import { z } from 'zod';
import { CreateMessageSchema } from '../../schemas';

/**
 * @ai-metadata
 * @description: Type definition for creating a new chat message
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["./schema/create-message.schema.ts"]
 * @review-required: "yes"
 * 
 * Type for creating a new message
 */
export type CreateMessageRequest = z.infer<typeof CreateMessageSchema>;