# Slack Messages Directory

This directory contains centralized Slack message templates and related services for the TaskGenie bot.

## Structure

```
messages/
├── index.ts                           # Barrel exports for all message templates
├── types.ts                           # TypeScript interfaces for message templates
├── welcome-message.template.ts        # Welcome message for new channel members
├── bot-intro-message.template.ts      # Bot introduction when joining channels
└── _map.md                           # This documentation file
```

## Components

### Message Templates
- **welcome-message.template.ts**: Template for welcoming new users to channels
- **bot-intro-message.template.ts**: Template for introducing TaskGenie when it joins a channel

### Types
- **types.ts**: Comprehensive TypeScript interfaces for Slack Block Kit messages
- Includes context interfaces for template rendering
- Provides type safety for message construction

### Message Builder Service
- **SlackMessageBuilderService**: Located in `../slack-service/slack-message-builder.service.ts`
- Renders templates with dynamic content
- Provides validation for required context fields
- Re-exported through `index.ts` for convenience

## Usage

```typescript
import { SlackMessageBuilderService } from '../messages';

const messageBuilder = new SlackMessageBuilderService();

// Build welcome message
const welcomeMessage = messageBuilder.buildWelcomeMessageSafe({
  channel: 'C1234567890',
  userId: 'U1234567890'
});

// Build bot intro message
const introMessage = messageBuilder.buildBotIntroMessageSafe({
  channel: 'C1234567890',
  teamName: 'Development Team'
});
```

## Benefits

1. **Centralized Management**: All message templates in one location
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Reusability**: Templates can be used across different services
4. **Maintainability**: Easy to update message content without touching service logic
5. **Consistency**: Standardized message structure and formatting
6. **Testability**: Templates can be unit tested independently

## Architecture

This follows the template pattern where:
- Templates define the structure and static content
- Context objects provide dynamic data
- The message builder service renders templates with context
- The messaging service uses the builder to send messages

This separation of concerns makes the codebase more maintainable and follows best practices for enterprise applications.