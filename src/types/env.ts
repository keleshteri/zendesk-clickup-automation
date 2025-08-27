/**
 * @ai-metadata
 * @component: Environment Types
 * @description: TypeScript type definitions for Cloudflare Workers environment variables
 * @last-update: 2025-01-16
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines the Env interface for Cloudflare Workers environment variables used throughout the application"
 */

/**
 * Environment variables interface for Cloudflare Workers
 * Defines all required and optional environment variables used by the application
 */
export interface Env {
  // Zendesk Configuration
  ZENDESK_DOMAIN: string;
  ZENDESK_SUBDOMAIN?: string;
  ZENDESK_EMAIL: string;
  ZENDESK_TOKEN: string;
  ZENDESK_WEBHOOK_SECRET?: string;
  ZENDESK_API_TOKEN?: string;

  // ClickUp Configuration
  CLICKUP_API_TOKEN?: string;
  CLICKUP_WEBHOOK_SECRET?: string;
  CLICKUP_CLIENT_ID: string;
  CLICKUP_CLIENT_SECRET: string;
  CLICKUP_REDIRECT_URI: string;
  CLICKUP_TEAM_ID?: string;
  CLICKUP_SPACE_ID?: string;
  CLICKUP_LIST_ID: string;

  // Slack Configuration
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_VERIFICATION_TOKEN?: string;
  SLACK_APP_TOKEN?: string;
  SLACK_CLIENT_ID?: string;
  SLACK_CLIENT_SECRET?: string;
  SLACK_NOTIFICATION_CHANNEL?: string;

  // AI Configuration
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;
  OPENAI_MODEL?: string;
  OPENAI_MAX_TOKENS?: string;

  AI_PROVIDER: 'googlegemini' | 'openai' | 'openrouter';

  // OAuth Configuration
  OAUTH_STATE_SECRET?: string;
  JWT_SECRET?: string;

  // Application Configuration
  ENVIRONMENT?: string;
  NODE_ENV?: string;
  APP_VERSION?: string;
  LOG_LEVEL?: string;
  CORS_ORIGINS?: string;
  API_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;

  // Cloudflare Workers specific
  __STATIC_CONTENT_MANIFEST?: string;

  // KV Namespaces (if using Cloudflare KV)
  OAUTH_STORAGE?: KVNamespace;
  CACHE_STORAGE?: KVNamespace;
  SESSION_STORAGE?: KVNamespace;
  OAUTH_KV?: KVNamespace;

  // D1 Database (if using Cloudflare D1)
  DB?: D1Database;

  // R2 Storage (if using Cloudflare R2)
  STORAGE?: R2Bucket;

  // Durable Objects (if using)
  WORKFLOW_ORCHESTRATOR?: DurableObjectNamespace;


  // Rate Limiting
  RATE_LIMIT_REQUESTS?: string;
  RATE_LIMIT_WINDOW?: string;

  // Security
  ENCRYPTION_KEY?: string;
  WEBHOOK_TIMEOUT?: string;
  MAX_PAYLOAD_SIZE?: string;

  // Feature Flags
  ENABLE_MULTI_AGENT?: string;
  ENABLE_TASK_GENIE?: string;
  ENABLE_AUTOMATION?: string;
  ENABLE_ANALYTICS?: string;

  // Monitoring
  SENTRY_DSN?: string;
  DATADOG_API_KEY?: string;
  METRICS_ENDPOINT?: string;
}

/**
 * Context variables that can be set during request processing
 */
export interface ContextVariableMap {
  services: Services;
  requestId: string;
  startTime: number;
  metrics: {
    headers: string[];
    timers: Map<string, Timer>;
  };
}

/**
 * Services container interface
 */
export interface Services {
  zendesk?: any;
  clickup?: any;
  slack?: any;
  ai?: any;
  oauth?: any;
  automation?: any;

  multiAgent?: any;
}

/**
 * Timer interface for performance metrics
 */
export interface Timer {
  start: number;
  end?: number;
  duration?: number;
}

/**
 * Request context type combining Hono context with our custom variables
 */
export type AppContext = {
  Bindings: Env;
  Variables: ContextVariableMap;
};