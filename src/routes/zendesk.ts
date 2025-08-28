/**
 * @ai-metadata
 * @component: ZendeskRoutes
 * @description: Zendesk integration routes with comprehensive validation, webhook handling and API operations
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/zendesk-routes.md
 * @stability: stable
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
import { webhookCORSMiddleware } from "../middleware/cors";
import {
  handleAsync,
  requireService,
} from "../middleware/error";

import { ZendeskWebhook } from "../services/integrations/zendesk/webhooks/zendesk-webhook";

// Webhook payload types are now imported from the webhook 

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
    requireService(services.clickup, "ClickUp");
    
    
    // Initialize webhook interface with context for Service Locator pattern
    const webhookInterface = new ZendeskWebhook(c.env, c);

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
    
    // Check for ZENDESK_SUBDOMAIN (preferred) or ZENDESK_DOMAIN (backward compatibility)
    const zendeskSubdomain = env.ZENDESK_SUBDOMAIN || env.ZENDESK_DOMAIN;
    
    const missing = [];
    const errors = [];
    const warnings = [];
    
    // Validate required environment variables
    if (!zendeskSubdomain) {
      missing.push('ZENDESK_SUBDOMAIN (or ZENDESK_DOMAIN for backward compatibility)');
    } else {
      // Validate subdomain format (alphanumeric, hyphens, no spaces)
      const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
      if (!subdomainRegex.test(zendeskSubdomain)) {
        errors.push('ZENDESK_SUBDOMAIN must be a valid subdomain (alphanumeric characters and hyphens only)');
      }
    }
    
    if (!env.ZENDESK_EMAIL) {
      missing.push('ZENDESK_EMAIL');
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(env.ZENDESK_EMAIL)) {
        errors.push('ZENDESK_EMAIL must be a valid email address');
      }
    }
    
    if (!env.ZENDESK_TOKEN) {
      missing.push('ZENDESK_TOKEN');
    } else {
      // Validate token format (should be non-empty and reasonable length)
      if (env.ZENDESK_TOKEN.length < 10) {
        errors.push('ZENDESK_TOKEN appears to be too short (minimum 10 characters expected)');
      }
    }
    
    // Warn about deprecated ZENDESK_DOMAIN usage
    if (env.ZENDESK_DOMAIN && !env.ZENDESK_SUBDOMAIN) {
      warnings.push('ZENDESK_DOMAIN is deprecated. Please use ZENDESK_SUBDOMAIN instead.');
    }
    
    // Check for optional but recommended variables
    if (!env.ZENDESK_WEBHOOK_SECRET) {
      warnings.push('ZENDESK_WEBHOOK_SECRET is not set. Webhook signature verification will be disabled.');
    }
    
    const allErrors = [...missing.map(m => `Missing required environment variable: ${m}`), ...errors];
    const isValid = allErrors.length === 0;
    
    return c.json({
      status: isValid ? 'success' : 'error',
      message: isValid ? 'Zendesk credentials validated successfully' : 'Zendesk credentials validation failed',
      validation: {
        service: 'zendesk',
        isValid,
        lastValidated: new Date().toISOString(),
        errors: allErrors,
        warnings: warnings,
        checkedVariables: {
          ZENDESK_SUBDOMAIN: !!env.ZENDESK_SUBDOMAIN,
          ZENDESK_DOMAIN: !!env.ZENDESK_DOMAIN,
          ZENDESK_EMAIL: !!env.ZENDESK_EMAIL,
          ZENDESK_TOKEN: !!env.ZENDESK_TOKEN,
          ZENDESK_WEBHOOK_SECRET: !!env.ZENDESK_WEBHOOK_SECRET
        }
      },
      timestamp: new Date().toISOString()
    }, isValid ? 200 : 400);
  }, "Zendesk credential validation failed");
});
