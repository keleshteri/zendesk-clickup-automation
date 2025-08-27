/**
 * @ai-metadata
 * @component: DIMiddleware
 * @description: Dependency injection middleware for service initialization and management
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/di-middleware.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "../services/*"]
 * @tests: ["./tests/middleware/di.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Service initialization and dependency injection for Hono application"
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

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

// Service imports (these will need to be created/imported from existing services)
import { ZendeskService } from '../services/integrations/zendesk/api/service';
import { ClickUpService } from '../services/integrations/clickup/api/service';
import { SlackService } from '../services/integrations/slack';
import { AIService } from '../services/ai/ai-service';
import { OAuthService } from '../services/integrations/clickup/oauth/oauth.service';


/**
 * Service container interface
 */
export interface Services {
  zendesk?: ZendeskService;
  clickup?: ClickUpService;
  slack?: SlackService;
  ai?: AIService;
  oauth?: OAuthService;
  
}

/**
 * Extended context with services
 */
declare module 'hono' {
  interface ContextVariableMap {
    services: Services;
  }
}

/**
 * Service initialization cache
 */
const serviceCache = new Map<string, Services>();

/**
 * Create cache key from environment variables
 */
function createCacheKey(env: Env): string {
  const keys = [
    env.SLACK_BOT_TOKEN,
    env.ZENDESK_DOMAIN || env.ZENDESK_SUBDOMAIN,
    env.CLICKUP_API_TOKEN,
    env.OPENAI_API_KEY,
    env.GOOGLE_GEMINI_API_KEY
  ].filter(Boolean);
  
  return keys.join('|');
}

/**
 * Initialize services based on available environment variables
 */
async function initializeServices(env: Env): Promise<Services> {
  const cacheKey = createCacheKey(env);
  
  // Check cache first
  if (serviceCache.has(cacheKey)) {
    return serviceCache.get(cacheKey)!;
  }

  const services: Services = {};

  try {
    // Initialize AI service first (required by other services)
    if (env.OPENAI_API_KEY || env.GOOGLE_GEMINI_API_KEY) {
      services.ai = new AIService(env);
    }

    // Initialize Slack service
    if (env.SLACK_BOT_TOKEN && env.SLACK_SIGNING_SECRET) {
      services.slack = new SlackService(env);
    }

    // Initialize Zendesk service (check both ZENDESK_DOMAIN and ZENDESK_SUBDOMAIN)
    if ((env.ZENDESK_DOMAIN || env.ZENDESK_SUBDOMAIN) && env.ZENDESK_EMAIL && (env.ZENDESK_API_TOKEN || env.ZENDESK_TOKEN)) {
      services.zendesk = new ZendeskService(env);
    }

    // Initialize ClickUp service (requires AI service)
    if (env.CLICKUP_API_TOKEN && services.ai) {
      services.clickup = new ClickUpService(env, services.ai);
    }

    // Initialize OAuth service
    if (env.CLICKUP_CLIENT_ID && env.CLICKUP_CLIENT_SECRET) {
      services.oauth = new OAuthService(env);
    }


    

    // Cache the initialized services
    serviceCache.set(cacheKey, services);

    return services;
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw new Error(`Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Dependency injection middleware
 * Initializes and injects services into the Hono context
 */
export const diMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  try {
    // Initialize services based on environment
    const services = await initializeServices(c.env);
    
    // Inject services into context
    c.set('services', services);
    
    // Continue to next middleware/handler
    await next();
  } catch (error) {
    console.error('DI Middleware Error:', error);
    
    // Set empty services object to prevent crashes
    c.set('services', {});
    
    // Continue with empty services (individual routes should handle missing services)
    await next();
  }
};

/**
 * Helper function to get a specific service from context
 */
export function getService<T extends keyof Services>(c: any, serviceName: T): Services[T] | undefined {
  const services = c.get('services') as Services;
  return services[serviceName];
}

/**
 * Helper function to check if a service is available
 */
export function hasService(c: any, serviceName: keyof Services): boolean {
  const services = c.get('services') as Services;
  return !!services[serviceName];
}

/**
 * Helper function to require a service (throws if not available)
 */
export function requireService<T extends keyof Services>(c: any, serviceName: T): NonNullable<Services[T]> {
  const service = getService(c, serviceName);
  if (!service) {
    throw new Error(`Required service '${String(serviceName)}' is not available`);
  }
  return service as NonNullable<Services[T]>;
}

/**
 * Clear service cache (useful for testing or configuration changes)
 */
export function clearServiceCache(): void {
  serviceCache.clear();
}

/**
 * Get service cache statistics
 */
export function getServiceCacheStats(): { size: number; keys: string[] } {
  return {
    size: serviceCache.size,
    keys: Array.from(serviceCache.keys())
  };
}