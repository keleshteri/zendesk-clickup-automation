import { Env, SlackEvent } from '../../../../types/index';
import { SlackConstants } from '../utils/slack-constants';
import { SlackValidators } from '../utils/slack-validators';

/**
 * @ai-metadata
 * @component: SlackSocketClient
 * @description: WebSocket client for Slack Socket Mode connections with event handling and reconnection logic
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-socket-client.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "connect": "allow", "disconnect": "allow", "send": "allow", "on": "allow", "off": "allow", "reconnect": "allow", "getState": "read-only", "isConnected": "read-only" }
 * @dependencies: []
 * @tests: ["./tests/slack-socket-client.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "WebSocket client that manages real-time connections to Slack. Changes here affect the reliability and performance of real-time Slack event handling."
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

/**
 * Socket Mode connection states
 */

export enum SocketState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Socket Mode message types
 */
export interface SocketMessage {
  envelope_id: string;
  type: 'hello' | 'disconnect' | 'events_api' | 'interactive' | 'slash_commands';
  payload?: any;
  accepts_response_payload?: boolean;
  retry_attempt?: number;
  retry_reason?: string;
}

/**
 * Socket Mode acknowledgment message
 */
export interface SocketAck {
  envelope_id: string;
  payload?: any;
}

/**
 * Socket Mode event handler
 */
export type SocketEventHandler = (event: SlackEvent, ack: () => void) => Promise<void> | void;

/**
 * Socket Mode connection options
 */
export interface SocketOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

/**
 * Slack Socket Mode client for real-time event handling
 * Provides an alternative to HTTP webhooks with persistent WebSocket connection
 */
export class SlackSocketClient {
  private env: Env;
  private ws: WebSocket | null = null;
  private state: SocketState = SocketState.DISCONNECTED;
  private eventHandlers: Map<string, SocketEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  
  private readonly options: Required<SocketOptions> = {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 5000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000
  };

  constructor(env: Env, options?: SocketOptions) {
    this.env = env;
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Connect to Slack Socket Mode
   */
  async connect(): Promise<void> {
    if (this.state === SocketState.CONNECTED || this.state === SocketState.CONNECTING) {
      console.warn('⚠️ Socket Mode already connected or connecting');
      return;
    }

    if (!this.env.SLACK_APP_TOKEN) {
      throw new Error('SLACK_APP_TOKEN is required for Socket Mode');
    }

    try {
      this.state = SocketState.CONNECTING;
      console.log('🔌 Connecting to Slack Socket Mode...');

      // Get WebSocket URL from Slack API
      const connectionUrl = await this.getConnectionUrl();
      
      // Create WebSocket connection
      this.ws = new WebSocket(connectionUrl);
      
      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        if (this.state === SocketState.CONNECTING) {
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.options.connectionTimeout);

      this.setupWebSocketHandlers();
      
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from Socket Mode
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from Slack Socket Mode...');
    
    this.state = SocketState.DISCONNECTED;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: SocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, handler?: SocketEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(eventType);
      return;
    }
    
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get current connection state
   */
  getState(): SocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === SocketState.CONNECTED;
  }

  /**
   * Get connection URL from Slack API
   */
  private async getConnectionUrl(): Promise<string> {
    const response = await fetch('https://slack.com/api/apps.connections.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.SLACK_APP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get Socket Mode URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { ok: boolean; error?: string; url?: string };
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
    }

    return data.url!;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.addEventListener('open', () => {
      console.log('✅ Connected to Slack Socket Mode');
      this.state = SocketState.CONNECTED;
      this.reconnectAttempts = 0;
      this.clearTimers();
      this.startHeartbeat();
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const message: SocketMessage = JSON.parse(event.data);
        this.handleSocketMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse Socket Mode message:', error);
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log(`🔌 Socket Mode connection closed: ${event.code} ${event.reason}`);
      this.state = SocketState.DISCONNECTED;
      this.clearTimers();
      
      if (this.options.autoReconnect && event.code !== 1000) {
        this.attemptReconnect();
      }
    });

    this.ws.addEventListener('error', (error) => {
      console.error('❌ Socket Mode WebSocket error:', error);
      this.handleConnectionError(new Error('WebSocket error'));
    });
  }

  /**
   * Handle incoming Socket Mode messages
   */
  private async handleSocketMessage(message: SocketMessage): Promise<void> {
    // Always acknowledge the message
    if (message.envelope_id) {
      this.sendAck(message.envelope_id);
    }

    switch (message.type) {
      case 'hello':
        console.log('👋 Received hello from Slack Socket Mode');
        break;
        
      case 'disconnect':
        console.log('🔌 Received disconnect from Slack');
        this.disconnect();
        break;
        
      case 'events_api':
        if (message.payload?.event) {
          await this.handleEvent(message.payload.event);
        }
        break;
        
      case 'interactive':
        // Handle interactive components (buttons, modals, etc.)
        console.log('🎛️ Received interactive event:', message.payload);
        break;
        
      case 'slash_commands':
        // Handle slash commands
        console.log('⚡ Received slash command:', message.payload);
        break;
        
      default:
        console.log(`📨 Received unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle Slack events
   */
  private async handleEvent(event: SlackEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    const allHandlers = this.eventHandlers.get('*') || [];
    
    const allEventHandlers = [...handlers, ...allHandlers];
    
    if (allEventHandlers.length === 0) {
      console.log(`📭 No handlers registered for event type: ${event.type}`);
      return;
    }

    // Create acknowledgment function (no-op for Socket Mode)
    const ack = () => {};

    // Execute all handlers
    await Promise.all(
      allEventHandlers.map(async (handler) => {
        try {
          await handler(event, ack);
        } catch (error) {
          console.error(`❌ Error in event handler for ${event.type}:`, error);
        }
      })
    );
  }

  /**
   * Send acknowledgment for received message
   */
  private sendAck(envelopeId: string, payload?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send ack: WebSocket not open');
      return;
    }

    const ack: SocketAck = {
      envelope_id: envelopeId,
      ...(payload && { payload })
    };

    this.ws.send(JSON.stringify(ack));
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send heartbeat message (Cloudflare Workers doesn't support ping frames)
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('❌ Failed to send heartbeat:', error);
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    console.error('❌ Socket Mode connection error:', error);
    this.state = SocketState.ERROR;
    this.clearTimers();
    
    if (this.options.autoReconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.options.maxReconnectAttempts}) exceeded`);
      this.state = SocketState.ERROR;
      return;
    }

    this.reconnectAttempts++;
    this.state = SocketState.RECONNECTING;
    
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error);
        this.attemptReconnect();
      });
    }, delay);
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    state: SocketState;
    reconnectAttempts: number;
    isConnected: boolean;
    eventHandlerCount: number;
  } {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.isConnected(),
      eventHandlerCount: Array.from(this.eventHandlers.values())
        .reduce((total, handlers) => total + handlers.length, 0)
    };
  }
}