import type {
  ChatPostMessageResponse,
  ChatUpdateResponse,
} from "@slack/web-api";
 
import { RenderedMessage } from "../templates/rendered-message.interface.js";
import { DirectMessageOptions, EphemeralMessageOptions, MessageDeleteOptions, MessageOptions, MessageReactionOptions, MessageUpdateOptions } from "./message-options/index.js";
 

/**
 * Slack messaging service interface
 */
export interface ISlackMessaging {
  /**
   * Send a basic message to a channel
   */
  sendMessage(options: MessageOptions): Promise<ChatPostMessageResponse>;

  /**
   * Send a direct message to a user
   */
  sendDirectMessage(
    options: DirectMessageOptions
  ): Promise<ChatPostMessageResponse>;

  /**
   * Send a message using a template
   */
  sendTemplatedMessage(
    templateId: string,
    channel: string,
    variables: Record<string, any>
  ): Promise<ChatPostMessageResponse>;

  /**
   * Send a rendered message
   */
  sendRenderedMessage(
    message: RenderedMessage,
    channel: string
  ): Promise<ChatPostMessageResponse>;

  /**
   * Update an existing message
   */
  updateMessage(options: MessageUpdateOptions): Promise<ChatUpdateResponse>;

  /**
   * Delete a message
   */
  deleteMessage(options: MessageDeleteOptions): Promise<void>;

  /**
   * Send an ephemeral message (only visible to specific user)
   */
  sendEphemeralMessage(options: EphemeralMessageOptions): Promise<void>;

  /**
   * Add reaction to a message
   */
  addReaction(options: MessageReactionOptions): Promise<void>;

  /**
   * Remove reaction from a message
   */
  removeReaction(options: MessageReactionOptions): Promise<void>;

  /**
   * Send typing indicator
   */
  sendTyping(channel: string): Promise<void>;

  /**
   * Get message permalink
   */
  getMessagePermalink(channel: string, timestamp: string): Promise<string>;

  /**
   * Get message history from a channel
   */
  getMessageHistory(
    channel: string,
    limit?: number,
    cursor?: string
  ): Promise<any[]>;
}
