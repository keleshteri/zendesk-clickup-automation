# Slack Integration Module

A comprehensive Slack integration module for the Zendesk-ClickUp automation system. This module provides complete Slack bot functionality with advanced features for enterprise automation workflows.

## Features

- 🤖 **Bot Integration**: Complete Slack bot implementation with event handling
- 💬 **Welcome Messages**: Automatic welcome messages when bot joins channels
- 🎯 **Mention Handling**: Intelligent bot mention processing with command support
- 📝 **Message Templates**: Advanced templating system with variable substitution and blocks
- 🔧 **Error Handling**: Robust error handling with custom Slack error types
- 🎨 **Rich Messages**: Full support for Slack blocks, attachments, and interactive elements
- ⚡ **TypeScript**: Complete TypeScript support with comprehensive interfaces
- 🔗 **API Integration**: Seamless integration with Slack Web API and Events API
- 🛡️ **Security**: Request verification and secure token handling
- 📊 **Monitoring**: Built-in health checks and status monitoring

## Quick Start

### 1. Basic Setup

```typescript
import { createSlackModule, createBasicSlackConfig } from './domains/slack/slack.module.js';

// Create basic configuration
const config = createBasicSlackConfig({
  botToken: 'xoxb-your-bot-token',
  signingSecret: 'your-signing-secret',
  botUserId: 'U1234567890',
  botName: 'MyBot',
  port: 3000
});

// Initialize the Slack module
const slackModule = createSlackModule(config);

// Start the bot
await slackModule.start();
console.log('🚀 Slack bot is running!');
```

## Documentation

### 📚 Complete Documentation

- **[Usage Examples](./examples/usage-examples.md)** - Comprehensive examples for all use cases
- **[API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Architecture Overview](#architecture)** - System design and components
- **[Migration Guide](./examples/migration-guide.md)** - Socket Mode to HTTP webhooks migration
- **[Cloudflare Integration](./docs/cloudflare-integration.md)** - Cloudflare Workers deployment guide

### 🚀 Quick Links

- [Basic Bot Setup](./examples/usage-examples.md#basic-bot-setup)
- [Message Templates](./examples/usage-examples.md#message-templates)
- [Event Handling](./examples/usage-examples.md#event-handling)
- [Advanced Workflows](./examples/usage-examples.md#advanced-workflows)
- [Error Handling](./examples/usage-examples.md#error-handling)
- [Testing Examples](./examples/usage-examples.md#testing-examples)
- [Migration Steps](./examples/migration-guide.md#step-by-step-migration)

### 2. Advanced Configuration

```typescript
import { SlackModule } from './domains/slack/slack.module.js';
import { LogLevel } from '@slack/bolt';

const slackModule = new SlackModule({
  botToken: 'xoxb-your-bot-token',
  signingSecret: 'your-signing-secret',
  botUserId: 'U1234567890',
  botName: 'AdvancedBot',
  port: 3000,
  logLevel: LogLevel.DEBUG,
  // HTTP webhook mode (Cloudflare Workers compatible)
  
  // Welcome message configuration
  enableWelcomeMessages: true,
  welcomeConfig: {
    templateId: 'welcome-detailed',
    variables: {
      companyName: 'Your Company'
    }
  },
  
  // Mention handling configuration
  enableMentionHandling: true,
  mentionConfig: {
    botName: 'AdvancedBot',
    enableHelp: true,
    enableStatus: true,
    enableGreeting: true,
    unknownCommandResponse: true
  }
});

await slackModule.start();
```

## Core Components

### SlackModule

The main module that orchestrates all Slack functionality.

#### Service Architecture

- **SlackService**: Cloudflare Workers-compatible service using HTTP webhooks

```typescript
// Get individual services
const bot = slackModule.getBot();
const messaging = slackModule.getMessagingService();
const templates = slackModule.getTemplateManager();
const mentionHandler = slackModule.getMentionHandler();

// Send messages
await slackModule.sendMessage('C1234567890', 'Hello, World!');

// Send welcome message
await slackModule.sendWelcomeMessage('C1234567890', {
  templateId: 'welcome-basic',
  variables: { botName: 'MyBot' }
});
```

### Message Templates

The module includes a powerful templating system with default templates:

#### Available Default Templates

- `welcome-basic`: Simple welcome message
- `welcome-detailed`: Comprehensive welcome with interactive elements
- `mention-greeting`: Friendly response to bot mentions
- `help-command`: Shows available commands
- `bot-status`: Displays bot status and health
- `unknown-command`: Response for unrecognized commands
- `error-generic`: Generic error message
- `success-generic`: Generic success message

#### Using Templates

```typescript
const templateManager = slackModule.getTemplateManager();

// Render a template
const rendered = await templateManager.renderTemplate('welcome-basic', {
  botName: 'MyBot',
  channelName: 'general'
});

// Register custom template
await templateManager.registerTemplate({
  id: 'custom-greeting',
  name: 'Custom Greeting',
  description: 'A custom greeting message',
  category: 'CUSTOM',
  text: 'Hello {{userName}}! Welcome to {{channelName}}!',
  defaultVariables: {
    userName: 'User',
    channelName: 'Channel'
  }
});
```

### Custom Commands

Register custom command handlers for bot mentions:

```typescript
// Register a custom command
slackModule.registerCommand('weather', async (context, args) => {
  const location = args.join(' ') || 'New York';
  
  return await slackModule.getMessagingService().sendMessage({
    channel: context.channel,
    text: `🌤️ Weather in ${location}: Sunny, 72°F (This is a mock response)`,
    threadTs: context.threadTs
  });
});

// Register a command with rich blocks
slackModule.registerCommand('ticket', async (context, args) => {
  return await slackModule.getMessagingService().sendMessage({
    channel: context.channel,
    text: 'Create a new ticket',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🎫 *Create a New Ticket*'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Ticket'
            },
            action_id: 'create_ticket',
            value: 'create_ticket'
          }
        ]
      }
    ],
    threadTs: context.threadTs
  });
});
```

## Built-in Commands

The module comes with several built-in commands:

- `@bot help` - Show available commands
- `@bot status` - Display bot status and uptime
- `@bot ping` - Simple ping/pong response
- `@bot hello/hi/hey` - Friendly greeting
- `@bot ticket create/status` - Zendesk ticket operations (mock)
- `@bot task create/status` - ClickUp task operations (mock)

## Message Types

### Basic Messages

```typescript
const messaging = slackModule.getMessagingService();

// Simple text message
await messaging.sendMessage({
  channel: 'C1234567890',
  text: 'Hello, World!'
});

// Message with blocks
await messaging.sendMessage({
  channel: 'C1234567890',
  text: 'Fallback text',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Bold text* and _italic text_'
      }
    }
  ]
});
```

### Direct Messages

```typescript
// Send DM to user
await messaging.sendDirectMessage({
  userId: 'U1234567890',
  text: 'This is a private message'
});
```

### Ephemeral Messages

```typescript
// Send message only visible to specific user
await messaging.sendEphemeralMessage({
  channel: 'C1234567890',
  user: 'U1234567890',
  text: 'Only you can see this message'
});
```

### Reactions

```typescript
// Add reaction to message
await messaging.addReaction({
  channel: 'C1234567890',
  timestamp: '1234567890.123456',
  name: 'thumbsup'
});

// Remove reaction
await messaging.removeReaction({
  channel: 'C1234567890',
  timestamp: '1234567890.123456',
  name: 'thumbsup'
});
```

## Error Handling

The module provides comprehensive error handling:

```typescript
try {
  await slackModule.sendMessage('invalid-channel', 'Test message');
} catch (error) {
  if (error instanceof SlackChannelError) {
    console.error('Channel error:', error.message);
  } else if (error instanceof SlackApiError) {
    console.error('API error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Types

- `SlackError` - Base error class
- `SlackApiError` - Slack API errors
- `SlackAuthError` - Authentication errors
- `SlackChannelError` - Channel-related errors
- `SlackConfigError` - Configuration errors
- `SlackEventError` - Event handling errors
- `SlackTemplateError` - Template errors
- `SlackValidationError` - Validation errors
- `SlackBotError` - Bot-specific errors

## Event Handling

Listen to custom Slack events:

```typescript
const bot = slackModule.getBot();

// Listen to channel creation
bot.addEventListener('channel_created', async ({ event }) => {
  console.log('New channel created:', event.channel.name);
});

// Listen to user joins
bot.addEventListener('team_join', async ({ event }) => {
  console.log('New user joined:', event.user.name);
});
```

## Configuration Options

### SlackModuleConfig

```typescript
interface SlackModuleConfig {
  // Required
  botToken: string;              // Bot User OAuth Token
  signingSecret: string;         // Signing Secret
  botUserId: string;            // Bot User ID
  
  // Optional
  botName?: string;             // Bot display name
  // Note: Socket Mode not supported in Cloudflare Workers
  port?: number;                // Server port (default: 3000)
  logLevel?: LogLevel;          // Logging level
  receiver?: ExpressReceiver;   // Custom receiver
  
  // Feature toggles
  enableWelcomeMessages?: boolean;    // Enable welcome messages
  enableMentionHandling?: boolean;    // Enable mention handling
  
  // Configuration objects
  welcomeConfig?: WelcomeConfig;      // Welcome message config
  mentionConfig?: MentionConfig;      // Mention handling config
}
```

### WelcomeConfig

```typescript
interface WelcomeConfig {
  templateId?: string;          // Template to use
  channelName?: string;         // Channel name for template
  variables?: Record<string, any>; // Template variables
}
```

### MentionConfig

```typescript
interface MentionConfig {
  botName?: string;             // Bot name for responses
  enableHelp?: boolean;         // Enable help command
  enableStatus?: boolean;       // Enable status command
  enableGreeting?: boolean;     // Enable greeting responses
  unknownCommandResponse?: boolean; // Respond to unknown commands
}
```

## Best Practices

1. **Environment Variables**: Store sensitive tokens in environment variables
2. **Error Handling**: Always wrap Slack operations in try-catch blocks
3. **Rate Limiting**: Be mindful of Slack's rate limits
4.5. **HTTP Webhooks**: Use HTTP webhooks for Cloudflare Workers compatibility **Templates**: Use templates for consistent messaging
6. **Logging**: Enable appropriate logging levels for debugging

## Example: Complete Bot Setup

```typescript
import { createSlackModule, createBasicSlackConfig } from './domains/slack/slack.module.js';
import { LogLevel } from '@slack/bolt';

async function setupSlackBot() {
  // Create configuration
  const config = createBasicSlackConfig({
    botToken: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    botUserId: process.env.SLACK_BOT_USER_ID!,
    botName: 'ZendeskClickUpBot',
    port: parseInt(process.env.PORT || '3000')
  });

  // Initialize module
  const slackModule = createSlackModule({
    ...config,
    logLevel: LogLevel.INFO,
    welcomeConfig: {
      templateId: 'welcome-detailed',
      variables: {
        companyName: 'Your Company'
      }
    }
  });

  // Register custom commands
  slackModule.registerCommand('deploy', async (context, args) => {
    return await slackModule.getMessagingService().sendMessage({
      channel: context.channel,
      text: '🚀 Deployment started! I\'ll notify you when it\'s complete.',
      threadTs: context.threadTs
    });
  });

  // Start the bot
  await slackModule.start();
  console.log('🤖 Slack bot is ready!');

  return slackModule;
}

// Usage
setupSlackBot().catch(console.error);
```

## Troubleshooting

### Common Issues

1. **Bot not responding to mentions**
   - Verify `botUserId` is correct
   - Check bot has necessary permissions
   - Ensure bot is added to the channel

2. **Welcome messages not sending**
   - Verify `member_joined_channel` event subscription
   - Check bot permissions in the channel
   - Ensure welcome messages are enabled

3. **Template errors**
   - Verify template ID exists
   - Check variable names match template
   - Ensure template is properly registered

4. **Connection issues**
   - Verify tokens are correct
   - Check network connectivity
   - Review Slack app configuration

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const slackModule = createSlackModule({
  // ... other config
  logLevel: LogLevel.DEBUG
});
```

## License

This module is part of the Zendesk-ClickUp automation project.