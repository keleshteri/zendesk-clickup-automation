import { WebClient, ChatPostMessageArguments, ChatUpdateArguments, ChatDeleteArguments, ChatPostMessageResponse, ChatUpdateResponse } from '@slack/web-api';
import type {
  ISlackMessaging,
  MessageOptions,
  DirectMessageOptions,
  MessageUpdateOptions,
  MessageDeleteOptions,
  EphemeralMessageOptions,
  MessageReactionOptions
} from '../interfaces/slack-messaging.interface.js';
import type { SlackApiResponse } from '../types/slack.types.js';
import { SlackApiError, SlackAuthError, SlackChannelError } from '../errors/slack.errors.js';

/**
 * Slack messaging service implementation
 * Handles all Slack messaging operations including sending, updating, deleting messages and managing reactions
 */
export class SlackMessagingService implements ISlackMessaging {
  private client: WebClient;

  constructor(client: WebClient) {
    if (!client) {
      throw new SlackAuthError('Slack WebClient is required');
    }
    this.client = client;
  }

  /**
   * Send a message to a channel or user
   */
  async sendMessage(options: MessageOptions): Promise<ChatPostMessageResponse> {
    try {
      const messageArgs: ChatPostMessageArguments = {
        channel: options.channel,
        text: options.text,
        ...(options.blocks && { blocks: options.blocks }),
        ...(options.attachments && { attachments: options.attachments }),
        ...(options.threadTimestamp && { thread_ts: options.threadTimestamp }),
        ...(options.replyBroadcast !== undefined && { reply_broadcast: options.replyBroadcast }),
        unfurl_links: options.unfurlLinks ?? true,
        unfurl_media: options.unfurlMedia ?? true,
        parse: options.parse ?? 'full',
        link_names: options.linkNames ?? true,
        ...(options.username && { username: options.username }),
        ...(options.iconEmoji && { icon_emoji: options.iconEmoji }),
        ...(options.iconUrl && { icon_url: options.iconUrl })
      } as ChatPostMessageArguments;

      const result = await this.client.chat.postMessage(messageArgs);
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to send message: ${result.error}`);
      }

      return result;
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(options: DirectMessageOptions): Promise<ChatPostMessageResponse> {
    try {
      // Open DM channel with user
      const dmResult = await this.client.conversations.open({
        users: options.userId
      });

      if (!dmResult.ok || !dmResult.channel) {
        throw new SlackChannelError(`Failed to open DM with user ${options.userId}`);
      }

      // Send message to DM channel
      return await this.sendMessage({
        channel: dmResult.channel.id!,
        text: options.text,
        ...(options.blocks && { blocks: options.blocks }),
        ...options.options
      });
    } catch (error) {
      if (error instanceof SlackApiError || error instanceof SlackChannelError) {
        throw error;
      }
      throw new SlackApiError(`Failed to send direct message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(options: MessageUpdateOptions): Promise<ChatUpdateResponse> {
    try {
      const updateArgs: ChatUpdateArguments = {
        channel: options.channel,
        ts: options.timestamp,
        ...(options.text && { text: options.text }),
        ...(options.blocks && { blocks: options.blocks })
      } as ChatUpdateArguments;

      const result = await this.client.chat.update(updateArgs);
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to update message: ${result.error}`);
      }

      return result;
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to update message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(options: MessageDeleteOptions): Promise<void> {
    try {
      const deleteArgs: ChatDeleteArguments = {
        channel: options.channel,
        ts: options.timestamp
      };

      const result = await this.client.chat.delete(deleteArgs);
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to delete message: ${result.error}`);
      }

      // Reaction removed successfully
      return;
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send an ephemeral message (only visible to specific user)
   */
  async sendEphemeralMessage(options: EphemeralMessageOptions): Promise<void> {
    try {
      const result = await this.client.chat.postEphemeral({
        channel: options.channel,
        user: options.userId,
        text: options.text,
        blocks: options.blocks
      });
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to send ephemeral message: ${result.error}`);
      }

      // Ephemeral message sent successfully
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to send ephemeral message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(options: MessageReactionOptions): Promise<void> {
    try {
      const result = await this.client.reactions.add({
        channel: options.channel,
        timestamp: options.timestamp,
        name: options.emoji
      });
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to add reaction: ${result.error}`);
      }

      // Reaction added successfully
      return;
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to add reaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(options: MessageReactionOptions): Promise<void> {
    try {
      const result = await this.client.reactions.remove({
        channel: options.channel,
        timestamp: options.timestamp,
        name: options.emoji
      });
      
      if (!result.ok) {
        throw new SlackApiError(`Failed to remove reaction: ${result.error}`);
      }

      // Reaction removed successfully
      return;
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }
      throw new SlackApiError(`Failed to remove reaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Additional utility methods removed to focus on ISlackMessaging interface compliance

  /**
   * Get the Slack Web API client for advanced operations
   */
  getClient(): WebClient {
    return this.client;
  }

  async sendTemplatedMessage(templateId: string, channel: string, variables: Record<string, any>): Promise<ChatPostMessageResponse> {
    // This would need template manager integration
    throw new Error('sendTemplatedMessage not implemented - requires template manager');
  }

  async sendRenderedMessage(message: any, channel: string): Promise<ChatPostMessageResponse> {
    return this.sendMessage({
      channel,
      text: message.text,
      blocks: message.blocks
    });
  }

  async sendTyping(channel: string): Promise<void> {
    // Slack doesn't have a typing indicator API for bots
    // This is a no-op for compatibility
  }

  async getMessagePermalink(channel: string, timestamp: string): Promise<string> {
    try {
      const result = await this.client.chat.getPermalink({
        channel,
        message_ts: timestamp
      });
      return result.permalink || '';
    } catch (error) {
      throw new SlackApiError(`Failed to get permalink: ${error}`);
    }
  }

  async getMessageHistory(channel: string, limit?: number, cursor?: string): Promise<any[]> {
    try {
      const result = await this.client.conversations.history({
        channel,
        limit: limit || 100,
        cursor
      });
      return result.messages || [];
    } catch (error) {
      throw new SlackApiError(`Failed to get message history: ${error}`);
    }
  }
}