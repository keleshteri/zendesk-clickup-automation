# Slack Error Reporting System

A comprehensive error reporting and monitoring system for the Zendesk-ClickUp automation project that integrates with Slack for real-time notifications and analytics.

## Overview

The Slack Error Reporting System provides:
- **Real-time error tracking** with Slack notifications
- **Error categorization** and severity levels
- **Persistent storage** with KV storage backend
- **Analytics and metrics** for error monitoring
- **Configurable alerting** with environment-based settings
- **Comprehensive testing** suite

## Architecture

```
src/services/integrations/slack/
├── slack-error-reporting.service.ts     # Main service class
├── slack-error-reporting.interface.ts   # Type definitions
├── slack-error-categorizer.util.ts      # Error categorization
├── slack-error-reporter.util.ts         # Slack reporting utilities
├── slack-error.utils.ts                 # General utilities
└── slack-error.interface.ts             # Additional interfaces

src/config/
└── error-reporting.config.ts            # Configuration management
```

## Quick Start

### 1. Basic Usage

```typescript
import { SlackErrorReportingService } from '@/services/integrations/slack/slack-error-reporting.service';
import { ErrorSeverity, ErrorCategory } from '@/services/integrations/slack/slack-error-reporting.interface';

// Initialize the service
const errorReporter = new SlackErrorReportingService(
  env,           // Environment variables
  kvStorage,     // KV storage instance
  slackService,  // Slack service instance
  messagingService // Messaging service instance
);

// Report an error
const errorReport = await errorReporter.reportError({
  error: new Error('Something went wrong'),
  category: ErrorCategory.INTEGRATION,
  severity: ErrorSeverity.HIGH,
  source: 'zendesk-sync',
  context: {
    userId: '12345',
    ticketId: 'ZD-789',
    operation: 'sync_ticket'
  }
});

console.log('Error reported:', errorReport.id);
```

### 2. Error Categories

```typescript
enum ErrorCategory {
  SYSTEM = 'system',           // System-level errors
  INTEGRATION = 'integration', // External API errors
  VALIDATION = 'validation',   // Data validation errors
  AUTHENTICATION = 'auth',     // Authentication errors
  AUTHORIZATION = 'authz',     // Authorization errors
  BUSINESS_LOGIC = 'business', // Business rule violations
  PERFORMANCE = 'performance', // Performance issues
  SECURITY = 'security',       // Security-related errors
  CONFIGURATION = 'config',    // Configuration errors
  UNKNOWN = 'unknown'          // Unclassified errors
}
```

### 3. Severity Levels

```typescript
enum ErrorSeverity {
  CRITICAL = 'critical', // System down, immediate action required
  HIGH = 'high',         // Major functionality affected
  MEDIUM = 'medium',     // Minor functionality affected
  LOW = 'low',           // Minimal impact
  INFO = 'info'          // Informational only
}
```

## Configuration

### Environment Variables

The system uses existing Slack channel environment variables:

```bash
# Slack Channels (used for error alerts)
SLACK_MANAGEMENT_CHANNEL="#management"
SLACK_DEVELOPMENT_CHANNEL="#development"
SLACK_SUPPORT_CHANNEL="#support"
SLACK_BILLING_CHANNEL="#billing"
SLACK_DEFAULT_CHANNEL="#general"

# Environment
ENVIRONMENT="development" # development | staging | production
```

### Configuration Profiles

The system automatically configures based on the environment:

#### Development
- **Max Stored Errors**: 1,000
- **Retention**: 7 days
- **Alert Threshold**: MEDIUM
- **Rate Limiting**: 10 errors/minute

#### Staging
- **Max Stored Errors**: 5,000
- **Retention**: 14 days
- **Alert Threshold**: HIGH
- **Rate Limiting**: 5 errors/minute

#### Production
- **Max Stored Errors**: 10,000
- **Retention**: 30 days
- **Alert Threshold**: HIGH
- **Rate Limiting**: 3 errors/minute

## API Reference

### SlackErrorReportingService

#### Methods

##### `reportError(options: ErrorReportOptions): Promise<SlackErrorReport>`

Reports a new error to the system.

**Parameters:**
- `error: Error` - The error object
- `category: ErrorCategory` - Error category
- `severity: ErrorSeverity` - Error severity level
- `source: string` - Source component/service
- `context?: Record<string, any>` - Additional context
- `tags?: string[]` - Optional tags
- `userId?: string` - Associated user ID

**Returns:** Promise resolving to the created error report

##### `getErrorById(id: string): Promise<SlackErrorReport | null>`

Retrieves an error report by ID.

##### `getErrorsByCategory(category: ErrorCategory): Promise<SlackErrorReport[]>`

Retrieves all errors for a specific category.

##### `getErrorsBySeverity(severity: ErrorSeverity): Promise<SlackErrorReport[]>`

Retrieves all errors for a specific severity level.

##### `resolveError(id: string, method: string, details?: string): Promise<void>`

Marks an error as resolved.

##### `getErrorStatistics(): Promise<ErrorStatistics>`

Retrieves comprehensive error statistics.

##### `getAnalyticsDashboard(): Promise<AnalyticsDashboard>`

Retrieves analytics dashboard data.

##### `cleanup(): Promise<void>`

Cleans up old error reports based on retention policy.

## Error Context

Provide rich context to help with debugging:

```typescript
const context = {
  // User information
  userId: 'user_123',
  userEmail: 'user@example.com',
  
  // Request information
  requestId: 'req_456',
  endpoint: '/api/tickets/sync',
  method: 'POST',
  
  // Business context
  ticketId: 'ZD-789',
  organizationId: 'org_101',
  
  // Technical context
  version: '1.2.3',
  environment: 'production',
  timestamp: new Date().toISOString(),
  
  // Additional metadata
  retryCount: 2,
  processingTime: 1500
};

await errorReporter.reportError({
  error: new Error('Sync failed'),
  category: ErrorCategory.INTEGRATION,
  severity: ErrorSeverity.HIGH,
  source: 'zendesk-sync',
  context,
  tags: ['sync', 'zendesk', 'retry-failed']
});
```

## Analytics and Monitoring

### Error Statistics

```typescript
const stats = await errorReporter.getErrorStatistics();

console.log('Total errors:', stats.totalErrors);
console.log('Errors by category:', stats.errorsByCategory);
console.log('Errors by severity:', stats.errorsBySeverity);
console.log('Recent trends:', stats.trends);
```

### Analytics Dashboard

```typescript
const dashboard = await errorReporter.getAnalyticsDashboard();

console.log('Error trends:', dashboard.errorTrends);
console.log('Top error sources:', dashboard.topErrorSources);
console.log('Resolution metrics:', dashboard.resolutionMetrics);
console.log('Real-time metrics:', dashboard.realTimeMetrics);
```

## Slack Integration

### Alert Channels

Errors are routed to appropriate Slack channels based on:
- **Severity level**
- **Error category**
- **Environment configuration**

### Message Format

Slack error messages include:
- **Error summary** with severity indicator
- **Source and category** information
- **Context details** in thread
- **Quick action buttons** for resolution
- **Analytics links** for deeper investigation

### Rate Limiting

To prevent spam, the system implements:
- **Per-minute rate limits** based on environment
- **Duplicate error detection** and grouping
- **Escalation rules** for repeated errors

## Testing

### Unit Tests

```bash
# Run error reporting tests
npm test -- --grep "SlackErrorReportingService"

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### Test Examples

```typescript
import { SlackErrorReportingService } from '@/services/integrations/slack/slack-error-reporting.service';

describe('SlackErrorReportingService', () => {
  let service: SlackErrorReportingService;
  let mockKV: any;
  let mockSlack: any;
  
  beforeEach(() => {
    // Setup mocks
    mockKV = createMockKVStorage();
    mockSlack = createMockSlackService();
    
    service = new SlackErrorReportingService(
      mockEnv,
      mockKV,
      mockSlack,
      mockMessaging
    );
  });
  
  it('should report errors correctly', async () => {
    const error = new Error('Test error');
    
    const report = await service.reportError({
      error,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      source: 'test'
    });
    
    expect(report.id).toBeDefined();
    expect(report.error.message).toBe('Test error');
    expect(mockSlack.sendMessage).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Error Categorization

- Use specific categories for better analytics
- Consistent categorization across the codebase
- Regular review of category effectiveness

### 2. Context Enrichment

- Include relevant business context
- Add technical debugging information
- Use consistent context structure

### 3. Severity Assignment

- **CRITICAL**: System completely down
- **HIGH**: Major feature broken
- **MEDIUM**: Minor feature affected
- **LOW**: Edge case or cosmetic issue
- **INFO**: Informational logging

### 4. Performance Considerations

- Use async reporting to avoid blocking
- Implement proper error handling in error reporting
- Monitor storage usage and cleanup regularly

### 5. Security

- Sanitize sensitive data from error context
- Use appropriate log levels for different environments
- Implement access controls for error data

## Troubleshooting

### Common Issues

#### 1. Slack Messages Not Sending

```typescript
// Check Slack service configuration
const config = await errorReporter.getConfigSummary();
console.log('Slack channels:', config.alerts.alertChannels);

// Verify Slack service is working
if (!slackService.isConfigured()) {
  console.error('Slack service not properly configured');
}
```

#### 2. Storage Issues

```typescript
// Check KV storage connectivity
try {
  await kvStorage.get('test-key');
  console.log('KV storage is accessible');
} catch (error) {
  console.error('KV storage error:', error);
}
```

#### 3. Rate Limiting

```typescript
// Check if rate limiting is affecting reports
const stats = await errorReporter.getErrorStatistics();
if (stats.rateLimitedErrors > 0) {
  console.warn('Some errors were rate limited');
}
```

### Debug Mode

```typescript
// Enable debug logging
const service = new SlackErrorReportingService(
  env,
  kvStorage,
  slackService,
  messagingService,
  { debug: true } // Enable debug mode
);
```

## Migration Guide

### From Basic Error Logging

```typescript
// Before: Basic console logging
console.error('Error occurred:', error);

// After: Structured error reporting
await errorReporter.reportError({
  error,
  category: ErrorCategory.SYSTEM,
  severity: ErrorSeverity.HIGH,
  source: 'component-name',
  context: { /* relevant context */ }
});
```

### From Custom Slack Integration

```typescript
// Before: Direct Slack API calls
await slackService.sendMessage({
  channel: '#errors',
  text: `Error: ${error.message}`
});

// After: Structured error reporting
await errorReporter.reportError({
  error,
  category: ErrorCategory.INTEGRATION,
  severity: ErrorSeverity.MEDIUM,
  source: 'legacy-component'
});
```

## Contributing

### Adding New Error Categories

1. Update `ErrorCategory` enum in `slack-error-reporting.interface.ts`
2. Add categorization logic in `slack-error-categorizer.util.ts`
3. Update tests and documentation
4. Consider alert routing implications

### Extending Analytics

1. Add new metrics to `ErrorStatistics` interface
2. Implement calculation logic in service
3. Update dashboard components
4. Add corresponding tests

### Custom Alert Rules

1. Extend `ErrorAlertConfig` interface
2. Implement rule logic in service
3. Update configuration management
4. Test with various scenarios

## Support

For issues or questions:
1. Check this documentation
2. Review existing error reports in Slack
3. Check the analytics dashboard
4. Contact the development team

---

*This documentation is maintained as part of the Zendesk-ClickUp automation project. Last updated: 2024-01-24*