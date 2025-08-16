/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for all external services
 */

// Zendesk API Endpoints
export const ZENDESK_ENDPOINTS = {
  BASE_URL: (domain: string) => `https://${domain}.zendesk.com/api/v2`,
  TICKETS: '/tickets.json',
  TICKET_BY_ID: (id: string | number) => `/tickets/${id}.json`,
  SEARCH: '/search.json',
  USERS: '/users.json',
  USER_BY_ID: (id: string | number) => `/users/${id}.json`,
  TICKET_COMMENTS: (ticketId: string | number) => `/tickets/${ticketId}/comments.json`,
  TICKET_URL: (domain: string, id: string | number) => `https://${domain}.zendesk.com/agent/tickets/${id}`
} as const;

// ClickUp API Endpoints
export const CLICKUP_ENDPOINTS = {
  BASE_URL: 'https://api.clickup.com/api/v2',
  TASKS: '/task',
  TASK_BY_ID: (id: string) => `/task/${id}`,
  LISTS: '/list',
  LIST_TASKS: (listId: string) => `/list/${listId}/task`,
  SPACES: '/space',
  TEAMS: '/team',
  COMMENTS: (taskId: string) => `/task/${taskId}/comment`,
  TASK_URL: (id: string) => `https://app.clickup.com/t/${id}`,
  OAUTH: {
    AUTHORIZE: 'https://app.clickup.com/api',
    TOKEN: 'https://api.clickup.com/api/v2/oauth/token'
  }
} as const;

// Slack API Endpoints
export const SLACK_ENDPOINTS = {
  BASE_URL: 'https://slack.com/api',
  CHAT_POST_MESSAGE: '/chat.postMessage',
  CHAT_UPDATE: '/chat.update',
  CHAT_DELETE: '/chat.delete',
  USERS_INFO: '/users.info',
  CONVERSATIONS_INFO: '/conversations.info',
  CONVERSATIONS_LIST: '/conversations.list',
  FILES_UPLOAD: '/files.upload',
  OAUTH: {
    ACCESS: '/oauth.v2.access',
    AUTHORIZE: 'https://slack.com/oauth/v2/authorize'
  }
} as const;

// AI Service Endpoints
export const AI_ENDPOINTS = {
  GOOGLE_GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    GENERATE_CONTENT: (model: string) => `/models/${model}:generateContent`,
    MODELS: '/models'
  }
} as const;

// Internal Application Endpoints
export const APP_ENDPOINTS = {
  HEALTH: '/',
  TEST: '/test',
  ZENDESK_WEBHOOK: '/zendesk-webhook',
  CLICKUP_WEBHOOK: '/clickup-webhook',
  WEBHOOK_ZENDESK: '/zendesk-webhook',
  WEBHOOK_CLICKUP: '/clickup-webhook',
  SLACK_EVENTS: '/slack/events',
  SLACK_COMMANDS: '/slack/commands',
  SLACK_OAUTH: '/slack/oauth',
  SLACK_INSTALL: '/slack/install',
  AGENTS: {
    ROUTE_TICKET: '/agents/route-ticket',
    ANALYZE: '/agents/analyze',
    STATUS: '/agents/status'
  },
  NLP: {
    PROCESS: '/nlp/process',
    ANALYZE: '/nlp/analyze'
  }
} as const;

// Webhook Event Types
export const WEBHOOK_EVENTS = {
  ZENDESK: {
    TICKET_CREATED: 'ticket.created',
    TICKET_UPDATED: 'ticket.updated',
    TICKET_SOLVED: 'ticket.solved',
    TICKET_CLOSED: 'ticket.closed'
  },
  CLICKUP: {
    TASK_CREATED: 'taskCreated',
    TASK_UPDATED: 'taskUpdated',
    TASK_STATUS_UPDATED: 'taskStatusUpdated',
    TASK_DELETED: 'taskDeleted'
  },
  SLACK: {
    MESSAGE: 'message',
    APP_MENTION: 'app_mention',
    REACTION_ADDED: 'reaction_added'
  }
} as const;

// Query Parameters
export const QUERY_PARAMS = {
  ZENDESK: {
    PER_PAGE: 'per_page',
    SORT_BY: 'sort_by',
    SORT_ORDER: 'sort_order',
    QUERY: 'query'
  },
  CLICKUP: {
    INCLUDE_CLOSED: 'include_closed',
    ORDER_BY: 'order_by',
    REVERSE: 'reverse',
    SUBTASKS: 'subtasks'
  }
} as const;