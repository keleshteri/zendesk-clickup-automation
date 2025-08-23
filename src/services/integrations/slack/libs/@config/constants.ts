/**
 * @fileoverview Slack Configuration Constants
 * @description Constants and default values for Slack configuration management
 * @author TaskGenie AI
 * @version 1.0.0
 */

// TODO: Add ENVIRONMENT_TYPES constant (development, staging, production, test)
// TODO: Add CONFIG_ERROR_CODES for validation errors
// TODO: Add CONFIG_UPDATE_TYPES (create, update, delete, merge, replace)
// TODO: Add CONFIG_EVENT_TYPES (loaded, updated, validated, error, cached, expired)
// TODO: Add DEFAULT_API_CONFIG with baseUrl, timeout, retries, userAgent, headers
// TODO: Add DEFAULT_RATE_LIMIT_CONFIG with requests, window, burst, strategy
// TODO: Add DEFAULT_CIRCUIT_BREAKER_CONFIG with enabled, failureThreshold, recoveryTimeout
// TODO: Add DEFAULT_SECURITY_CONFIG with signature validation, encryption, CORS, CSP
// TODO: Add DEFAULT_FEATURE_CONFIG with metrics, caching, retries, validation flags
// TODO: Add DEFAULT_LOGGING_CONFIG with level, console, file, remote settings
// TODO: Add DEFAULT_INTEGRATION_CONFIG for Zendesk, ClickUp, webhook configurations
// TODO: Add DEFAULT_APP_CONFIG with scopes, settings, OAuth, events, commands
// TODO: Add ENVIRONMENT_CONFIGS for each environment type
// TODO: Add CONFIG_PATHS for configuration file locations
// TODO: Add CONFIG_SCHEMAS for validation
// TODO: Add CONFIG_CACHE_SETTINGS and CONFIG_MANAGER_SETTINGS
// TODO: Add SLACK_API_LIMITS for message length, blocks, options constraints

// Environment types
const ENVIRONMENT_TYPES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;

// Configuration error codes
const CONFIG_ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  LOAD_FAILED: 'LOAD_FAILED',
  SAVE_FAILED: 'SAVE_FAILED'
} as const;

// Configuration update types
const CONFIG_UPDATE_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MERGE: 'merge',
  REPLACE: 'replace'
} as const;

// Configuration event types
const CONFIG_EVENT_TYPES = {
  LOADED: 'loaded',
  UPDATED: 'updated',
  VALIDATED: 'validated',
  ERROR: 'error',
  CACHED: 'cached',
  EXPIRED: 'expired'
} as const;

// Default API configuration
const DEFAULT_API_CONFIG = {
  // TODO: Implement API configuration
} as const;

// Default rate limit configuration
const DEFAULT_RATE_LIMIT_CONFIG = {
  // TODO: Implement rate limit configuration
} as const;

// Default circuit breaker configuration
const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  // TODO: Implement circuit breaker configuration
} as const;

// Default security configuration
const DEFAULT_SECURITY_CONFIG = {
  // TODO: Implement security configuration
} as const;

// Default feature configuration
const DEFAULT_FEATURE_CONFIG = {
  // TODO: Implement feature configuration
} as const;

// Default logging configuration
const DEFAULT_LOGGING_CONFIG = {
  // TODO: Implement logging configuration
} as const;

// Default integration configuration
const DEFAULT_INTEGRATION_CONFIG = {
  // TODO: Implement integration configuration
} as const;

// Default app configuration
const DEFAULT_APP_CONFIG = {
  // TODO: Implement app configuration
} as const;

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  // TODO: Implement environment configurations
} as const;

// Configuration file paths
const CONFIG_PATHS = {
  APP: './config/app.json',
  ENVIRONMENT: './config/environment.json',
  SECURITY: './config/security.json',
  FEATURES: './config/features.json',
  INTEGRATIONS: './config/integrations.json',
  LOGGING: './config/logging.json'
} as const;

// Configuration validation schemas
const CONFIG_SCHEMAS = {
  // TODO: Implement configuration schemas
} as const;

// Configuration cache settings
const CONFIG_CACHE_SETTINGS = {
  DEFAULT_TTL: 300000, // 5 minutes
  MAX_ENTRIES: 1000,
  CLEANUP_INTERVAL: 60000, // 1 minute
  ENABLE_STATS: true
} as const;

// Configuration manager settings
const CONFIG_MANAGER_SETTINGS = {
  DEFAULT_ENVIRONMENT: 'development',
  VALIDATE_ON_LOAD: true,
  ENABLE_CACHING: true,
  ENV_PREFIX: 'SLACK_',
  CONFIG_EXTENSION: '.json',
  WATCH_FILES: true,
  RELOAD_ON_CHANGE: true
} as const;

// Slack API limits
const SLACK_API_LIMITS = {
  MESSAGE_TEXT_MAX_LENGTH: 3000,
  ATTACHMENT_TEXT_MAX_LENGTH: 8000,
  BLOCKS_MAX_COUNT: 50,
  BLOCK_ELEMENTS_MAX_COUNT: 10,
  OPTION_MAX_COUNT: 100,
  CHANNEL_NAME_MAX_LENGTH: 80,
  USER_NAME_MAX_LENGTH: 80,
  TEAM_NAME_MAX_LENGTH: 80
} as const;

// Note: HTTP_STATUS constants moved to @core/constants.ts to avoid duplication

// Common regex patterns
// Note: REGEX_PATTERNS constants moved to @core/constants.ts to avoid duplication

// Time constants
// Note: TIME_CONSTANTS moved to @core/constants.ts to avoid duplication

// Export all constants
export {
  ENVIRONMENT_TYPES,
  CONFIG_ERROR_CODES,
  CONFIG_UPDATE_TYPES,
  CONFIG_EVENT_TYPES,
  DEFAULT_API_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_FEATURE_CONFIG,
  DEFAULT_LOGGING_CONFIG,
  DEFAULT_INTEGRATION_CONFIG,
  DEFAULT_APP_CONFIG,
  ENVIRONMENT_CONFIGS,
  CONFIG_PATHS,
  CONFIG_SCHEMAS,
  CONFIG_CACHE_SETTINGS,
  CONFIG_MANAGER_SETTINGS,
  SLACK_API_LIMITS
  // HTTP_STATUS_CODES, REGEX_PATTERNS, TIME_CONSTANTS moved to @core/constants.ts
};