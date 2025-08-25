/**
 * @ai-metadata
 * @component: SlackErrorReportingTypes
 * @description: Type definitions and interfaces for the Slack error reporting system
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-error-reporting-types.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../interfaces"]
 * @tests: ["../tests/types.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Central type definitions for the modular error reporting system"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type {
  SlackErrorReport,
  ErrorSeverity,
  ErrorSource
} from '../../interfaces/slack-error-reporting.interface';

// Re-export core interfaces
export type {
  SlackErrorReport,
  ErrorSeverity,
  ErrorSource
} from '../../interfaces/slack-error-reporting.interface';

/**
 * Configuration for error reporting service
 */
export interface ErrorReportingConfig {
  enabled: boolean;
  maxReportsPerHour: number;
  retentionDays: number;
  duplicateThresholdMinutes: number;
  severityThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  storage: {
    type: 'memory' | 'cloudflare-kv' | 'database';
    maxMemoryEntries: number;
    persistenceEnabled: boolean;
  };
  analytics: {
    enabled: boolean;
    cacheTTL: number;
    metricsRetentionHours: number;
  };
  alerting: {
    enabled: boolean;
    channels: AlertChannel[];
    rateLimits: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
    escalation: {
      enabled: boolean;
      timeoutMinutes: number;
      maxLevels: number;
    };
  };
  forecasting: {
    enabled: boolean;
    forecastHorizon: number;
    confidenceLevel: number;
    minDataPoints: number;
    anomalyThreshold: number;
  };
}

/**
 * Alert channel configuration
 */
export interface AlertChannel {
  type: 'slack' | 'email' | 'webhook' | 'pagerduty';
  name: string;
  enabled: boolean;
  config: {
    // Slack
    channelId?: string;
    webhookUrl?: string;
    
    // Email
    recipients?: string[];
    smtpConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    
    // Webhook
    url?: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
    
    // PagerDuty
    integrationKey?: string;
    severity?: 'critical' | 'error' | 'warning' | 'info';
  };
  filters: {
    severities: ErrorSeverity[];
    services: string[];
    sources: ErrorSource[];
    excludePatterns: string[];
  };
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    severity: ErrorSeverity[];
    services: string[];
    sources: ErrorSource[];
    errorPatterns: string[];
    thresholds: {
      count?: number;
      rate?: number; // errors per minute
      timeWindow?: number; // minutes
    };
  };
  actions: {
    channels: string[]; // Alert channel names
    escalate: boolean;
    suppress: {
      enabled: boolean;
      duration: number; // minutes
    };
  };
  schedule: {
    enabled: boolean;
    timezone: string;
    activeHours: {
      start: string; // HH:mm format
      end: string;
    };
    activeDays: number[]; // 0-6, Sunday = 0
  };
}

/**
 * Error statistics interface
 */
export interface ErrorStats {
  total: number;
  byService: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
  bySource: Record<string, number>;
  byHour: Array<{ hour: number; count: number }>;
  byDay: Array<{ date: string; count: number }>;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  trends: {
    hourly: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    daily: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
  };
}

/**
 * Real-time metrics interface
 */
export interface RealTimeMetrics {
  timestamp: Date;
  activeErrors: number;
  errorsPerMinute: number;
  averageResolutionTime: number; // minutes
  criticalErrors: number;
  servicesAffected: number;
  topAffectedServices: Array<{
    service: string;
    errorCount: number;
    lastError: Date;
  }>;
  alertsTriggered: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number; // 0-100
    factors: Array<{
      name: string;
      status: 'good' | 'warning' | 'critical';
      value: number;
      threshold: number;
    }>;
  };
}

/**
 * Dashboard data interface
 */
export interface DashboardData {
  overview: {
    totalErrors: number;
    activeAlerts: number;
    servicesMonitored: number;
    uptimePercentage: number;
  };
  recentErrors: SlackErrorReport[];
  statistics: ErrorStats;
  realTimeMetrics: RealTimeMetrics;
  alerts: {
    active: Alert[];
    recent: Alert[];
  };
  forecasts?: {
    shortTerm: ForecastSummary;
    trends: TrendAnalysis[];
  };
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: ErrorSeverity;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  suppressedUntil?: Date;
  error: SlackErrorReport;
  channels: string[];
  escalationLevel: number;
  escalationHistory: Array<{
    level: number;
    timestamp: Date;
    channels: string[];
    success: boolean;
  }>;
  metadata: {
    triggerCount: number;
    lastTriggered: Date;
    relatedAlerts: string[];
  };
}

/**
 * Storage interface for error persistence
 */
export interface ErrorStorage {
  store(error: SlackErrorReport): Promise<void>;
  update(id: string, updates: Partial<SlackErrorReport>): Promise<void>;
  get(id: string): Promise<SlackErrorReport | null>;
  getAll(filters?: ErrorFilters): Promise<SlackErrorReport[]>;
  delete(id: string): Promise<void>;
  deleteMany(filters: ErrorFilters): Promise<number>;
  count(filters?: ErrorFilters): Promise<number>;
  getStats(): Promise<StorageStats>;
}

/**
 * Error filters for querying
 */
export interface ErrorFilters {
  from?: Date;
  to?: Date;
  service?: string;
  services?: string[];
  severity?: ErrorSeverity;
  severities?: ErrorSeverity[];
  source?: ErrorSource;
  sources?: ErrorSource[];
  resolved?: boolean;
  fingerprint?: string;
  fingerprints?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'service' | 'occurrenceCount';
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalErrors: number;
  storageSize: number; // bytes
  oldestError?: Date;
  newestError?: Date;
  byService: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
  memoryUsage?: {
    used: number;
    available: number;
    percentage: number;
  };
}

/**
 * Forecast data point
 */
export interface ForecastDataPoint {
  timestamp: Date;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-1
  confidence: number; // 0-1
  changeRate: number; // percentage change per time unit
  seasonality: {
    detected: boolean;
    period?: number; // in hours
    amplitude?: number;
  };
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  score: number; // 0-1
  expectedRange: {
    min: number;
    max: number;
  };
  actualValue: number;
  timestamp: Date;
}

/**
 * Forecast result
 */
export interface ForecastResult {
  service: string;
  severity?: ErrorSeverity;
  forecast: ForecastDataPoint[];
  trend: TrendAnalysis;
  anomalies: AnomalyDetection[];
  recommendations: string[];
  generatedAt: Date;
  validUntil: Date;
}

/**
 * Forecast summary for dashboard
 */
export interface ForecastSummary {
  overallTrend: TrendAnalysis;
  criticalForecasts: ForecastResult[];
  anomalyCount: number;
  recommendations: string[];
}

/**
 * Error resolution data
 */
export interface ErrorResolution {
  id: string;
  errorId: string;
  resolvedBy: string;
  resolvedAt: Date;
  resolution: {
    type: 'fixed' | 'ignored' | 'duplicate' | 'false-positive';
    description: string;
    actions: string[];
    preventionMeasures?: string[];
  };
  timeToResolve: number; // minutes
  relatedIssues?: string[];
  followUpRequired: boolean;
}

/**
 * Error pattern for duplicate detection
 */
export interface ErrorPattern {
  fingerprint: string;
  signature: string;
  service: string;
  source: ErrorSource;
  firstSeen: Date;
  lastSeen: Date;
  occurrenceCount: number;
  severity: ErrorSeverity;
  isResolved: boolean;
  resolvedAt?: Date;
  tags: string[];
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  type: 'error' | 'alert' | 'resolution' | 'forecast';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: {
    error?: SlackErrorReport;
    alert?: Alert;
    resolution?: ErrorResolution;
    forecast?: ForecastResult;
  };
  channels: string[];
  metadata: {
    timestamp: Date;
    source: string;
    correlationId?: string;
    retryCount?: number;
  };
}

/**
 * Rate limit tracker
 */
export interface RateLimitTracker {
  key: string;
  count: number;
  windowStart: Date;
  windowDuration: number; // minutes
  limit: number;
  isExceeded(): boolean;
  increment(): void;
  reset(): void;
  getTimeUntilReset(): number; // milliseconds
}

/**
 * Escalation rule
 */
export interface EscalationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    severity: ErrorSeverity[];
    services: string[];
    timeoutMinutes: number;
    maxOccurrences?: number;
  };
  levels: Array<{
    level: number;
    channels: string[];
    delay: number; // minutes
    conditions?: {
      requireAcknowledgment: boolean;
      autoResolve: boolean;
      suppressDuration?: number; // minutes
    };
  }>;
  schedule: {
    enabled: boolean;
    timezone: string;
    activeHours: {
      start: string;
      end: string;
    };
    activeDays: number[];
  };
}

/**
 * Module health status
 */
export interface ModuleHealth {
  module: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: {
    uptime: number; // percentage
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // operations per minute
  };
  issues: Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

/**
 * System health overview
 */
export interface SystemHealth {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number; // 0-100
    lastUpdated: Date;
  };
  modules: ModuleHealth[];
  dependencies: Array<{
    name: string;
    type: 'database' | 'api' | 'service' | 'storage';
    status: 'available' | 'degraded' | 'unavailable';
    responseTime?: number;
    lastCheck: Date;
  }>;
  alerts: {
    active: number;
    critical: number;
    acknowledged: number;
  };
  performance: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    path: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  operation: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  itemsProcessed: number;
  itemsRemoved: number;
  errors: Array<{
    item: string;
    error: string;
  }>;
  success: boolean;
}

/**
 * Export summary for data export operations
 */
export interface ExportSummary {
  format: 'json' | 'csv' | 'xlsx';
  filters: ErrorFilters;
  totalRecords: number;
  exportedRecords: number;
  fileSize: number; // bytes
  generatedAt: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

/**
 * Import result for data import operations
 */
export interface ImportResult {
  format: 'json' | 'csv';
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  duplicatesSkipped: number;
  errors: Array<{
    record: number;
    field?: string;
    message: string;
  }>;
  warnings: Array<{
    record: number;
    message: string;
  }>;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
}

/**
 * Event for the error reporting system
 */
export interface ErrorReportingEvent {
  type: 'error.created' | 'error.updated' | 'error.resolved' | 'alert.triggered' | 'alert.acknowledged' | 'alert.resolved' | 'forecast.generated';
  timestamp: Date;
  source: string;
  data: {
    error?: SlackErrorReport;
    alert?: Alert;
    forecast?: ForecastResult;
    changes?: Record<string, any>;
  };
  metadata: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    version: string;
  };
}

/**
 * Event handler interface
 */
export interface EventHandler {
  handle(event: ErrorReportingEvent): Promise<void>;
  canHandle(eventType: string): boolean;
}

/**
 * Plugin interface for extending functionality
 */
export interface ErrorReportingPlugin {
  name: string;
  version: string;
  enabled: boolean;
  initialize(config: any): Promise<void>;
  shutdown(): Promise<void>;
  onError?(error: SlackErrorReport): Promise<void>;
  onAlert?(alert: Alert): Promise<void>;
  onResolution?(resolution: ErrorResolution): Promise<void>;
  getHealth?(): Promise<ModuleHealth>;
}

/**
 * Utility type for partial updates
 */
export type PartialUpdate<T> = {
  [P in keyof T]?: T[P] extends object ? PartialUpdate<T[P]> : T[P];
};

/**
 * Utility type for required fields
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for optional fields
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;