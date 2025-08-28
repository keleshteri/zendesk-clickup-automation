/**
 * @ai-metadata
 * @component: EndpointCategories
 * @description: Default endpoint categories and registry for API documentation
 * @last-update: 2025-01-27
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/endpoint-categories.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./route-interfaces.ts"]
 * @tests: ["./tests/interfaces/endpoint-categories.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Predefined endpoint categories and registry for consistent API documentation"
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

import type { EndpointCategory, EndpointInfo } from './route-interfaces';

/**
 * Default endpoint categories
 */
export const DEFAULT_CATEGORIES: Record<string, EndpointCategory> = {
  health: {
    name: 'Health & Status',
    description: 'System health monitoring and status endpoints',
    icon: '🏥',
    order: 1
  },
  slack: {
    name: 'Slack Integration',
    description: 'Slack API endpoints for events, commands, and socket mode',
    icon: '💬',
    order: 2
  },
  clickup: {
    name: 'ClickUp Integration',
    description: 'ClickUp API endpoints for tasks, OAuth, and webhooks',
    icon: '📋',
    order: 3
  },
  zendesk: {
    name: 'Zendesk Integration',
    description: 'Zendesk API endpoints for tickets and webhooks',
    icon: '🎫',
    order: 4
  },
  test: {
    name: 'Test Endpoints',
    description: 'Development and testing endpoints',
    icon: '🧪',
    order: 5
  },
  docs: {
    name: 'Documentation',
    description: 'API documentation and schema endpoints',
    icon: '📚',
    order: 6
  }
};

/**
 * Predefined endpoint registry
 * This serves as a fallback and documentation source for endpoints
 */
export const ENDPOINT_REGISTRY: EndpointInfo[] = [
  // Health & Status
  {
    method: 'GET',
    path: '/health',
    description: 'Basic health check with service availability',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/health/detailed',
    description: 'Detailed health check with service testing',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/health/ready',
    description: 'Readiness probe for container orchestration',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/health/live',
    description: 'Liveness probe for container orchestration',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/health/circuit-breakers',
    description: 'Circuit breaker status and statistics',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/health/credentials',
    description: 'Credential validation status',
    category: 'health',
    authentication: 'none',
    cors: 'public'
  },

  // Slack Integration
  {
    method: 'POST',
    path: '/slack/events',
    description: 'Slack Events API webhook endpoint',
    category: 'slack',
    authentication: 'webhook',
    cors: 'webhook'
  },
  {
    method: 'POST',
    path: '/slack/commands',
    description: 'Slack slash commands endpoint',
    category: 'slack',
    authentication: 'webhook',
    cors: 'webhook'
  },
  {
    method: 'POST',
    path: '/slack/interactive',
    description: 'Slack interactive components endpoint',
    category: 'slack',
    authentication: 'webhook',
    cors: 'webhook'
  },
  {
    method: 'GET',
    path: '/slack/oauth',
    description: 'Slack OAuth callback endpoint',
    category: 'slack',
    authentication: 'none',
    cors: 'public'
  },

  // ClickUp Integration
  {
    method: 'POST',
    path: '/clickup/webhook',
    description: 'ClickUp webhook endpoint for task updates',
    category: 'clickup',
    authentication: 'webhook',
    cors: 'webhook'
  },
  {
    method: 'GET',
    path: '/clickup/oauth',
    description: 'ClickUp OAuth callback endpoint',
    category: 'clickup',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/clickup/tasks',
    description: 'Get ClickUp tasks with filtering',
    category: 'clickup',
    authentication: 'bearer',
    cors: 'restricted'
  },
  {
    method: 'POST',
    path: '/clickup/tasks',
    description: 'Create new ClickUp task',
    category: 'clickup',
    authentication: 'bearer',
    cors: 'restricted'
  },

  // Zendesk Integration
  {
    method: 'POST',
    path: '/zendesk/webhook',
    description: 'Zendesk webhook endpoint for ticket updates',
    category: 'zendesk',
    authentication: 'webhook',
    cors: 'webhook'
  },
  {
    method: 'GET',
    path: '/zendesk/tickets',
    description: 'Get Zendesk tickets with filtering',
    category: 'zendesk',
    authentication: 'bearer',
    cors: 'restricted'
  },
  {
    method: 'POST',
    path: '/zendesk/tickets',
    description: 'Create new Zendesk ticket',
    category: 'zendesk',
    authentication: 'bearer',
    cors: 'restricted'
  },

  // Documentation
  {
    method: 'GET',
    path: '/',
    description: 'API documentation and endpoint discovery',
    category: 'docs',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/docs',
    description: 'Interactive API documentation',
    category: 'docs',
    authentication: 'none',
    cors: 'public'
  },
  {
    method: 'GET',
    path: '/docs/openapi',
    description: 'OpenAPI specification',
    category: 'docs',
    authentication: 'none',
    cors: 'public'
  }
];