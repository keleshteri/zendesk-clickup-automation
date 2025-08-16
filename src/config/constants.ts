/**
 * Application Constants
 * Centralized configuration constants to eliminate magic numbers and strings
 */

// Slack Configuration
export const SLACK_DEFAULTS = {
  CHANNEL: '#zendesk-clickup-automation',
  USER_ID: 'default',
  USER_NAME: 'Steve',
  BOT_NAME: 'TaskGenie',
  ICON_EMOJI: ':robot_face:',
  THREAD_TIMEOUT: 30000, // 30 seconds
  THREAD_REPLY_DELAY: 1000,
  MAX_MESSAGE_LENGTH: 3000,
  RETRY_ATTEMPTS: 3
} as const;

// ClickUp Configuration
export const CLICKUP_DEFAULTS = {
  PRIORITY_NORMAL: 3,
  PRIORITY_HIGH: 2,
  PRIORITY_URGENT: 1,
  PRIORITY_LOW: 4,
  DEFAULT_STATUS: 'Open',
  TASK_DESCRIPTION_MAX_LENGTH: 8000
} as const;

// Zendesk Configuration
export const ZENDESK_DEFAULTS = {
  DEFAULT_STATUS: 'new',
  PRIORITY_NORMAL: 'normal',
  TICKET_FETCH_LIMIT: 100,
  API_RATE_LIMIT_DELAY: 1000 // 1 second
} as const;

// AI Service Configuration
export const AI_DEFAULTS = {
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  MODEL_NAME: 'gemini-1.5-pro',
  ANALYSIS_TIMEOUT: 30000,
  MAX_RETRIES: 3
} as const;

// Agent Configuration
export const AGENT_DEFAULTS = {
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_PROCESSING_TIME: 60000, // 1 minute
  DEFAULT_AGENT: 'SOFTWARE_ENGINEER',
  MAX_RECOMMENDATIONS: 5
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_ENV_VAR: 'Required environment variable is missing',
  API_REQUEST_FAILED: 'API request failed',
  INVALID_TICKET_DATA: 'Invalid ticket data provided',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_REQUEST: 'Invalid request format',
  RATE_LIMITED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  WEBHOOK_PROCESSING_FAILED: 'Webhook processing failed',
  AUTHENTICATION_FAILED: 'Authentication failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Logging Configuration
export const LOG_CONFIG = {
  PREFIXES: {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🐛',
    PROCESSING: '⚙️',
    STORAGE: '💾',
    NOTIFICATION: '💬',
    SEARCH: '🔍',
    STATS: '📊',
    AI: '🤖',
    SLACK: '💬'
  },
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  }
} as const;

// Application endpoints
export const APP_ENDPOINTS = {
  HEALTH: '/health',
  TEST_ENV: '/test',
  WEBHOOK_ZENDESK: '/zendesk-webhook',
  WEBHOOK_CLICKUP: '/clickup-webhook',
  SLACK_EVENTS: '/slack/events',
  SLACK_COMMANDS: '/slack/commands',
  OAUTH_CLICKUP: '/auth/clickup',
  OAUTH_CALLBACK: '/auth/clickup/callback',
  OAUTH_STATUS: '/auth/clickup/status'
} as const;

// Task Mapping Configuration
export const TASK_MAPPING = {
  KEY_PREFIXES: {
    ZENDESK: 'zendesk_',
    CLICKUP: 'clickup_',
    TICKET: 'ticket:'
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SYNCED: 'synced'
  }
} as const;