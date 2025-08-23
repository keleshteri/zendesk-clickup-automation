# Slack Utils Module Map

## Overview
This folder contains utility functions, constants, formatters, validators, and helper modules that provide common functionality across the Slack integration. These utilities ensure consistency, reusability, and maintainability throughout the codebase.

## File Structure

### Core Files
- **`index.ts`** - Main export file for all utility modules
- **`slack-constants.ts`** - Constants, enums, and configuration values
- **`slack-emojis.ts`** - Emoji mappings and utility functions
- **`slack-formatters.ts`** - Text and message formatting utilities
- **`slack-utilities.ts`** - General-purpose utility functions
- **`slack-validators.ts`** - Validation functions and schema validators

## Component Relationships

```
utils/
├── index.ts (exports all utilities)
├── slack-constants.ts (constants & enums)
├── slack-emojis.ts (emoji utilities)
├── slack-formatters.ts (formatting functions)
├── slack-utilities.ts (general utilities)
└── slack-validators.ts (validation functions)
```

## Dependencies
- **External**: @slack/types, lodash, date-fns
- **Internal**: ../types, ../config
- **Project**: src/types, src/utils

## Usage Patterns
- Utilities are imported by all other Slack modules
- Formatters are used by message builders and notifications
- Validators are used by handlers and security services
- Constants provide standardized values across components

## Key Utility Categories

### Constants (`slack-constants.ts`)
- **API_LIMITS**: Rate limits and API constraints
- **MESSAGE_LIMITS**: Character and block limits
- **EVENT_TYPES**: Standardized event type constants
- **CHANNEL_TYPES**: Channel type definitions
- **USER_ROLES**: User role and permission constants
- **ERROR_CODES**: Custom error code definitions

### Emojis (`slack-emojis.ts`)
- **STATUS_EMOJIS**: Status indicator emojis (✅, ❌, ⚠️)
- **PRIORITY_EMOJIS**: Priority level indicators
- **SERVICE_EMOJIS**: Service-specific emojis (Zendesk, ClickUp)
- **REACTION_EMOJIS**: Common reaction emojis
- **getEmojiForStatus()**: Dynamic emoji selection
- **formatWithEmoji()**: Add emojis to text

### Formatters (`slack-formatters.ts`)
- **formatUserMention()**: Create user mention strings
- **formatChannelLink()**: Create channel link strings
- **formatTimestamp()**: Format dates and times
- **formatCodeBlock()**: Create code block formatting
- **formatBold()**, **formatItalic()**: Text styling
- **formatList()**: Create formatted lists
- **truncateText()**: Text truncation with ellipsis

### Utilities (`slack-utilities.ts`)
- **parseSlackId()**: Extract IDs from Slack strings
- **isValidSlackId()**: Validate Slack ID formats
- **extractMentions()**: Find mentions in messages
- **sanitizeInput()**: Clean and sanitize user input
- **chunkArray()**: Split arrays for batch processing
- **retryWithBackoff()**: Retry logic with exponential backoff
- **generateThreadId()**: Create unique thread identifiers

### Validators (`slack-validators.ts`)
- **validateSlackEvent()**: Event payload validation
- **validateMessageFormat()**: Message structure validation
- **validateUserPermissions()**: Permission checking
- **validateChannelAccess()**: Channel access validation
- **validateWorkflowStep()**: Workflow step validation
- **isValidSlackUrl()**: URL format validation

## Integration Points
- **Core Services**: Use utilities for API interactions
- **Handlers**: Use validators and formatters
- **Notifications**: Use formatters and emojis
- **Threads**: Use utilities for thread management
- **Security**: Use validators for input validation

## Common Patterns

### Error Handling
```typescript
try {
  const result = await slackApiCall();
  return formatSuccessResponse(result);
} catch (error) {
  return formatErrorResponse(error);
}
```

### Message Formatting
```typescript
const message = formatMessage({
  text: formatBold('Important Update'),
  emoji: getEmojiForStatus('success'),
  timestamp: formatTimestamp(new Date())
});
```

### Validation Pipeline
```typescript
const isValid = validateSlackEvent(event) &&
                validateUserPermissions(user) &&
                validateChannelAccess(channel);
```

## Performance Optimizations
- **Memoization**: Cache expensive formatting operations
- **Batch Processing**: Utilities for handling multiple items
- **Lazy Loading**: Load utilities only when needed
- **String Pooling**: Reuse common string constants

## Security Features
- **Input Sanitization**: Prevent injection attacks
- **URL Validation**: Ensure safe link handling
- **Permission Checking**: Validate user access rights
- **Rate Limiting**: Utilities for API rate management

## Testing Utilities
- **Mock Generators**: Create test data
- **Assertion Helpers**: Custom test assertions
- **Fixture Builders**: Build test fixtures
- **Validation Helpers**: Test validation functions

## Configuration Management
- **Environment Variables**: Access configuration values
- **Feature Flags**: Toggle functionality
- **Default Values**: Provide sensible defaults
- **Validation Rules**: Configuration validation

## Maintenance Guidelines
- Keep utilities pure and side-effect free
- Maintain comprehensive test coverage
- Document all utility functions
- Regular performance profiling
- Consistent error handling patterns