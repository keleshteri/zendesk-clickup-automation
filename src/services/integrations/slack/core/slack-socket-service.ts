/**
 * @ai-metadata
 * @component: SlackSocketService
 * @description: High-level service for managing Slack Socket Mode connections and event handling
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-socket-service.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "initialize": "allow", "shutdown": "allow", "onEvent": "allow", "offEvent": "allow", "reconnect": "allow", "updateConfig": "allow", "getStatus": "read-only", "isAvailable": "read-only", "getConnectionInfo": "read-only", "testConnection": "read-only", "getMetrics": "read-only" }
 * @dependencies: ["../../../../types/index.ts", "../types/index.ts", "./slack-socket-client.ts", "./slack-api-client.ts"]
 * @tests: ["./tests/slack-socket-service.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Service layer that manages Socket Mode connections for real-time Slack events. Changes here affect the reliability and configuration of real-time event handling."
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

import { Env } from '../../../../types/index';
import { 
  SlackEvent, 
  SlackTeamJoinEvent, 
  SlackChannelCreatedEvent, 
  SlackFileSharedEvent, 
  SlackReactionAddedEvent,
  SlackAuthTestResponse,
  SlackMessageEvent
} from '../types/index';
import { SlackSocketClient, SocketState, SocketEventHandler, SocketOptions } from './slack-socket-client';
import { SlackApiClient } from './slack-api-client';
/**
 * Socket Mode service configuration
 */
export interface SocketServiceConfig {
  enabled: boolean;
  fallbackToWebhooks: boolean;
  socketOptions?: SocketOptions;
  eventFilters?: string[];
}

/**
 * Socket Mode service for managing real-time Slack events
 * Provides high-level interface for Socket Mode functionality
 */
export class SlackSocketService {
  private env: Env;
  private apiClient: SlackApiClient;
  private socketClient: SlackSocketClient | null = null;
  private config: SocketServiceConfig;
  private isInitialized = false;

  constructor(
    env: Env,
    apiClient: SlackApiClient,
    config: SocketServiceConfig = {
      enabled: false,
      fallbackToWebhooks: true
    }
  ) {
    this.env = env;
    this.apiClient = apiClient;
    this.config = config;
  }

  /**
   * Initialize Socket Mode service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ Socket Mode service already initialized');
      return;
    }

    if (!this.config.enabled) {
      console.log('📴 Socket Mode disabled in configuration');
      return;
    }

    if (!this.env.SLACK_APP_TOKEN) {
      console.error('❌ SLACK_APP_TOKEN required for Socket Mode');
      if (this.config.fallbackToWebhooks) {
        console.log('🔄 Falling back to webhook mode');
        return;
      }
      throw new Error('Socket Mode enabled but SLACK_APP_TOKEN not provided');
    }

    try {
      // Verify app token has required scopes
      await this.verifyAppToken();
      
      // Create socket client
      this.socketClient = new SlackSocketClient(this.env, this.config.socketOptions);
      
      // Setup default event handlers
      this.setupDefaultHandlers();
      
      // Connect to Socket Mode
      await this.socketClient.connect();
      
      this.isInitialized = true;
      console.log('✅ Socket Mode service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Socket Mode service:', error);
      
      if (this.config.fallbackToWebhooks) {
        console.log('🔄 Falling back to webhook mode');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Shutdown Socket Mode service
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Shutting down Socket Mode service...');
    
    if (this.socketClient) {
      this.socketClient.disconnect();
      this.socketClient = null;
    }
    
    this.isInitialized = false;
    console.log('✅ Socket Mode service shutdown complete');
  }

  /**
   * Register event handler
   */
  onEvent(eventType: string, handler: SocketEventHandler): void {
    if (!this.socketClient) {
      throw new Error('Socket Mode not initialized');
    }
    
    // Apply event filters if configured
    if (this.config.eventFilters && !this.config.eventFilters.includes(eventType)) {
      console.log(`🚫 Event type ${eventType} filtered out by configuration`);
      return;
    }
    
    this.socketClient.on(eventType, handler);
    console.log(`📝 Registered handler for event type: ${eventType}`);
  }

  /**
   * Remove event handler
   */
  offEvent(eventType: string, handler?: SocketEventHandler): void {
    if (!this.socketClient) {
      return;
    }
    
    this.socketClient.off(eventType, handler);
    console.log(`🗑️ Removed handler for event type: ${eventType}`);
  }

  /**
   * Get connection status
   */
  getStatus(): {
    enabled: boolean;
    initialized: boolean;
    connected: boolean;
    state: SocketState | null;
    stats?: any;
  } {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      connected: this.socketClient?.isConnected() || false,
      state: this.socketClient?.getState() || null,
      stats: this.socketClient?.getStats()
    };
  }

  /**
   * Check if Socket Mode is available and connected
   */
  isAvailable(): boolean {
    return this.isInitialized && 
           this.socketClient !== null && 
           this.socketClient.isConnected();
  }

  /**
   * Reconnect to Socket Mode
   */
  async reconnect(): Promise<void> {
    if (!this.socketClient) {
      throw new Error('Socket Mode not initialized');
    }
    
    console.log('🔄 Reconnecting to Socket Mode...');
    this.socketClient.disconnect();
    await this.socketClient.connect();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SocketServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Socket Mode configuration updated');
  }

  /**
   * Verify app token has required scopes for Socket Mode
   */
  private async verifyAppToken(): Promise<void> {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_APP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Auth test failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as SlackAuthTestResponse;
      
      if (!data.ok) {
        throw new Error(`App token validation failed: ${data.error}`);
      }

      console.log(`✅ App token validated for bot: ${data.bot_id}`);
      
    } catch (error) {
      throw new Error(`Failed to verify app token: ${error}`);
    }
  }

  /**
   * Setup default event handlers for common events
   */
  private setupDefaultHandlers(): void {
    if (!this.socketClient) return;

    // Handle app mentions
    this.socketClient.on('app_mention', async (event: SlackEvent) => {
      const mentionEvent = event as SlackMessageEvent;
      console.log(`📢 App mentioned in channel ${mentionEvent.channel}: ${mentionEvent.text}`);
    });

    // Handle direct messages
    this.socketClient.on('message', async (event: SlackEvent) => {
      const messageEvent = event as SlackMessageEvent;
      if (messageEvent.channel?.startsWith('D')) {
        console.log(`💬 Direct message from ${messageEvent.user}: ${messageEvent.text}`);
      }
    });

    // Handle team join events
    this.socketClient.on('team_join', async (event: SlackEvent) => {
      const teamJoinEvent = event as any;
      console.log(`👋 New team member joined: ${teamJoinEvent.user?.name || teamJoinEvent.user?.id}`);
    });

    // Handle channel events
    this.socketClient.on('channel_created', async (event: SlackEvent) => {
      const channelEvent = event as any;
      console.log(`📁 New channel created: ${channelEvent.channel?.name}`);
    });

    // Handle file events
    this.socketClient.on('file_shared', async (event: SlackEvent) => {
      const fileEvent = event as any;
      console.log(`📎 File shared: ${fileEvent.file?.name || fileEvent.file_id}`);
    });

    // Handle reaction events
    this.socketClient.on('reaction_added', async (event: SlackEvent) => {
      const reactionEvent = event as any;
      console.log(`👍 Reaction added: ${reactionEvent.reaction} by ${reactionEvent.user}`);
    });

    // Handle workflow step events
    this.socketClient.on('workflow_step_execute', async (event: SlackEvent) => {
      const workflowEvent = event as any;
      console.log(`⚡ Workflow step executed: ${workflowEvent.workflow_step?.workflow_id}`);
    });

    // Handle error events
    this.socketClient.on('error', async (event: SlackEvent) => {
      console.error(`❌ Socket Mode error event:`, event);
    });

    console.log('📋 Default event handlers registered');
  }

  /**
   * Get Socket Mode connection URL for debugging
   */
  async getConnectionInfo(): Promise<any> {
    if (!this.env.SLACK_APP_TOKEN) {
      throw new Error('SLACK_APP_TOKEN required');
    }

    const response = await fetch('https://slack.com/api/apps.connections.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.SLACK_APP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get connection info: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Test Socket Mode connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const info = await this.getConnectionInfo();
      return info.ok === true;
    } catch (error) {
      console.error('❌ Socket Mode connection test failed:', error);
      return false;
    }
  }

  /**
   * Get Socket Mode metrics
   */
  getMetrics(): {
    connectionState: SocketState | null;
    reconnectAttempts: number;
    eventHandlerCount: number;
    uptime: number;
    lastError?: string;
  } {
    const stats = this.socketClient?.getStats();
    
    return {
      connectionState: stats?.state || null,
      reconnectAttempts: stats?.reconnectAttempts || 0,
      eventHandlerCount: stats?.eventHandlerCount || 0,
      uptime: this.isInitialized ? Date.now() : 0,
      lastError: undefined // Could be enhanced to track last error
    };
  }
}