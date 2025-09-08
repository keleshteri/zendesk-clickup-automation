/**
 * @ai-metadata
 * @description: Index file for AI interfaces exports
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "medium"
 * @dependencies: ["./ai-client.interface", "./gemini-client.interface", "./prompt-manager.interface", "./chat"]
 * @review-required: "no"
 */
/**
 * @type: domain
 * @domain: ai
 * @purpose: AI service interfaces
 */

// Export all interfaces
export * from './ai-client.interface';
export * from './gemini-client.interface';
export * from './prompt-manager.interface';
export * from './chat-service.interface';