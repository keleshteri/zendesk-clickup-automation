# 📁 slack-error-reporting Module Map

> **Purpose**: Class-based components and services

## 📊 Quick Stats
- **Files**: 2
- **Classes**: 1
- **Interfaces**: 0
- **Functions**: 4

## 🗂️ Files Overview

### `error-reporting.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackErrorReportingService`
**Methods**:
- `constructor(client, env, config, messagingService)`
- `reportError(error, source, param)`
- `getErrors(param)`
- `getStatistics(timeRange)`
- `getRealTimeMetrics()`
- `getAnalyticsDashboard(timeRange)`
- `getErrorForecast(param)`
- `resolveError(errorId, resolution)`
- `getError(errorId)`
- `cleanup()`
- `updateConfig(config)`
- `getConfig()`
- `sendAlert(errorReport)`
- `private scheduleCleanup()`

**Properties**:
- `client: WebClient`
- `env: Env`
- `config: ErrorReportingConfig`
- `messagingService: unknown`
- `core: ErrorReportingCore`
- `analytics: ErrorAnalytics`
- `persistence: ErrorPersistence`
- `alerting: ErrorAlerting`
- `forecasting: ErrorForecasting`

---

### `index.ts`
**Purpose**: Utility functions and helpers | **Risk**: low

**FUNCTION**: `createErrorReportingService`
**CONST**: `DEFAULT_ERROR_REPORTING_CONFIG`
**FUNCTION**: `validateConfig`
**FUNCTION**: `mergeConfig`
**CONST**: `VERSION`
**CONST**: `MODULE_INFO`
**FUNCTION**: `getSystemHealth`
---

## 🔗 Dependencies
- `../../../../config/error-reporting.config`
- `../../../../types`
- `../interfaces/slack-error-reporting.interface`
- `../interfaces/slack-error.interface`
- `./modules/error-alerting`
- `./modules/error-analytics`
- `./modules/error-forecasting`
- `./modules/error-persistence`
- `./modules/error-reporting-core`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/25/2025, 10:38:21 AM*
