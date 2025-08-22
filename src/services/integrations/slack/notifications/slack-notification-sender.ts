/**
 * @ai-metadata
 * @component: SlackNotificationSender
 * @description: Handles sending Slack notifications with retry logic, error handling, and batch operations
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-notification-sender.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "sendNotification": "allow", "sendWithRetry": "read-only", "validateMessage": "read-only" }
 * @dependencies: ["../../../../types/index.ts", "../core/slack-api-client.ts", "../utils/slack-validators.ts", "../utils/slack-constants.ts"]
 * @tests: ["./tests/slack-notification-sender.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core notification sender with retry logic and error handling. Critical for reliable message delivery."
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { SlackMessage, SlackApiResponse, Env } from '../../../../types/index';
import { SlackApiClient } from '../core/slack-api-client';
import { SlackValidators } from '../utils/slack-validators';
import { SlackConstants } from '../utils/slack-constants';

/**
 * Handles sending Slack notifications with retry logic and error handling
 */
export class SlackNotificationSender {
  private apiClient: SlackApiClient;
  private env: Env;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(env: Env) {
    this.env = env;
    this.apiClient = new SlackApiClient(env);
  }

  /**
   * Send a notification message
   */
  async sendNotification(message: SlackMessage): Promise<SlackApiResponse | null> {
    try {
      // Validate message before sending
      if (!this.validateMessage(message)) {
        console.error('Invalid message format:', message);
        return null;
      }

      // Send with retry logic
      return await this.sendWithRetry(message);
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Send multiple notifications in batch
   */
  async sendBatchNotifications(messages: SlackMessage[]): Promise<(SlackApiResponse | null)[]> {
    const results: (SlackApiResponse | null)[] = [];
    
    // Send messages with rate limiting
    for (const message of messages) {
      const result = await this.sendNotification(message);
      results.push(result);
      
      // Add delay between messages to respect rate limits
      if (messages.indexOf(message) < messages.length - 1) {
        await this.delay(SlackConstants.API.RATE_LIMIT_DELAY);
      }
    }
    
    return results;
  }

  /**
   * Send a threaded notification
   */
  async sendThreadedNotification(
    message: SlackMessage,
    parentTs: string
  ): Promise<SlackApiResponse | null> {
    const threadedMessage = {
      ...message,
      thread_ts: parentTs
    };
    
    return await this.sendNotification(threadedMessage);
  }

  /**
   * Send an ephemeral notification (only visible to specific user)
   */
  async sendEphemeralNotification(
    message: SlackMessage,
    userId: string
  ): Promise<SlackApiResponse | null> {
    try {
      if (!this.validateMessage(message)) {
        console.error('Invalid ephemeral message format:', message);
        return null;
      }

      return await this.apiClient.sendEphemeralMessage(message.channel, userId, message);
    } catch (error) {
      console.error('Error sending ephemeral notification:', error);
      return null;
    }
  }

  /**
   * Update an existing notification
   */
  async updateNotification(
    channel: string,
    messageTs: string,
    updatedMessage: Partial<SlackMessage>
  ): Promise<SlackApiResponse | null> {
    try {
      return await this.apiClient.updateMessage({
        channel,
        ts: messageTs,
        text: updatedMessage.text,
        blocks: updatedMessage.blocks
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      return null;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    channel: string,
    messageTs: string
  ): Promise<SlackApiResponse | null> {
    try {
      return await this.apiClient.deleteMessage(channel, messageTs);
    } catch (error) {
      console.error('Error deleting notification:', error);
      return null;
    }
  }

  /**
   * Send notification with reaction
   */
  async sendNotificationWithReaction(
    message: SlackMessage,
    reaction: string
  ): Promise<{ message: SlackApiResponse | null; reaction: SlackApiResponse | null }> {
    const messageResult = await this.sendNotification(message);
    let reactionResult: SlackApiResponse | null = null;

    if (messageResult?.success && messageResult.data?.ts) {
      try {
        reactionResult = await this.apiClient.addReaction(
          message.channel,
          messageResult.data.ts,
          reaction
        );
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    }

    return {
      message: messageResult,
      reaction: reactionResult
    };
  }

  /**
   * Send notification to multiple channels
   */
  async sendToMultipleChannels(
    channels: string[],
    messageTemplate: Omit<SlackMessage, 'channel'>
  ): Promise<Map<string, SlackApiResponse | null>> {
    const results = new Map<string, SlackApiResponse | null>();

    for (const channel of channels) {
      const message: SlackMessage = {
        ...messageTemplate,
        channel
      };

      const result = await this.sendNotification(message);
      results.set(channel, result);

      // Add delay between channels to respect rate limits
      if (channels.indexOf(channel) < channels.length - 1) {
        await this.delay(SlackConstants.API.RATE_LIMIT_DELAY);
      }
    }

    return results;
  }

  /**
   * Send with retry logic
   */
  private async sendWithRetry(message: SlackMessage): Promise<SlackApiResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.apiClient.sendMessage(message);
        
        if (result.success) {
          return result;
        }

        // If it's a rate limit error, wait longer
        if (result.error?.includes('rate_limited')) {
          await this.delay(this.retryDelay * attempt * 2);
          continue;
        }

        // For other errors, don't retry
        console.error(`Failed to send message (attempt ${attempt}):`, result.error);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Error sending message (attempt ${attempt}):`, error);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    console.error('All retry attempts failed:', lastError);
    return null;
  }

  /**
   * Validate message format
   */
  private validateMessage(message: SlackMessage): boolean {
    if (!message.channel) {
      console.error('Message missing channel');
      return false;
    }

    if (!message.text && (!message.blocks || message.blocks.length === 0)) {
      console.error('Message missing both text and blocks');
      return false;
    }

    // Validate channel format
    if (!SlackValidators.validateChannelId(message.channel)) {
      console.error('Invalid channel format:', message.channel);
      return false;
    }

    // Validate blocks if present
    if (message.blocks && !SlackValidators.validateBlocks(message.blocks)) {
      console.error('Invalid blocks format');
      return false;
    }

    return true;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = Math.max(1, attempts);
    this.retryDelay = Math.max(100, delay);
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): { attempts: number; delay: number } {
    return {
      attempts: this.retryAttempts,
      delay: this.retryDelay
    };
  }

  /**
   * Check if the sender is properly configured
   */
  isConfigured(): boolean {
    return !!this.env.SLACK_BOT_TOKEN && !!this.env.SLACK_SIGNING_SECRET;
  }
}