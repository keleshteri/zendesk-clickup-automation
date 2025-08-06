interface Env {
  ZENDESK_DOMAIN: string;
  ZENDESK_EMAIL: string;
  ZENDESK_TOKEN: string;
  CLICKUP_TOKEN: string;
  CLICKUP_LIST_ID: string;
  TASK_MAPPING?: KVNamespace;
}

interface ZendeskTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignee_id?: string;
  requester_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ZendeskWebhook {
  type: string;
  detail?: ZendeskTicket;
  account_id?: number;
  subject?: string;
  time?: string;
  zendesk_event_version?: string;
}

interface ClickUpWebhook {
  event: string;
  task_id: string;
  webhook_id: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

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
          message: 'Zendesk-ClickUp Automation Worker is running! 🚀',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          language: 'TypeScript',
          endpoints: [
            'GET  / - Health check',
            'GET  /test - Environment test',
            'POST /zendesk-webhook - Zendesk webhook endpoint',
            'POST /clickup-webhook - ClickUp webhook endpoint'
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
          message: 'Environment test',
          environment: {
            zendesk_domain: env.ZENDESK_DOMAIN ? '✅ configured' : '❌ missing',
            zendesk_email: env.ZENDESK_EMAIL ? '✅ configured' : '❌ missing',
            zendesk_token: env.ZENDESK_TOKEN ? '✅ configured' : '❌ missing',
            clickup_token: env.CLICKUP_TOKEN ? '✅ configured' : '❌ missing',
            clickup_list_id: env.CLICKUP_LIST_ID ? '✅ configured' : '❌ missing',
            kv_storage: env.TASK_MAPPING ? '✅ available' : '❌ missing'
          },
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Route: Zendesk webhook - Create ClickUp task when ticket is created
      if (url.pathname === '/zendesk-webhook' && method === 'POST') {
        const data: ZendeskWebhook = await request.json();
        
        console.log('📧 Zendesk webhook received:', {
          type: data.type,
          ticket_id: data.detail?.id,
          subject: data.detail?.subject
        });

        // Only process ticket creation events
        if ((data.type === 'zen:event-type:ticket.created' || data.type === 'ticket.created') && data.detail) {
          try {
            // Validate required environment variables
            if (!env.CLICKUP_TOKEN || !env.CLICKUP_LIST_ID) {
              throw new Error('Missing ClickUp configuration (CLICKUP_TOKEN or CLICKUP_LIST_ID)');
            }

            // Map Zendesk priority to ClickUp priority
            const priorityMapping: Record<string, number> = {
              'LOW': 4,
              'NORMAL': 3,
              'HIGH': 2,
              'URGENT': 1
            };
            const clickupPriority = priorityMapping[data.detail.priority] || 3;

            // Create ClickUp task
            const taskPayload = {
              name: `[Zendesk #${data.detail.id}] ${data.detail.subject}`,
              description: `**Zendesk Ticket ID:** ${data.detail.id}\n\n**Description:**\n${data.detail.description}\n\n**Status:** ${data.detail.status}\n**Priority:** ${data.detail.priority}`,
              priority: clickupPriority,
              status: 'Open',
              tags: ['zendesk', `ticket-${data.detail.id}`, ...(data.detail.tags || [])]
            };

            const clickupResponse = await fetch(`https://api.clickup.com/api/v2/list/${env.CLICKUP_LIST_ID}/task`, {
              method: 'POST',
              headers: {
                'Authorization': env.CLICKUP_TOKEN,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(taskPayload)
            });

            if (!clickupResponse.ok) {
              const errorText = await clickupResponse.text();
              throw new Error(`ClickUp API error: ${clickupResponse.status} - ${errorText}`);
            }

            const clickupTask = await clickupResponse.json() as {
              id: string;
              url?: string;
              name: string;
              status: { status: string };
            };
            console.log('✅ ClickUp task created:', clickupTask.id);

            // Store mapping in KV if available
            if (env.TASK_MAPPING) {
              const mappingKey = `zendesk_${data.detail.id}`;
              const mappingValue = {
                zendesk_ticket_id: data.detail.id,
                clickup_task_id: clickupTask.id,
                created_at: new Date().toISOString(),
                status: 'active'
              };
              await env.TASK_MAPPING.put(mappingKey, JSON.stringify(mappingValue));
              console.log('💾 Task mapping stored:', mappingKey);
            }

            return new Response(JSON.stringify({
              status: 'processed',
              message: 'Zendesk ticket successfully converted to ClickUp task',
              data: {
                zendesk_ticket_id: data.detail.id,
                zendesk_subject: data.detail.subject,
                clickup_task_id: clickupTask.id,
                clickup_task_url: clickupTask.url || `https://app.clickup.com/t/${clickupTask.id}`,
                event_type: data.type
              },
              timestamp: new Date().toISOString()
            }), {
              status: 200,
              headers: corsHeaders
            });

          } catch (error) {
            console.error('❌ Error creating ClickUp task:', error);
            
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Failed to create ClickUp task',
              error: error instanceof Error ? error.message : 'Unknown error',
              data: {
                zendesk_ticket_id: data.detail?.id,
                event_type: data.type
              },
              timestamp: new Date().toISOString()
            }), {
              status: 500,
              headers: corsHeaders
            });
          }
        } else {
          // For non-creation events, just acknowledge
          return new Response(JSON.stringify({
            status: 'received',
            message: `Zendesk webhook received but not processed (event: ${data.type})`,
            data: {
              ticket_id: data.detail?.id || 'unknown',
              event_type: data.type || 'unknown',
              subject: data.detail?.subject || 'no subject'
            },
            timestamp: new Date().toISOString()
          }), {
            status: 200,
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

      // Route: Not found
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Endpoint ${method} ${url.pathname} not found`,
        available_endpoints: [
          'GET  /',
          'GET  /test',
          'POST /zendesk-webhook',
          'POST /clickup-webhook'
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