import { SlackMessage, SlackEvent, TaskGenieContext, Env, TicketAnalysis, ZendeskTicket, AssignmentRecommendation, AIInsights, TokenUsage, SlackApiResponse } from '../../../types/index.js';
import { AIService } from '../../ai/ai-service.js';
import { ZendeskService } from '../zendesk/zendesk.js';
import { MultiAgentService } from '../../multi-agent-service.js';
import { TaskGenie } from '../../task-genie.js';
import { SlackCommandParser, SlackCommand } from './slack-command-parser.js';
import { SlackMessageHandler } from './slack-message-handler.js';
import { SlackNotificationService } from './slack-notification-service.js';
import { SlackThreadManager } from './slack-thread-manager.js';
import { SlackVerification } from './slack-verification.js';
import { SlackUtils } from './slack-utils.js';

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
  
  // Specialized service modules
  private messageHandler: SlackMessageHandler;
  private notificationService: SlackNotificationService;
  private threadManager: SlackThreadManager;
  private verification: SlackVerification;

  constructor(env: Env, multiAgentService?: MultiAgentService, taskGenie?: TaskGenie) {
    this.env = env;
    this.aiService = new AIService(env);
    this.zendeskService = new ZendeskService(env);
    this.multiAgentService = multiAgentService || null;
    this.taskGenie = taskGenie || null;
    
    // Initialize specialized services
    this.notificationService = new SlackNotificationService(env, this.aiService);
    this.messageHandler = new SlackMessageHandler(env, this.aiService, this.zendeskService, this.notificationService, this.multiAgentService, this.taskGenie);
    this.threadManager = new SlackThreadManager(env);
    this.verification = new SlackVerification(env);
    
    // Set SlackService reference in messageHandler
    this.messageHandler.setSlackService(this);
  }

  /**
   * Set the ClickUp service instance
   */
  setClickUpService(clickupService: any): void {
    this.clickupService = clickupService;
    this.messageHandler.setClickUpService(clickupService);
  }

  /**
   * Handle Slack mentions by delegating to the message handler
   */
  async handleMention(event: SlackEvent): Promise<void> {
    return this.messageHandler.handleMention(event);
  }

  /**
   * Handle member joined events
   */
  async handleMemberJoined(event: SlackEvent): Promise<void> {
    try {
      const { user, channel, bot_id } = event;
      if (!user || !channel) {
        console.warn('Missing user or channel in member_joined_channel event');
        return;
      }

      // Skip if any bot is joining (including TaskGenie)
      if (bot_id) {
        console.log('Bot joined channel, skipping welcome message');
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
            await this.notificationService.sendTaskGenieIntroMessage(channel, serviceStatuses);
            return;
          }
        }
      } catch (botInfoError) {
        console.error('Error getting bot info:', botInfoError);
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
      const channel = this.getTeamChannel(assignment?.team || 'general');
      
      const blocks = [
        SlackUtils.createHeader(`🎯 New Ticket Analysis: #${ticket.id}`),
        SlackUtils.createDivider(),
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Subject:*\n${SlackUtils.escapeSlackMarkdown(ticket.subject)}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:* ${SlackUtils.getCategoryEmoji(ticket.priority)} ${ticket.priority}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:* ${SlackUtils.getCategoryEmoji(ticket.status)} ${ticket.status}`
            },
            {
              type: 'mrkdwn',
              text: `*Category:* ${SlackUtils.getCategoryEmoji(analysis.category)} ${analysis.category}`
            }
          ]
        }
      ];

      if (analysis.summary) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Summary:*\n${SlackUtils.truncateText(analysis.summary, 500)}`
          }
        });
      }

      if (assignment) {
        blocks.push(
          SlackUtils.createDivider(),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🎯 Recommended Assignment:*\n*Team:* ${assignment.team}\n*Confidence:* ${Math.round(assignment.confidence * 100)}%`
            }
          }
        );

        if (assignment.reason) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Reasoning:* ${assignment.reason}`
            }
          });
        }
      }

      blocks.push(
        SlackUtils.createDivider(),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🎫 View Ticket'
              },
              url: ticket.url,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📋 View Task'
              },
              url: clickupTaskUrl
            }
          ]
        },
        SlackUtils.createContextFooter(!!this.aiService)
      );

      const message = {
        channel,
        blocks,
        text: `New ticket analysis for #${ticket.id}: ${ticket.subject}`
      };

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          channel,
          text: `New ticket analysis for #${ticket.id}: ${ticket.subject}`,
          user: 'bot',
          ts: (result as any).ts || Date.now().toString()
        };
      } else {
        console.error('Failed to send intelligent notification:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error sending intelligent notification:', error);
      return null;
    }
  }

  /**
   * Send daily insights
   */
  async sendDailyInsights(insights: AIInsights): Promise<void> {
    try {
      const channel = '#general'; // Configure as needed
      
      const blocks = [
        SlackUtils.createHeader('📊 Daily Insights Report'),
        SlackUtils.createDivider(),
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*📅 Period:* ${insights.period}`
            },
            {
              type: 'mrkdwn',
              text: `*📊 Total Tickets:* ${insights.total_tickets}`
            }
          ]
        }
      ];

      if (insights.trends && Object.keys(insights.trends.priority_distribution).length > 0) {
        blocks.push(
          SlackUtils.createDivider(),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📈 Key Trends:*\n• Priority Distribution: ${Object.entries(insights.trends.priority_distribution).map(([key, value]) => `${key}: ${value}`).join(', ')}\n• Categories: ${Object.entries(insights.trends.category_breakdown).map(([key, value]) => `${key}: ${value}`).join(', ')}`
            }
          }
        );
      }

      if (insights.recommendations && insights.recommendations.length > 0) {
        blocks.push(
          SlackUtils.createDivider(),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💡 Recommendations:*\n${insights.recommendations.map(rec => `• ${rec}`).join('\n')}`
            }
          }
        );
      }

      blocks.push(SlackUtils.createContextFooter(!!this.aiService));

      await this.sendMessage({
        channel,
        text: 'Daily Insights Report',
        blocks
      });
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
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🤖 AI Analysis for Ticket #${ticket.id}*`
          }
        },
        SlackUtils.createDivider(),
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Category:* ${SlackUtils.getCategoryEmoji(analysis.category)} ${analysis.category}`
            },
            {
              type: 'mrkdwn',
              text: `*Sentiment:* ${SlackUtils.getUrgencyEmoji(analysis.sentiment, ticket.priority)} ${analysis.sentiment}`
            },
            {
              type: 'mrkdwn',
              text: `*Complexity:* ${analysis.estimated_complexity || 'medium'}`
            }
          ]
        }
      ];

      if (analysis.summary) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:*\n${SlackUtils.truncateText(analysis.summary, 500)}`
          }
        });
      }

      if (analysis.action_items && analysis.action_items.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Action Items:*\n${analysis.action_items.map(item => `• ${item}`).join('\n')}`
          }
        });
      }

      const message = {
        channel,
        thread_ts: threadTs,
        blocks,
        text: `AI Analysis for Ticket #${ticket.id}`
      };

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to send threaded AI analysis:', await response.text());
        return null;
      }
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
      const agentEmoji = this.getAgentEmoji(agentType);
      
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${agentEmoji} ${agentType} Feedback*`
          }
        },
        SlackUtils.createDivider(),
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: feedback
          }
        }
      ];

      if (timeEstimate) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*⏱️ Estimated Time:* ${timeEstimate}`
          }
        });
      }

      if (recommendations && recommendations.length > 0) {
        blocks.push(
          SlackUtils.createDivider(),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💡 Recommendations:*\n${recommendations.map(rec => `• ${rec}`).join('\n')}`
            }
          }
        );
      }

      const message = {
        channel,
        thread_ts: threadTs,
        blocks,
        text: `${agentType} feedback`
      };

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to send threaded agent feedback:', await response.text());
        return null;
      }
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
      const mentionText = mentions.map(mention => `<@${mention}>`).join(' ');
      
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*👥 Team Collaboration Required*\n${mentionText}`
          }
        },
        SlackUtils.createDivider(),
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: enhancedMessage
          }
        }
      ];

      if (timeline) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*⏰ Timeline:* ${timeline}`
          }
        });
      }

      if (nextSteps && nextSteps.length > 0) {
        blocks.push(
          SlackUtils.createDivider(),
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📋 Next Steps:*\n${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
            }
          }
        );
      }

      const message = {
        channel,
        thread_ts: threadTs,
        blocks,
        text: `Team collaboration required: ${mentionText}`
      };

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to send threaded team mentions:', await response.text());
        return null;
      }
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
      const message: any = {
        channel,
        thread_ts: threadTs,
        text
      };

      if (blocks) {
        message.blocks = blocks;
      }

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to send threaded message:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error sending threaded message:', error);
      return null;
    }
  }

  /**
   * Send a basic Slack message
   */
  async sendMessage(message: { channel: string; text: string; thread_ts?: string; blocks?: any[] }): Promise<void> {
    try {
      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send Slack message:', errorText);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }
  }

  /**
   * Verify Slack request authenticity
   */
  async verifyRequest(body: string, timestamp: string, signature: string): Promise<boolean> {
    const headers = {
      'x-slack-signature': signature,
      'x-slack-request-timestamp': timestamp
    };
    const result = await this.verification.verifySlackRequest(body, headers);
    return result.isValid;
  }

  /**
   * Get conversation replies from Slack API
   */
  async getConversationReplies(channel: string, threadTs: string, limit: number = 10, cursor?: string): Promise<any> {
    try {
      const response = await fetch('https://slack.com/api/conversations.replies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          ts: threadTs,
          limit,
          ...(cursor ? { cursor } : {})
        })
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        console.warn(`Slack rate limited conversations.replies. Retry after ${retryAfter ?? 'unknown'} seconds.`);
        return null;
      }

      const result = await response.json() as any;
      
      if (result.ok) {
        return result;
      } else {
        console.error('Failed to get conversation replies:', result.error);
        return null;
      }
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

  // Helper methods
  private getAgentEmoji(agentType: string): string {
    const emojiMap: { [key: string]: string } = {
      'Software Engineer': '💻',
      'WordPress Developer': '🌐',
      'DevOps Engineer': '⚙️',
      'QA Tester': '🧪',
      'Project Manager': '📋',
      'Business Analyst': '📊'
    };
    return emojiMap[agentType] || '🤖';
  }

  private getTeamChannel(team: string): string {
    const channelMap: { [key: string]: string } = {
      'development': '#dev-team',
      'support': '#support-team',
      'sales': '#sales-team',
      'marketing': '#marketing-team',
      'general': '#general'
    };
    return channelMap[team.toLowerCase()] || '#general';
  }

  // Expose thread manager for external use
  get threads(): SlackThreadManager {
    return this.threadManager;
  }

  // Expose message handler for external use
  get messages(): SlackMessageHandler {
    return this.messageHandler;
  }

  // Expose notification service for external use
  get notifications(): SlackNotificationService {
    return this.notificationService;
  }
}