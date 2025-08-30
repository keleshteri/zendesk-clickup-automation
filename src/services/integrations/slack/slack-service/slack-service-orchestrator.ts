/**
 * @ai-metadata
 * @component: SlackServiceOrchestrator
 * @description: Orchestrator for Slack services following SRP - only handles service coordination
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../interfaces"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "New orchestrator class following SRP and ISP principles"
 */

import { WebClient, LogLevel } from '@slack/web-api';
import type { Env } from '../../../../types';
import type { ISlackServiceOrchestrator, ISlackMessagingService, ISlackBotManager, ISlackEventHandler, ISlackSecurityService } from '../interfaces';
import { SlackMessagingService } from './slack-messaging.service';
import { SlackEventHandler } from './slack-event-handler.service';
import { SlackBotManager } from './slack-bot-manager.service';
import { SlackSecurityService } from './slack-security.service';
import { SlackErrorReportingService } from '../slack-error-reporting';
import { initializeErrorReporter } from '../utils/slack-error-reporter.util';
import { IExternalServices } from '../../../../interfaces/service-interfaces';

/**
 * Orchestrator for Slack services that focuses solely on service coordination
 * Follows SRP by handling only initialization and service management
 */
export class SlackServiceOrchestrator implements ISlackServiceOrchestrator {
  private client: WebClient;
  private env: Env;
  private botUserId?: string;
  private isInitializedFlag: boolean = false;
  
  // Sub-services
  private messagingService: SlackMessagingService;
  private eventHandler: SlackEventHandler;
  private botManager: SlackBotManager;
  private securityService: SlackSecurityService;
  private errorReportingService: SlackErrorReportingService;

  /**
   * Initialize the SlackServiceOrchestrator with environment configuration
   * Sets up all sub-services but does not initialize bot user ID (call initialize() for that)
   * @param env - Environment configuration containing Slack tokens and settings
   */
  constructor(env: Env) {
    this.env = env;
    
    // Configure WebClient with proper options for Cloudflare Workers
    this.client = new WebClient(env.SLACK_BOT_TOKEN, {
      logLevel: LogLevel.DEBUG,
      retryConfig: {
        retries: 3,
        factor: 2
      }
    });
    
    console.log('🔧 Slack WebClient configured with token:', env.SLACK_BOT_TOKEN ? 'PRESENT' : 'MISSING');
    
    // Initialize error reporting service first
    this.errorReportingService = new SlackErrorReportingService(this.client, env);
    
    // Initialize global error reporter for application-wide use
    initializeErrorReporter(this.errorReportingService);
    
    // Initialize sub-services with error reporting
    this.messagingService = new SlackMessagingService(this.client, env, this.errorReportingService);
    this.botManager = new SlackBotManager(this.client, this.messagingService, env);
    this.eventHandler = new SlackEventHandler(this.client, this.messagingService, this.botManager);
    this.securityService = new SlackSecurityService(this.client, env);
  }

  /**
   * Initialize the SlackService asynchronously
   * This must be called after construction to properly set up bot user ID
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await this.initializeBotUserId();
    this.isInitializedFlag = true;
  }

  /**
   * Get the messaging service instance
   * @returns The messaging service
   */
  getMessagingService(): ISlackMessagingService {
    return this.messagingService;
  }

  /**
   * Get the bot manager instance
   * @returns The bot manager
   */
  getBotManager(): ISlackBotManager {
    return this.botManager;
  }

  /**
   * Get the event handler instance
   * @returns The event handler
   */
  getEventHandler(): ISlackEventHandler {
    return this.eventHandler;
  }

  /**
   * Get the security service instance
   * @returns The security service
   */
  getSecurityService(): ISlackSecurityService {
    return this.securityService;
  }

  /**
   * Set external services for all sub-services that need them
   * @param services - External services object
   */
  setExternalServices(services: IExternalServices): void {
    this.eventHandler.setServices(services);
  }

  /**
   * Get the Slack WebClient instance
   * @returns The WebClient instance
   */
  getClient(): WebClient {
    return this.client;
  }

  /**
   * Get the bot user ID
   * @returns The bot user ID if initialized
   */
  getBotUserId(): string | undefined {
    return this.botUserId;
  }

  /**
   * Check if the service is initialized
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.isInitializedFlag && !!this.botUserId;
  }

  /**
   * Wait for initialization to complete with timeout
   * @param timeoutMs - Timeout in milliseconds (default: 30000)
   * @returns Promise that resolves when initialization is complete
   */
  async waitForInitialization(timeoutMs: number = 30000): Promise<void> {
    if (this.isInitialized()) {
      return;
    }
    
    const startTime = Date.now();
    while (!this.isInitialized() && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isInitialized()) {
      throw new Error(`SlackServiceOrchestrator initialization timeout after ${timeoutMs}ms`);
    }
  }

  /**
   * Initialize bot user ID by calling Slack auth.test API
   * Sets the bot user ID across all sub-services for proper identification
   * Includes retry logic for better reliability
   * @private
   */
  private async initializeBotUserId(): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempting to initialize bot user ID (attempt ${retryCount + 1}/${maxRetries})...`);
        console.log('🔑 Using bot token:', this.env.SLACK_BOT_TOKEN ? `${this.env.SLACK_BOT_TOKEN.substring(0, 12)}...` : 'MISSING');
        
        const authResult = await this.client.auth.test();
        
        if (authResult.ok && authResult.user_id) {
          this.botUserId = authResult.user_id;
          console.log('✅ Bot user ID initialized:', this.botUserId);
          
          // Set bot user ID in sub-services
          this.botManager.setBotUserId(this.botUserId);
          this.eventHandler.setBotUserId(this.botUserId);
          
          return;
        } else {
          throw new Error(`Auth test failed: ${authResult.error || 'Unknown error'}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`❌ Failed to initialize bot user ID (attempt ${retryCount}):`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to initialize bot user ID after ${maxRetries} attempts: ${error}`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }
}