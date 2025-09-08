/**
 * @type: domain
 * @domain: ai
 * @purpose: Chat service interface for AI conversations
 */

import { CreateConversationRequest, CreateMessageRequest } from "../types";
import { ChatConversation } from "./chat/chat-conversation.interface";

/**
 * Interface for AI chat service
 */
export interface IChatService {
  /**
   * Create a new conversation
   * @param request The conversation creation request
   * @returns The created conversation
   */
  createConversation(
    request: CreateConversationRequest
  ): Promise<ChatConversation>;

  /**
   * Get a conversation by ID
   * @param id The conversation ID
   * @returns The conversation or null if not found
   */
  getConversation(id: string): Promise<ChatConversation | null>;

  /**
   * Add a message to a conversation
   * @param conversationId The conversation ID
   * @param request The message creation request
   * @returns The updated conversation
   */
  addMessage(
    conversationId: string,
    request: CreateMessageRequest
  ): Promise<ChatConversation>;

  /**
   * Generate AI response for a conversation
   * @param conversationId The conversation ID
   * @returns The updated conversation with AI response
   */
  generateResponse(conversationId: string): Promise<ChatConversation>;

  /**
   * List all conversations
   * @returns Array of conversations
   */
  listConversations(): Promise<ChatConversation[]>;

  /**
   * Delete a conversation
   * @param id The conversation ID
   * @returns True if deleted, false if not found
   */
  deleteConversation(id: string): Promise<boolean>;
}
