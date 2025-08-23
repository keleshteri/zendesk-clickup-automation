# Slack Core Module Map

## Overview
This folder contains the core Slack integration components including API clients, security services, message builders, and socket connections that form the foundation of the Slack integration.

## File Structure

### API & Communication
- **`slack-api-client.ts`** - Main Slack Web API client wrapper
- **`slack-socket-client.ts`** - Socket Mode client for real-time events
- **`slack-socket-service.ts`** - Socket connection management and event handling

### App Management
- **`slack-app-manifest-client.ts`** - Slack App manifest API client
- **`slack-app-manifest-service.ts`** - App configuration and manifest management

### Core Services
- **`slack-message-builder.ts`** - Message construction and formatting utilities
- **`slack-security-service.ts`** - Authentication, authorization, and security validation

## Component Relationships

```
core/
├── slack-api-client.ts (Web API wrapper)
├── slack-socket-client.ts (Socket Mode client)
├── slack-socket-service.ts (Socket management)
├── slack-app-manifest-client.ts (App manifest API)
├── slack-app-manifest-service.ts (App management)
├── slack-message-builder.ts (Message construction)
└── slack-security-service.ts (Security & auth)
```

## Dependencies
- **External**: @slack/web-api, @slack/socket-mode, @slack/types
- **Internal**: ../config, ../types, ../utils
- **Project**: src/config, src/types

## Usage Patterns
- API clients are used by all service layers
- Message builder is used by handlers and notifications
- Security service validates all incoming requests
- Socket services handle real-time event processing

## Key Responsibilities
- **API Client**: HTTP requests to Slack Web API
- **Socket Client**: Real-time bidirectional communication
- **Socket Service**: Event routing and connection management
- **App Manifest**: App configuration and deployment
- **Message Builder**: Consistent message formatting
- **Security Service**: Request validation and authentication

## Integration Points
- **Handlers**: Use API clients and message builders
- **Notifications**: Leverage message builders and API clients
- **Threads**: Utilize API clients for thread management
- **Services**: All upper-layer services depend on core components

## Security Considerations
- All API calls must go through security validation
- Socket connections require proper authentication
- Message builders should sanitize input data
- App manifest changes require careful review

## Performance Notes
- API clients should implement rate limiting
- Socket connections need reconnection logic
- Message builders should cache templates
- Security validation should be optimized for high throughput