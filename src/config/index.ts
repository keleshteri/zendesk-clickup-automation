/**
 * Configuration Module Index
 * Centralized exports for all configuration modules
 */

// Import and re-export constants
import {
  SLACK_DEFAULTS,
  CLICKUP_DEFAULTS,
  ZENDESK_DEFAULTS,
  AI_DEFAULTS,
  AGENT_DEFAULTS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  LOG_CONFIG,
  APP_ENDPOINTS,
  TASK_MAPPING
} from './constants';

import {
  ZENDESK_ENDPOINTS,
  CLICKUP_ENDPOINTS,
  SLACK_ENDPOINTS,
  AI_ENDPOINTS,
  WEBHOOK_EVENTS,
  QUERY_PARAMS
} from './endpoints';

// Agent capabilities moved to ../agents/config/agent-capabilities.js

// Export all constants
export * from './constants';

// Export all endpoints
export * from './endpoints';

// Agent capabilities moved to ../agents/config/

// Re-export commonly used configurations for convenience
export {
  SLACK_DEFAULTS,
  CLICKUP_DEFAULTS,
  ZENDESK_DEFAULTS,
  AI_DEFAULTS,
  AGENT_DEFAULTS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  LOG_CONFIG
} from './constants';

export {
  ZENDESK_ENDPOINTS,
  CLICKUP_ENDPOINTS,
  SLACK_ENDPOINTS,
  APP_ENDPOINTS,
  WEBHOOK_EVENTS
} from './endpoints';

// Agent capabilities exports moved to ../agents/config/

// Configuration utility functions
// getAgentByRole moved to ../agents/config/

export const getEndpointUrl = (service: 'zendesk' | 'clickup' | 'slack', endpoint: string, params?: Record<string, any>) => {
  switch (service) {
    case 'zendesk':
      return ZENDESK_ENDPOINTS.BASE_URL(params?.domain || '') + endpoint;
    case 'clickup':
      return CLICKUP_ENDPOINTS.BASE_URL + endpoint;
    case 'slack':
      return SLACK_ENDPOINTS.BASE_URL + endpoint;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
};

export const getLogPrefix = (type: keyof typeof LOG_CONFIG.PREFIXES) => {
  return LOG_CONFIG.PREFIXES[type] || LOG_CONFIG.PREFIXES.INFO;
};