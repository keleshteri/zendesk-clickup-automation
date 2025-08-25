# 📁 endpoints Module Map

> **Purpose**: Mixed functionality - see individual files for details

## 📊 Quick Stats
- **Files**: 5
- **Classes**: 4
- **Interfaces**: 7
- **Functions**: 0

## 🗂️ Files Overview

### `commands-handler.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackCommandsHandler`
**Methods**:
- `constructor(options)`
- `handleCommand(context, ctx)`
- `private handleZendeskCommand(text, userId, channelId, context)`
- `private handleClickUpCommand(text, userId, channelId, context)`
- `private handleHelpCommand(text, userId, channelId, context)`
- `private handleStatusCommand(text, userId, channelId, context)`
- `private handleUnknownCommand(command, text, userId, channelId, context)`
- `private isCommandSupported(command)`
- `private createSuccessResponse(data)`
- `private createErrorResponse(message)`

**Properties**:
- `options: CommandHandlerOptions`

---

### `events-handler.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackEventsHandler`
**Methods**:
- `constructor(options)`
- `handleEvent(context, ctx)`
- `private handleAppMention(event, context, ctx)`
- `private handleMessage(event, context, ctx)`
- `private handleMemberJoined(event, context, ctx)`
- `private createSuccessResponse(data)`

**Properties**:
- `options: EventHandlerOptions`

---

### `interactions-handler.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackInteractionsHandler`
**Methods**:
- `constructor(options)`
- `handleInteraction(context, ctx)`
- `private handleBlockActions(payload, context)`
- `private handleInteractiveMessage(payload, context)`
- `private handleViewSubmission(payload, context)`
- `private handleViewClosed(payload, context)`
- `private handleShortcut(payload, context)`
- `private handleUnknownInteraction(interactionType, payload, context)`
- `private isInteractionSupported(interactionType)`
- `private createSuccessResponse(data)`
- `private createErrorResponse(message)`

**Properties**:
- `options: InteractionHandlerOptions`

---

### `types.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `BaseHandlerOptions`
**Properties**:
- `env: Env`
- `slackService: SlackService`
- `corsHeaders: Record`

**INTERFACE**: `WebhookHandlerOptions`
**Properties**:
- `enableSignatureVerification?: boolean`
- `enableRateLimiting?: boolean`

**INTERFACE**: `EventHandlerOptions`
**Properties**:
- `enableEventFiltering?: boolean`
- `supportedEventTypes?: unknown`

**INTERFACE**: `CommandHandlerOptions`
**Properties**:
- `enableCommandValidation?: boolean`
- `supportedCommands?: unknown`

**INTERFACE**: `InteractionHandlerOptions`
**Properties**:
- `enableInteractionValidation?: boolean`
- `supportedInteractionTypes?: unknown`

**INTERFACE**: `HandlerResponse`
**Properties**:
- `success: boolean`
- `data?: unknown`
- `error?: string`
- `statusCode: number`

**INTERFACE**: `RequestContext`
**Properties**:
- `request: Request`
- `body: string`
- `parsedBody: unknown`
- `headers: Record`
- `timestamp: string`
- `signature?: string`

---

### `webhook-handler.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackWebhookHandler`
**Methods**:
- `constructor(options)`
- `handle(request, ctx)`
- `private extractRequestContext(request)`
- `private verifySignature(context)`
- `private routeRequest(context, ctx)`

**Properties**:
- `options: WebhookHandlerOptions`
- `eventsHandler: SlackEventsHandler`
- `commandsHandler: SlackCommandsHandler`
- `interactionsHandler: SlackInteractionsHandler`

---

## 🔗 Dependencies
- `../../../../config`
- `../../../../types`
- `../../../../utils`
- `../interfaces/slack-app-mention-event.interface`
- `../interfaces/slack-member-joined-channel-event.interface`
- `../interfaces/slack-message-event.interface`
- `../slack-service`
- `../types`
- `./commands-handler`
- `./events-handler`
- `./interactions-handler`
- `./types`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/25/2025, 12:00:23 PM*
