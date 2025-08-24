/**
 * @ai-metadata
 * @component: ErrorReportingConfig
 * @description: Centralized configuration for Slack error reporting system
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-reporting-config.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../services/integrations/slack/interfaces/slack-error-reporting.interface.ts"]
 * @tests: ["./tests/error-reporting-config.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Configuration management for error reporting system with environment-specific settings"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import {
  ErrorReportingConfig,
  ErrorAlertConfig,
  ErrorSeverity,
  ErrorCategory
} from '../services/integrations/slack/interfaces/slack-error-reporting.interface';
import type { Env } from '../types';

/**
 * Environment-specific error reporting configurations
 */
export interface ErrorReportingEnvironmentConfig {
  development: ErrorReportingConfig;
  staging: ErrorReportingConfig;
  production: ErrorReportingConfig;
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: ErrorAlertConfig = {
  enabled: true,
  severityThreshold: ErrorSeverity.MEDIUM,
  categories: [
    ErrorCategory.AUTH,
    ErrorCategory.API,
    ErrorCategory.RATE_LIMIT,
    ErrorCategory.NETWORK,
    ErrorCategory.CONFIG,
    ErrorCategory.SECURITY,
    ErrorCategory.BOT_MANAGEMENT
  ],
  rateLimit: {
    maxAlerts: 10,
    timeWindow: 60 // 1 hour
  },
  alertChannels: ['#alerts-dev'], // Default to dev channel
  includeDetails: true
};

/**
 * Development environment configuration
 */
const DEVELOPMENT_CONFIG: ErrorReportingConfig = {
  enabled: true,
  maxStoredErrors: 1000,
  retentionDays: 7,
  autoResolve: {
    enabled: true,
    categories: [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.NETWORK
    ],
    maxAge: 24 // 24 hours
  },
  alerts: {
    ...DEFAULT_ALERT_CONFIG,
    severityThreshold: ErrorSeverity.LOW, // More verbose in dev
    alertChannels: ['#alerts-dev']
  },
  externalReporting: {
    enabled: false,
    services: []
  }
};

/**
 * Staging environment configuration
 */
const STAGING_CONFIG: ErrorReportingConfig = {
  enabled: true,
  maxStoredErrors: 5000,
  retentionDays: 14,
  autoResolve: {
    enabled: true,
    categories: [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.NETWORK
    ],
    maxAge: 12 // 12 hours
  },
  alerts: {
    ...DEFAULT_ALERT_CONFIG,
    severityThreshold: ErrorSeverity.MEDIUM,
    alertChannels: ['#alerts-staging']
  },
  externalReporting: {
    enabled: true,
    services: ['datadog', 'sentry']
  }
};

/**
 * Production environment configuration
 */
const PRODUCTION_CONFIG: ErrorReportingConfig = {
  enabled: true,
  maxStoredErrors: 10000,
  retentionDays: 30,
  autoResolve: {
    enabled: true,
    categories: [
      ErrorCategory.RATE_LIMIT
    ],
    maxAge: 6 // 6 hours
  },
  alerts: {
    ...DEFAULT_ALERT_CONFIG,
    severityThreshold: ErrorSeverity.HIGH, // Only high/critical in prod
    rateLimit: {
      maxAlerts: 5,
      timeWindow: 60 // More restrictive in prod
    },
    alertChannels: ['#alerts-production', '#on-call']
  },
  externalReporting: {
    enabled: true,
    services: ['datadog', 'sentry', 'pagerduty']
  }
};

/**
 * All environment configurations
 */
export const ERROR_REPORTING_CONFIGS: ErrorReportingEnvironmentConfig = {
  development: DEVELOPMENT_CONFIG,
  staging: STAGING_CONFIG,
  production: PRODUCTION_CONFIG
};

/**
 * Get error reporting configuration for the current environment
 * @param env - Environment variables
 * @returns Error reporting configuration for the current environment
 */
export function getErrorReportingConfig(env: Env): ErrorReportingConfig {
  const environment = env.ENVIRONMENT || 'development';
  
  // Get base config for environment
  let config: ErrorReportingConfig;
  
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      config = ERROR_REPORTING_CONFIGS.production;
      break;
    case 'staging':
    case 'stage':
      config = ERROR_REPORTING_CONFIGS.staging;
      break;
    case 'development':
    case 'dev':
    default:
      config = ERROR_REPORTING_CONFIGS.development;
      break;
  }
  
  // Override with environment-specific settings if available
  const overrides: Partial<ErrorReportingConfig> = {};
  
  // Use existing Slack channels from environment for alerts
  const alertChannels: string[] = [];
  if (env.SLACK_MANAGEMENT_CHANNEL) alertChannels.push(env.SLACK_MANAGEMENT_CHANNEL);
  if (env.SLACK_DEVELOPMENT_CHANNEL) alertChannels.push(env.SLACK_DEVELOPMENT_CHANNEL);
  if (env.SLACK_SUPPORT_CHANNEL) alertChannels.push(env.SLACK_SUPPORT_CHANNEL);
  
  if (alertChannels.length > 0) {
    overrides.alerts = {
      ...config.alerts,
      alertChannels
    };
  }
  
  return {
    ...config,
    ...overrides
  };
}

/**
 * Validate error reporting configuration
 * @param config - Configuration to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateErrorReportingConfig(config: ErrorReportingConfig): string[] {
  const errors: string[] = [];
  
  if (config.maxStoredErrors <= 0) {
    errors.push('maxStoredErrors must be greater than 0');
  }
  
  if (config.retentionDays <= 0) {
    errors.push('retentionDays must be greater than 0');
  }
  
  if (config.autoResolve.maxAge <= 0) {
    errors.push('autoResolve.maxAge must be greater than 0');
  }
  
  if (config.alerts.rateLimit.maxAlerts <= 0) {
    errors.push('alerts.rateLimit.maxAlerts must be greater than 0');
  }
  
  if (config.alerts.rateLimit.timeWindow <= 0) {
    errors.push('alerts.rateLimit.timeWindow must be greater than 0');
  }
  
  if (config.alerts.alertChannels.length === 0) {
    errors.push('At least one alert channel must be configured');
  }
  
  // Validate alert channels format
  for (const channel of config.alerts.alertChannels) {
    if (!channel.startsWith('#') && !channel.startsWith('@')) {
      errors.push(`Invalid alert channel format: ${channel}. Must start with # or @`);
    }
  }
  
  return errors;
}

/**
 * Get configuration summary for logging/debugging
 * @param config - Configuration to summarize
 * @returns Human-readable configuration summary
 */
export function getConfigSummary(config: ErrorReportingConfig): string {
  return [
    `Error Reporting: ${config.enabled ? 'Enabled' : 'Disabled'}`,
    `Max Stored Errors: ${config.maxStoredErrors}`,
    `Retention: ${config.retentionDays} days`,
    `Auto-resolve: ${config.autoResolve.enabled ? 'Enabled' : 'Disabled'}`,
    `Alert Threshold: ${config.alerts.severityThreshold}`,
    `Alert Channels: ${config.alerts.alertChannels.join(', ')}`,
    `External Reporting: ${config.externalReporting.enabled ? 'Enabled' : 'Disabled'}`
  ].join('\n');
}

/**
 * Environment variable names used for configuration
 */
export const ERROR_REPORTING_ENV_VARS = {
  ENVIRONMENT: 'ENVIRONMENT',
  SLACK_MANAGEMENT_CHANNEL: 'SLACK_MANAGEMENT_CHANNEL',
  SLACK_DEVELOPMENT_CHANNEL: 'SLACK_DEVELOPMENT_CHANNEL',
  SLACK_SUPPORT_CHANNEL: 'SLACK_SUPPORT_CHANNEL',
  SLACK_BILLING_CHANNEL: 'SLACK_BILLING_CHANNEL',
  SLACK_DEFAULT_CHANNEL: 'SLACK_DEFAULT_CHANNEL'
} as const;