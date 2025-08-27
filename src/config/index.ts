/**
 * @ai-metadata
 * @component: ConfigIndex
 * @description: Main configuration exports for the application
 * @last-update: 2024-01-27
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Central configuration exports for simplified Zendesk-ClickUp automation"
 */

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Logging configuration
export const LOG_CONFIG = {
  LEVEL: 'info',
  FORMAT: 'json',
  TIMESTAMP: true,
  REQUEST_ID: true,
  PREFIXES: {
    SLACK: '[SLACK]',
    ZENDESK: '[ZENDESK]',
    CLICKUP: '[CLICKUP]',
    AI: '[AI]',
    WEBHOOK: '[WEBHOOK]',
    ERROR: '[ERROR]'
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Invalid request format',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  UNAUTHORIZED: 'Unauthorized access',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  INTERNAL_ERROR: 'Internal server error',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_WEBHOOK_SIGNATURE: 'Invalid webhook signature'
} as const;

// Slack configuration defaults
export const SLACK_DEFAULTS = {
  BOT_NAME: 'ZendeskBot',
  CHANNEL: '#general',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
} as const;

// ClickUp configuration defaults
export const CLICKUP_DEFAULTS = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  DEFAULT_STATUS: 'Open'
} as const;

// Zendesk configuration defaults
export const ZENDESK_DEFAULTS = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  WEBHOOK_TIMEOUT: 10000
} as const;

// AI service defaults
export const AI_DEFAULTS = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000
} as const;