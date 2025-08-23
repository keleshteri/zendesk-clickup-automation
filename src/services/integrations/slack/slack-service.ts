import { TaskGenieContext, Env, TicketAnalysis, ZendeskTicket, AssignmentRecommendation, AIInsights, TokenUsage, SlackEvent as MainSlackEvent } from '../../../types/index';
import { SlackMessage, SlackEvent, SlackMessageEvent, SlackApiResponse, SlackBlockType } from './types/index';
import { AIService } from '../../ai/ai-service';
import { ZendeskService } from '../zendesk/zendesk';
import { MultiAgentService } from '../../multi-agent-service';
import { TaskGenie } from '../../task-genie';
import { SlackCommand } from './handlers/slack-command-handler';
import { SlackMessageHandler } from './slack-message-handler';
import { SlackNotificationService } from './slack-notification-service';
import { SlackThreadManager } from './threads';
// SlackVerification functionality now consolidated into SlackSecurityService

import { SlackApiClient } from './core/slack-api-client';
import { SlackMessageBuilder } from './core/slack-message-builder';
import { SlackSocketService, SocketServiceConfig } from './core/slack-socket-service';
import { SlackAppManifestService, AppConfigTemplate } from './core/slack-app-manifest-service';
import { SlackSecurityService, TokenRotationConfig, SecurityMetrics, SecurityAuditEntry } from './core/slack-security-service';
import { SlackWorkflowHandler, SlackMentionHandler, SlackCommandHandler, MentionEvent } from './handlers/index';
import { SlackEmojis, SlackFormatters, SlackValidators, SlackConstants } from './utils/index';
// Version constant to avoid package.json import issues
const TASKGENIE_VERSION = '0.0.2';

/**
 * Main Slack service orchestrator that coordinates all Slack-related functionality
 * This service acts as the primary interface for Slack operations and delegates
 * specific tasks to specialized service modules
 */
export class SlackService {
  private env: Env;
  private aiService: AIService;
  private zendeskService: ZendeskService;
  private multiAgentService: MultiAgentService | null = null;
  private taskGenie: TaskGenie | null = null;
  private clickupService: any = null;
  
  // Core infrastructure
  private _apiClient: SlackApiClient;
  private _messageBuilder: SlackMessageBuilder;
  private _socketService: SlackSocketService;
  private _manifestService?: SlackAppManifestService;
  private _securityService?: SlackSecurityService;
  
  // Specialized handlers
  private _workflowHandler: SlackWorkflowHandler;
  private _mentionHandler: SlackMentionHandler;
  private _commandHandler: SlackCommandHandler;
  
  // Legacy services (for backward compatibility)
  private messageHandler: SlackMessageHandler;
  private notificationService: SlackNotificationService;
  private threadManager: SlackThreadManager;
  // verification functionality now handled by _securityService

  constructor(env: Env, multiAgentService?: MultiAgentService, taskGenie?: TaskGenie) {
    this.env = env;
    this.aiService = new AIService(env);
    this.zendeskService = new ZendeskService(env);
    this.multiAgentService = multiAgentService || null;
    this.taskGenie = taskGenie || null;
    
    // Initialize core infrastructure
    this._apiClient = new SlackApiClient(env);
    this._messageBuilder = new SlackMessageBuilder();
    
    // Initialize Socket Mode service
    const socketConfig: SocketServiceConfig = {
      enabled: !!env.SLACK_APP_TOKEN, // Enable if app token is available
      fallbackToWebhooks: true,
      socketOptions: {
        autoReconnect: true,
        maxReconnectAttempts: 10,
        reconnectDelay: 5000,
        heartbeatInterval: 30000,
        connectionTimeout: 10000
      },
      eventFilters: ['app_mention', 'message', 'team_join', 'channel_created', 'file_shared', 'reaction_added']
    };
    this._socketService = new SlackSocketService(env, this._apiClient, socketConfig);
    
    // Initialize specialized handlers
    this._workflowHandler = new SlackWorkflowHandler(
      this._apiClient,
      this._messageBuilder
    );
    this._mentionHandler = new SlackMentionHandler(
      this._apiClient,
      this._messageBuilder
    );
    this._commandHandler = new SlackCommandHandler(
      this._apiClient,
      this._messageBuilder
    );
    
    // Initialize legacy services (for backward compatibility)
    this.notificationService = new SlackNotificationService(env, this.aiService);
    this.messageHandler = new SlackMessageHandler(env, this.aiService, this.zendeskService, this.notificationService, this.multiAgentService, this.taskGenie);
    this.threadManager = new SlackThreadManager(env);
    // verification functionality now handled by _securityService
    
    // Set SlackService reference in messageHandler
    this.messageHandler.setSlackService(this);
    
    // Initialize Socket Mode if enabled
    this.initializeSocketMode();
    
    // Initialize App Manifest service
    this.initializeManifestService();
    
    // Initialize Security service
    this.initializeSecurityService();
    
    console.log('🚀 SlackService initialized with new architecture and specialized handlers');
  }

  /**
   * Set the ClickUp service instance
   */
  setClickUpService(clickupService: any): void {
    this.clickupService = clickupService;
    this.messageHandler.setClickUpService(clickupService);
  }

  /**
   * Handle Slack mentions by delegating to the mention handler
   */
  async handleMention(event: SlackMessageEvent): Promise<void> {
    try {
      // Convert SlackEvent to MentionEvent format
      const mentionEvent = {
        type: "user" as const,
        mentionedId: event.user,
        mentionedBy: event.user,
        channel: event.channel,
        threadTs: event.thread_ts,
        messageTs: event.ts,
        text: event.text || '',
        context: {
          isUrgent: false,
          priority: "medium" as const,
          category: "general",
          keywords: [],
          sentiment: "neutral" as const,
          requiresResponse: true,
          escalationLevel: 0
        }
      };

      await this._mentionHandler.processMention(mentionEvent);
    } catch (error) {
      console.error('Error handling mention with new handler:', error);
      // Fallback to legacy handler - convert to SlackAppMentionEvent format
      const appMentionEvent = {
        ...event,
        type: 'app_mention' as const,
        user: event.user || 'unknown',
        text: event.text || ''
      };
      await this.messageHandler.handleMention(appMentionEvent);
    }
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /<@([UW][A-Z0-9]+)>/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  /**
   * Handle member joined events
   */
  async handleMemberJoined(event: SlackEvent): Promise<void> {
    try {
      const user = (event as any).user;
      const channel = (event as any).channel;
      const bot_id = (event as any).bot_id;
      if (!user || !channel) {
        console.warn('Missing user or channel in member_joined_channel event');
        return;
      }

      // Get service statuses for welcome message
      const serviceStatuses = await this.getServiceStatuses();

      // Get bot info to check if the joining user is TaskGenie itself
      try {
        const botInfoResponse = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (botInfoResponse.ok) {
          const botInfo: any = await botInfoResponse.json();
          if (botInfo.user_id === user) {
            // TaskGenie is joining - send intro message
            console.log('TaskGenie joined channel, sending welcome message');
            await this.notificationService.sendTaskGenieIntroMessage(channel, serviceStatuses);
            return;
          }
        }
      } catch (botInfoError) {
        console.error('Error getting bot info:', botInfoError);
      }
      
      // Skip if any other bot is joining (not TaskGenie)
      if (bot_id) {
        console.log('Other bot joined channel, skipping welcome message');
        return;
      }
      
      // Send welcome message to new human users only
      await this.notificationService.sendUserWelcomeMessage(channel, user, serviceStatuses);
    } catch (error) {
      console.error('Error handling member joined event:', error);
    }
  }

  /**
   * Send task creation notification
   */
  async sendTaskCreationMessage(
    channel: string,
    ticketId: string,
    ticketUrl: string,
    clickupTaskUrl: string,
    assigneeName?: string
  ): Promise<SlackMessage | null> {
    return this.notificationService.sendTaskCreationMessage(
      channel,
      ticketId,
      ticketUrl,
      clickupTaskUrl,
      assigneeName
    );
  }

  /**
   * Send TaskGenie introduction message
   */
  async sendTaskGenieIntroMessage(channel: string): Promise<void> {
    return this.notificationService.sendTaskGenieIntroMessage(channel, {
      zendesk: !!this.env.ZENDESK_DOMAIN,
      clickup: !!this.env.CLICKUP_TOKEN,
      ai: !!this.aiService,
      zendeskDomain: this.env.ZENDESK_DOMAIN
    });
  }

  /**
   * Send user welcome message
   */
  async sendUserWelcomeMessage(channel: string, user: string): Promise<void> {
    return this.notificationService.sendUserWelcomeMessage(channel, user, {
       zendesk: !!this.env.ZENDESK_DOMAIN,
       clickup: !!this.env.CLICKUP_TOKEN,
       ai: !!this.aiService,
       zendeskDomain: this.env.ZENDESK_DOMAIN
     });
  }

  /**
   * Send help message
   */
  async sendHelpMessage(channel: string, threadTs?: string): Promise<void> {
    return this.notificationService.sendHelpMessage(channel, threadTs);
  }

  /**
   * Send command-specific help message
   */
  async sendCommandHelpMessage(channel: string, threadTs?: string): Promise<void> {
    return this.notificationService.sendCommandHelpMessage(channel, threadTs);
  }

  /**
   * Send intelligent notification for ticket analysis
   */
  async sendIntelligentNotification(
    ticket: ZendeskTicket,
    analysis: TicketAnalysis,
    clickupTaskUrl: string,
    assignment?: AssignmentRecommendation
  ): Promise<SlackMessage | null> {
    try {
      const urgencyEmoji = SlackEmojis.getUrgencyEmoji(analysis.priority, analysis.sentiment);
      const categoryEmoji = SlackEmojis.getCategoryEmoji(analysis.category);
      const priorityEmoji = SlackEmojis.getPriorityEmoji(analysis.priority);
      
      let assignmentText = '';
      let teamChannel = this.env.SLACK_DEFAULT_CHANNEL || '#zendesk-clickup-automation';
      
      if (assignment) {
        if (assignment.team) {
          const agentEmoji = SlackEmojis.getAgentEmoji(assignment.team);
          assignmentText = `\n${agentEmoji} *Assigned to:* ${assignment.team}`;
        }
        
        if (assignment.team) {
          teamChannel = this.getTeamChannel(assignment.team);
          assignmentText += `\n👥 *Team:* ${assignment.team}`;
        }
      }

      // Build message using SlackMessageBuilder
      const message = this._messageBuilder.buildIntelligentNotification(
        ticket,
        analysis,
        clickupTaskUrl,
        assignment
      );
      
      // Send message using SlackApiClient
      const result = await this._apiClient.sendMessage({
        channel: teamChannel,
        text: `New ticket alert: ${ticket.subject}`,
        blocks: message.blocks,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send intelligent notification:', result.error);
        return null;
      }

      return {
        channel: teamChannel,
        text: `New ticket alert: ${ticket.subject}`,
        blocks: message.blocks
      };
    } catch (error) {
      console.error('💥 Failed to send intelligent Slack notification:', error);
      return null;
    }
  }

  /**
   * Send daily insights
   */
  async sendDailyInsights(insights: AIInsights): Promise<void> {
    try {
      const channel = this.env.SLACK_MANAGEMENT_CHANNEL || this.env.SLACK_DEFAULT_CHANNEL || '#zendesk-clickup-automation';
      
      // Build message blocks directly
      const blocks: SlackBlockType[] = [
        {
          type: 'header' as const,
          text: {
            type: 'plain_text' as const,
            text: '📊 Daily Insights Report'
          }
        },
        {
          type: 'divider' as const
        },
        {
          type: 'section' as const,
          fields: [
            {
              type: 'mrkdwn' as const,
              text: `*📅 Period:*\n${insights.period}`
            },
            {
              type: 'mrkdwn' as const,
              text: `*📊 Total Tickets:*\n${insights.total_tickets.toString()}`
            }
          ]
        }
      ];

      if (insights.trends && Object.keys(insights.trends.priority_distribution).length > 0) {
        const priorityText = Object.entries(insights.trends.priority_distribution)
          .map(([key, value]) => `${key}: ${value}`).join(', ');
        const categoryText = Object.entries(insights.trends.category_breakdown)
          .map(([key, value]) => `${key}: ${value}`).join(', ');
        
        blocks.push(
          { type: 'divider' as const },
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: `*📈 Key Trends:*\n• Priority Distribution: ${priorityText}\n• Categories: ${categoryText}`
            }
          }
        );
      }

      if (insights.recommendations && insights.recommendations.length > 0) {
        blocks.push(
          { type: 'divider' as const },
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: `*💡 Recommendations:*\n${insights.recommendations.map(rec => `• ${rec}`).join('\n')}`
            }
          }
        );
      }

      blocks.push({
        type: 'context' as const,
        elements: [{
          type: 'mrkdwn' as const,
          text: `🤖 TaskGenie v${TASKGENIE_VERSION} • Made by 2DC Team • Powered by AI`
        }]
      });

      // Send message using SlackApiClient
      const result = await this._apiClient.sendMessage({
        channel,
        text: 'Daily Insights Report',
        blocks,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send daily insights:', result.error);
      }
    } catch (error) {
      console.error('Error sending daily insights:', error);
    }
  }

  /**
   * Send threaded AI analysis
   */
  async sendThreadedAIAnalysis(
    channel: string,
    threadTs: string,
    ticket: ZendeskTicket,
    analysis: TicketAnalysis
  ): Promise<SlackApiResponse | null> {
    try {
      const categoryEmoji = SlackEmojis.getCategoryEmoji(analysis.category);
      const priorityEmoji = SlackEmojis.getPriorityEmoji(analysis.priority);
      
      // Build message using SlackMessageBuilder
      const message = this._messageBuilder
        .reset()
        .addSection(
          `🤖 *AI Analysis*\n📂 *Category*: ${categoryEmoji} ${analysis.category}\n⚡ *Priority*: ${priorityEmoji} ${analysis.priority}\n📝 *Summary*: ${analysis.summary || 'Analysis in progress...'}`
        );

      // Send message using SlackApiClient
      const result = await this._apiClient.sendMessage({
        channel,
        text: `AI Analysis for Ticket #${ticket.id}`,
        blocks: message.getBlocks(),
        thread_ts: threadTs,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send threaded AI analysis:', result.error);
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error sending threaded AI analysis:', error);
      return null;
    }
  }

  /**
   * Send threaded agent feedback
   */
  async sendThreadedAgentFeedback(
    channel: string,
    threadTs: string,
    agentType: string,
    feedback: string,
    recommendations?: string[],
    timeEstimate?: string
  ): Promise<SlackApiResponse | null> {
    try {
      const agentEmoji = SlackEmojis.getAgentEmoji(agentType);
      
      // Limit recommendations to max 3 bullet points
      const limitedRecommendations = recommendations ? recommendations.slice(0, 3) : [];
      
      // Build message using SlackMessageBuilder
      const message = this._messageBuilder
        .reset()
        .addSection(`${agentEmoji} *${agentType} Analysis*`);

      // Add feedback as bullet points if it contains multiple items
      if (limitedRecommendations.length > 0) {
        const recommendationsText = limitedRecommendations.map(rec => `• ${rec}`).join('\n') + 
          (timeEstimate ? `\n• *Est. time*: ${timeEstimate}` : '');
        message.addSection(recommendationsText);
      } else if (feedback) {
        const feedbackText = feedback + (timeEstimate ? `\n• *Est. time*: ${timeEstimate}` : '');
        message.addSection(feedbackText);
      }

      // Send message using SlackApiClient
      const result = await this._apiClient.sendMessage({
        channel,
        text: `${agentType} Analysis`,
        blocks: message.getBlocks(),
        thread_ts: threadTs,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send threaded agent feedback:', result.error);
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error sending threaded agent feedback:', error);
      return null;
    }
  }

  /**
   * Send threaded team mentions
   */
  async sendThreadedTeamMentions(
    channel: string,
    threadTs: string,
    mentions: string[],
    enhancedMessage: string,
    timeline?: string,
    nextSteps?: string[]
  ): Promise<SlackApiResponse | null> {
    try {
      // Build message using SlackMessageBuilder
      const message = this._messageBuilder
        .reset()
        .addSection(enhancedMessage);

      // Add next steps if provided
      if (nextSteps && nextSteps.length > 0) {
        message.addSection(`📋 *Next Steps:*\n${nextSteps.map(step => `• ${step}`).join('\n')}`);
      }

      // Send message using SlackApiClient
      const result = await this._apiClient.sendMessage({
        channel,
        text: enhancedMessage,
        blocks: message.getBlocks(),
        thread_ts: threadTs,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send threaded team mentions:', result.error);
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error sending threaded team mentions:', error);
      return null;
    }
  }

  /**
   * Send threaded message
   */
  async sendThreadedMessage(
    channel: string,
    threadTs: string,
    text: string,
    blocks?: any[]
  ): Promise<SlackApiResponse | null> {
    try {
      const result = await this._apiClient.sendMessage({
        channel,
        thread_ts: threadTs,
        text,
        blocks,
        user: 'taskgenie-bot',
        ts: Date.now().toString()
      });

      if (!result.success) {
        console.error('Failed to send threaded message:', result.error);
        return null;
      }

      return {
        ok: true,
        success: true,
        ts: result.data?.ts,
        channel: result.data?.channel,
        data: result.data
      };
    } catch (error) {
      console.error('Error sending threaded message:', error);
      return null;
    }
  }

  /**
   * Send a basic Slack message
   */
  async sendMessage(message: { channel: string; text: string; thread_ts?: string; blocks?: any[]; user?: string; ts?: string }): Promise<void> {
    try {
      const messageWithDefaults = {
      ...message,
      user: message.user || 'taskgenie-bot',
      ts: message.ts || Date.now().toString()
    };
    const result = await this._apiClient.sendMessage(messageWithDefaults);

      if (!result.success) {
        console.error('Failed to send Slack message:', result.error);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }
  }

  /**
   * Verify Slack request authenticity
   */
  async verifyRequest(body: string, timestamp: string, signature: string): Promise<boolean> {
    try {
      // Use new SlackValidators for webhook signature validation
      const validationResult = SlackValidators.validateWebhookSignature(
        signature,
        timestamp,
        body,
        this.env.SLACK_SIGNING_SECRET
      );
      
      if (!validationResult.isValid) {
        console.warn('Invalid Slack webhook signature:', validationResult.errors);
      }
      
      return validationResult.isValid;
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      // Fallback to legacy verification using security service
      const headers = {
        'x-slack-signature': signature,
        'x-slack-request-timestamp': timestamp
      };
      if (this._securityService) {
        const result = await this._securityService.verifyRequestWithAudit(body, headers, 'webhook');
        return result.isValid;
      }
      return false;
    }
  }

  /**
   * Get conversation replies from Slack API
   */
  async getConversationReplies(channel: string, threadTs: string, limit: number = 10, cursor?: string): Promise<any> {
    try {
      const result = await this._apiClient.getConversationReplies(
        channel,
        threadTs,
        limit,
        cursor
      );

      if (!result.success) {
        console.error('Failed to get conversation replies:', result.error);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Error getting conversation replies:', error);
      return null;
    }
  }

  /**
   * Get service statuses for all integrated services
   */
  private async getServiceStatuses(): Promise<{
    zendesk: boolean;
    clickup: boolean;
    ai: boolean;
    zendeskDomain?: string;
  }> {
    try {
      console.log('🔍 Checking service statuses...');
      
      let zendeskDomain = '';
      if (this.env.ZENDESK_DOMAIN) {
        zendeskDomain = `${this.env.ZENDESK_DOMAIN}.zendesk.com`;
      }

      // Use proper service test methods instead of duplicating logic
      const [zendeskResult, clickupResult, aiStatus] = await Promise.allSettled([
        this.testZendeskConnection(),
        this.testClickUpConnection(), 
        this.aiService.testConnection()
      ]);

      const zendeskStatus = zendeskResult.status === 'fulfilled' ? zendeskResult.value : false;
      const clickupStatus = clickupResult.status === 'fulfilled' ? clickupResult.value : false;
      const aiConnectionStatus = aiStatus.status === 'fulfilled' ? aiStatus.value : false;

      const result = {
        zendesk: zendeskStatus,
        clickup: clickupStatus,
        ai: aiConnectionStatus,
        zendeskDomain
      };
      
      console.log('📊 Service status summary:', result);
      return result;
    } catch (error) {
      console.error('Error checking service statuses:', error);
      return {
        zendesk: false,
        clickup: false,
        ai: false
      };
    }
  }

  /**
   * Test Zendesk connection
   */
  private async testZendeskConnection(): Promise<boolean> {
    try {
      if (!this.env.ZENDESK_DOMAIN) {
        console.log('❌ Zendesk domain not configured');
        return false;
      }
      
      // Use ZendeskService's dedicated test method
      return await this.zendeskService.testConnection();
    } catch (error) {
      console.log('❌ Zendesk connection test failed:', error);
      return false;
    }
  }

  /**
   * Test ClickUp connection
   */
  private async testClickUpConnection(): Promise<boolean> {
    try {
      console.log('📋 Testing ClickUp connection...');
      
      // Use existing ClickUp service if available, otherwise create one with OAuth support
      let clickupService = this.clickupService;
      if (!clickupService) {
        const { ClickUpService } = await import('../clickup/clickup.js');
        
        // Try to get OAuth data for enhanced authentication
        let oauthData = null;
        if (this.env.TASK_MAPPING) {
          try {
            const { OAuthService } = await import('../clickup/clickup_oauth.js');
            const oauthService = new OAuthService(this.env);
            const defaultUserId = 'default'; // Use default user for status check
            oauthData = await oauthService.getUserOAuth(defaultUserId);
            
            if (oauthData && !oauthService.isTokenValid(oauthData)) {
              console.log('🔍 OAuth token found but invalid, falling back to API token');
              oauthData = null;
            }
          } catch (oauthError) {
            console.log('🔍 OAuth check failed, falling back to API token:', oauthError);
          }
        }
        
        clickupService = new ClickUpService(this.env, this.aiService, oauthData);
      }
      
      // Check if service has valid authentication (OAuth or API token)
      if (!clickupService.hasValidAuth()) {
        console.log('❌ ClickUp authentication not configured (no OAuth or API token)');
        return false;
      }
      
      const testResult = await clickupService.testConnection();
      console.log(`${testResult.success ? '✅' : '❌'} ClickUp connection: ${testResult.success ? 'Connected' : testResult.error}`);
      return testResult.success;
    } catch (error) {
      console.log('❌ ClickUp connection failed:', error);
      return false;
    }
  }



  /**
   * Get team channel based on team name
   */
  private getTeamChannel(team: string): string {
    const channelMap: { [key: string]: string } = {
      'development': '#dev-team',
      'support': '#support-team',
      'sales': '#sales-team',
      'marketing': '#marketing-team',
      'general': '#general'
    };
    return channelMap[team.toLowerCase()] || '#zendesk-clickup-automation';
  }

  // Expose new architecture components for external use
  get apiClient(): SlackApiClient {
    return this._apiClient;
  }

  get messageBuilder(): SlackMessageBuilder {
    return this._messageBuilder;
  }

  get socketService(): SlackSocketService {
    return this._socketService;
  }

  /**
   * Get app manifest service instance
   */
  get manifestService(): SlackAppManifestService | undefined {
    return this._manifestService;
  }

  /**
   * Get security service instance
   */
  get securityService(): SlackSecurityService | undefined {
    return this._securityService;
  }

  get workflowHandler(): SlackWorkflowHandler {
    return this._workflowHandler;
  }

  get mentionHandler(): SlackMentionHandler {
    return this._mentionHandler;
  }

  get commandHandler(): SlackCommandHandler {
    return this._commandHandler;
  }

  // Expose legacy services for backward compatibility
  get threads(): SlackThreadManager {
    return this.threadManager;
  }

  get messages(): SlackMessageHandler {
    return this.messageHandler;
  }

  get notifications(): SlackNotificationService {
    return this.notificationService;
  }

  /**
   * Initialize Socket Mode service
   */
  private async initializeSocketMode(): Promise<void> {
    try {
      if (!this.env.SLACK_APP_TOKEN) {
        console.log('📴 Socket Mode disabled: SLACK_APP_TOKEN not provided');
        return;
      }

      console.log('🔌 Initializing Socket Mode...');
      
      // Setup Socket Mode event handlers
      this.setupSocketEventHandlers();
      
      // Initialize the socket service
      await this._socketService.initialize();
      
      if (this._socketService.isAvailable()) {
        console.log('✅ Socket Mode initialized successfully');
      } else {
        console.log('🔄 Socket Mode initialization completed, falling back to webhooks');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Socket Mode:', error);
      console.log('🔄 Continuing with webhook mode');
    }
  }

  /**
   * Setup Socket Mode event handlers
   */
  private setupSocketEventHandlers(): void {
    // Handle app mentions via Socket Mode
    this._socketService.onEvent('app_mention', async (event: SlackEvent) => {
      console.log('📢 Socket Mode: App mention received');
      await this.handleMention(event as any);
    });

    // Handle direct messages via Socket Mode
    this._socketService.onEvent('message', async (event: SlackEvent) => {
      const messageEvent = event as SlackMessageEvent;
      // Check if it's a direct message by checking if channel starts with 'D'
      if (messageEvent.channel && messageEvent.channel.startsWith('D')) {
        console.log('💬 Socket Mode: Direct message received');
        // Handle direct message
        await this.handleDirectMessage(messageEvent);
      }
    });

    // Handle team join events
    this._socketService.onEvent('team_join', async (event: SlackEvent) => {
      console.log('👋 Socket Mode: New team member joined');
      // Could trigger welcome message or onboarding flow
    });

    // Handle channel creation
    this._socketService.onEvent('channel_created', async (event: SlackEvent) => {
      console.log('📁 Socket Mode: New channel created');
      // Could trigger channel setup or notifications
    });

    // Handle file sharing
    this._socketService.onEvent('file_shared', async (event: SlackEvent) => {
      console.log('📎 Socket Mode: File shared');
      // Could trigger file processing or notifications
    });

    // Handle reactions
    this._socketService.onEvent('reaction_added', async (event: SlackEvent) => {
      console.log('👍 Socket Mode: Reaction added');
      // Could trigger reaction-based workflows
    });

    console.log('📋 Socket Mode event handlers configured');
  }

  /**
   * Handle direct messages (for Socket Mode)
   */
  private async handleDirectMessage(event: SlackMessageEvent): Promise<void> {
    try {
      // Use existing mention handler logic for direct messages
      const mentionEvent = {
        type: "user" as const,
        mentionedId: event.user,
        mentionedBy: event.user,
        channel: event.channel,
        threadTs: event.thread_ts,
        messageTs: event.ts,
        text: event.text || '',
        context: {
          isUrgent: false,
          priority: "medium" as const,
          category: "general",
          keywords: [],
          sentiment: "neutral" as const,
          requiresResponse: true,
          escalationLevel: 0
        }
      };
      await this._mentionHandler.processMention(mentionEvent);
    } catch (error) {
      console.error('❌ Error handling direct message:', error);
    }
  }

  /**
   * Get Socket Mode status and metrics
   */
  getSocketModeStatus(): any {
    return this._socketService.getStatus();
  }

  /**
   * Check if Socket Mode is available
   */
  isSocketModeAvailable(): boolean {
    return this._socketService.isAvailable();
  }

  /**
   * Reconnect Socket Mode
   */
  async reconnectSocketMode(): Promise<void> {
    if (this._socketService.isAvailable()) {
      await this._socketService.reconnect();
    }
  }

  /**
   * Shutdown Socket Mode
   */
  async shutdownSocketMode(): Promise<void> {
    await this._socketService.shutdown();
  }

  /**
   * Initialize App Manifest service
   */
  private initializeManifestService(): void {
    try {
      this._manifestService = new SlackAppManifestService(this.env, this._apiClient);
      console.log('📋 App Manifest service initialized');
    } catch (error) {
      console.error('Failed to initialize App Manifest service:', error);
    }
  }

  /**
   * Initialize Security service
   */
  private async initializeSecurityService(): Promise<void> {
    try {
      // Configure token rotation based on environment
      const rotationConfig: Partial<TokenRotationConfig> = {
        enabled: this.env.SLACK_TOKEN_ROTATION_ENABLED === 'true',
        rotationIntervalHours: parseInt(this.env.SLACK_TOKEN_ROTATION_INTERVAL_HOURS || '720', 10), // 30 days default
        gracePeriodHours: parseInt(this.env.SLACK_TOKEN_GRACE_PERIOD_HOURS || '24', 10), // 1 day default
        notifyBeforeRotationHours: parseInt(this.env.SLACK_TOKEN_NOTIFY_BEFORE_HOURS || '168', 10), // 7 days default
        backupTokenCount: parseInt(this.env.SLACK_BACKUP_TOKEN_COUNT || '2', 10)
      };

      this._securityService = new SlackSecurityService(this.env, rotationConfig);
      await this._securityService.initializeTokenRotation();
      console.log('🔒 Security service initialized');
    } catch (error) {
      console.error('Failed to initialize Security service:', error);
    }
  }

  /**
   * Deploy app configuration from template
   */
  async deployAppFromTemplate(template: AppConfigTemplate, appId?: string) {
    if (!this._manifestService) {
      throw new Error('App Manifest service not initialized');
    }
    return this._manifestService.deployFromTemplate(template, appId);
  }

  /**
   * Update app configuration
   */
  async updateAppConfiguration(appId: string, updates: any, options?: any) {
    if (!this._manifestService) {
      throw new Error('App Manifest service not initialized');
    }
    return this._manifestService.updateAppConfig(appId, updates, options);
  }

  /**
   * Get available app templates
   */
  getAppTemplates() {
    if (!this._manifestService) {
      throw new Error('App Manifest service not initialized');
    }
    return this._manifestService.getTemplates();
  }

  /**
   * Validate app configuration
   */
  async validateAppConfiguration(appId: string) {
    if (!this._manifestService) {
      throw new Error('App Manifest service not initialized');
    }
    return this._manifestService.validateAppConfiguration(appId);
  }

  /**
   * Check manifest permissions
   */
  async checkManifestPermissions() {
    if (!this._manifestService) {
      throw new Error('App Manifest service not initialized');
    }
    return this._manifestService.checkPermissions();
  }

  // Security Service Methods

  /**
   * Verify Slack request with enhanced security audit
   */
  async verifyRequestWithAudit(
    body: string,
    headers: Record<string, string>,
    source: string = 'webhook'
  ): Promise<{ isValid: boolean; error?: string; auditId: string }> {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.verifyRequestWithAudit(body, headers, source);
  }

  /**
   * Rotate bot token
   */
  async rotateBotToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.rotateBotToken();
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.getSecurityMetrics();
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog(limit: number = 100, severity?: 'low' | 'medium' | 'high' | 'critical'): SecurityAuditEntry[] {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.getAuditLog(limit, severity);
  }

  /**
   * Update token rotation configuration
   */
  updateTokenRotationConfig(config: Partial<TokenRotationConfig>): void {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    this._securityService.updateRotationConfig(config);
  }

  /**
   * Force token rotation
   */
  async forceTokenRotation(tokenType: 'bot' | 'user' | 'app' = 'bot'): Promise<{ success: boolean; error?: string }> {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.forceTokenRotation(tokenType);
  }

  /**
   * Check token rotation status
   */
  async checkTokenRotationStatus(): Promise<{
    needsRotation: boolean;
    nextRotation?: string;
    warnings: string[];
  }> {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.checkTokenRotationStatus();
  }

  /**
   * Get token metadata
   */
  getTokenMetadata() {
    if (!this._securityService) {
      throw new Error('Security service not initialized');
    }
    return this._securityService.getTokenMetadata();
  }

}