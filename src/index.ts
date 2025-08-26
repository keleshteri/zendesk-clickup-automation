import 'reflect-metadata';
import { Env, ZendeskWebhook, ClickUpWebhook, ZendeskTicket, UserOAuthData } from './types/index.js';
import { SlackService } from './services/integrations/slack';
import { SlackWebhookHandler } from './services/integrations/slack/endpoints/webhook-handler.js';
import { ZendeskService } from './services/integrations/zendesk/zendesk.js';
import { ClickUpService } from './services/integrations/clickup/clickup.js';
import { AIService } from './services/ai/ai-service.js';
import { OAuthService } from './services/integrations/clickup/clickup_oauth.js';
import { AutomationService } from './services/automation-service.js';
import { TaskGenie } from './services/task-genie.js';
import { EnhancedWorkflowOrchestrator } from './services/enhanced-workflow-orchestrator.js';
import { AgentRole } from './agents/types/agent-types.js';
import { getCorsHeaders, formatErrorResponse, formatSuccessResponse } from './utils/index.js';
import {
  SLACK_DEFAULTS,
  ZENDESK_DEFAULTS,
  CLICKUP_DEFAULTS,
  HTTP_STATUS,
  LOG_CONFIG,
  ERROR_MESSAGES,
  TASK_MAPPING,
  APP_ENDPOINTS
} from './config/index.js';

// Helper functions to normalize webhook data
function mapPriority(priority: string): 'low' | 'normal' | 'high' | 'urgent' {
  const mapping: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    'low': 'low',
    'normal': 'normal', 
    'high': 'high',
    'urgent': 'urgent',
    // Handle Zendesk v2 webhook formats
    'LOW': 'low',
    'NORMAL': 'normal',
    'HIGH': 'high', 
    'URGENT': 'urgent'
  };
  return mapping[priority] || 'normal';
}

function mapStatus(status: string): 'new' | 'open' | 'pending' | 'solved' | 'closed' {
  const mapping: Record<string, 'new' | 'open' | 'pending' | 'solved' | 'closed'> = {
    'new': 'new',
    'open': 'open',
    'pending': 'pending', 
    'solved': 'solved',
    'closed': 'closed',
    // Handle Zendesk v2 webhook formats
    'NEW': 'new',
    'OPEN': 'open',
    'PENDING': 'pending',
    'SOLVED': 'solved',
    'CLOSED': 'closed'
  };
  return mapping[status] || 'new';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers for all responses
    const corsHeaders = getCorsHeaders();
    
    // Initialize services with error handling
    let slackService: SlackService | null = null;
    let zendeskService: ZendeskService | null = null;
    let clickupService: ClickUpService | null = null;
    let aiService: AIService | null = null;
    let oauthService: OAuthService | null = null;
    let automationService: AutomationService | null = null;
    let taskGenie: TaskGenie | null = null;

    // Standardized service initialization with consistent error logging
    const logError = (service: string, error: unknown) => {
      console.error(`${LOG_CONFIG.PREFIXES.ERROR} ${service} service initialization failed:`, 
        error instanceof Error ? error.message : ERROR_MESSAGES.SERVICE_UNAVAILABLE);
    };

    const logWarning = (service: string, message: string) => {
      console.warn(`${LOG_CONFIG.PREFIXES.WARNING} ${service} service initialization skipped: ${message}`);
    };

    try {
      zendeskService = new ZendeskService(env);
    } catch (error) {
      logError('Zendesk', error);
    }

    try {
      aiService = new AIService(env);
      
      // Test AI service immediately after creation
      const aiWorking = await aiService.testConnection();
      if (!aiWorking) {
        console.error('🚨 AI Service test failed - enhanced workflow will not work properly');
      }
    } catch (error) {
      console.error('❌ AI Service initialization failed completely:', error);
      logError('AI', error);
    }

    try {
      if (aiService) {
        clickupService = new ClickUpService(env, aiService);
      } else {
        logWarning('ClickUp', 'AI service not available');
      }
    } catch (error) {
      logError('ClickUp', error);
    }

    try {
      oauthService = new OAuthService(env);
    } catch (error) {
      logError('OAuth', error);
    }

    try {
      if (aiService && zendeskService && clickupService) {
        automationService = new AutomationService(env, aiService, slackService, zendeskService, clickupService);
      } else {
        logWarning('Automation', 'Required services not available');
      }
    } catch (error) {
      logError('Automation', error);
    }

    // Initialize TaskGenie with all required services
    try {
      if (aiService && zendeskService && automationService && clickupService) {
        taskGenie = new TaskGenie(env, aiService, zendeskService, automationService, clickupService);
      } else {
        logWarning('TaskGenie', 'Required services not available');
      }
    } catch (error) {
      logError('TaskGenie', error);
    }

    // Initialize SlackService with automationService and TaskGenie
    try {
      console.log('🚀 Creating SlackService instance...');
      slackService = new SlackService(env);
      console.log('✅ SlackService instance created, starting initialization...');
      
      // Initialize bot user ID asynchronously with proper error handling
      slackService.initialize().then(() => {
        console.log('✅ SlackService fully initialized with bot user ID');
      }).catch(error => {
        console.error('❌ SlackService initialization failed:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        logError('Slack initialization', error);
      });
    } catch (error) {
      console.error('❌ Failed to create SlackService:', error);
      logError('Slack', error);
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: HTTP_STATUS.OK,
        headers: corsHeaders
      });
    }

    try {
      // Route: Health check
      if (url.pathname === '/' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'TaskGenie - Zendesk-ClickUp-Slack Automation Worker is running! 🧞',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          language: 'TypeScript',
          features: [
            '🎫 Zendesk ticket automation',
            '📋 ClickUp task management', 
            '💬 Slack bot integration',
            '🤖 AI-powered summarization',
            '🤖 Multi-agent orchestration',
            '🧞 TaskGenie NLP interface'
          ],
          endpoints: [
            'GET  / - Health check',
            'GET  /test - Environment test',
            'POST /zendesk-webhook - Zendesk webhook endpoint',
            'POST /clickup-webhook - ClickUp webhook endpoint',
            'POST /slack/events - Slack events endpoint',
            'POST /slack/commands - Slack commands endpoint',
            'GET  /slack/socket/status - Socket Mode connection status',
            'POST /slack/socket/reconnect - Reconnect Socket Mode',
            'POST /slack/socket/shutdown - Shutdown Socket Mode',
            'GET  /slack/manifest/templates - Get app configuration templates',
            'POST /slack/manifest/deploy - Deploy app from template',
            'PUT  /slack/manifest/:appId - Update app configuration',
            'GET  /slack/manifest/:appId/validate - Validate app configuration',
            'GET  /slack/manifest/permissions - Check manifest permissions',
            'GET  /slack/security/metrics - Get security metrics',
            'GET  /slack/security/audit - Get security audit log',
            'GET  /slack/security/tokens - Get token metadata',
            'GET  /slack/security/rotation/status - Check token rotation status',
            'POST /slack/security/rotation/force - Force token rotation',
            'PUT  /slack/security/rotation/config - Update rotation configuration',
            'POST /slack/security/verify - Verify request with security audit',
            'GET  /auth/clickup - Start ClickUp OAuth flow',
            'GET  /auth/clickup/callback - ClickUp OAuth callback',
            'GET  /auth/clickup/status - Check OAuth authorization status',
            'POST /test-ai - Test AI summarization',
            'POST /test-clickup - Test ClickUp integration',
            'POST /test-slack - Test Slack integration',
            'POST /agents/process-ticket - Process ticket with multi-agent system',
            'POST /agents/analyze-and-create-tasks - Analyze ticket and create ClickUp tasks',
            'POST /agents/comprehensive-insights - Get comprehensive AI + agent insights',
            'POST /agents/route-ticket - Route ticket to specific agent',
            'GET  /agents/metrics - Get workflow metrics',
            'GET  /agents/status - Get all agent statuses',
            'GET  /agents/status/:role - Get specific agent status',
            'POST /agents/reset-metrics - Reset workflow metrics',
            'GET  /agents/capabilities - List agent capabilities',
            'POST /agents/simulate-workflow - Simulate workflow with sample data',
            'POST /taskgenie/chat - Chat with TaskGenie using natural language',
            'GET  /taskgenie/help - Get TaskGenie help and commands',
            'GET  /taskgenie/status - Get TaskGenie system status',
            'POST /taskgenie/batch - Process multiple queries in batch',
            'DELETE /taskgenie/context - Clear conversation context'
          ]
        }), {
          status: HTTP_STATUS.OK,
          headers: corsHeaders
        });
      }

      // Route: Test Slack service statuses (for debugging)
      if (url.pathname === '/test/slack-statuses' && method === 'GET') {
        if (!slackService) {
          return new Response(JSON.stringify({
            error: 'Slack service not available'
          }), {
            status: HTTP_STATUS.SERVICE_UNAVAILABLE,
            headers: corsHeaders
          });
        }
        
        try {
          // Set the ClickUp service so Slack can test it
          slackService.setClickUpService(clickupService);
          
          // Get service statuses using the same method Slack bot uses
          const statuses = await (slackService as any).getServiceStatuses();
          
          return new Response(JSON.stringify({
            status: 'ok',
            message: 'Slack Service Status Test',
            serviceStatuses: statuses,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to get service statuses',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Test bot welcome message (for debugging)
      if (url.pathname === '/test/bot-welcome' && method === 'POST') {
        if (!slackService) {
          return new Response(JSON.stringify({
            error: 'Slack service not available'
          }), {
            status: HTTP_STATUS.SERVICE_UNAVAILABLE,
            headers: corsHeaders
          });
        }
        
        try {
          const body = await request.json() as { channel?: string; user?: string };
          const testChannel = body.channel || 'C09BY7A600Z';
          const testUser = body.user || 'U1234567890';
          
          // Test the welcome message functionality by simulating a member join event
          const memberJoinEvent = {
            type: 'member_joined_channel' as const,
            user: testUser,
            channel: testChannel,
            event_ts: Date.now().toString()
          };
          
          await slackService.handleEvent(memberJoinEvent);
          const result = { success: true, event: 'member_joined_channel' };
          
          return new Response(JSON.stringify({
            status: 'ok',
            message: 'Bot welcome message test completed',
            result: result,
            botUserId: slackService.getBotUserId(),
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to send welcome message',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Environment test
      if (url.pathname === '/test' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'TaskGenie Environment Test',
          services: {
            slack: slackService ? '✅ available' : '❌ unavailable',
            zendesk: zendeskService ? '✅ available' : '❌ unavailable',
            clickup: clickupService ? '✅ available' : '❌ unavailable',
            ai: aiService ? '✅ available' : '❌ unavailable',
            oauth: oauthService ? '✅ available' : '❌ unavailable',
            automation: automationService ? '✅ available' : '❌ unavailable',
            taskGenie: taskGenie ? '✅ available' : '❌ unavailable'
          },
          environment: {
            // Zendesk Configuration
            zendesk_domain: env.ZENDESK_DOMAIN ? '✅ configured' : '❌ missing',
            zendesk_email: env.ZENDESK_EMAIL ? '✅ configured' : '❌ missing',
            zendesk_token: env.ZENDESK_TOKEN ? '✅ configured' : '❌ missing',
            
            // ClickUp Configuration
            clickup_token: env.CLICKUP_TOKEN ? '✅ configured' : '❌ missing (OAuth recommended)',
            clickup_list_id: env.CLICKUP_LIST_ID ? '✅ configured' : '❌ missing',
            
            // ClickUp OAuth Configuration  
            clickup_client_id: env.CLICKUP_CLIENT_ID ? '✅ configured' : '❌ missing',
            clickup_client_secret: env.CLICKUP_CLIENT_SECRET ? '✅ configured' : '❌ missing',
            clickup_redirect_uri: env.CLICKUP_REDIRECT_URI ? '✅ configured' : '❌ missing',
            
            // Slack Configuration
            slack_bot_token: env.SLACK_BOT_TOKEN ? '✅ configured' : '❌ missing',
            slack_signing_secret: env.SLACK_SIGNING_SECRET ? '✅ configured' : '❌ missing',
            
            // AI Configuration
            ai_provider: env.AI_PROVIDER || '❌ not set',
            ai_configured: aiService?.isConfigured() ? '✅ ready' : '❌ missing keys',
            
            // Storage & Security
            webhook_secret: env.WEBHOOK_SECRET ? '✅ configured' : '❌ missing',
            kv_storage: env.TASK_MAPPING ? '✅ available' : '❌ missing'
          },
          timestamp: new Date().toISOString()
        }), {
          status: HTTP_STATUS.OK,
          headers: corsHeaders
        });
      }



      // Route: Zendesk webhook - Create ClickUp task and notify Slack
      if (url.pathname === APP_ENDPOINTS.WEBHOOK_ZENDESK && method === 'POST') {
        try {
          // Check if required services are available
          if (!clickupService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          // Validate webhook secret for security
          const authHeader = request.headers.get('Authorization');
          const expectedSecret = `Bearer ${env.WEBHOOK_SECRET}`;
          
          if (!authHeader || authHeader !== expectedSecret) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.UNAUTHORIZED)), {
              status: HTTP_STATUS.UNAUTHORIZED,
              headers: corsHeaders
            });
          }
          
          const data: ZendeskWebhook = await request.json();
          
          // Handle both old and new Zendesk webhook formats
          const rawTicket = data.ticket || data.detail;
          
          // Normalize the ticket data to match expected format
          const ticket = rawTicket ? {
            ...rawTicket,
            id: typeof rawTicket.id === 'string' ? parseInt(rawTicket.id) : rawTicket.id,
            priority: mapPriority(rawTicket.priority || 'normal'),
            status: mapStatus(rawTicket.status || 'new'),
            tags: rawTicket.tags || [],
            // Ensure URL is properly set - generate it if missing
            url: rawTicket.url || (zendeskService ? zendeskService.getTicketUrl(typeof rawTicket.id === 'string' ? parseInt(rawTicket.id) : rawTicket.id) : `https://${env.ZENDESK_DOMAIN}/agent/tickets/${rawTicket.id}`)
          } as ZendeskTicket : null;
          
          console.log('📧 Zendesk webhook received:', {
            type: data.type,
            ticket_id: ticket?.id,
            subject: ticket?.subject,
            format: data.ticket ? 'legacy' : 'v2'
          });

          // Only process ticket creation events
          if ((data.type === 'zen:event-type:ticket.created' || data.type === 'ticket.created') && ticket) {
            console.log('📋 Processing ticket creation event for ticket:', ticket.id);
            
            // Try to get OAuth data for enhanced permissions
            let oauthClickUpService = clickupService;
            if (oauthService && env.TASK_MAPPING) {
              try {
                // For demo, use 'default' user - in production, this should come from the webhook or be configurable
                const defaultUserId = SLACK_DEFAULTS.USER_ID; 
                const oauthData = await oauthService.getUserOAuth(defaultUserId);
                
                if (oauthData && oauthService.isTokenValid(oauthData)) {
                  console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} Using OAuth tokens for ClickUp API`);
                  if (aiService) {
                    oauthClickUpService = new ClickUpService(env, aiService, oauthData);
                  } else {
                    console.warn('⚠️ AI service not available for OAuth ClickUp service');
                  }
                } else {
                  console.log(`${LOG_CONFIG.PREFIXES.WARNING} OAuth data not found or invalid, falling back to API token`);
                }
              } catch (oauthError) {
                console.warn(`${LOG_CONFIG.PREFIXES.WARNING} Error retrieving OAuth data, falling back to API token:`, oauthError);
              }
            }
            
            // Generate AI analysis for the ticket
            let aiAnalysis = null;
            if (aiService) {
              try {
                console.log(`${LOG_CONFIG.PREFIXES.AI} Generating AI analysis for ticket...`);
                aiAnalysis = await aiService.analyzeTicket(JSON.stringify(ticket));
                console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} AI analysis completed:`, {
                  priority: aiAnalysis.priority,
                  category: aiAnalysis.category,
                  sentiment: aiAnalysis.sentiment,
                  urgency_indicators: aiAnalysis.urgency_indicators
                });
              } catch (aiError) {
                console.warn(`${LOG_CONFIG.PREFIXES.WARNING} AI analysis failed:`, aiError);
                aiAnalysis = null;
              }
            }

            // Create ClickUp task using the service (OAuth or API token) with AI analysis
            let clickupTask;
            try {
              clickupTask = await oauthClickUpService.createTaskFromTicket(ticket, aiAnalysis || undefined);
            } catch (clickupError) {
              console.error(`${LOG_CONFIG.PREFIXES.ERROR} ClickUp task creation failed:`, clickupError);
              throw new Error(`ClickUp task creation failed: ${clickupError instanceof Error ? clickupError.message : 'Unknown error'}`);
            }
            
            if (!clickupTask) {
              console.error(`${LOG_CONFIG.PREFIXES.ERROR} ClickUp task creation returned null`);
              throw new Error('Failed to create ClickUp task - service returned null');
            }

            console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} ClickUp task created successfully:`, {
              id: clickupTask.id,
              name: clickupTask.name,
              url: clickupTask.url,
              ai_enhanced: !!aiAnalysis
            });

            // Store mapping in KV if available
            if (env.TASK_MAPPING) {
              const mappingKey = `zendesk_${ticket.id}`;
              const mappingValue = {
                zendesk_ticket_id: ticket.id,
                clickup_task_id: clickupTask.id,
                created_at: new Date().toISOString(),
                status: TASK_MAPPING.STATUS.ACTIVE
              };
              await env.TASK_MAPPING.put(mappingKey, JSON.stringify(mappingValue));
              console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} Task mapping stored:`, mappingKey);
            }

            // Send Slack notification if configured
            let slackThreadTs: string | undefined;
            if (slackService && env.SLACK_BOT_TOKEN && env.SLACK_SIGNING_SECRET) {
              try {
                const zendeskUrl = zendeskService?.getTicketUrl(ticket.id) || `https://${env.ZENDESK_DOMAIN}/agent/tickets/${ticket.id}`;
                const clickupUrl = oauthClickUpService.getTaskUrl(clickupTask.id);
                
                if (aiAnalysis) {
                  // Send intelligent notification with AI insights
                  console.log(`${LOG_CONFIG.PREFIXES.SLACK} Sending intelligent Slack notification with AI insights...`);
                  const defaultChannel = SLACK_DEFAULTS.CHANNEL;
                  const slackMessage = await slackService.sendIntelligentNotification(
                    defaultChannel,
                    ticket,
                    clickupUrl,
                    null // No assignment recommendation for now
                  );
                  slackThreadTs = slackMessage?.ts;
                } else {
                  // Fallback to basic notification
                  console.log(`${LOG_CONFIG.PREFIXES.SLACK} Sending basic Slack notification...`);
                  const defaultChannel = SLACK_DEFAULTS.CHANNEL;
                  const slackMessage = await slackService.sendTaskCreationMessage(
                    defaultChannel,
                    ticket.id.toString(),
                    zendeskUrl,
                    clickupUrl,
                    SLACK_DEFAULTS.USER_NAME // In production, get from ticket requester
                  );
                  slackThreadTs = slackMessage?.ts;
                }
                
                console.log(`${LOG_CONFIG.PREFIXES.SLACK} Slack notification sent:`, slackThreadTs);
                
                // Execute enhanced workflow steps if we have a thread timestamp
                if (slackThreadTs && aiAnalysis) {
                  try {
                    console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} Starting enhanced workflow orchestration...`);
                    console.log(`🤖 AI Service available: ${aiService ? 'YES' : 'NO'}`);
                    console.log(`🎯 Automation service available: ${automationService ? 'YES' : 'NO'}`);
                    console.log(`💬 Slack service available: ${slackService ? 'YES' : 'NO'}`);
                    
                    const orchestrator = new EnhancedWorkflowOrchestrator(
                      slackService,
                      automationService,
                      aiService
                    );
                    
                    // Execute enhanced workflow asynchronously to avoid blocking the response
                    ctx.waitUntil(
                      orchestrator.executeEnhancedWorkflow({
                        ticket,
                        clickUpTaskUrl: oauthClickUpService.getTaskUrl(clickupTask.id),
                        initialSlackTs: slackThreadTs,
                        channel: SLACK_DEFAULTS.CHANNEL,
                        existingAiAnalysis: aiAnalysis // Pass existing analysis to avoid redundancy
                      }).then(result => {
                        if (result.success) {
                          console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} ✅ Enhanced workflow completed successfully:`, {
                            stepsCompleted: result.completedSteps.length,
                            totalSteps: result.totalSteps,
                            stepNames: result.completedSteps.map(s => s.stepName)
                          });
                        } else {
                          console.error(`${LOG_CONFIG.PREFIXES.ERROR} ❌ Enhanced workflow failed:`, {
                            stepsCompleted: result.completedSteps.length,
                            totalSteps: result.totalSteps,
                            stepNames: result.completedSteps.map(s => s.stepName),
                            failedSteps: result.failedSteps.map(s => `${s.stepName}: ${s.error}`),
                            errors: result.errors
                          });
                          console.error(`🚨 This is why you're seeing "Hi Here!" instead of enhanced workflow!`);
                        }
                      }).catch(error => {
                        console.error(`${LOG_CONFIG.PREFIXES.ERROR} 💥 Enhanced workflow crashed completely:`, error);
                        console.error(`🚨 This is why you're seeing "Hi here!" instead of enhanced workflow!`);
                        console.error(`🔧 Check AI service, multi-agent service, and Slack service initialization`);
                      })
                    );
                  } catch (orchestratorError) {
                    console.error(`${LOG_CONFIG.PREFIXES.ERROR} 💥 Failed to start enhanced workflow:`, orchestratorError);
                    console.error(`🚨 This is why you're seeing "Hi here!" instead of enhanced workflow!`);
                    console.error(`🔧 Check service initialization and environment variables`);
                    // Don't fail the main process if enhanced workflow fails
                  }
                } else {
                  console.error(`${LOG_CONFIG.PREFIXES.ERROR} ❌ Enhanced workflow conditions not met:`);
                  console.error(`📍 Slack thread TS: ${slackThreadTs ? 'PRESENT' : 'MISSING'}`);
                  console.error(`🤖 AI Analysis: ${aiAnalysis ? 'PRESENT' : 'MISSING'}`);
                  console.error(`🚨 This is why you're seeing "Hi here!" instead of enhanced workflow!`);
                }
              } catch (slackError) {
                console.error(`${LOG_CONFIG.PREFIXES.ERROR} Slack notification failed:`, slackError);
                // Don't fail the whole process if Slack fails
              }
            }

            return new Response(JSON.stringify(formatSuccessResponse({
              zendesk_ticket_id: ticket.id,
              zendesk_subject: ticket.subject,
              clickup_task_id: clickupTask.id,
              clickup_task_url: oauthClickUpService.getTaskUrl(clickupTask.id),
              slack_thread_ts: slackThreadTs,
              event_type: data.type,
              ai_analysis: aiAnalysis ? {
                priority: aiAnalysis.priority,
                category: aiAnalysis.category,
                sentiment: aiAnalysis.sentiment,
                urgency_indicators: aiAnalysis.urgency_indicators,
                action_items: aiAnalysis.action_items
              } : null,
              ai_enhanced: !!aiAnalysis
            }, aiAnalysis ? 'Zendesk ticket successfully converted to ClickUp task with AI analysis and intelligent Slack notification' : 'Zendesk ticket successfully converted to ClickUp task and Slack notified')), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          } else {
            return new Response(JSON.stringify(formatSuccessResponse(null, 'Event type not processed')), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error processing Zendesk webhook:`, error);
          
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.WEBHOOK_PROCESSING_FAILED,
            'zendesk-webhook'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Events API
      if (url.pathname === APP_ENDPOINTS.SLACK_EVENTS && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const webhookHandler = new SlackWebhookHandler({
            env,
            slackService,
            corsHeaders
          });
          return await webhookHandler.handle(request, ctx);
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error processing Slack event:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-events'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Slash Commands
      if (url.pathname === APP_ENDPOINTS.SLACK_COMMANDS && method === 'POST') {
        try {
          const formData = await request.formData();
          const command = formData.get('command');
          const text = formData.get('text');
          const userId = formData.get('user_id');
          const channelId = formData.get('channel_id');

          if (command === '/taskgenie') {
            return new Response(JSON.stringify({
              response_type: 'ephemeral',
              text: '🧞 TaskGenie is here to help! I automatically create ClickUp tasks from Zendesk tickets and can provide AI-powered summaries. Just mention me in a thread and ask for "summarize"!'
            }), {
              status: HTTP_STATUS.OK,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            response_type: 'ephemeral',
            text: 'Unknown command. Try `/taskgenie` for help.'
          }), {
            status: HTTP_STATUS.OK,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error processing Slack command:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-commands'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Socket Mode Status
      if (url.pathname === '/slack/socket/status' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const status = slackService.getSocketModeStatus();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            socketMode: {
              available: slackService.isSocketModeAvailable(),
              connected: status.connected,
              connectionState: status.connectionState,
              lastConnected: status.lastConnected,
              lastDisconnected: status.lastDisconnected,
              reconnectAttempts: status.reconnectAttempts,
              eventsReceived: status.eventsReceived,
              lastEventTime: status.lastEventTime,
              lastError: status.lastError
            },
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error getting Socket Mode status:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-socket-status'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Socket Mode Reconnect
      if (url.pathname === '/slack/socket/reconnect' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          if (!slackService.isSocketModeAvailable()) {
            return new Response(JSON.stringify(formatErrorResponse(
              'Socket Mode is not available. Please check SLACK_APP_TOKEN configuration.',
              'slack-socket-unavailable'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          await slackService.reconnectSocketMode();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            message: 'Socket Mode reconnection initiated successfully',
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error reconnecting Socket Mode:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-socket-reconnect'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Socket Mode Shutdown
      if (url.pathname === '/slack/socket/shutdown' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          await slackService.shutdownSocketMode();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            message: 'Socket Mode shutdown completed successfully',
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error shutting down Socket Mode:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-socket-shutdown'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Get App Manifest Templates
      if (url.pathname === '/slack/manifest/templates' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const templates = slackService.getAppTemplates();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            templates,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error getting app templates:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-manifest-templates'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Deploy App from Template
      if (url.pathname === '/slack/manifest/deploy' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const body = await request.json() as { templateName: string; appId?: string; customizations?: any };
          
          if (!body.templateName) {
            return new Response(JSON.stringify(formatErrorResponse(
              'Template name is required',
              'slack-manifest-deploy-missing-template'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          const templates = slackService.getAppTemplates();
          const template = templates[body.templateName];
          
          if (!template) {
            return new Response(JSON.stringify(formatErrorResponse(
              `Template '${body.templateName}' not found`,
              'slack-manifest-deploy-template-not-found'
            )), {
              status: HTTP_STATUS.NOT_FOUND,
              headers: corsHeaders
            });
          }

          // Apply customizations if provided
          const finalTemplate = body.customizations ? { ...template, ...body.customizations } : template;
          
          const result = await slackService.deployAppFromTemplate(finalTemplate, body.appId);
          
          return new Response(JSON.stringify(formatSuccessResponse({
            deployment: result,
            timestamp: new Date().toISOString()
          })), {
            status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error deploying app from template:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-manifest-deploy'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Update App Configuration
      if (url.pathname.startsWith('/slack/manifest/') && url.pathname.split('/').length === 4 && method === 'PUT') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const appId = url.pathname.split('/')[3];
          const body = await request.json() as { updates: any; options?: any };
          
          if (!body.updates) {
            return new Response(JSON.stringify(formatErrorResponse(
              'Updates object is required',
              'slack-manifest-update-missing-updates'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          const result = await slackService.updateAppConfiguration(appId, body.updates, body.options);
          
          return new Response(JSON.stringify(formatSuccessResponse({
            update: result,
            timestamp: new Date().toISOString()
          })), {
            status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error updating app configuration:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-manifest-update'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Validate App Configuration
      if (url.pathname.startsWith('/slack/manifest/') && url.pathname.endsWith('/validate') && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const pathParts = url.pathname.split('/');
          const appId = pathParts[3];
          
          if (!appId || appId === 'validate') {
            return new Response(JSON.stringify(formatErrorResponse(
              'App ID is required',
              'slack-manifest-validate-missing-app-id'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          const validation = await slackService.validateAppConfiguration(appId);
          
          return new Response(JSON.stringify(formatSuccessResponse({
            validation,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error validating app configuration:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-manifest-validate'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Check Manifest Permissions
      if (url.pathname === '/slack/manifest/permissions' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const permissions = await slackService.checkManifestPermissions();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            permissions,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error checking manifest permissions:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-manifest-permissions'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Get Security Metrics
      if (url.pathname === '/slack/security/metrics' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const metrics = slackService.getSecurityMetrics();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            metrics,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error getting security metrics:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-metrics'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Get Security Audit Log
      if (url.pathname === '/slack/security/audit' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const urlParams = new URLSearchParams(url.search);
          const limit = parseInt(urlParams.get('limit') || '100', 10);
          const severity = urlParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null;
          
          const auditLog = slackService.getSecurityAuditLog();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            auditLog,
            count: auditLog.entries.length,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error getting security audit log:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-audit'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Get Token Metadata
      if (url.pathname === '/slack/security/tokens' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const tokens = await slackService.getTokenMetadata();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            tokens,
            count: tokens.tokens?.length || 0,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error getting token metadata:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-tokens'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Check Token Rotation Status
      if (url.pathname === '/slack/security/rotation/status' && method === 'GET') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const status = await slackService.checkTokenRotationStatus();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            rotationStatus: status,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error checking token rotation status:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-rotation-status'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Force Token Rotation
      if (url.pathname === '/slack/security/rotation/force' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const body = await request.json() as { tokenType?: 'bot' | 'user' | 'app' };
          const tokenType = body.tokenType || 'bot';
          
          const result = await slackService.forceTokenRotation();
          
          return new Response(JSON.stringify(formatSuccessResponse({
            rotation: result,
            timestamp: new Date().toISOString()
          })), {
            status: result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error forcing token rotation:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-rotation-force'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Update Token Rotation Configuration
      if (url.pathname === '/slack/security/rotation/config' && method === 'PUT') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const body = await request.json() as { config: any };
          
          if (!body.config) {
            return new Response(JSON.stringify(formatErrorResponse(
              'Configuration object is required',
              'slack-security-rotation-config-missing'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          slackService.updateTokenRotationConfig(body.config);
          
          return new Response(JSON.stringify(formatSuccessResponse({
            message: 'Token rotation configuration updated successfully',
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error updating token rotation config:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-rotation-config'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Verify Request with Security Audit
      if (url.pathname === '/slack/security/verify' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.SERVICE_UNAVAILABLE)), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const body = await request.json() as { 
            body: string; 
            headers: Record<string, string>; 
            source?: string 
          };
          
          if (!body.body || !body.headers) {
            return new Response(JSON.stringify(formatErrorResponse(
              'Request body and headers are required',
              'slack-security-verify-missing-data'
            )), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          const signature = body.headers['x-slack-signature'] || '';
          const timestamp = body.headers['x-slack-request-timestamp'] || '';
          
          const result = await slackService.verifyRequestWithAudit(
            signature,
            body.body, 
            timestamp
          );
          
          return new Response(JSON.stringify(formatSuccessResponse({
            verification: result,
            timestamp: new Date().toISOString()
          })), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Error verifying request:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            'slack-security-verify'
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: ClickUp webhook (placeholder)
      if (url.pathname === APP_ENDPOINTS.WEBHOOK_CLICKUP && method === 'POST') {
        const data: ClickUpWebhook = await request.json();
        
        console.log(`${LOG_CONFIG.PREFIXES.INFO} ClickUp webhook received:`, {
          event: data.event,
          task_id: data.task_id,
          webhook_id: data.webhook_id
        });

        return new Response(JSON.stringify({
          status: 'received',
          message: 'ClickUp webhook processed successfully',
          data: {
            task_id: data.task_id || 'unknown',
            event: data.event || 'unknown',
            webhook_id: data.webhook_id || 'unknown'
          },
          timestamp: new Date().toISOString()
        }), {
          status: HTTP_STATUS.OK,
          headers: corsHeaders
        });
      }

      // Route: Test AI functionality
      if (url.pathname === '/test-ai' && method === 'POST') {
        try {
          if (!aiService) {
            return new Response(JSON.stringify({
              error: 'AI Service Not Available',
              message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const data = await request.json() as { text?: string };
          const text = data.text;
          
          if (!text || typeof text !== 'string') {
            return new Response(JSON.stringify({
              error: 'Bad Request',
              message: ERROR_MESSAGES.INVALID_REQUEST
            }), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          // Test AI summarization
          const aiResponse = await aiService.summarizeTicket(text);
          
          return new Response(JSON.stringify({
            status: 'success',
            provider: aiService.getProviderName(),
            input_length: text.length,
            summary: aiResponse.summary,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} AI test error:`, error);
          return new Response(JSON.stringify({
            error: 'AI Test Failed',
            message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            provider: aiService.getProviderName(),
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Test Zendesk + AI integration
      if (url.pathname === '/test-zendesk-ai' && method === 'POST') {
        try {
          const data = await request.json() as { ticket_id?: string | number };
          const ticketId = data.ticket_id;
          
          if (!ticketId) {
            return new Response(JSON.stringify({
              error: 'Bad Request',
              message: ERROR_MESSAGES.INVALID_REQUEST
            }), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          // Fetch ticket from Zendesk
          let ticket;
          try {
            ticket = await zendeskService.getTicket(Number(ticketId));
          } catch (zendeskError) {
            console.error(`${LOG_CONFIG.PREFIXES.ERROR} Zendesk API error:`, zendeskError);
            return new Response(JSON.stringify({
              error: 'Zendesk API Error',
              message: zendeskError instanceof Error ? zendeskError.message : 'Failed to fetch ticket from Zendesk',
              ticket_id: ticketId,
              timestamp: new Date().toISOString()
            }), {
              status: 502, // Bad Gateway - external service error
              headers: corsHeaders
            });
          }
          
          if (!ticket) {
            return new Response(JSON.stringify({
              error: 'Not Found',
              message: `Zendesk ticket ${ticketId} not found or access denied`,
              ticket_id: ticketId,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.NOT_FOUND,
              headers: corsHeaders
            });
          }

          // Create ticket content for AI summarization
          const ticketContent = `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nRequester: ${ticket.requester_id}`;
          
          // Test AI summarization
          const aiResponse = await aiService.summarizeTicket(ticketContent);
          
          return new Response(JSON.stringify({
            status: 'success',
            zendesk_ticket: {
              id: ticket.id,
              subject: ticket.subject,
              status: ticket.status,
              priority: ticket.priority,
              created_at: ticket.created_at
            },
            ai_summary: {
              provider: aiService.getProviderName(),
              content_length: ticketContent.length,
              summary: aiResponse.summary
            },
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Zendesk + AI test error:`, error);
          return new Response(JSON.stringify({
            error: 'Integration Test Failed',
            message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Test ClickUp Integration
      if (url.pathname === '/test-clickup' && method === 'POST') {
        try {
          if (!clickupService) {
            return new Response(JSON.stringify({
              error: 'ClickUp Service Not Available',
              message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          // ✅ Try to get OAuth data for enhanced permissions (same logic as webhook)
          let oauthClickUpService = clickupService;
          if (oauthService && env.TASK_MAPPING) {
            try {
              const defaultUserId = SLACK_DEFAULTS.USER_ID;
              const oauthData = await oauthService.getUserOAuth(defaultUserId);

              if (oauthData && oauthService.isTokenValid(oauthData)) {
                console.log(`${LOG_CONFIG.PREFIXES.SUCCESS} Using OAuth tokens for ClickUp test`);
                oauthClickUpService = new ClickUpService(env, aiService, oauthData);
              } else {
                console.log(`${LOG_CONFIG.PREFIXES.WARNING} OAuth data not found or invalid, falling back to API token for test`);
              }
            } catch (oauthError) {
              console.warn(`${LOG_CONFIG.PREFIXES.WARNING} Error retrieving OAuth data for test, falling back to API token:`, oauthError);
            }
          }

          const body = await request.json() as {
            action: 'test_auth' | 'create_test_task' | 'list_spaces';
            test_ticket_id?: string;
          };

          interface TestResults {
            action: string;
            timestamp: string;
            using_oauth: boolean;
            connection_test?: any;
            test_task_creation?: {
              success: boolean;
              task_id?: string;
              task_url?: string | null;
              error?: string;
            };
            spaces?: any;
            spaces_error?: {
              message?: string;
              status?: number;
              statusText?: string;
              body?: string;
            };
            environment_check?: {
              clickup_token: boolean;
              clickup_list_id: boolean;
              clickup_team_id: boolean;
              clickup_space_id: boolean;
            };
          }

          const results: TestResults = {
            action: body.action,
            timestamp: new Date().toISOString(),
            using_oauth: oauthClickUpService !== clickupService
          };
          
          switch (body.action) {
            case 'test_auth':
              // Test ClickUp API authentication using OAuth-enabled service
              const connectionTest = await oauthClickUpService.testConnection();
              results.connection_test = connectionTest;
              break;

            case 'create_test_task':
              // Create a test task to verify the integration using OAuth-enabled service
              const testTicket = {
                id: parseInt(body.test_ticket_id || '12345'),
                subject: 'Test Ticket from TaskGenie',
                description: 'This is a test ticket created to verify the ClickUp integration.',
                status: 'new',
                priority: 'normal',
                created_at: new Date().toISOString(),
                requester_id: 123456,
                tags: ['test', 'automation']
              } as ZendeskTicket;

              try {
                const testTask = await oauthClickUpService.createTaskFromTicket(testTicket);
                results.test_task_creation = {
                  success: !!testTask,
                  task_id: testTask?.id,
                  task_url: testTask ? oauthClickUpService.getTaskUrl(testTask.id) : null
                };
              } catch (error) {
                results.test_task_creation = {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                };
              }
              break;
              
            case 'list_spaces':
              // List ClickUp spaces to help debug list configuration using OAuth-enabled service
              try {
                // ✅ Use OAuth-enabled service instead of hardcoded API token
                if (!oauthClickUpService.hasValidAuth()) {
                  results.spaces_error = {
                    message: 'No valid ClickUp authentication available (neither OAuth nor API token)'
                  };
                  break;
                }

                const spacesResponse = await fetch('https://api.clickup.com/api/v2/team', {
                  headers: {
                    'Authorization': oauthClickUpService.getAuthHeader(), // Use the service's auth method
                    'Content-Type': 'application/json'
                  }
                });

                if (spacesResponse.ok) {
                  const spacesData = await spacesResponse.json();
                  results.spaces = spacesData;
                } else {
                  const errorText = await spacesResponse.text();
                  results.spaces_error = {
                    status: spacesResponse.status,
                    statusText: spacesResponse.statusText,
                    body: errorText
                  };
                }
              } catch (error) {
                results.spaces_error = {
                  message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
                };
              }
              break;
              
            default:
              return new Response(JSON.stringify({
                error: 'Invalid Action',
                message: ERROR_MESSAGES.INVALID_REQUEST,
                available_actions: ['test_auth', 'create_test_task', 'list_spaces'],
                timestamp: new Date().toISOString()
              }), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
          }
          
          // Check environment configuration
          results.environment_check = {
            clickup_token: !!env.CLICKUP_TOKEN,
            clickup_list_id: !!env.CLICKUP_LIST_ID,
            clickup_team_id: !!env.CLICKUP_TEAM_ID,
            clickup_space_id: !!env.CLICKUP_SPACE_ID
          };
          
          return new Response(JSON.stringify({
            status: 'success',
            clickup_test_results: results
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} ClickUp test error:`, error);
          return new Response(JSON.stringify({
            error: 'ClickUp Test Failed',
            message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }
      if (url.pathname === '/test-slack' && method === 'POST') {
        try {
          const body = await request.json() as { 
            action: 'send_message' | 'test_auth' | 'verify_webhook';
            channel?: string;
            message?: string;
            test_signature?: boolean;
          };
          
          interface SlackTestResults {
            action: string;
            timestamp: string;
            message_sent?: {
              channel: string;
              text: string;
              status: string;
            };
            auth_test?: {
              ok: boolean;
              [key: string]: any;
            };
            webhook_verification?: {
              test_body: string;
              test_timestamp: string;
              test_signature: string;
              verification_result: boolean;
              signing_secret_configured: boolean;
            };
            environment_check?: {
              slack_bot_token: boolean;
              slack_signing_secret: boolean;
              slack_app_token: boolean;
            };
          }

          const results: SlackTestResults = {
            action: body.action,
            timestamp: new Date().toISOString()
          };
          
          switch (body.action) {
            case 'send_message':
              if (!body.channel || !body.message) {
                return new Response(JSON.stringify({
                  error: 'Missing Parameters',
                  message: ERROR_MESSAGES.INVALID_REQUEST,
                  required_params: ['channel', 'message'],
                  timestamp: new Date().toISOString()
                }), {
                  status: HTTP_STATUS.BAD_REQUEST,
                  headers: corsHeaders
                });
              }
              
              await slackService.sendMessage(body.channel, body.message);
              
              results.message_sent = {
                channel: body.channel,
                text: body.message,
                status: 'sent'
              };
              break;
              
            case 'test_auth':
              // Test Slack API authentication by calling a simple API endpoint
              const authResponse = await fetch('https://slack.com/api/auth.test', {
                headers: {
                  'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const authResult = await authResponse.json() as any;
              results.auth_test = {
                ok: authResult.ok,
                team: authResult.team,
                user: authResult.user,
                bot_id: authResult.bot_id,
                app_id: authResult.app_id,
                error: authResult.error
              };
              break;
              
            case 'verify_webhook':
              // Test webhook signature verification
              const testBody = JSON.stringify({ test: 'data' });
              const testTimestamp = Math.floor(Date.now() / 1000).toString();
              const testSignature = 'v0=test_signature';
              
              const isValid = await slackService.verifyRequest(testSignature, testBody, testTimestamp);
              results.webhook_verification = {
                test_body: testBody,
                test_timestamp: testTimestamp,
                test_signature: testSignature,
                verification_result: isValid,
                signing_secret_configured: !!env.SLACK_SIGNING_SECRET
              };
              break;
              
            default:
              return new Response(JSON.stringify({
                error: ERROR_MESSAGES.INVALID_REQUEST,
                message: 'action must be one of: send_message, test_auth, verify_webhook',
                available_actions: ['send_message', 'test_auth', 'verify_webhook'],
                timestamp: new Date().toISOString()
              }), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
          }
          
          // Check environment configuration
          results.environment_check = {
            slack_bot_token: !!env.SLACK_BOT_TOKEN,
            slack_signing_secret: !!env.SLACK_SIGNING_SECRET,
            slack_app_token: !!env.SLACK_APP_TOKEN
          };
          
          return new Response(JSON.stringify({
            status: 'success',
            slack_test_results: results
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Slack test error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown Slack test error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Start ClickUp OAuth Flow
      if (url.pathname === '/auth/clickup' && method === 'GET') {
        try {
          if (!oauthService) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              message: 'OAuth service is not configured. Please check your ClickUp OAuth environment variables.',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          // Generate state for security
          const state = oauthService.generateState();
          
          // Generate OAuth URL
          const authUrl = oauthService.generateAuthUrl(state);
          
          // Store state in KV for validation (if available)
          if (env.TASK_MAPPING) {
            await env.TASK_MAPPING.put(`oauth_state_${state}`, JSON.stringify({
              state,
              created_at: new Date().toISOString(),
              expires_at: Date.now() + (10 * 60 * 1000) // 10 minutes
            }));
          }

          return new Response(JSON.stringify({
            status: 'success',
            message: 'ClickUp OAuth authorization URL generated',
            auth_url: authUrl,
            state: state,
            instructions: [
              '1. Visit the auth_url to authorize TaskGenie',
              '2. You will be redirected back to the callback URL',
              '3. TaskGenie will then have access to your ClickUp workspace'
            ],
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth start error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown OAuth error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: ClickUp OAuth Callback
      if (url.pathname === '/auth/clickup/callback' && method === 'GET') {
        try {
          if (!oauthService) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              message: 'OAuth service is not configured.',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          // Handle OAuth errors
          if (error) {
            console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth callback error:`, error);
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.INVALID_REQUEST,
              message: `ClickUp OAuth error: ${error}`,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          if (!code) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.INVALID_REQUEST,
              message: 'No authorization code provided by ClickUp',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }

          // Validate state if KV storage is available
          if (state && env.TASK_MAPPING) {
            const storedStateData = await env.TASK_MAPPING.get(`oauth_state_${state}`);
            if (!storedStateData) {
              return new Response(JSON.stringify({
                error: ERROR_MESSAGES.INVALID_REQUEST,
                message: 'OAuth state parameter is invalid or expired',
                timestamp: new Date().toISOString()
              }), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
            }
            // Clean up state after validation
            await env.TASK_MAPPING.delete(`oauth_state_${state}`);
          }

          // Exchange code for tokens
          const tokens = await oauthService.exchangeCodeForToken(code);
          
          // Get user info
          const userInfo = await oauthService.getUserInfo(tokens.access_token);
          const userTeams = await oauthService.getUserTeams(tokens.access_token);

          // Create user OAuth data
          const userId = userInfo.user?.id || 'unknown';
          const oauthData: UserOAuthData = {
            user_id: userId,
            team_id: userTeams.length > 0 ? userTeams[0].id : undefined,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
            authorized_at: new Date().toISOString(),
            scopes: []
          };

          // Store OAuth data with both actual user ID and 'default' key
          await oauthService.storeUserOAuth(userId, oauthData);
          // Also store with 'default' key for application compatibility
          await oauthService.storeUserOAuth('default', oauthData);

          return new Response(JSON.stringify({
            status: 'success',
            message: 'ClickUp OAuth authorization successful!',
            user: {
              id: userInfo.user?.id,
              username: userInfo.user?.username,
              email: userInfo.user?.email
            },
            teams: userTeams.map((team: any) => ({
              id: team.id,
              name: team.name
            })),
            access_granted: true,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth callback error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown OAuth callback error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Check OAuth Status (with basic security)
      if (url.pathname === '/auth/clickup/status' && method === 'GET') {
        try {
          // Basic security: Check for admin token or local access
          const authHeader = request.headers.get('Authorization');
          const adminToken = env.WEBHOOK_SECRET; // Reuse webhook secret as admin token
          const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

          if (!isLocalhost && (!authHeader || authHeader !== `Bearer ${adminToken}`)) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.UNAUTHORIZED,
              message: 'This endpoint requires authentication',
              hint: 'Add Authorization: Bearer <WEBHOOK_SECRET> header or access from localhost',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.UNAUTHORIZED,
              headers: corsHeaders
            });
          }

          const userId = url.searchParams.get('user_id') || 'default';

          if (!oauthService) {
            return new Response(JSON.stringify({
              status: 'oauth_unavailable',
              message: 'OAuth service is not configured',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          console.log(`${LOG_CONFIG.PREFIXES.INFO} Checking OAuth status for user: ${userId}`);
          const oauthData = await oauthService.getUserOAuth(userId);

          if (!oauthData) {
            console.log(`${LOG_CONFIG.PREFIXES.ERROR} No OAuth data found for user: ${userId}`);
            return new Response(JSON.stringify({
              status: 'not_authorized',
              message: 'User has not authorized ClickUp access',
              oauth_url: `/auth/clickup`,
              checked_user_id: userId,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          const isValid = oauthService.isTokenValid(oauthData);
          
          return new Response(JSON.stringify({
            status: isValid ? 'authorized' : 'token_expired',
            message: isValid ? 'ClickUp access is authorized and valid' : 'ClickUp access token has expired',
            user_id: oauthData.user_id,
            team_id: oauthData.team_id,
            authorized_at: oauthData.authorized_at,
            expires_at: oauthData.expires_at,
            needs_reauth: !isValid,
            oauth_url: !isValid ? `/auth/clickup` : undefined,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth status check error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown status check error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Test ClickUp OAuth (comprehensive test) - PROTECTED
      if (url.pathname === '/auth/test' && method === 'GET') {
        try {
          // Security check
          const authHeader = request.headers.get('Authorization');
          const adminToken = env.WEBHOOK_SECRET;
          const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

          if (!isLocalhost && (!authHeader || authHeader !== `Bearer ${adminToken}`)) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.UNAUTHORIZED,
              message: 'This endpoint requires authentication',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.UNAUTHORIZED,
              headers: corsHeaders
            });
          }

          if (!oauthService || !env.TASK_MAPPING) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          const results: any = {
            oauth_service: !!oauthService,
            kv_storage: !!env.TASK_MAPPING,
            tests: {}
          };

          // Test 1: Check OAuth data exists
          const defaultData = await oauthService.getUserOAuth('default');
          results.tests.oauth_data_exists = !!defaultData;

          if (defaultData) {
            results.tests.token_valid = oauthService.isTokenValid(defaultData);
            results.user_info = {
              user_id: defaultData.user_id,
              team_id: defaultData.team_id,
              authorized_at: defaultData.authorized_at,
              expires_at: defaultData.expires_at
            };

            // Test 2: Try ClickUp API call
            try {
              const clickupService = new ClickUpService(env, aiService, defaultData);
              const testResult = await clickupService.testConnection();
              results.tests.clickup_api_test = testResult;
            } catch (apiError) {
              results.tests.clickup_api_test = {
                success: false,
                error: apiError instanceof Error ? apiError.message : 'Unknown API error'
              };
            }
          }

          return new Response(JSON.stringify({
            status: 'oauth_test_complete',
            results,
            overall_status: defaultData && oauthService.isTokenValid(defaultData) ? 'healthy' : 'needs_auth',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth test error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown test error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Route: Debug OAuth Storage (for troubleshooting) - PROTECTED
      if (url.pathname === '/auth/debug' && method === 'GET') {
        try {
          // Security check
          const authHeader = request.headers.get('Authorization');
          const adminToken = env.WEBHOOK_SECRET;
          const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

          if (!isLocalhost && (!authHeader || authHeader !== `Bearer ${adminToken}`)) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.UNAUTHORIZED,
              message: 'This endpoint requires authentication',
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.UNAUTHORIZED,
              headers: corsHeaders
            });
          }

          if (!oauthService || !env.TASK_MAPPING) {
            return new Response(JSON.stringify({
              error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
              timestamp: new Date().toISOString()
            }), {
              status: HTTP_STATUS.SERVICE_UNAVAILABLE,
              headers: corsHeaders
            });
          }

          // Check for both 'default' and any specific user ID
          const defaultData = await oauthService.getUserOAuth('default');

          return new Response(JSON.stringify({
            status: 'debug_info',
            oauth_service_available: !!oauthService,
            kv_storage_available: !!env.TASK_MAPPING,
            default_user_data: defaultData ? {
              user_id: defaultData.user_id,
              team_id: defaultData.team_id,
              has_access_token: !!defaultData.access_token,
              authorized_at: defaultData.authorized_at,
              expires_at: defaultData.expires_at
            } : null,
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.OK,
            headers: corsHeaders
          });
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} OAuth debug error:`, error);
          return new Response(JSON.stringify({
            error: ERROR_MESSAGES.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : 'Unknown debug error',
            timestamp: new Date().toISOString()
          }), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // Agent Routes
      if (url.pathname.startsWith('/agents/') && automationService) {
        try {
          // Route: Process ticket with multi-agent system
          if (url.pathname === '/agents/process-ticket' && method === 'POST') {
            const body = await request.json() as { ticketId: string };
            const result = await automationService.processTicket(body.ticketId);
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Analyze ticket and create ClickUp tasks
          if (url.pathname === '/agents/analyze-and-create-tasks' && method === 'POST') {
            const body = await request.json() as { ticketId: string; workspaceId?: string; listId?: string };
            const result = await automationService.analyzeAndCreateTasks(
              body.ticketId,
              body.listId
            );
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Get comprehensive insights
          if (url.pathname === '/agents/comprehensive-insights' && method === 'POST') {
            const body = await request.json() as { ticketIds: string[]; analysisType?: string; includeRecommendations?: boolean };
            
            // Handle both single ticketId and multiple ticketIds for backward compatibility
            const ticketIds = body.ticketIds || [(body as any).ticketId];
            
            if (!ticketIds || ticketIds.length === 0) {
              return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.INVALID_REQUEST)), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
            }
            
            // For now, process the first ticket (can be extended to handle multiple)
            const result = await automationService.getComprehensiveInsights(ticketIds[0]);
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Route ticket to specific agent
          if (url.pathname === '/agents/route-ticket' && method === 'POST') {
            const body = await request.json() as { ticketId: string; targetAgent: AgentRole; context?: any };
            const result = await automationService.routeToAgent(body.ticketId, body.targetAgent);
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Get workflow metrics
          if (url.pathname === '/agents/metrics' && method === 'GET') {
            const result = await automationService.getWorkflowMetrics();
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Get all agent statuses
          if (url.pathname === '/agents/status' && method === 'GET') {
            const result = await automationService.getAgentStatuses();
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Get specific agent status
          if (url.pathname.startsWith('/agents/status/') && method === 'GET') {
            const role = url.pathname.split('/')[3] as AgentRole;
            const result = await automationService.getAgentStatuses();
            const agentStatus = result.agents.find(agent => agent.role === role);
            if (agentStatus) {
              return new Response(JSON.stringify(formatSuccessResponse(agentStatus)), {
                status: HTTP_STATUS.OK,
                headers: corsHeaders
              });
            } else {
              return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.NOT_FOUND)), {
                status: HTTP_STATUS.NOT_FOUND,
                headers: corsHeaders
              });
            }
          }

          // Route: Reset workflow metrics
          if (url.pathname === '/agents/reset-metrics' && method === 'POST') {
            // This would require adding a reset method to the orchestrator
            return new Response(JSON.stringify(formatSuccessResponse({ message: 'Metrics reset successfully' })), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: List agent capabilities
          if (url.pathname === '/agents/capabilities' && method === 'GET') {
            const capabilities = {
              PROJECT_MANAGER: ['project_coordination', 'resource_allocation', 'risk_management', 'progress_tracking', 'stakeholder_communication', 'quality_assurance'],
              SOFTWARE_ENGINEER: ['technical_analysis', 'code_review', 'api_integration', 'backend_development', 'database_optimization', 'security_analysis', 'performance_tuning', 'debugging', 'architecture_design'],
              WORDPRESS_DEVELOPER: ['wordpress_development', 'plugin_development', 'theme_customization', 'woocommerce_integration', 'performance_optimization', 'security_hardening', 'migration_assistance', 'troubleshooting', 'maintenance'],
              DEVOPS: ['infrastructure_management', 'deployment_automation', 'monitoring_setup', 'security_compliance', 'backup_recovery', 'performance_monitoring', 'scalability_planning', 'incident_response', 'network_management'],
              QA_TESTER: ['test_planning', 'bug_detection', 'regression_testing', 'performance_testing', 'usability_testing', 'compatibility_testing', 'automation_testing', 'quality_assurance', 'documentation'],
              BUSINESS_ANALYST: ['requirements_analysis', 'data_analysis', 'process_optimization', 'roi_analysis', 'stakeholder_management', 'reporting', 'strategic_planning', 'business_intelligence', 'workflow_design']
            };
            return new Response(JSON.stringify(formatSuccessResponse(capabilities)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

          // Route: Simulate workflow with sample data
          if (url.pathname === '/agents/simulate-workflow' && method === 'POST') {
            const sampleTicket = {
              id: 'sample-123',
              subject: 'Website performance issues after recent update',
              description: 'Our website has been loading slowly since the last WordPress update. Users are complaining about long load times and some pages are timing out.',
              priority: 'high',
              status: 'open',
              requester_id: 'user-456',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Simulate processing with sample data
            const result = {
              ticketId: sampleTicket.id,
              workflow: {
                initialAgent: 'PROJECT_MANAGER',
                steps: [
                  { agent: 'PROJECT_MANAGER', action: 'Initial analysis and routing', confidence: 0.9 },
                  { agent: 'WORDPRESS_DEVELOPER', action: 'WordPress performance analysis', confidence: 0.85 },
                  { agent: 'DEVOPS', action: 'Server performance check', confidence: 0.8 },
                  { agent: 'QA_TESTER', action: 'Performance testing validation', confidence: 0.75 }
                ],
                finalRecommendations: [
                  'Optimize WordPress plugins and themes',
                  'Implement caching solutions',
                  'Review server resources and scaling',
                  'Conduct comprehensive performance testing'
                ]
              },
              simulationNote: 'This is a simulated workflow for demonstration purposes'
            };
            
            return new Response(JSON.stringify(formatSuccessResponse(result)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }

        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} Agent route error:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }

      // TaskGenie Routes
      if (url.pathname.startsWith('/taskgenie/') && taskGenie) {
        try {
          // Route: Chat with TaskGenie
          if (url.pathname === '/taskgenie/chat' && method === 'POST') {
            const body = await request.json() as { query: string; userId?: string; sessionId?: string };
            
            if (!body.query) {
              return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.INVALID_REQUEST)), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
            }
            
            const response = await taskGenie.chat(body.query, body.userId, body.sessionId);
            
            return new Response(JSON.stringify(formatSuccessResponse(response)), {
              status: response.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
              headers: corsHeaders
            });
          }
          
          // Route: Get TaskGenie help
          if (url.pathname === '/taskgenie/help' && method === 'GET') {
            const response = await taskGenie.getHelp();
            
            return new Response(JSON.stringify(formatSuccessResponse(response)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
          // Route: Get TaskGenie status
          if (url.pathname === '/taskgenie/status' && method === 'GET') {
            const response = await taskGenie.getStatus();
            
            return new Response(JSON.stringify(formatSuccessResponse(response)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
          // Route: Batch process queries
          if (url.pathname === '/taskgenie/batch' && method === 'POST') {
            const body = await request.json() as { queries: string[]; userId?: string };
            
            if (!body.queries || !Array.isArray(body.queries)) {
              return new Response(JSON.stringify(formatErrorResponse(ERROR_MESSAGES.INVALID_REQUEST)), {
                status: HTTP_STATUS.BAD_REQUEST,
                headers: corsHeaders
              });
            }
            
            const responses = await taskGenie.batchProcess(body.queries, body.userId);
            
            return new Response(JSON.stringify(formatSuccessResponse(responses)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
          // Route: Clear conversation context
          if (url.pathname === '/taskgenie/context' && method === 'DELETE') {
            const body = await request.json() as { userId?: string; sessionId?: string };
            
            const cleared = taskGenie.clearContext(body.userId, body.sessionId);
            
            return new Response(JSON.stringify(formatSuccessResponse({
              cleared,
              message: cleared ? 'Context cleared successfully' : 'No context found to clear'
            })), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
          // Route: Get conversation history
          if (url.pathname === '/taskgenie/history' && method === 'GET') {
            const url_params = new URLSearchParams(url.search);
            const userId = url_params.get('userId') || undefined;
            const sessionId = url_params.get('sessionId') || undefined;
            
            const history = taskGenie.getConversationHistory(userId, sessionId);
            
            return new Response(JSON.stringify(formatSuccessResponse(history)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
          // Route: Get TaskGenie statistics
          if (url.pathname === '/taskgenie/stats' && method === 'GET') {
            const stats = taskGenie.getStats();
            
            return new Response(JSON.stringify(formatSuccessResponse(stats)), {
              status: HTTP_STATUS.OK,
              headers: corsHeaders
            });
          }
          
        } catch (error) {
          console.error(`${LOG_CONFIG.PREFIXES.ERROR} TaskGenie route error:`, error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
          )), {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: corsHeaders
          });
        }
      }
      
      // TaskGenie routes require TaskGenie service
      if (url.pathname.startsWith('/taskgenie/') && !taskGenie) {
        return new Response(JSON.stringify(formatErrorResponse(
          ERROR_MESSAGES.SERVICE_UNAVAILABLE
        )), {
          status: HTTP_STATUS.SERVICE_UNAVAILABLE,
          headers: corsHeaders
        });
      }

      // Agent routes require multi-agent service
      if (url.pathname.startsWith('/agents/') && !automationService) {
        return new Response(JSON.stringify(formatErrorResponse(
          ERROR_MESSAGES.SERVICE_UNAVAILABLE
        )), {
          status: HTTP_STATUS.SERVICE_UNAVAILABLE,
          headers: corsHeaders
        });
      }

      // Route: Not found
      return new Response(JSON.stringify({
        error: ERROR_MESSAGES.NOT_FOUND,
        message: `Endpoint ${method} ${url.pathname} not found`,
        available_endpoints: [
          'GET  / - Health check',
          'GET  /test - Environment test',
          'POST /zendesk-webhook - Zendesk webhook endpoint',
          'POST /clickup-webhook - ClickUp webhook endpoint',
          'POST /slack/events - Slack events endpoint',
          'POST /slack/commands - Slack slash commands',
          'GET  /auth/clickup - Start ClickUp OAuth flow',
          'GET  /auth/clickup/callback - ClickUp OAuth callback',
          'GET  /auth/clickup/status - Check OAuth authorization status',
          'POST /test-ai - Test AI summarization',
          'POST /test-zendesk-ai - Test Zendesk + AI integration',
          'POST /test-clickup - Test ClickUp integration',
          'POST /test-slack - Test Slack integration',
          'POST /agents/process-ticket - Process ticket with multi-agent system',
          'POST /agents/analyze-and-create-tasks - Analyze ticket and create ClickUp tasks',
          'POST /agents/comprehensive-insights - Get comprehensive AI + agent insights',
          'POST /agents/route-ticket - Route ticket to specific agent',
          'GET  /agents/metrics - Get workflow metrics',
          'GET  /agents/status - Get all agent statuses',
          'GET  /agents/status/:role - Get specific agent status',
          'POST /agents/reset-metrics - Reset workflow metrics',
          'GET  /agents/capabilities - List agent capabilities',
          'POST /agents/simulate-workflow - Simulate workflow with sample data'
        ]
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: corsHeaders
      });

    } catch (error) {
      console.error(`${LOG_CONFIG.PREFIXES.ERROR} Worker error:`, error);
      
      return new Response(JSON.stringify({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: corsHeaders
      });
    }
  }
};