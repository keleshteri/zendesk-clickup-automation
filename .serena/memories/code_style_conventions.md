# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2022 with modern JavaScript features
- **Module**: ES2022 with bundler resolution
- **Strict Mode**: Enabled with strict null checks
- **No Implicit Any**: Disabled for flexibility
- **Module Detection**: Forced for proper ESM handling

## Code Organization
### File Structure
```
src/
├── index.ts              # Main entry point and routing
├── types/
│   ├── index.ts          # Core type definitions
│   └── agents.ts         # Agent-specific types
├── services/             # Service layer
│   ├── ai.ts            # AI service integration
│   ├── slack.ts         # Slack API service
│   ├── zendesk.ts       # Zendesk API service
│   ├── multi-agent-service.ts  # Multi-agent orchestration
│   ├── clickup/         # ClickUp services
│   └── agents/          # Individual agent implementations
├── utils/
│   └── index.ts         # Utility functions
└── routes/
    └── agents.ts        # Agent-specific routes
```

## Naming Conventions
- **Files**: kebab-case (`multi-agent-service.ts`)
- **Classes**: PascalCase (`MultiAgentService`)
- **Functions**: camelCase (`processTicket`)
- **Constants**: UPPER_SNAKE_CASE (`WEBHOOK_SECRET`)
- **Interfaces**: PascalCase with descriptive names (`ZendeskTicket`, `ClickUpWebhook`)
- **Environment Variables**: UPPER_SNAKE_CASE (`ZENDESK_DOMAIN`)

## Error Handling
- Use `formatErrorResponse()` and `formatSuccessResponse()` utility functions
- Implement try-catch blocks around service calls
- Log errors with descriptive context using console.error
- Return appropriate HTTP status codes (400, 401, 500, 503)
- Include timestamps in all responses

## API Response Format
```typescript
// Success Response
{
  status: 'success',
  data: {...},
  message: 'Operation completed successfully',
  timestamp: '2024-01-15T10:30:00.000Z'
}

// Error Response
{
  error: 'Error Type',
  message: 'Descriptive error message',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Service Initialization Pattern
```typescript
// Graceful service initialization with error handling
let service: SomeService | null = null;
try {
  service = new SomeService(env);
} catch (error) {
  console.warn('Service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
}

// Check service availability before use
if (!service) {
  return new Response(JSON.stringify(formatErrorResponse('Service not available')), {
    status: 503,
    headers: corsHeaders
  });
}
```

## Logging Conventions
- Use emoji prefixes for different log types:
  - `🚀` for startup/initialization
  - `📧` for Zendesk events
  - `📋` for ClickUp operations
  - `💬` for Slack interactions
  - `🤖` for AI operations
  - `✅` for success operations
  - `⚠️` for warnings
  - `❌` for errors
  - `🔍` for debugging
  - `💾` for storage operations

## Environment Variable Handling
- Always check environment variables exist before using
- Provide meaningful error messages for missing config
- Use optional chaining and nullish coalescing
- Store secrets in Cloudflare Worker secrets (not environment variables)

## Import/Export Style
- Use ES6 import/export syntax
- Import from relative paths with `.js` extension for proper ESM support
- Export interfaces and types for reuse across modules
- Use named exports for utilities, default exports for main classes
