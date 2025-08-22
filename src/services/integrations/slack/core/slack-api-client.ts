/**
 * @ai-metadata
 * @component: SlackApiClient
 * @description: Core Slack API client for handling all Slack Web API interactions including messages, threads, users, and channels
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-api-client.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "postMessage": "allow", "postThreadMessage": "allow", "updateMessage": "allow", "deleteMessage": "allow", "getUserInfo": "read-only", "getChannelInfo": "read-only", "testConnection": "read-only", "getBotInfo": "read-only", "sendMessage": "allow", "addReaction": "allow", "sendEphemeralMessage": "allow", "makeApiRequest": "read-only" }
 * @dependencies: ["../../../../types/index.ts", "../utils/slack-validators.ts", "../utils/slack-constants.ts"]
 * @tests: ["./tests/slack-api-client.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Critical API client that handles all communication with Slack's Web API. Changes here affect all Slack functionality including message sending, user management, and channel operations."
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

import { Env, SlackMessage, SlackApiResponse } from '../../../../types/index';
import { SlackValidators } from '../utils/slack-validators';
import { SlackConstants } from '../utils/slack-constants';

export interface SlackMessageRequest {
  channel: string;
  text?: string; // Optional when using blocks, but recommended as fallback for accessibility
  blocks?: any[];
  attachments?: any[]; // JSON-based array of structured attachments
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string; // URL to an image for the message icon (alternative to icon_emoji)
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  link_names?: boolean; // Find and link user groups
  mrkdwn?: boolean; // Enable/disable Slack markup parsing (defaults to true)
  parse?: 'none' | 'full'; // Change how messages are treated
  reply_broadcast?: boolean; // Make thread replies visible to everyone in channel
  metadata?: {
    event_type: string;
    event_payload: Record<string, any>;
  }; // JSON object with event_type and event_payload fields
  as_user?: boolean; // Legacy parameter for classic apps
}

export interface SlackThreadRequest {
  channel: string;
  thread_ts: string;
  text: string;
  blocks?: any[];
  username?: string;
  icon_emoji?: string;
}

export interface SlackMessageUpdate {
  channel: string;
  ts: string;
  text?: string;
  blocks?: any[];
}

export interface SlackUserInfo {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  email?: string;
  is_bot?: boolean;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile?: {
    display_name?: string;
    real_name?: string;
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
  };
}

export interface SlackChannelInfo {
  id: string;
  name: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  is_archived?: boolean;
  is_general?: boolean;
  is_shared?: boolean;
  is_org_shared?: boolean;
  is_member?: boolean;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
}

export interface SlackHeaders {
  'x-slack-signature'?: string;
  'x-slack-request-timestamp'?: string;
  'content-type'?: string;
  'user-agent'?: string;
}

/**
 * Centralized Slack API client for all Slack Web API interactions
 * Handles authentication, rate limiting, and error handling
 */
export class SlackApiClient {
  private env: Env;
  private readonly baseUrl = SlackConstants.API.BASE_URL;
  private readonly defaultHeaders: Record<string, string>;

  constructor(env: Env) {
    this.env = env;
    this.defaultHeaders = {
      'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'TaskGenie-SlackBot/1.0'
    };
  }

  /**
   * Post a message to a Slack channel
   */
  async postMessage(message: SlackMessageRequest): Promise<SlackApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          channel: message.channel,
          text: message.text,
          blocks: message.blocks,
          thread_ts: message.thread_ts,
          username: message.username || 'TaskGenie',
          icon_emoji: message.icon_emoji || ':robot_face:',
          unfurl_links: message.unfurl_links ?? false,
          unfurl_media: message.unfurl_media ?? false
        })
      });

      const data = await response.json() as SlackApiResponse;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (postMessage):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to post Slack message:', error);
      throw error;
    }
  }

  /**
   * Post a threaded message to a Slack channel
   */
  async postThreadMessage(threadMessage: SlackThreadRequest): Promise<SlackApiResponse> {
    return this.postMessage({
      channel: threadMessage.channel,
      text: threadMessage.text,
      blocks: threadMessage.blocks,
      thread_ts: threadMessage.thread_ts,
      username: threadMessage.username,
      icon_emoji: threadMessage.icon_emoji
    });
  }

  /**
   * Get conversation replies (thread messages)
   */
  async getConversationReplies(
    channel: string, 
    threadTs: string, 
    limit: number = 10, 
    cursor?: string
  ): Promise<SlackApiResponse> {
    try {
      const params = new URLSearchParams({
        channel,
        ts: threadTs,
        limit: limit.toString()
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`${this.baseUrl}/conversations.replies?${params}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      const data = await response.json() as SlackApiResponse;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (getConversationReplies):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get conversation replies:', error);
      throw error;
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(messageUpdate: SlackMessageUpdate): Promise<SlackApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.update`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          channel: messageUpdate.channel,
          ts: messageUpdate.ts,
          text: messageUpdate.text,
          blocks: messageUpdate.blocks
        })
      });

      const data = await response.json() as SlackApiResponse;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (updateMessage):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to update Slack message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(channel: string, ts: string): Promise<SlackApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.delete`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          channel,
          ts
        })
      });

      const data = await response.json() as SlackApiResponse;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (deleteMessage):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to delete Slack message:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: string): Promise<SlackUserInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/users.info?user=${userId}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      const data = await response.json() as any;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (getUserInfo):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data.user as SlackUserInfo;
    } catch (error) {
      console.error('❌ Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<SlackChannelInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.info?channel=${channelId}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      const data = await response.json() as any;
      
      if (!data.ok) {
        console.error('❌ Slack API Error (getChannelInfo):', data.error);
        throw new Error(`Slack API Error: ${data.error}`);
      }

      return data.channel as SlackChannelInfo;
    } catch (error) {
      console.error('❌ Failed to get channel info:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      const data = await response.json() as SlackApiResponse;
      return data.ok === true;
    } catch (error) {
      console.error('❌ Failed to test Slack connection:', error);
      return false;
    }
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        method: 'POST',
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      return {
        ok: data.ok,
        user_id: data.user_id,
        team_id: data.team_id,
        url: data.url,
        team: data.team,
        user: data.user,
        bot_id: data.bot_id
      };
    } catch (error) {
      console.error('Error getting bot info:', error);
      throw error;
    }
  }

  /**
   * Send a message (alias for postMessage)
   */
  async sendMessage(message: SlackMessage): Promise<SlackApiResponse> {
    const messageRequest: SlackMessageRequest = {
      channel: message.channel,
      text: message.text,
      blocks: message.blocks,
      thread_ts: message.thread_ts,
      username: message.username,
      icon_emoji: message.icon_emoji
    };
    return this.postMessage(messageRequest);
  }

  /**
   * Add reaction to a message
   */
  async addReaction(channel: string, timestamp: string, name: string): Promise<SlackApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reactions.add`, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          timestamp,
          name
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        ok: data.ok,
        success: data.ok,
        error: data.error,
        data: data.ok ? { ts: timestamp, channel } : undefined
      };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send ephemeral message
   */
  async sendEphemeralMessage(channel: string, user: string, message: Partial<SlackMessage>): Promise<SlackApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postEphemeral`, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          user,
          text: message.text,
          blocks: message.blocks,
          username: message.username,
          icon_emoji: message.icon_emoji
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        ok: data.ok,
        success: data.ok,
        error: data.error,
        channel: data.channel,
        ts: data.message_ts,
        data: data.ok ? { ts: data.message_ts, channel: data.channel } : undefined
      };
    } catch (error) {
      console.error('Error sending ephemeral message:', error);
      return {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced rate limiting handler with tier-aware delays
   */
  private async handleRateLimit(retryAfter?: number, endpoint?: string): Promise<void> {
    // Use Retry-After header if provided, otherwise use tier-based defaults
    let delay = retryAfter ? retryAfter * 1000 : this.getTierBasedDelay(endpoint);
    
    // Cap the delay to prevent excessive waiting
    delay = Math.min(delay, SlackConstants.API.TIMEOUT.LONG_RUNNING);
    
    console.warn(`⚠️ Rate limited on ${endpoint || 'unknown endpoint'}, waiting ${delay}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get tier-based delay for different API endpoints
   */
  private getTierBasedDelay(endpoint?: string): number {
    if (!endpoint) return SlackConstants.API.RATE_LIMIT_DELAY;
    
    // Message posting endpoints (Tier 1)
    if (endpoint.includes('chat.postMessage') || endpoint.includes('files.upload')) {
      return 60000; // 1 minute for Tier 1
    }
    
    // Simple read operations (Tier 3)
    if (endpoint.includes('users.info') || endpoint.includes('conversations.info')) {
      return 1200; // 1.2 seconds for Tier 3 (50 requests/minute)
    }
    
    // Very simple methods (Tier 4)
    if (endpoint.includes('auth.test')) {
      return 600; // 0.6 seconds for Tier 4 (100 requests/minute)
    }
    
    // Default to Tier 2 (most Web API methods)
    return 3000; // 3 seconds for Tier 2 (20 requests/minute)
  }

  /**
   * Public method for app manifest API calls
   */
  async makeAppManifestRequest(
    endpoint: string,
    data: Record<string, any>
  ): Promise<SlackApiResponse> {
    const options: RequestInit = {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data)
    };
    
    return this.makeApiRequest(endpoint, options);
  }

  /**
   * Enhanced API request with comprehensive error handling and retry logic
   */
  private async makeApiRequest(
    endpoint: string, 
    options: RequestInit, 
    retries: number = SlackConstants.API.RETRY.MAX_ATTEMPTS
  ): Promise<SlackApiResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: { ...this.defaultHeaders, ...options.headers },
          signal: AbortSignal.timeout(SlackConstants.API.TIMEOUT.DEFAULT)
        });

        // Handle different HTTP status codes
        if (response.status === 429) {
          // Rate limiting - extract Retry-After header
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
          console.warn(`🚦 Rate limited on ${endpoint} (attempt ${attempt}/${retries})`);
          
          if (attempt < retries) {
            await this.handleRateLimit(retryAfter, endpoint);
            continue;
          } else {
            throw new Error(`Rate limit exceeded after ${retries} attempts on ${endpoint}`);
          }
        }

        if (response.status === 401) {
          throw new Error(`Authentication failed for ${endpoint}. Check your bot token.`);
        }

        if (response.status === 403) {
          throw new Error(`Insufficient permissions for ${endpoint}. Check your OAuth scopes.`);
        }

        if (response.status === 404) {
          throw new Error(`Resource not found for ${endpoint}. Check channel/user IDs.`);
        }

        if (response.status >= 500) {
          console.warn(`🔧 Server error ${response.status} on ${endpoint} (attempt ${attempt}/${retries})`);
          if (attempt < retries) {
            // Use exponential backoff for server errors
            const delay = Math.min(
              SlackConstants.API.RETRY.BASE_DELAY * Math.pow(SlackConstants.API.RETRY.BACKOFF_FACTOR, attempt - 1),
              SlackConstants.API.RETRY.MAX_DELAY
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Parse response
        let data: SlackApiResponse;
        try {
          data = await response.json() as SlackApiResponse;
        } catch (parseError) {
          throw new Error(`Failed to parse response from ${endpoint}: ${parseError}`);
        }

        // Handle Slack API-level errors
        if (data.ok === false) {
          const errorMsg = data.error || 'Unknown Slack API error';
          
          // Handle specific Slack errors that might be retryable
          if (this.isRetryableSlackError(errorMsg) && attempt < retries) {
            console.warn(`🔄 Retryable Slack error '${errorMsg}' on ${endpoint} (attempt ${attempt}/${retries})`);
            const delay = SlackConstants.API.RETRY.BASE_DELAY * attempt;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`Slack API error on ${endpoint}: ${errorMsg}`);
        }

        // Success - log if this was a retry
        if (attempt > 1) {
          console.log(`✅ Request to ${endpoint} succeeded on attempt ${attempt}`);
        }

        return data;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log the error with context
        console.error(`❌ API request to ${endpoint} failed (attempt ${attempt}/${retries}):`, {
          error: lastError.message,
          endpoint,
          attempt,
          retries
        });
        
        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }
        
        // Skip retry for non-retryable errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }
        
        // Exponential backoff for network/timeout errors
        const delay = Math.min(
          SlackConstants.API.RETRY.BASE_DELAY * Math.pow(SlackConstants.API.RETRY.BACKOFF_FACTOR, attempt - 1),
          SlackConstants.API.RETRY.MAX_DELAY
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    throw new Error(`Request to ${endpoint} failed after ${retries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Check if a Slack API error is retryable
   */
  private isRetryableSlackError(error: string): boolean {
    const retryableErrors = [
      'internal_error',
      'service_unavailable', 
      'timeout',
      'rate_limited',
      'fatal_error'
    ];
    return retryableErrors.includes(error);
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('authentication failed') ||
      message.includes('insufficient permissions') ||
      message.includes('resource not found') ||
      message.includes('invalid') ||
      message.includes('malformed')
    );
  }
}