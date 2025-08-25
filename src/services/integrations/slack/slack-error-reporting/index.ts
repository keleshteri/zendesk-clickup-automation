/**
 * @ai-metadata
 * @component: SlackErrorReportingIndex
 * @description: Main entry point for the modular Slack error reporting system
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./error-reporting.service", "./modules", "./types"]
 * @tests: ["./tests/index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export point for the refactored error reporting system"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

// Main service export
export { SlackErrorReportingService } from './error-reporting.service';

// Module exports
export { ErrorReportingCore } from './modules/error-reporting-core';
export { ErrorPersistence } from './modules/error-persistence';
export { ErrorAnalytics } from './modules/error-analytics';
export { ErrorAlerting } from './modules/error-alerting';
export { ErrorForecasting } from './modules/error-forecasting';

// Type exports
export type {
  // Core types
  SlackErrorReport,
  ErrorSeverity,
  ErrorSource,
  
  // Configuration types
  ErrorReportingConfig,
  AlertChannel,
  AlertRule,
  
  // Statistics and metrics
  ErrorStats,
  RealTimeMetrics,
  DashboardData,
  
  // Alert types
  Alert,
  
  // Storage types
  ErrorStorage,
  ErrorFilters,
  StorageStats,
  
  // Forecasting types
  ForecastDataPoint,
  TrendAnalysis,
  AnomalyDetection,
  ForecastResult,
  ForecastSummary,
  
  // Resolution types
  ErrorResolution,
  ErrorPattern,
  
  // Notification types
  NotificationPayload,
  RateLimitTracker,
  EscalationRule,
  
  // Health and monitoring
  ModuleHealth,
  SystemHealth,
  
  // Utility types
  ConfigValidationResult,
  CleanupResult,
  ExportSummary,
  ImportResult,
  
  // Event system
  ErrorReportingEvent,
  EventHandler,
  ErrorReportingPlugin,
  
  // Utility types
  PartialUpdate,
  RequiredFields,
  OptionalFields
} from './types';

// Note: Types are now exported from ./types to avoid duplicates

/**
 * Factory function to create a configured error reporting service
 * @param client - The Slack WebClient instance
 * @param env - Environment configuration
 * @param config - Optional configuration overrides
 * @returns Configured SlackErrorReportingService instance
 */
export function createErrorReportingService(
  client: import('@slack/web-api').WebClient,
  env: import('../../../../types').Env,
  config?: Partial<import('./types').ErrorReportingConfig>
): import('./error-reporting.service').SlackErrorReportingService {
  const { SlackErrorReportingService } = require('./error-reporting.service');
  return new SlackErrorReportingService(client, env, config);
}

/**
 * Default configuration for the error reporting service
 */
export const DEFAULT_ERROR_REPORTING_CONFIG: import('./types').ErrorReportingConfig = {
  enabled: true,
  maxReportsPerHour: 1000,
  retentionDays: 30,
  duplicateThresholdMinutes: 5,
  severityThresholds: {
    critical: 10,
    high: 50,
    medium: 100
  },
  storage: {
    type: 'memory',
    maxMemoryEntries: 10000,
    persistenceEnabled: false
  },
  analytics: {
    enabled: true,
    cacheTTL: 300000, // 5 minutes
    metricsRetentionHours: 168 // 7 days
  },
  alerting: {
    enabled: true,
    channels: [],
    rateLimits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000
    },
    escalation: {
      enabled: false,
      timeoutMinutes: 30,
      maxLevels: 3
    }
  },
  forecasting: {
    enabled: true,
    forecastHorizon: 24, // 24 hours
    confidenceLevel: 0.95,
    minDataPoints: 24,
    anomalyThreshold: 2
  }
};

/**
 * Utility function to validate error reporting configuration
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: Partial<import('./types').ErrorReportingConfig>): import('./types').ConfigValidationResult {
  const errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ path: string; message: string; suggestion?: string }> = [];

  // Validate required fields
  if (config.maxReportsPerHour !== undefined && config.maxReportsPerHour <= 0) {
    errors.push({
      path: 'maxReportsPerHour',
      message: 'Must be greater than 0',
      severity: 'error'
    });
  }

  if (config.retentionDays !== undefined && config.retentionDays <= 0) {
    errors.push({
      path: 'retentionDays',
      message: 'Must be greater than 0',
      severity: 'error'
    });
  }

  if (config.duplicateThresholdMinutes !== undefined && config.duplicateThresholdMinutes < 0) {
    errors.push({
      path: 'duplicateThresholdMinutes',
      message: 'Must be greater than or equal to 0',
      severity: 'error'
    });
  }

  // Validate severity thresholds
  if (config.severityThresholds) {
    const { critical, high, medium } = config.severityThresholds;
    if (critical !== undefined && critical <= 0) {
      errors.push({
        path: 'severityThresholds.critical',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }
    if (high !== undefined && high <= 0) {
      errors.push({
        path: 'severityThresholds.high',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }
    if (medium !== undefined && medium <= 0) {
      errors.push({
        path: 'severityThresholds.medium',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }

    // Check logical ordering
    if (critical !== undefined && high !== undefined && critical >= high) {
      warnings.push({
        path: 'severityThresholds',
        message: 'Critical threshold should be lower than high threshold',
        suggestion: 'Consider adjusting thresholds to maintain logical ordering'
      });
    }
    if (high !== undefined && medium !== undefined && high >= medium) {
      warnings.push({
        path: 'severityThresholds',
        message: 'High threshold should be lower than medium threshold',
        suggestion: 'Consider adjusting thresholds to maintain logical ordering'
      });
    }
  }

  // Validate storage configuration
  if (config.storage) {
    if (config.storage.maxMemoryEntries !== undefined && config.storage.maxMemoryEntries <= 0) {
      errors.push({
        path: 'storage.maxMemoryEntries',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }

    if (config.storage.type === 'memory' && config.storage.maxMemoryEntries && config.storage.maxMemoryEntries > 50000) {
      warnings.push({
        path: 'storage.maxMemoryEntries',
        message: 'Large memory storage may impact performance',
        suggestion: 'Consider using persistent storage for large datasets'
      });
    }
  }

  // Validate analytics configuration
  if (config.analytics) {
    if (config.analytics.cacheTTL !== undefined && config.analytics.cacheTTL < 60000) {
      warnings.push({
        path: 'analytics.cacheTTL',
        message: 'Very short cache TTL may impact performance',
        suggestion: 'Consider using at least 60 seconds for cache TTL'
      });
    }

    if (config.analytics.metricsRetentionHours !== undefined && config.analytics.metricsRetentionHours <= 0) {
      errors.push({
        path: 'analytics.metricsRetentionHours',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }
  }

  // Validate alerting configuration
  if (config.alerting) {
    const { rateLimits, escalation } = config.alerting;
    
    if (rateLimits) {
      if (rateLimits.perMinute !== undefined && rateLimits.perMinute <= 0) {
        errors.push({
          path: 'alerting.rateLimits.perMinute',
          message: 'Must be greater than 0',
          severity: 'error'
        });
      }
      if (rateLimits.perHour !== undefined && rateLimits.perHour <= 0) {
        errors.push({
          path: 'alerting.rateLimits.perHour',
          message: 'Must be greater than 0',
          severity: 'error'
        });
      }
      if (rateLimits.perDay !== undefined && rateLimits.perDay <= 0) {
        errors.push({
          path: 'alerting.rateLimits.perDay',
          message: 'Must be greater than 0',
          severity: 'error'
        });
      }

      // Check logical ordering
      if (rateLimits.perMinute && rateLimits.perHour && rateLimits.perMinute * 60 > rateLimits.perHour) {
        warnings.push({
          path: 'alerting.rateLimits',
          message: 'Per-minute rate limit may exceed hourly limit',
          suggestion: 'Ensure rate limits are logically consistent'
        });
      }
    }

    if (escalation) {
      if (escalation.timeoutMinutes !== undefined && escalation.timeoutMinutes <= 0) {
        errors.push({
          path: 'alerting.escalation.timeoutMinutes',
          message: 'Must be greater than 0',
          severity: 'error'
        });
      }
      if (escalation.maxLevels !== undefined && escalation.maxLevels <= 0) {
        errors.push({
          path: 'alerting.escalation.maxLevels',
          message: 'Must be greater than 0',
          severity: 'error'
        });
      }
    }
  }

  // Validate forecasting configuration
  if (config.forecasting) {
    if (config.forecasting.forecastHorizon !== undefined && config.forecasting.forecastHorizon <= 0) {
      errors.push({
        path: 'forecasting.forecastHorizon',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }

    if (config.forecasting.confidenceLevel !== undefined) {
      if (config.forecasting.confidenceLevel <= 0 || config.forecasting.confidenceLevel >= 1) {
        errors.push({
          path: 'forecasting.confidenceLevel',
          message: 'Must be between 0 and 1 (exclusive)',
          severity: 'error'
        });
      }
    }

    if (config.forecasting.minDataPoints !== undefined && config.forecasting.minDataPoints <= 0) {
      errors.push({
        path: 'forecasting.minDataPoints',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }

    if (config.forecasting.anomalyThreshold !== undefined && config.forecasting.anomalyThreshold <= 0) {
      errors.push({
        path: 'forecasting.anomalyThreshold',
        message: 'Must be greater than 0',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Utility function to merge configurations with defaults
 * @param userConfig - User-provided configuration
 * @param defaultConfig - Default configuration
 * @returns Merged configuration
 */
export function mergeConfig(
  userConfig: Partial<import('./types').ErrorReportingConfig>,
  defaultConfig: import('./types').ErrorReportingConfig = DEFAULT_ERROR_REPORTING_CONFIG
): import('./types').ErrorReportingConfig {
  return {
    enabled: userConfig.enabled ?? defaultConfig.enabled,
    maxReportsPerHour: userConfig.maxReportsPerHour ?? defaultConfig.maxReportsPerHour,
    retentionDays: userConfig.retentionDays ?? defaultConfig.retentionDays,
    duplicateThresholdMinutes: userConfig.duplicateThresholdMinutes ?? defaultConfig.duplicateThresholdMinutes,
    severityThresholds: {
      ...defaultConfig.severityThresholds,
      ...userConfig.severityThresholds
    },
    storage: {
      ...defaultConfig.storage,
      ...userConfig.storage
    },
    analytics: {
      ...defaultConfig.analytics,
      ...userConfig.analytics
    },
    alerting: {
      ...defaultConfig.alerting,
      ...userConfig.alerting,
      rateLimits: {
        ...defaultConfig.alerting.rateLimits,
        ...userConfig.alerting?.rateLimits
      },
      escalation: {
        ...defaultConfig.alerting.escalation,
        ...userConfig.alerting?.escalation
      }
    },
    forecasting: {
      ...defaultConfig.forecasting,
      ...userConfig.forecasting
    }
  };
}

/**
 * Version information
 */
export const VERSION = '2.0.0';

/**
 * Module information
 */
export const MODULE_INFO = {
  name: 'slack-error-reporting',
  version: VERSION,
  description: 'Modular Slack error reporting system with analytics, alerting, and forecasting',
  author: 'Zendesk-ClickUp Automation Team',
  license: 'MIT',
  dependencies: {
    typescript: '^5.0.0'
  },
  features: [
    'Error collection and deduplication',
    'Real-time analytics and metrics',
    'Intelligent alerting with escalation',
    'Predictive forecasting and anomaly detection',
    'Configurable persistence layers',
    'Comprehensive dashboard data',
    'Plugin architecture for extensibility'
  ]
};

/**
 * Health check function for the error reporting system
 * @param service - Error reporting service instance
 * @returns System health status
 */
export async function getSystemHealth(service: import('./error-reporting.service').SlackErrorReportingService): Promise<import('./types').SystemHealth> {
  try {
    const modules: import('./types').ModuleHealth[] = [];
    const startTime = Date.now();

    // Check core module
    try {
      await service.getStatistics({ from: new Date(Date.now() - 60000), to: new Date() });
      modules.push({
        module: 'core',
        status: 'healthy',
        lastCheck: new Date(),
        metrics: {
          uptime: 100,
          responseTime: Date.now() - startTime,
          errorRate: 0,
          throughput: 0
        },
        issues: []
      });
    } catch (error) {
      modules.push({
        module: 'core',
        status: 'unhealthy',
        lastCheck: new Date(),
        metrics: {
          uptime: 0,
          responseTime: Date.now() - startTime,
          errorRate: 100,
          throughput: 0
        },
        issues: [{
          type: 'error',
          message: `Core module error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          resolved: false
        }]
      });
    }

    // Calculate overall health
    const healthyModules = modules.filter(m => m.status === 'healthy').length;
    const totalModules = modules.length;
    const healthScore = totalModules > 0 ? (healthyModules / totalModules) * 100 : 0;
    
    const overallStatus = healthScore >= 80 ? 'healthy' : 
                         healthScore >= 50 ? 'degraded' : 'critical';

    return {
      overall: {
        status: overallStatus,
        score: healthScore,
        lastUpdated: new Date()
      },
      modules,
      dependencies: [], // Would be populated with actual dependency checks
      alerts: {
        active: 0,
        critical: 0,
        acknowledged: 0
      },
      performance: {
        avgResponseTime: modules.reduce((sum, m) => sum + m.metrics.responseTime, 0) / modules.length,
        throughput: modules.reduce((sum, m) => sum + m.metrics.throughput, 0),
        errorRate: modules.reduce((sum, m) => sum + m.metrics.errorRate, 0) / modules.length,
        availability: healthScore
      }
    };
  } catch (error) {
    return {
      overall: {
        status: 'critical',
        score: 0,
        lastUpdated: new Date()
      },
      modules: [],
      dependencies: [],
      alerts: {
        active: 0,
        critical: 1,
        acknowledged: 0
      },
      performance: {
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 100,
        availability: 0
      }
    };
  }
}