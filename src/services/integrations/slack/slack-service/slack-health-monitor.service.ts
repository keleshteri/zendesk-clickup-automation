/**
 * @ai-metadata
 * @component: SlackHealthMonitor
 * @description: Service for monitoring health status of Slack services following SRP
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../interfaces"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Health monitoring service following SRP principles"
 */

import type { ISlackHealthMonitor, ISlackMessagingService, ISlackBotManager, ISlackEventHandler, ISlackSecurityService, ServiceHealthStatus } from '../interfaces';

/**
 * Service responsible for monitoring health status of Slack services
 * Follows SRP by focusing only on health monitoring and status checking
 */
export class SlackHealthMonitor implements ISlackHealthMonitor {
  private messagingService: ISlackMessagingService;
  private botManager: ISlackBotManager;
  private eventHandler: ISlackEventHandler;
  private securityService: ISlackSecurityService;

  /**
   * Initialize the health monitor with service dependencies
   * @param messagingService - The messaging service to monitor
   * @param botManager - The bot manager to monitor
   * @param eventHandler - The event handler to monitor
   * @param securityService - The security service to monitor
   */
  constructor(
    messagingService: ISlackMessagingService,
    botManager: ISlackBotManager,
    eventHandler: ISlackEventHandler,
    securityService: ISlackSecurityService
  ) {
    this.messagingService = messagingService;
    this.botManager = botManager;
    this.eventHandler = eventHandler;
    this.securityService = securityService;
  }

  /**
   * Get overall health status of all Slack services
   * @returns Promise that resolves to health status object
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      messaging: boolean;
      botManager: boolean;
      eventHandler: boolean;
      security: boolean;
    };
    timestamp: string;
  }> {
    const serviceHealth = await this.checkAllServicesHealth();
    const healthyCount = Object.values(serviceHealth).filter(Boolean).length;
    const totalServices = Object.keys(serviceHealth).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalServices) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: serviceHealth,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if a specific service is healthy
   * @param serviceName - Name of the service to check
   * @returns Promise that resolves to true if service is healthy
   */
  async isServiceHealthy(serviceName: keyof ServiceHealthStatus): Promise<boolean> {
    return this.checkServiceHealth(serviceName);
  }

  /**
   * Check health of individual service
   * @param serviceName - Name of the service to check
   * @returns Promise that resolves to health status boolean
   */
  async checkServiceHealth(serviceName: 'messaging' | 'botManager' | 'eventHandler' | 'security'): Promise<boolean> {
    try {
      switch (serviceName) {
        case 'messaging':
          return this.checkMessagingHealth();
        case 'botManager':
          return this.checkBotManagerHealth();
        case 'eventHandler':
          return this.checkEventHandlerHealth();
        case 'security':
          return this.checkSecurityHealth();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Get detailed health metrics for all services
   * @returns Promise that resolves to detailed health metrics
   */
  async getDetailedHealthMetrics(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      messaging: { healthy: boolean; details: any };
      botManager: { healthy: boolean; details: any };
      eventHandler: { healthy: boolean; details: any };
      security: { healthy: boolean; details: any };
    };
    timestamp: string;
    uptime: number;
  }> {
    const serviceHealth = await this.checkAllServicesHealth();
    const healthyCount = Object.values(serviceHealth).filter(Boolean).length;
    const totalServices = Object.keys(serviceHealth).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalServices) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services: {
        messaging: {
          healthy: serviceHealth.messaging,
          details: await this.getMessagingDetails()
        },
        botManager: {
          healthy: serviceHealth.botManager,
          details: await this.getBotManagerDetails()
        },
        eventHandler: {
          healthy: serviceHealth.eventHandler,
          details: await this.getEventHandlerDetails()
        },
        security: {
          healthy: serviceHealth.security,
          details: await this.getSecurityDetails()
        }
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0
    };
  }

  /**
   * Check health of all services
   * @private
   * @returns Promise that resolves to service health object
   */
  private async checkAllServicesHealth(): Promise<{
    messaging: boolean;
    botManager: boolean;
    eventHandler: boolean;
    security: boolean;
  }> {
    const [messaging, botManager, eventHandler, security] = await Promise.allSettled([
      this.checkMessagingHealth(),
      this.checkBotManagerHealth(),
      this.checkEventHandlerHealth(),
      this.checkSecurityHealth()
    ]);

    return {
      messaging: messaging.status === 'fulfilled' ? messaging.value : false,
      botManager: botManager.status === 'fulfilled' ? botManager.value : false,
      eventHandler: eventHandler.status === 'fulfilled' ? eventHandler.value : false,
      security: security.status === 'fulfilled' ? security.value : false
    };
  }

  /**
   * Check messaging service health
   * @private
   * @returns Boolean indicating health status
   */
  private checkMessagingHealth(): boolean {
    // Basic health check - service exists and has required methods
    return !!(this.messagingService && 
             typeof this.messagingService.sendMessage === 'function' &&
             typeof this.messagingService.sendIntelligentNotification === 'function');
  }

  /**
   * Check bot manager health
   * @private
   * @returns Boolean indicating health status
   */
  private checkBotManagerHealth(): boolean {
    // Basic health check - service exists and has required methods
    return !!(this.botManager && 
             typeof this.botManager.setBotUserId === 'function' &&
             typeof this.botManager.handleBotJoinedChannel === 'function');
  }

  /**
   * Check event handler health
   * @private
   * @returns Boolean indicating health status
   */
  private checkEventHandlerHealth(): boolean {
    // Basic health check - service exists and has required methods
    return !!(this.eventHandler && 
             typeof this.eventHandler.handleMention === 'function' &&
             typeof this.eventHandler.handleMemberJoined === 'function');
  }

  /**
   * Check security service health
   * @private
   * @returns Boolean indicating health status
   */
  private checkSecurityHealth(): boolean {
    // Basic health check - service exists and has required methods
    return !!(this.securityService && 
             typeof this.securityService.verifyRequest === 'function' &&
             typeof this.securityService.auditSecurity === 'function');
  }

  /**
   * Get detailed messaging service information
   * @private
   * @returns Promise that resolves to messaging details
   */
  private async getMessagingDetails(): Promise<any> {
    return {
      hasEmojiSupport: typeof this.messagingService.getCategoryEmoji === 'function',
      hasThreadingSupport: typeof this.messagingService.sendThreadedMessage === 'function',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Get detailed bot manager information
   * @private
   * @returns Promise that resolves to bot manager details
   */
  private async getBotManagerDetails(): Promise<any> {
    return {
      hasBotTracking: typeof this.botManager.getBotJoinData === 'function',
      hasChannelReset: typeof this.botManager.resetChannelTracking === 'function',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Get detailed event handler information
   * @private
   * @returns Promise that resolves to event handler details
   */
  private async getEventHandlerDetails(): Promise<any> {
    return {
      hasCommandHandling: typeof this.eventHandler.handleStatusRequest === 'function',
      hasEventProcessing: typeof this.eventHandler.handleEvent === 'function',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Get detailed security service information
   * @private
   * @returns Promise that resolves to security details
   */
  private async getSecurityDetails(): Promise<any> {
    return {
      hasTokenManagement: typeof this.securityService.getTokenMetadata === 'function',
      hasAuditLogging: typeof this.securityService.getSecurityAuditLog === 'function',
      lastChecked: new Date().toISOString()
    };
  }
}