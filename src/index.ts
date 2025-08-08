import { Env, ZendeskWebhook, ClickUpWebhook, SlackEvent, ZendeskTicket } from './types/index.js';
import { SlackService } from './services/slack.js';
import { ZendeskService } from './services/zendesk.js';
import { ClickUpService } from './services/clickup.js';
import { AIService } from './services/ai.js';
import { getCorsHeaders, formatErrorResponse, formatSuccessResponse } from './utils/index.js';

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

    try {
      slackService = new SlackService(env);
    } catch (error) {
      console.warn('Slack service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      zendeskService = new ZendeskService(env);
    } catch (error) {
      console.warn('Zendesk service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      clickupService = new ClickUpService(env);
    } catch (error) {
      console.warn('ClickUp service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      aiService = new AIService(env);
    } catch (error) {
      console.warn('AI service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    try {
      // Route: Health check
      if (url.pathname === '/' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'TaskGenie - Zendesk-ClickUp-Slack Automation Worker is running! 🧞‍♂️',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          language: 'TypeScript',
          features: [
            '🎫 Zendesk ticket automation',
            '📋 ClickUp task management', 
            '💬 Slack bot integration',
            '🤖 AI-powered summarization'
          ],
          endpoints: [
            'GET  / - Health check',
            'GET  /test - Environment test',
            'POST /zendesk-webhook - Zendesk webhook endpoint',
            'POST /clickup-webhook - ClickUp webhook endpoint',
            'POST /slack/events - Slack events endpoint',
            'POST /slack/commands - Slack commands endpoint',
            'POST /test-ai - Test AI summarization',
            'POST /test-clickup - Test ClickUp integration',
            'POST /test-slack - Test Slack integration'
          ]
        }), {
          status: 200,
          headers: corsHeaders
        });
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
            ai: aiService ? '✅ available' : '❌ unavailable'
          },
          environment: {
            // Zendesk Configuration
            zendesk_domain: env.ZENDESK_DOMAIN ? '✅ configured' : '❌ missing',
            zendesk_email: env.ZENDESK_EMAIL ? '✅ configured' : '❌ missing',
            zendesk_token: env.ZENDESK_TOKEN ? '✅ configured' : '❌ missing',
            
            // ClickUp Configuration
            clickup_token: env.CLICKUP_TOKEN ? '✅ configured' : '❌ missing',
            clickup_list_id: env.CLICKUP_LIST_ID ? '✅ configured' : '❌ missing',
            
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
          status: 200,
          headers: corsHeaders
        });
      }

      // Route: Zendesk webhook - Create ClickUp task and notify Slack
      if (url.pathname === '/zendesk-webhook' && method === 'POST') {
        try {
          // Check if required services are available
          if (!clickupService) {
            return new Response(JSON.stringify(formatErrorResponse('ClickUp service not available - check environment configuration')), {
              status: 503,
              headers: corsHeaders
            });
          }

          // Validate webhook secret for security
          const authHeader = request.headers.get('Authorization');
          const expectedSecret = `Bearer ${env.WEBHOOK_SECRET}`;
          
          if (!authHeader || authHeader !== expectedSecret) {
            return new Response(JSON.stringify(formatErrorResponse('Unauthorized - Invalid webhook secret')), {
              status: 401,
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
            tags: rawTicket.tags || []
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
            
            // Create ClickUp task using the service
            let clickupTask;
            try {
              clickupTask = await clickupService.createTaskFromTicket(ticket);
            } catch (clickupError) {
              console.error('💥 ClickUp task creation failed:', clickupError);
              throw new Error(`ClickUp task creation failed: ${clickupError instanceof Error ? clickupError.message : 'Unknown error'}`);
            }
            
            if (!clickupTask) {
              console.error('❌ ClickUp task creation returned null');
              throw new Error('Failed to create ClickUp task - service returned null');
            }

            console.log('🎉 ClickUp task created successfully:', {
              id: clickupTask.id,
              name: clickupTask.name,
              url: clickupTask.url
            });

            // Store mapping in KV if available
            if (env.TASK_MAPPING) {
              const mappingKey = `zendesk_${ticket.id}`;
              const mappingValue = {
                zendesk_ticket_id: ticket.id,
                clickup_task_id: clickupTask.id,
                created_at: new Date().toISOString(),
                status: 'active'
              };
              await env.TASK_MAPPING.put(mappingKey, JSON.stringify(mappingValue));
              console.log('💾 Task mapping stored:', mappingKey);
            }

            // Send Slack notification if configured
            let slackThreadTs: string | undefined;
            if (slackService && env.SLACK_BOT_TOKEN && env.SLACK_SIGNING_SECRET) {
              try {
                // For demo purposes, we'll use a default channel
                // In production, this should be configurable
                const defaultChannel = '#taskgenie'; // or get from env
                const zendeskUrl = zendeskService?.getTicketUrl(ticket.id) || `https://${env.ZENDESK_DOMAIN}/agent/tickets/${ticket.id}`;
                const clickupUrl = clickupService.getTaskUrl(clickupTask.id);
                
                const slackMessage = await slackService.sendTaskCreationMessage(
                  defaultChannel,
                  ticket.id.toString(),
                  zendeskUrl,
                  clickupUrl,
                  'Steve' // In production, get from ticket requester
                );
                slackThreadTs = slackMessage?.ts;
                
                console.log('💬 Slack notification sent:', slackThreadTs);
              } catch (slackError) {
                console.error('⚠️ Slack notification failed:', slackError);
                // Don't fail the whole process if Slack fails
              }
            }

            return new Response(JSON.stringify(formatSuccessResponse({
              zendesk_ticket_id: ticket.id,
              zendesk_subject: ticket.subject,
              clickup_task_id: clickupTask.id,
              clickup_task_url: clickupService.getTaskUrl(clickupTask.id),
              slack_thread_ts: slackThreadTs,
              event_type: data.type
            }, 'Zendesk ticket successfully converted to ClickUp task and Slack notified')), {
              status: 200,
              headers: corsHeaders
            });
          } else {
            return new Response(JSON.stringify(formatSuccessResponse(null, 'Event type not processed')), {
              status: 200,
              headers: corsHeaders
            });
          }

        } catch (error) {
          console.error('❌ Error processing Zendesk webhook:', error);
          
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : 'Unknown error',
            'zendesk-webhook'
          )), {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Events API
      if (url.pathname === '/slack/events' && method === 'POST') {
        try {
          if (!slackService) {
            return new Response(JSON.stringify(formatErrorResponse('Slack service not available - check environment configuration')), {
              status: 503,
              headers: corsHeaders
            });
          }

          const body = await request.text();
          const timestamp = request.headers.get('X-Slack-Request-Timestamp') || '';
          const signature = request.headers.get('X-Slack-Signature') || '';

          // Verify Slack request signature
          if (!await slackService.verifyRequest(body, timestamp, signature)) {
            return new Response(JSON.stringify(formatErrorResponse('Invalid Slack signature')), {
              status: 401,
              headers: corsHeaders
            });
          }

          const data = JSON.parse(body);

          // Handle URL verification challenge
          if (data.type === 'url_verification') {
            return new Response(data.challenge, {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          }

          // Handle app mentions and direct messages
          if (data.type === 'event_callback' && data.event) {
            const event: SlackEvent = data.event;
            
            if (event.type === 'app_mention' || event.type === 'message') {
              // Handle the mention asynchronously
              ctx.waitUntil(slackService.handleMention(event));
              
              return new Response('', { status: 200 });
            }
          }

          return new Response('', { status: 200 });
        } catch (error) {
          console.error('❌ Error processing Slack event:', error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : 'Unknown error',
            'slack-events'
          )), {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      // Route: Slack Slash Commands
      if (url.pathname === '/slack/commands' && method === 'POST') {
        try {
          const formData = await request.formData();
          const command = formData.get('command');
          const text = formData.get('text');
          const userId = formData.get('user_id');
          const channelId = formData.get('channel_id');

          if (command === '/taskgenie') {
            return new Response(JSON.stringify({
              response_type: 'ephemeral',
              text: '🧞‍♂️ TaskGenie is here to help! I automatically create ClickUp tasks from Zendesk tickets and can provide AI-powered summaries. Just mention me in a thread and ask for "summarize"!'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            response_type: 'ephemeral',
            text: 'Unknown command. Try `/taskgenie` for help.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('❌ Error processing Slack command:', error);
          return new Response(JSON.stringify(formatErrorResponse(
            error instanceof Error ? error.message : 'Unknown error',
            'slack-commands'
          )), {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      // Route: ClickUp webhook (placeholder)
      if (url.pathname === '/clickup-webhook' && method === 'POST') {
        const data: ClickUpWebhook = await request.json();
        
        console.log('📝 ClickUp webhook received:', {
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
          status: 200,
          headers: corsHeaders
        });
      }

      // Route: Test AI functionality
      if (url.pathname === '/test-ai' && method === 'POST') {
        try {
          if (!aiService) {
            return new Response(JSON.stringify({
              error: 'AI Service Not Available',
              message: 'AI service is not configured. Please check your environment variables.',
              timestamp: new Date().toISOString()
            }), {
              status: 503,
              headers: corsHeaders
            });
          }

          const data = await request.json() as { text?: string };
          const text = data.text;
          
          if (!text || typeof text !== 'string') {
            return new Response(JSON.stringify({
              error: 'Bad Request',
              message: 'Missing or invalid "text" field in request body'
            }), {
              status: 400,
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
            status: 200,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error('❌ AI test error:', error);
          return new Response(JSON.stringify({
            error: 'AI Test Failed',
            message: error instanceof Error ? error.message : 'Unknown AI error',
            provider: aiService.getProviderName(),
            timestamp: new Date().toISOString()
          }), {
            status: 500,
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
              message: 'Missing "ticket_id" field in request body'
            }), {
              status: 400,
              headers: corsHeaders
            });
          }

          // Fetch ticket from Zendesk
          let ticket;
          try {
            ticket = await zendeskService.getTicket(Number(ticketId));
          } catch (zendeskError) {
            console.error('❌ Zendesk API error:', zendeskError);
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
              status: 404,
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
            status: 200,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error('❌ Zendesk + AI test error:', error);
          return new Response(JSON.stringify({
            error: 'Integration Test Failed',
            message: error instanceof Error ? error.message : 'Unknown integration error',
            timestamp: new Date().toISOString()
          }), {
            status: 500,
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
              message: 'ClickUp service is not configured. Please check your environment variables.',
              timestamp: new Date().toISOString()
            }), {
              status: 503,
              headers: corsHeaders
            });
          }

          const body = await request.json() as { 
            action: 'test_auth' | 'create_test_task' | 'list_spaces';
            test_ticket_id?: string;
          };
          
          const results: any = {
            action: body.action,
            timestamp: new Date().toISOString()
          };
          
          switch (body.action) {
            case 'test_auth':
              // Test ClickUp API authentication
              const connectionTest = await clickupService.testConnection();
              results.connection_test = connectionTest;
              break;
              
            case 'create_test_task':
              // Create a test task to verify the integration
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
                const testTask = await clickupService.createTaskFromTicket(testTicket);
                results.test_task_creation = {
                  success: !!testTask,
                  task_id: testTask?.id,
                  task_url: testTask ? clickupService.getTaskUrl(testTask.id) : null
                };
              } catch (error) {
                results.test_task_creation = {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                };
              }
              break;
              
            case 'list_spaces':
              // List ClickUp spaces to help debug list configuration
              try {
                const spacesResponse = await fetch('https://api.clickup.com/api/v2/team', {
                  headers: {
                    'Authorization': env.CLICKUP_TOKEN,
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
                  message: error instanceof Error ? error.message : 'Unknown error'
                };
              }
              break;
              
            default:
              return new Response(JSON.stringify({
                error: 'Invalid Action',
                message: 'action must be one of: test_auth, create_test_task, list_spaces',
                available_actions: ['test_auth', 'create_test_task', 'list_spaces'],
                timestamp: new Date().toISOString()
              }), {
                status: 400,
                headers: corsHeaders
              });
          }
          
          // Check environment configuration
          results.environment_check = {
            clickup_token: !!env.CLICKUP_TOKEN,
            clickup_list_id: !!env.CLICKUP_LIST_ID,
            clickup_list_id_value: env.CLICKUP_LIST_ID || 'not set'
          };
          
          return new Response(JSON.stringify({
            status: 'success',
            clickup_test_results: results
          }), {
            status: 200,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error('❌ ClickUp test error:', error);
          return new Response(JSON.stringify({
            error: 'ClickUp Test Failed',
            message: error instanceof Error ? error.message : 'Unknown ClickUp test error',
            timestamp: new Date().toISOString()
          }), {
            status: 500,
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
          
          const results: any = {
            action: body.action,
            timestamp: new Date().toISOString()
          };
          
          switch (body.action) {
            case 'send_message':
              if (!body.channel || !body.message) {
                return new Response(JSON.stringify({
                  error: 'Missing Parameters',
                  message: 'channel and message are required for send_message action',
                  required_params: ['channel', 'message'],
                  timestamp: new Date().toISOString()
                }), {
                  status: 400,
                  headers: corsHeaders
                });
              }
              
              await slackService.sendMessage({
                channel: body.channel,
                text: body.message
              });
              
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
              
              const isValid = await slackService.verifyRequest(testBody, testTimestamp, testSignature);
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
                error: 'Invalid Action',
                message: 'action must be one of: send_message, test_auth, verify_webhook',
                available_actions: ['send_message', 'test_auth', 'verify_webhook'],
                timestamp: new Date().toISOString()
              }), {
                status: 400,
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
            status: 200,
            headers: corsHeaders
          });
          
        } catch (error) {
          console.error('❌ Slack test error:', error);
          return new Response(JSON.stringify({
            error: 'Slack Test Failed',
            message: error instanceof Error ? error.message : 'Unknown Slack test error',
            timestamp: new Date().toISOString()
          }), {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      // Route: Not found
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Endpoint ${method} ${url.pathname} not found`,
        available_endpoints: [
          'GET  / - Health check',
          'GET  /test - Environment test',
          'POST /zendesk-webhook - Zendesk webhook endpoint',
          'POST /clickup-webhook - ClickUp webhook endpoint',
          'POST /slack/events - Slack events endpoint',
          'POST /slack/commands - Slack slash commands',
          'POST /test-ai - Test AI summarization',
          'POST /test-zendesk-ai - Test Zendesk + AI integration',
          'POST /test-clickup - Test ClickUp integration',
          'POST /test-slack - Test Slack integration'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('❌ Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};