/**
 * @type: routes
 * @domain: slack
 * @purpose: Slack health check and webhook routes for Cloudflare Workers
 * @framework: Hono
 * @validation: Zod
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { DIContext } from '../di/container';
import type { Env } from '../di/dependencies';
import { SlackService } from '../../domains/slack/services/slack.service';
import { eventDeduplicationService } from '../../domains/slack/services/event-deduplication.service';
import type { SlackCommand } from '../../domains/slack/types/slack.types';

// Validation schemas
const TestMessageSchema = z.object({
  channel: z.string().min(1, 'Channel is required'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  threadTs: z.string().optional()
});

type TestMessageRequest = z.infer<typeof TestMessageSchema>;

// Create Slack routes app
const slackRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /slack/health
 * Check Slack webhook health and configuration for Cloudflare Workers
 */
slackRoutes.get('/health', async (c: DIContext) => {
  try {
    // For Cloudflare Workers, we check if environment variables are set
    const hasToken = !!c.env.SLACK_BOT_TOKEN;
    const hasSecret = !!c.env.SLACK_SIGNING_SECRET;
    
    const deduplicationStats = eventDeduplicationService.getCacheStats();
    
    return c.json({
      status: hasToken && hasSecret ? 'healthy' : 'misconfigured',
      service: 'cloudflare-slack',
      config: {
        hasToken,
        hasSecret,
        mode: 'webhook' // HTTP webhooks instead of Socket Mode
      },
      deduplication: {
        cacheSize: deduplicationStats.size,
        maxCacheSize: deduplicationStats.maxSize,
        ttlMinutes: Math.round(deduplicationStats.ttlMs / 60000)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * POST /slack/events
 * Handle Slack events via webhook
 */
slackRoutes.post('/events', async (c: DIContext) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('x-slack-signature');
    const timestamp = c.req.header('x-slack-request-timestamp');
    
    if (!signature || !timestamp) {
      return c.json({ error: 'Missing Slack headers' }, 400);
    }

    const botToken = c.env.SLACK_BOT_TOKEN;
    const signingSecret = c.env.SLACK_SIGNING_SECRET;
    
    if (!botToken || !signingSecret) {
      return c.json({ error: 'Missing Slack configuration' }, 500);
    }
    
    const slackService = new SlackService({
      botToken,
      signingSecret,
    });

    // Verify request signature
    const isValid = slackService.verifySignature(body, signature, timestamp);
    if (!isValid) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const event = JSON.parse(body);
    
    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      return c.text(event.challenge);
    }

    // Handle events
    if (event.type === 'event_callback') {
      const slackEvent = event.event;
      const eventTs = event.event_ts || slackEvent.ts;
      
      // Log incoming event with timestamp
      console.log(`[${new Date().toISOString()}] Received Slack event:`, {
        type: slackEvent.type,
        user: slackEvent.user,
        channel: slackEvent.channel,
        ts: slackEvent.ts,
        event_ts: eventTs,
        dateTime: new Date(eventTs * 1000).toISOString()
      });
      
      // Check for duplicate events
      if (eventDeduplicationService.isDuplicate(slackEvent, eventTs)) {
        console.log(`[${new Date().toISOString()}] Duplicate event detected, skipping:`, {
          type: slackEvent.type,
          ts: slackEvent.ts,
          event_ts: eventTs
        });
        return c.json({ status: 'duplicate_ignored' });
      }
      
      // Mark event as processed before processing
      eventDeduplicationService.markAsProcessed(slackEvent, eventTs);
      
      // Process the event
      await slackService.processEvent(slackEvent);
      
      console.log(`[${new Date().toISOString()}] Successfully processed event:`, {
        type: slackEvent.type,
        ts: slackEvent.ts
      });
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('Slack event error:', error);
    return c.json({
      error: 'Event processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /slack/interactions
 * Handle Slack interactive components (buttons, modals, etc.)
 */
slackRoutes.post('/interactions', async (c: DIContext) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('x-slack-signature');
    const timestamp = c.req.header('x-slack-request-timestamp');
    
    if (!signature || !timestamp) {
      return c.json({ error: 'Missing Slack headers' }, 400);
    }

    const botToken = c.env.SLACK_BOT_TOKEN;
    const signingSecret = c.env.SLACK_SIGNING_SECRET;
    
    if (!botToken || !signingSecret) {
      return c.json({ error: 'Missing Slack configuration' }, 500);
    }
    
    const slackService = new SlackService({
      botToken,
      signingSecret,
    });

    // Verify request signature
    const isValid = slackService.verifySignature(body, signature, timestamp);
    if (!isValid) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Parse URL-encoded payload
    const payload = new URLSearchParams(body).get('payload');
    if (!payload) {
      return c.json({ error: 'Missing payload' }, 400);
    }

    const interaction = JSON.parse(payload);
    await slackService.handleInteraction(interaction);

    return c.json({ ok: true });
  } catch (error) {
    console.error('Slack interaction error:', error);
    return c.json({
      error: 'Interaction processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /slack/commands
 * Handle Slack slash commands
 */
slackRoutes.post('/commands', async (c: DIContext) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('x-slack-signature');
    const timestamp = c.req.header('x-slack-request-timestamp');
    
    if (!signature || !timestamp) {
      return c.json({ error: 'Missing Slack headers' }, 400);
    }

    const botToken = c.env.SLACK_BOT_TOKEN;
    const signingSecret = c.env.SLACK_SIGNING_SECRET;
    
    if (!botToken || !signingSecret) {
      return c.json({ error: 'Missing Slack configuration' }, 500);
    }
    
    const slackService = new SlackService({
      botToken,
      signingSecret,
    });

    // Verify request signature
    const isValid = slackService.verifySignature(body, signature, timestamp);
    if (!isValid) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Parse command data
     const command = Object.fromEntries(new URLSearchParams(body));
     const response = await slackService.handleSlashCommand(command as SlackCommand);

    return c.json(response);
  } catch (error) {
    console.error('Slack command error:', error);
    return c.json({
      text: 'Sorry, there was an error processing your command.',
      response_type: 'ephemeral'
    });
  }
});

export { slackRoutes };