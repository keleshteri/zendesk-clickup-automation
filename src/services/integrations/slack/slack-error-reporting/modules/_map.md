# 📁 modules Module Map

> **Purpose**: Class-based components and services

## 📊 Quick Stats
- **Files**: 5
- **Classes**: 5
- **Interfaces**: 0
- **Functions**: 0

## 🗂️ Files Overview

### `error-alerting.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `ErrorAlerting`
**Methods**:
- `constructor(persistence, config)`
- `processErrorForAlerting(error)`
- `private getMatchingRules(error)`
- `private isRateLimited(error)`
- `sendAlert(error)`
- `private sendAlertWithRule(error, rule)`
- `private sendToChannel(error, rule, channel, alertStatus)`
- `private formatAlertMessage(error, rule, channel)`
- `private getTemplate(severity)`
- `private sendSlackAlert(target, message, error)`
- `private sendEmailAlert(target, message, error)`
- `private sendWebhookAlert(target, message, error)`
- `private sendPagerDutyAlert(target, message, error)`
- `private setupEscalation(error)`
- `private executeEscalation(error, rule)`
- `private executeEscalationAction(error, action, rule)`
- `acknowledgeAlert(alertId, acknowledgedBy)`
- `sendResolutionNotification(error)`
- `private updateRateLimitTrackers(error)`
- `private generateAlertId(error, rule)`
- `private formatDuration(milliseconds)`
- `private mergeWithDefaultConfig(config)`
- `getAlertHistory(filters)`
- `updateConfig(newConfig)`
- `getConfig()`
- `shouldSendAlert(error)`
- `cleanup()`

**Properties**:
- `persistence: ErrorPersistence`
- `config: AlertConfig`
- `alertHistory: Map`
- `rateLimitTracker: Map`
- `escalationTimers: Map`

---

### `error-analytics.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `ErrorAnalytics`
**Methods**:
- `constructor(persistence)`
- `getStatistics(timeRange)`
- `private calculateStatistics(errors, timeRange)`
- `private calculateSeverityBreakdown(errors)`
- `private calculateServiceBreakdown(errors)`
- `private calculateErrorRate(errors, timeRange)`
- `private getTopErrors(errors)`
- `private calculateCategoryBreakdown(errors)`
- `private calculateTrends(errors)`
- `private getWeekKey(date)`
- `private getWeekNumber(date)`
- `getRealTimeMetrics()`
- `private calculateAverageResponseTime(errors)`
- `getAnalyticsDashboard(timeRange)`
- `private getErrorPatterns(timeRange)`
- `private calculateTrend(timestamps, timeRange)`
- `private getServiceHealth(timeRange)`
- `private getResolutionMetrics(timeRange)`
- `private getEmptyStatistics()`
- `private getCachedData(key)`
- `private setCachedData(key, data, ttl)`
- `private cleanupCache()`

**Properties**:
- `persistence: ErrorPersistence`
- `metricsCache: Map`
- `CACHE_TTL: unknown`

---

### `error-forecasting.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `ErrorForecasting`
**Methods**:
- `constructor(persistence, analytics, config)`
- `generateForecast(param)`
- `private performForecasting(historicalData, options)`
- `private analyzeTrend(data)`
- `private detectSeasonality(data)`
- `private calculateAutocorrelation(values, lag)`
- `private detrend(values)`
- `private detectAnomalies(data)`
- `private generateForecastPoints(historicalData, forecastHours, trend)`
- `private calculateStandardDeviation(values)`
- `private generateRecommendations(trend, anomalies, forecast)`
- `private getHistoricalData(timeRange, options)`
- `private getDefaultTimeRange()`
- `private generateCacheKey(options)`
- `private getCachedForecast(key)`
- `private setCachedForecast(key, result)`
- `private cleanupCache()`
- `private mergeWithDefaultConfig(config)`
- `updateConfig(newConfig)`
- `getConfig()`
- `getForecastSummary(services)`
- `private calculateOverallTrend(forecasts)`

**Properties**:
- `persistence: ErrorPersistence`
- `analytics: ErrorAnalytics`
- `config: ForecastConfig`
- `forecastCache: Map`
- `CACHE_TTL: unknown`

---

### `error-persistence.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `ErrorPersistence`
**Methods**:
- `constructor(env, config)`
- `private initializeStorage()`
- `private loadExistingErrors()`
- `private loadFromKV()`
- `storeError(error)`
- `private persistToStorage(error)`
- `private storeInKV(error)`
- `private storeInDatabase(error)`
- `updateError(error)`
- `getError(errorId)`
- `private loadErrorFromStorage(errorId)`
- `findErrorByFingerprint(fingerprint)`
- `private searchByFingerprintInStorage(fingerprint)`
- `getErrors(param)`
- `private applyFilters(errors, filters)`
- `getErrorCount(param)`
- `deleteErrorsBefore(cutoffDate)`
- `deleteError(errorId)`
- `private deleteFromStorage(errorId)`
- `getStorageStats()`
- `private estimateMemoryUsage()`
- `persistConfig(config)`
- `loadConfig()`
- `updateConfig(config)`
- `clearAllErrors()`

**Properties**:
- `env: Env`
- `config: ErrorReportingConfig`
- `errorStore: Map`
- `fingerprintIndex: Map`

---

### `error-reporting-core.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `ErrorReportingCore`
**Methods**:
- `constructor(persistence, config)`
- `reportError(error, source, param)`
- `private createErrorReport(error, source, param)`
- `private extractErrorDetails(error)`
- `private extractErrorCode(error)`
- `private determineSeverity(error, context)`
- `private inferErrorSource(error, stack)`
- `private extractServiceFromPath(filePath)`
- `private buildErrorContext(context, error)`
- `private generateErrorTags(error, source, context)`
- `private generateErrorFingerprint(error, source)`
- `private generateErrorId(error, timestamp)`
- `private hashString(str)`
- `private isSlackAPIError(error)`
- `private validateErrorReport(errorReport)`
- `private findDuplicateError(errorReport)`
- `private updateDuplicateError(existingError, newError)`
- `createFallbackErrorReport(originalError, source, context, reportingError)`
- `resolveError(errorId, resolution)`
- `cleanup()`
- `updateConfig(config)`
- `private categorizeError(error)`

**Properties**:
- `persistence: ErrorPersistence`
- `config: ErrorReportingConfig`

---

## 🔗 Dependencies
- `../../../../../types`
- `../../interfaces/slack-error-reporting.interface`
- `../../interfaces/slack-error.interface`
- `../types`
- `./error-analytics`
- `./error-persistence`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/25/2025, 10:39:03 AM*
