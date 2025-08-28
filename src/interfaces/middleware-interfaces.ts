/**
 * @ai-metadata
 * @component: MiddlewareInterfaces
 * @description: Interface definitions for middleware components
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/middleware-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Centralized interface definitions for middleware components including CORS, error handling, DI, and credential validation"
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

import { Env } from '../types/env';

// CORS Configuration Interface
export interface CORSConfig {
  origin: string | string[] | ((origin: string, c?: any) => string);
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Error Response Interface
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Services Interface for Dependency Injection
export interface Services {
  // Add service definitions here as they are identified
  [key: string]: any;
}

// Credential Validation Interfaces
export interface CredentialValidationResult {
  isValid: boolean;
  service: string;
  errors: string[];
  warnings?: string[];
  lastValidated?: Date;
  authType?: string; // For ClickUp OAuth vs API token
}

export interface ZendeskCredentialValidationResult extends CredentialValidationResult {
  service: 'zendesk';
  subdomain?: string;
  email?: string;
  hasApiToken?: boolean;
}

export interface ClickUpCredentialValidationResult extends CredentialValidationResult {
  service: 'clickup';
  teamId?: string;
  userId?: string;
  authType: 'oauth' | 'api_token';
}

export interface ServiceCredentials {
  zendesk: {
    validation: (env: Env) => Promise<ZendeskCredentialValidationResult>;
  };
  clickup: {
    validation: (env: Env) => Promise<ClickUpCredentialValidationResult>;
  };
}

// Health Check Interfaces (from routes/health.ts)
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
  services?: ServiceStatus[];
  checks?: HealthCheck[];
  circuitBreakers?: Record<string, CircuitBreakerHealth>;
}

export interface CircuitBreakerHealth {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureRate: string;
  totalRequests: number;
  lastFailure?: string;
  lastSuccess?: string;
  uptime: number;
  nextAttempt?: string;
}

export interface ServiceStatus {
  name: string;
  status: 'available' | 'unavailable' | 'degraded';
  configured: boolean;
  lastCheck?: string;
  responseTime?: number;
  error?: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  output?: string;
  error?: string;
}

// Route-specific Interfaces
export interface ClickUpWebhookPayload {
  event: string;
  task_id?: string;
  history_items?: Array<{
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: any;
    source: string;
    user: {
      id: number;
      username: string;
      email: string;
      color: string;
      initials: string;
      profilePicture: string;
    };
    before?: any;
    after?: any;
  }>;
  webhook_id: string;
}

export interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    type: string;
    channel: string;
    user: string;
    text: string;
    ts: string;
    event_ts: string;
    channel_type: string;
    bot_id?: string;
  };
  type: string;
  event_id: string;
  event_time: number;
  authorizations?: Array<{
    enterprise_id: string | null;
    team_id: string;
    user_id: string;
    is_bot: boolean;
    is_enterprise_install: boolean;
  }>;
  is_ext_shared_channel: boolean;
  event_context: string;
}

export interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id: string;
}