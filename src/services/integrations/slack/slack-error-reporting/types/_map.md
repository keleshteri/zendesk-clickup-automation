# 📝 types Module Map

> **Purpose**: TypeScript type definitions and interfaces

## 📊 Quick Stats
- **Files**: 1
- **Classes**: 0
- **Interfaces**: 29
- **Functions**: 0

## 🗂️ Files Overview

### `index.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `ErrorReportingConfig`
**Properties**:
- `enabled: boolean`
- `maxReportsPerHour: number`
- `retentionDays: number`
- `duplicateThresholdMinutes: number`
- `severityThresholds: unknown`
- `storage: unknown`
- `analytics: unknown`
- `alerting: unknown`
- `forecasting: unknown`

**INTERFACE**: `AlertChannel`
**Properties**:
- `type: unknown`
- `name: string`
- `enabled: boolean`
- `config: unknown`
- `filters: unknown`

**INTERFACE**: `AlertRule`
**Properties**:
- `id: string`
- `name: string`
- `enabled: boolean`
- `conditions: unknown`
- `actions: unknown`
- `schedule: unknown`

**INTERFACE**: `ErrorStats`
**Properties**:
- `total: number`
- `byService: Record`
- `bySeverity: Record`
- `bySource: Record`
- `byHour: Array`
- `byDay: Array`
- `topErrors: Array`
- `trends: unknown`

**INTERFACE**: `RealTimeMetrics`
**Properties**:
- `timestamp: Date`
- `activeErrors: number`
- `errorsPerMinute: number`
- `averageResolutionTime: number`
- `criticalErrors: number`
- `servicesAffected: number`
- `topAffectedServices: Array`
- `alertsTriggered: number`
- `systemHealth: unknown`

**INTERFACE**: `DashboardData`
**Properties**:
- `overview: unknown`
- `recentErrors: unknown`
- `statistics: ErrorStats`
- `realTimeMetrics: RealTimeMetrics`
- `alerts: unknown`
- `forecasts?: unknown`

**INTERFACE**: `Alert`
**Properties**:
- `id: string`
- `ruleId: string`
- `ruleName: string`
- `severity: ErrorSeverity`
- `status: unknown`
- `triggeredAt: Date`
- `acknowledgedAt?: Date`
- `acknowledgedBy?: string`
- `resolvedAt?: Date`
- `resolvedBy?: string`
- `suppressedUntil?: Date`
- `error: SlackErrorReport`
- `channels: unknown`
- `escalationLevel: number`
- `escalationHistory: Array`
- `metadata: unknown`

**INTERFACE**: `ErrorStorage`
**INTERFACE**: `ErrorFilters`
**Properties**:
- `from?: Date`
- `to?: Date`
- `service?: string`
- `services?: unknown`
- `severity?: ErrorSeverity`
- `severities?: unknown`
- `source?: ErrorSource`
- `sources?: unknown`
- `resolved?: boolean`
- `fingerprint?: string`
- `fingerprints?: unknown`
- `limit?: number`
- `offset?: number`
- `sortBy?: unknown`
- `sortOrder?: unknown`
- `searchText?: string`

**INTERFACE**: `StorageStats`
**Properties**:
- `totalErrors: number`
- `storageSize: number`
- `oldestError?: Date`
- `newestError?: Date`
- `byService: Record`
- `bySeverity: Record`
- `memoryUsage?: unknown`

**INTERFACE**: `ForecastDataPoint`
**Properties**:
- `timestamp: Date`
- `predicted: number`
- `confidence: number`
- `upperBound: number`
- `lowerBound: number`

**INTERFACE**: `TrendAnalysis`
**Properties**:
- `direction: unknown`
- `strength: number`
- `confidence: number`
- `changeRate: number`
- `seasonality: unknown`

**INTERFACE**: `AnomalyDetection`
**Properties**:
- `isAnomaly: boolean`
- `severity: unknown`
- `score: number`
- `expectedRange: unknown`
- `actualValue: number`
- `timestamp: Date`

**INTERFACE**: `ForecastResult`
**Properties**:
- `service: string`
- `severity?: ErrorSeverity`
- `forecast: unknown`
- `trend: TrendAnalysis`
- `anomalies: unknown`
- `recommendations: unknown`
- `generatedAt: Date`
- `validUntil: Date`

**INTERFACE**: `ForecastSummary`
**Properties**:
- `overallTrend: TrendAnalysis`
- `criticalForecasts: unknown`
- `anomalyCount: number`
- `recommendations: unknown`

**INTERFACE**: `ErrorResolution`
**Properties**:
- `id: string`
- `errorId: string`
- `resolvedBy: string`
- `resolvedAt: Date`
- `resolution: unknown`
- `timeToResolve: number`
- `relatedIssues?: unknown`
- `followUpRequired: boolean`

**INTERFACE**: `ErrorPattern`
**Properties**:
- `fingerprint: string`
- `signature: string`
- `service: string`
- `source: ErrorSource`
- `firstSeen: Date`
- `lastSeen: Date`
- `occurrenceCount: number`
- `severity: ErrorSeverity`
- `isResolved: boolean`
- `resolvedAt?: Date`
- `tags: unknown`

**INTERFACE**: `NotificationPayload`
**Properties**:
- `type: unknown`
- `priority: unknown`
- `title: string`
- `message: string`
- `data: unknown`
- `channels: unknown`
- `metadata: unknown`

**INTERFACE**: `RateLimitTracker`
**Properties**:
- `key: string`
- `count: number`
- `windowStart: Date`
- `windowDuration: number`
- `limit: number`

**INTERFACE**: `EscalationRule`
**Properties**:
- `id: string`
- `name: string`
- `enabled: boolean`
- `conditions: unknown`
- `levels: Array`
- `schedule: unknown`

**INTERFACE**: `ModuleHealth`
**Properties**:
- `module: string`
- `status: unknown`
- `lastCheck: Date`
- `metrics: unknown`
- `issues: Array`

**INTERFACE**: `SystemHealth`
**Properties**:
- `overall: unknown`
- `modules: unknown`
- `dependencies: Array`
- `alerts: unknown`
- `performance: unknown`

**INTERFACE**: `ConfigValidationResult`
**Properties**:
- `isValid: boolean`
- `errors: Array`
- `warnings: Array`

**INTERFACE**: `CleanupResult`
**Properties**:
- `operation: string`
- `startTime: Date`
- `endTime: Date`
- `duration: number`
- `itemsProcessed: number`
- `itemsRemoved: number`
- `errors: Array`
- `success: boolean`

**INTERFACE**: `ExportSummary`
**Properties**:
- `format: unknown`
- `filters: ErrorFilters`
- `totalRecords: number`
- `exportedRecords: number`
- `fileSize: number`
- `generatedAt: Date`
- `downloadUrl?: string`
- `expiresAt?: Date`

**INTERFACE**: `ImportResult`
**Properties**:
- `format: unknown`
- `totalRecords: number`
- `successfulImports: number`
- `failedImports: number`
- `duplicatesSkipped: number`
- `errors: Array`
- `warnings: Array`
- `startTime: Date`
- `endTime: Date`
- `duration: number`

**INTERFACE**: `ErrorReportingEvent`
**Properties**:
- `type: unknown`
- `timestamp: Date`
- `source: string`
- `data: unknown`
- `metadata: unknown`

**INTERFACE**: `EventHandler`
**INTERFACE**: `ErrorReportingPlugin`
**Properties**:
- `name: string`
- `version: string`
- `enabled: boolean`

**TYPE**: `PartialUpdate`
**TYPE**: `RequiredFields`
**TYPE**: `OptionalFields`
---

## 🔗 Dependencies
- `../../interfaces/slack-error-reporting.interface`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/25/2025, 10:39:06 AM*
