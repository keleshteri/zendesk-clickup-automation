import { z } from "zod";
import { CreateConversationSchema } from "../../schemas";

/**
 * @ai-metadata
 * @description: Type definition for creating a new chat conversation
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["./schema/create-conversation.schema.ts"]
 * @review-required: "yes"
 * 
 * Type for creating a new conversation
 */
export type CreateConversationRequest = z.infer<
  typeof CreateConversationSchema
>;
