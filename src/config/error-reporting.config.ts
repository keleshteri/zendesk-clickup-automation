/**
 * @ai-metadata
 * @component: ErrorReportingConfig
 * @description: Simplified error reporting configuration
 * @last-update: 2024-01-27
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Basic error reporting configuration for simplified automation"
 */

// Import types from the service interfaces
import type {
  ErrorReportingConfig,
  ErrorSeverity
} from '../services/integrations/slack/interfaces/slack-error-reporting.interface';

// Re-export the types for convenience
export type {
  ErrorReportingConfig,
  ErrorSeverity
} from '../services/integrations/slack/interfaces/slack-error-reporting.interface';

// Default configuration that matches the expected interface
export const DEFAULT_CONFIG: ErrorReportingConfig = {
  enabled: true,
  maxStoredErrors: 1000,
  retentionDays: 7,
  autoResolve: {
    enabled: false,
    categories: [],
    maxAge: 24
  },
  alerts: {
    enabled: true,
    severityThreshold: 'medium' as ErrorSeverity,
    categories: [],
    rateLimit: {
      maxAlerts: 10,
      timeWindow: 60
    },
    alertChannels: [process.env.SLACK_DEFAULT_CHANNEL || '#alerts'],
    includeDetails: true
  },
  externalReporting: {
    enabled: false,
    services: []
  }
};

// Simplified configuration getter
export function getErrorReportingConfig(env?: any): ErrorReportingConfig {
  const alertChannel = env?.SLACK_DEVELOPMENT_CHANNEL || env?.SLACK_DEFAULT_CHANNEL || process.env.SLACK_DEVELOPMENT_CHANNEL || process.env.SLACK_DEFAULT_CHANNEL || '#alerts';
  
  return {
    ...DEFAULT_CONFIG,
    alerts: {
      ...DEFAULT_CONFIG.alerts,
      alertChannels: [alertChannel]
    }
  };
}

// Validation function (simplified)
export function validateErrorReportingConfig(config: ErrorReportingConfig): string[] {
  const errors: string[] = [];
  
  if (config.maxStoredErrors <= 0) {
    errors.push('maxStoredErrors must be greater than 0');
  }
  
  if (config.retentionDays <= 0) {
    errors.push('retentionDays must be greater than 0');
  }
  
  return errors;
}

// Config summary function (simplified)
export function getConfigSummary(config: ErrorReportingConfig): string {
  return `Error Reporting Config:
  - Enabled: ${config.enabled}
  - Max Stored: ${config.maxStoredErrors}
  - Retention: ${config.retentionDays} days
  - Alerts: ${config.alerts.enabled ? 'enabled' : 'disabled'}
  - Alert Channels: ${config.alerts.alertChannels.join(', ')}`;
}

// Export default config for convenience
export const defaultErrorReportingConfig = DEFAULT_CONFIG;