/**
 * @ai-metadata
 * @component: ZendeskRoutes
 * @description: Zendesk integration routes including webhook handling and API operations
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-routes.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "../middleware/error.ts", "../middleware/cors.ts"]
 * @tests: ["./tests/routes/zendesk.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Zendesk integration endpoints for webhook processing and API operations"
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

import { Hono } from "hono";
import type { Env } from "../types/env";
import type { ZendeskTicket } from "../types";
import { webhookCORSMiddleware } from "../middleware/cors";
import {
  handleAsync,
  requireService,
  validateRequired,
  AuthenticationError,
  ValidationError,
} from "../middleware/error";

import { ZendeskWebhookInterface } from "../services/integrations/zendesk";

// Webhook payload types are now imported from the webhook interface

/**
 * Create Zendesk routes
 */
export const zendeskRoutes = new Hono<{ Bindings: Env }>();

// Apply CORS middleware to all endpoints
zendeskRoutes.use("*", webhookCORSMiddleware);

/**
 * Zendesk webhook endpoint
 * POST /zendesk/webhook
 *
 * Processes incoming Zendesk webhooks and creates corresponding ClickUp tasks
 * with AI analysis and intelligent routing.
 */
zendeskRoutes.post("/webhook", async (c) => {
  return handleAsync(async () => {
    const services = c.get("services");

    // Verify required services
    requireService(services.zendesk, "Zendesk");
    
    // Get request headers and body
    const signature = c.req.header("X-Zendesk-Webhook-Signature");
    const timestamp = c.req.header("X-Zendesk-Webhook-Signature-Timestamp");
    const body = await c.req.text();

    // Initialize webhook interface
    const webhookInterface = new ZendeskWebhookInterface(c.env);

    // Process the webhook
    return await webhookInterface.handleWebhook(c);
  }, "Zendesk webhook processing failed");
});

/**
 * Zendesk credential validation endpoint
 * GET /zendesk/validate
 *
 * Validates Zendesk API credentials and returns validation status
 */
zendeskRoutes.get("/validate", async (c) => {
  return handleAsync(async () => {
    const env = c.env;
    const isValid = !!(env.ZENDESK_SUBDOMAIN && env.ZENDESK_EMAIL && env.ZENDESK_API_TOKEN);
    
    const missing = [];
    if (!env.ZENDESK_SUBDOMAIN) missing.push('ZENDESK_SUBDOMAIN');
    if (!env.ZENDESK_EMAIL) missing.push('ZENDESK_EMAIL');
    if (!env.ZENDESK_API_TOKEN) missing.push('ZENDESK_API_TOKEN');
    
    return c.json({
      status: isValid ? 'success' : 'error',
      message: isValid ? 'Zendesk credentials validated successfully' : 'Zendesk credentials validation failed',
      validation: {
        service: 'zendesk',
        isValid,
        lastValidated: new Date().toISOString(),
        errors: missing.length > 0 ? [`Missing required environment variables: ${missing.join(', ')}`] : []
      },
      timestamp: new Date().toISOString()
    }, isValid ? 200 : 400);
  }, "Zendesk credential validation failed");
});
