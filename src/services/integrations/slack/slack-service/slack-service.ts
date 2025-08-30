/**
 * @ai-metadata
 * @component: SlackService
 * @description: Main orchestrator for Slack integration, coordinating messaging, events, security, and bot management
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../types"]
 */

import { WebClient, LogLevel } from '@slack/web-api';
import type { Env } from '../../../../types';
import type {
  ISlackService,
  ISlackServiceOrchestrator,
  ISlackMessagingService,
  ISlackEventHandler,
  ISlackBotManager,
  ISlackSecurityService
} from '../interfaces';
import type { SlackEventType } from '../types';

import { SlackMessagingService } from './slack-messaging.service';
import { SlackEventHandler } from './slack-event-handler.service';
import { SlackBotManager } from './slack-bot-manager.service';
import { SlackSecurityService } from './slack-security.service';
import { SlackServiceOrchestrator } from './slack-service-orchestrator';
import { SlackHealthMonitor } from './slack-health-monitor.service';
import { SlackErrorReportingService } from '../slack-error-reporting';
import { initializeErrorReporter } from '../utils/slack-error-reporter.util';
import { IExternalServices } from '../../../../interfaces/service-interfaces';

/**
 * Main Slack service that orchestrates all Slack-related functionality
 * Now delegates to SlackServiceOrchestrator for better separation of concerns
 * Implements ISlackService interface for LSP compliance
 */
export class SlackService implements ISlackService {
  private orchestrator: ISlackServiceOrchestrator;
  private healthMonitor: SlackHealthMonitor;
  private errorReportingService: SlackErrorReportingService;

  /**
   * Initialize the SlackService with environment configuration
   * Delegates to orchestrator for better separation of concerns
   * @param env - Environment configuration containing Slack tokens and settings
   */
  constructor(env: Env) {
    // Configure WebClient with proper options for Cloudflare Workers
    const client = new WebClient(env.SLACK_BOT_TOKEN, {
      logLevel: LogLevel.DEBUG,
      retryConfig: {
        retries: 3,
        factor: 2
      }
    });
    
    console.log('🔧 Slack WebClient configured with token:', env.SLACK_BOT_TOKEN ? 'PRESENT' : 'MISSING');
    
    // Initialize error reporting service first
    this.errorReportingService = new SlackErrorReportingService(client, env);
    
    // Initialize global error reporter for application-wide use
    initializeErrorReporter(this.errorReportingService);
    
    // Initialize orchestrator with all sub-services
    this.orchestrator = new SlackServiceOrchestrator(env);
    
    // Initialize health monitor
    this.healthMonitor = new SlackHealthMonitor(
      this.orchestrator.getMessagingService(),
      this.orchestrator.getBotManager(),
      this.orchestrator.getEventHandler(),
      this.orchestrator.getSecurityService()
    );
  }

  /**
   * Initialize the SlackService asynchronously
   * Delegates to orchestrator for initialization
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();
  }



  // ===== CORE DELEGATION METHODS =====
  
  async sendMessage(channel: string, text: string, threadTs?: string): Promise<void> {
    return this.orchestrator.getMessagingService().sendMessage(channel, text, threadTs);
  }

  async sendIntelligentNotification(
    channel: string,
    ticketData: any,
    _clickupUrl?: string,
    _assignmentRecommendation?: any
  ): Promise<any> {
    const context = { isUpdate: false, previousData: null };
    return this.orchestrator.getMessagingService().sendIntelligentNotification(channel, ticketData, context);
  }

  async sendTaskCreationMessage(
    channel: string,
    ticketId: string,
    _zendeskUrl: string,
    clickupUrl: string,
    _userName?: string
  ): Promise<any> {
    const ticketData = { id: ticketId };
    const taskData = { url: clickupUrl };
    return this.orchestrator.getMessagingService().sendTaskCreationMessage(channel, ticketData, taskData);
  }

  async sendThreadedAIAnalysis(channel: string, threadTs: string, analysis: string): Promise<any> {
    return this.orchestrator.getMessagingService().sendThreadedAIAnalysis(channel, threadTs, analysis);
  }

  async sendThreadedTeamMentions(
    channel: string,
    threadTs: string,
    mentions: string[],
    enhancedMessage: string,
    timeline?: string,
    nextSteps?: string[]
  ): Promise<any> {
    return this.orchestrator.getMessagingService().sendThreadedTeamMentions(channel, threadTs, mentions, enhancedMessage, timeline, nextSteps);
  }

  async sendThreadedMessage(channel: string, threadTs: string, text: string, blocks?: any[]): Promise<any> {
    return this.orchestrator.getMessagingService().sendThreadedMessage(channel, threadTs, text, blocks);
  }

  async sendBotIntroMessage(channel: string): Promise<void> {
    return this.orchestrator.getMessagingService().sendBotIntroMessage(channel);
  }

  async sendUserWelcomeMessage(channel: string, userId: string): Promise<void> {
    return this.orchestrator.getMessagingService().sendUserWelcomeMessage(channel, userId);
  }

  getCategoryEmoji(category: string): string {
    return this.orchestrator.getMessagingService().getCategoryEmoji(category);
  }

  getPriorityEmoji(priority: string): string {
    return this.orchestrator.getMessagingService().getPriorityEmoji(priority);
  }

  getHelpMessage(): string {
    return this.orchestrator.getMessagingService().getHelpMessage();
  }

  // ===== EVENT HANDLING DELEGATION =====
  
  async handleEvent(event: SlackEventType): Promise<void> {
    return this.orchestrator.getEventHandler().handleEvent(event);
  }

  async handleMention(event: any): Promise<void> {
    await this.orchestrator.getEventHandler().handleMention(event);
  }

  async handleMemberJoined(event: any): Promise<void> {
    await this.orchestrator.getEventHandler().handleMemberJoined(event);
  }

  async handleStatusRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    return this.orchestrator.getEventHandler().handleStatusRequest(channel, user, threadTs);
  }

  async handleSummarizeRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    return this.orchestrator.getEventHandler().handleSummarizeRequest(channel, user, threadTs);
  }

  async handleListTicketsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    return this.orchestrator.getEventHandler().handleListTicketsRequest(channel, user, threadTs);
  }

  async handleAnalyticsRequest(channel: string, user: string, threadTs?: string): Promise<void> {
    return this.orchestrator.getEventHandler().handleAnalyticsRequest(channel, user, threadTs);
  }

  // ===== BOT MANAGEMENT DELEGATION =====

  async handleBotJoinedChannel(channel: string): Promise<void> {
    return this.orchestrator.getBotManager().handleBotJoinedChannel(channel);
  }

  getBotJoinData(): any {
    return this.orchestrator.getBotManager().getBotJoinTracker();
  }

  async storeBotJoinData(_channel: string, _data: any): Promise<void> {
    console.log('📝 Legacy storeBotJoinData called - data is now managed internally');
  }

  async resetChannelTracking(channelId?: string): Promise<void> {
    return this.orchestrator.getBotManager().resetChannelTracking(channelId);
  }

  // ===== SECURITY DELEGATION =====
  
  async verifyRequest(signature: string, body: string, timestamp: string): Promise<boolean> {
    return this.orchestrator.getSecurityService().verifyRequest(signature, body, timestamp);
  }

  async verifyRequestWithAudit(signature: string, body: string, timestamp: string): Promise<boolean> {
    return this.orchestrator.getSecurityService().verifyRequestWithAudit(signature, body, timestamp);
  }

  async getSecurityMetrics(): Promise<any> {
    return this.orchestrator.getSecurityService().getSecurityMetrics();
  }

  getSecurityAuditLog(): any {
    return this.orchestrator.getSecurityService().getSecurityAuditLog();
  }

  async getTokenMetadata(): Promise<any> {
    return this.orchestrator.getSecurityService().getTokenMetadata();
  }

  async checkTokenRotationStatus(): Promise<any> {
    return this.orchestrator.getSecurityService().checkTokenRotationStatus();
  }

  async forceTokenRotation(): Promise<{ success: boolean; message: string }> {
    return this.orchestrator.getSecurityService().forceTokenRotation();
  }

  async updateTokenRotationConfig(config: Partial<any>): Promise<{ success: boolean; message: string }> {
    return this.orchestrator.getSecurityService().updateTokenRotationConfig(config);
  }

  checkManifestPermissions(): any {
    return this.orchestrator.getSecurityService().checkManifestPermissions();
  }



  setExternalServices(services: IExternalServices): void {
    this.orchestrator.getEventHandler().setServices(services);
  }

  // ===== GETTER DELEGATION =====
  
  getBotUserId(): string | undefined {
    return this.orchestrator.getBotUserId();
  }

  isInitialized(): boolean {
    return this.orchestrator.isInitialized();
  }

  async waitForInitialization(timeoutMs: number = 30000): Promise<void> {
    return this.orchestrator.waitForInitialization(timeoutMs);
  }

  getClient(): WebClient {
    return this.orchestrator.getClient();
  }

  getMessagingService(): ISlackMessagingService {
    return this.orchestrator.getMessagingService();
  }

  getEventHandler(): ISlackEventHandler {
    return this.orchestrator.getEventHandler();
  }

  getBotManager(): ISlackBotManager {
    return this.orchestrator.getBotManager();
  }

  getSecurityService(): ISlackSecurityService {
    return this.orchestrator.getSecurityService();
  }

  getErrorReportingService(): SlackErrorReportingService {
    return this.errorReportingService;
  }

  /**
   * Get comprehensive health status of all Slack services
   * Delegates to health monitor for detailed health metrics
   * @returns Health status object with detailed metrics
   */
  getHealthStatus(): any {
    return this.healthMonitor.getHealthStatus();
  }
}