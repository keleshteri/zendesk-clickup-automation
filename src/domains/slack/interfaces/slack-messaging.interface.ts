// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;
import type { ChatPostMessageResponse, ChatUpdateResponse } from '@slack/web-api';
import type { RenderedMessage } from './message-template.interface.js';

/**
 * Basic message options
 */
export interface MessageOptions {
  /** Channel ID to send message to */
  channel: string;
  /** Message text content */
  text: string;
  /** Rich Block Kit blocks */
  blocks?: (KnownBlock | Block)[];
  /** Legacy message attachments */
  attachments?: any[];
  /** Thread timestamp for replies */
  threadTimestamp?: string;
  /** Whether to broadcast thread reply to channel */
  replyBroadcast?: boolean;
  /** Custom username for the message */
  username?: string;
  /** Custom icon emoji */
  iconEmoji?: string;
  /** Custom icon URL */
  iconUrl?: string;
  /** Whether to parse links and mentions */
  parse?: 'full' | 'none';
  /** Whether to linkify channel names and usernames */
  linkNames?: boolean;
  /** Whether to find and link channel names and usernames */
  unfurlLinks?: boolean;
  /** Whether to unfurl media content */
  unfurlMedia?: boolean;
}

/**
 * Direct message options
 */
export interface DirectMessageOptions {
  /** User ID to send DM to */
  userId: string;
  /** Message text content */
  text: string;
  /** Rich Block Kit blocks */
  blocks?: (KnownBlock | Block)[];
  /** Additional message options */
  options?: Partial<MessageOptions>;
}

/**
 * Message update options
 */
export interface MessageUpdateOptions {
  /** Channel ID where message exists */
  channel: string;
  /** Timestamp of message to update */
  timestamp: string;
  /** New message text */
  text?: string;
  /** New blocks */
  blocks?: (KnownBlock | Block)[];
}

/**
 * Message deletion options
 */
export interface MessageDeleteOptions {
  /** Channel ID where message exists */
  channel: string;
  /** Timestamp of message to delete */
  timestamp: string;
}

/**
 * Ephemeral message options (only visible to specific user)
 */
export interface EphemeralMessageOptions {
  /** Channel ID to send message in */
  channel: string;
  /** User ID who will see the message */
  userId: string;
  /** Message text content */
  text: string;
  /** Rich Block Kit blocks */
  blocks?: (KnownBlock | Block)[];
}

/**
 * Message reaction options
 */
export interface MessageReactionOptions {
  /** Channel ID where message exists */
  channel: string;
  /** Timestamp of message to react to */
  timestamp: string;
  /** Emoji name (without colons) */
  emoji: string;
}

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
  sendDirectMessage(options: DirectMessageOptions): Promise<ChatPostMessageResponse>;
  
  /**
   * Send a message using a template
   */
  sendTemplatedMessage(templateId: string, channel: string, variables: Record<string, any>): Promise<ChatPostMessageResponse>;
  
  /**
   * Send a rendered message
   */
  sendRenderedMessage(message: RenderedMessage, channel: string): Promise<ChatPostMessageResponse>;
  
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
  getMessageHistory(channel: string, limit?: number, cursor?: string): Promise<any[]>;
}