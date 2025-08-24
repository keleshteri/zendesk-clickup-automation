# Slack Types Library

## Overview

This directory contains the comprehensive TypeScript type definitions for the Slack integration within the Zendesk-ClickUp automation project. The types library provides a complete, type-safe foundation for all Slack API interactions, ensuring robust development and preventing runtime errors through compile-time type checking.

## Purpose

The `@types` library serves as the definitive type system for:

- **Slack API Types**: Complete type definitions for all Slack Web API responses and payloads
- **Event System Types**: Types for Slack Events API and Socket Mode events
- **Interactive Components**: Types for buttons, modals, blocks, and interactive elements
- **Webhook Types**: Types for incoming webhook payloads and outgoing webhook responses
- **Integration Types**: Custom types for Zendesk-ClickUp integration workflows
- **Utility Types**: Helper types, type guards, and type utilities
- **Configuration Types**: Types for Slack app configuration and settings
- **Error Handling Types**: Structured error types and response handling

## Architecture Overview

### Type System Hierarchy

```
@types/
├── Core Slack API Types
│   ├── slack-api.ts              # Core Slack Web API types
│   ├── slack-events.ts           # Events API and Socket Mode types
│   ├── slack-rtm.ts              # Real-time messaging types
│   └── slack-oauth.ts            # OAuth and authentication types
│
├── Interactive Component Types
│   ├── blocks.ts                 # Block Kit component types
│   ├── attachments.ts            # Legacy attachment types
│   ├── modals.ts                 # Modal dialog types
│   └── interactive-elements.ts   # Interactive element types
│
├── Message and Content Types
│   ├── messages.ts               # Message structure types
│   ├── threads.ts                # Thread conversation types
│   ├── files.ts                  # File upload and sharing types
│   └── reactions.ts              # Emoji reaction types
│
├── Integration-Specific Types
│   ├── zendesk-integration.ts    # Zendesk-Slack integration types
│   ├── clickup-integration.ts    # ClickUp-Slack integration types
│   ├── workflow-types.ts         # Cross-platform workflow types
│   └── sync-types.ts             # Synchronization operation types
│
├── Configuration and Setup Types
│   ├── app-config.ts             # Slack app configuration types
│   ├── permissions.ts            # Permission and role types
│   ├── channels.ts               # Channel management types
│   └── teams.ts                  # Team and workspace types
│
├── Notification System Types
│   ├── notifications.ts          # Notification framework types
│   ├── templates.ts              # Message template types
│   ├── scheduling.ts             # Scheduled message types
│   └── delivery.ts               # Delivery tracking types
│
├── Handler System Types
│   ├── handlers.ts               # Event handler types
│   ├── middleware.ts             # Middleware pipeline types
│   ├── routing.ts                # Event routing types
│   └── processing.ts             # Message processing types
│
├── Core Infrastructure Types
│   ├── cache.ts                  # Caching system types
│   ├── logging.ts                # Logging framework types
│   ├── rate-limiting.ts          # Rate limiting types
│   └── error-handling.ts         # Error management types
│
└── Utility Types and Helpers
    ├── type-guards.ts            # Runtime type validation
    ├── type-utils.ts             # Type manipulation utilities
    ├── constants.ts              # Typed constants and enums
    └── validation.ts             # Input validation types
```

## Planned Type Categories

### 1. Core Slack API Types

#### `slack-api.ts` - Fundamental API Types
```typescript
// Core API Response Structure
interface SlackApiResponse<T = any> {
  ok: boolean;
  error?: string;
  warning?: string;
  response_metadata?: {
    next_cursor?: string;
    scopes?: string[];
    acceptedScopes?: string[];
  };
  data?: T;
}

// User Information Types
interface SlackUser {
  id: string;
  team_id?: string;
  name: string;
  deleted?: boolean;
  color?: string;
  real_name?: string;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile: SlackUserProfile;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  is_bot?: boolean;
  is_app_user?: boolean;
  updated?: number;
  has_2fa?: boolean;
}

// Channel Information Types
interface SlackChannel {
  id: string;
  name?: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  created?: number;
  is_archived?: boolean;
  is_general?: boolean;
  unlinked?: number;
  name_normalized?: string;
  is_shared?: boolean;
  parent_conversation?: string;
  creator?: string;
  is_ext_shared?: boolean;
  is_org_shared?: boolean;
  shared_team_ids?: string[];
  pending_shared?: string[];
  pending_connected_team_ids?: string[];
  is_pending_ext_shared?: boolean;
  is_member?: boolean;
  is_open?: boolean;
  last_read?: string;
  topic?: SlackChannelTopic;
  purpose?: SlackChannelPurpose;
  previous_names?: string[];
}
```

#### `slack-events.ts` - Events API Types
```typescript
// Base Event Structure
interface SlackEvent {
  type: string;
  event_ts: string;
  user?: string;
  ts?: string;
  channel?: string;
  text?: string;
}

// Specific Event Types
interface MessageEvent extends SlackEvent {
  type: 'message';
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
  hidden?: boolean;
  deleted_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  is_starred?: boolean;
  pinned_to?: string[];
  reactions?: SlackReaction[];
}

// App Events Wrapper
interface SlackAppEvent {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: 'event_callback';
  event_id: string;
  event_time: number;
  authorizations?: SlackAuthorization[];
  is_ext_shared_channel?: boolean;
  event_context?: string;
}
```

### 2. Interactive Component Types

#### `blocks.ts` - Block Kit Types
```typescript
// Block Types Union
type SlackBlock = 
  | SectionBlock 
  | DividerBlock 
  | ImageBlock 
  | ActionsBlock 
  | ContextBlock 
  | InputBlock 
  | FileBlock 
  | HeaderBlock;

// Section Block
interface SectionBlock {
  type: 'section';
  block_id?: string;
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: BlockElement;
}

// Actions Block
interface ActionsBlock {
  type: 'actions';
  block_id?: string;
  elements: (ButtonElement | SelectMenuElement | OverflowMenuElement | DatePickerElement)[];
}

// Interactive Elements
interface ButtonElement {
  type: 'button';
  action_id: string;
  text: SlackTextObject;
  value?: string;
  url?: string;
  style?: 'default' | 'primary' | 'danger';
  confirm?: ConfirmationDialog;
}
```

#### `modals.ts` - Modal Dialog Types
```typescript
// Modal View Structure
interface SlackModal {
  type: 'modal';
  callback_id?: string;
  title: SlackTextObject;
  blocks: SlackBlock[];
  close?: SlackTextObject;
  submit?: SlackTextObject;
  private_metadata?: string;
  clear_on_close?: boolean;
  notify_on_close?: boolean;
  external_id?: string;
}

// Modal Submission
interface ModalSubmission {
  type: 'view_submission';
  team: SlackTeam;
  user: SlackUser;
  api_app_id: string;
  token: string;
  trigger_id: string;
  view: {
    id: string;
    team_id: string;
    type: 'modal';
    blocks: SlackBlock[];
    private_metadata?: string;
    callback_id?: string;
    state: {
      values: Record<string, Record<string, any>>;
    };
    hash: string;
    title: SlackTextObject;
    clear_on_close?: boolean;
    notify_on_close?: boolean;
    close?: SlackTextObject;
    submit?: SlackTextObject;
    previous_view_id?: string;
    root_view_id?: string;
    app_id?: string;
    external_id?: string;
    app_installed_team_id?: string;
    bot_id?: string;
  };
}
```

### 3. Integration-Specific Types

#### `zendesk-integration.ts` - Zendesk Integration Types
```typescript
// Zendesk-Slack Mapping Types
interface ZendeskSlackMapping {
  ticketId: string;
  threadTs: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'deleted';
  syncDirection: 'zendesk_to_slack' | 'slack_to_zendesk' | 'bidirectional';
}

// Ticket Notification Types
interface TicketNotification {
  type: 'ticket_created' | 'ticket_updated' | 'ticket_closed' | 'ticket_reopened';
  ticket: ZendeskTicket;
  changes?: TicketChanges;
  notificationTarget: NotificationTarget;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  templateId?: string;
  customFields?: Record<string, any>;
}

// Integration Workflow Types
interface ZendeskWorkflow {
  id: string;
  name: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}
```

#### `clickup-integration.ts` - ClickUp Integration Types
```typescript
// ClickUp-Slack Mapping Types
interface ClickUpSlackMapping {
  taskId: string;
  threadTs: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'deleted';
  syncDirection: 'clickup_to_slack' | 'slack_to_clickup' | 'bidirectional';
}

// Task Notification Types
interface TaskNotification {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned';
  task: ClickUpTask;
  changes?: TaskChanges;
  notificationTarget: NotificationTarget;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  templateId?: string;
  customFields?: Record<string, any>;
}

// Integration Workflow Types
interface ClickUpWorkflow {
  id: string;
  name: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}
```

### 4. Utility Types and Type Guards

#### `type-guards.ts` - Runtime Type Validation
```typescript
// Type Guard Functions
export const TypeGuards = {
  // Slack ID Validation
  isSlackUserId: (value: unknown): value is string => 
    typeof value === 'string' && /^U[A-Z0-9]{8,}$/.test(value),
  
  isSlackChannelId: (value: unknown): value is string => 
    typeof value === 'string' && /^[CDG][A-Z0-9]{8,}$/.test(value),
  
  isSlackTeamId: (value: unknown): value is string => 
    typeof value === 'string' && /^T[A-Z0-9]{8,}$/.test(value),

  // Event Type Guards
  isMessageEvent: (event: SlackEvent): event is MessageEvent =>
    event.type === 'message' && 'channel' in event && 'text' in event,

  isButtonInteraction: (interaction: SlackInteraction): interaction is ButtonInteraction =>
    interaction.type === 'block_actions' && 
    interaction.actions?.some(action => action.type === 'button'),

  // API Response Guards
  isSuccessfulApiResponse: <T>(response: SlackApiResponse<T>): response is SuccessfulSlackApiResponse<T> =>
    response.ok === true,

  isErrorApiResponse: (response: SlackApiResponse): response is ErrorSlackApiResponse =>
    response.ok === false && typeof response.error === 'string'
};
```

#### `type-utils.ts` - Type Manipulation Utilities
```typescript
// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Slack-Specific Utility Types
export type SlackTimestamp = string; // Format: "1234567890.123456"
export type SlackUserId = string;    // Format: "U1234567890"
export type SlackChannelId = string; // Format: "C1234567890"
export type SlackTeamId = string;    // Format: "T1234567890"

// Event Handler Types
export type EventHandler<T extends SlackEvent = SlackEvent> = (
  event: T,
  context: HandlerContext
) => Promise<HandlerResult> | HandlerResult;

export type MiddlewareFunction = (
  context: HandlerContext,
  next: () => Promise<void>
) => Promise<void> | void;

// Integration Types
export type IntegrationDirection = 'inbound' | 'outbound' | 'bidirectional';
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
```

## Usage Patterns

### Basic Type Usage
```typescript
import type {
  SlackUser,
  SlackChannel,
  MessageEvent,
  SlackApiResponse,
  ButtonInteraction
} from '@types';

// Type-safe API response handling
async function getUser(userId: string): Promise<SlackUser | null> {
  const response: SlackApiResponse<SlackUser> = await slackApi.users.info({ user: userId });
  
  if (TypeGuards.isSuccessfulApiResponse(response)) {
    return response.data;
  }
  
  return null;
}

// Event handler with proper typing
const messageHandler: EventHandler<MessageEvent> = async (event, context) => {
  if (TypeGuards.isSlackChannelId(event.channel)) {
    // Type-safe channel operations
    await processChannelMessage(event.channel, event.text);
  }
  
  return { success: true };
};
```

### Integration Type Usage
```typescript
import type {
  ZendeskSlackMapping,
  TicketNotification,
  TaskNotification
} from '@types';

// Type-safe integration mapping
async function createTicketThreadMapping(
  ticketId: string,
  threadTs: string,
  channelId: string
): Promise<ZendeskSlackMapping> {
  const mapping: ZendeskSlackMapping = {
    ticketId,
    threadTs,
    channelId,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    syncDirection: 'bidirectional'
  };
  
  await storageService.saveMapping(mapping);
  return mapping;
}
```

### Advanced Type Composition
```typescript
// Conditional types for different notification types
type NotificationPayload<T extends string> = 
  T extends 'ticket_created' ? TicketNotification :
  T extends 'task_updated' ? TaskNotification :
  T extends 'sync_completed' ? SyncNotification :
  never;

// Generic handler type with payload constraints
interface TypedNotificationHandler<T extends string> {
  type: T;
  handle(payload: NotificationPayload<T>): Promise<void>;
}

// Implementation with full type safety
class TicketCreatedHandler implements TypedNotificationHandler<'ticket_created'> {
  type = 'ticket_created' as const;
  
  async handle(payload: TicketNotification): Promise<void> {
    // Fully typed payload access
    const { ticket, notificationTarget, priority } = payload;
    // Implementation...
  }
}
```

## Type Safety Guidelines

### Strict Type Checking
- All types should be as specific as possible
- Use literal types for known string values
- Implement proper type guards for runtime validation
- Avoid `any` type - use `unknown` when necessary

### Error Handling Types
```typescript
// Structured error types
interface SlackError {
  code: SlackErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  context?: ErrorContext;
}

// Result types for error handling
type Result<T, E = SlackError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// API operation results
type ApiResult<T> = Result<T, SlackApiError>;
type HandlerResult = Result<void, HandlerError>;
type SyncResult = Result<SyncDetails, SyncError>;
```

### Performance Considerations

### Type Optimization
- Use interface merging for extensible types
- Implement conditional types for performance
- Use mapped types efficiently
- Avoid deep recursive types that impact compilation

### Runtime Performance
- Keep type guards lightweight
- Cache type validation results when appropriate
- Use discriminated unions for better performance
- Implement lazy type loading where possible

## Testing and Validation

### Type Testing
```typescript
// Type assertion tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test type compatibility
type TestSlackUserIdType = AssertEqual<SlackUserId, string>; // Should be true
type TestEventHandlerType = AssertEqual<
  EventHandler<MessageEvent>,
  (event: MessageEvent, context: HandlerContext) => Promise<HandlerResult>
>; // Should be true

// Runtime type validation tests
describe('TypeGuards', () => {
  it('should validate Slack user IDs correctly', () => {
    expect(TypeGuards.isSlackUserId('U1234567890')).toBe(true);
    expect(TypeGuards.isSlackUserId('invalid')).toBe(false);
  });
});
```

## Future Enhancements

### Advanced Type Features
- **Template Literal Types**: For more precise string typing
- **Conditional Type Chains**: Complex type logic implementation  
- **Branded Types**: Prevent type confusion with similar structures
- **Recursive Types**: Support for complex nested structures
- **Distributive Conditional Types**: Advanced type manipulation

### Integration Expansion
- **GraphQL Types**: Support for GraphQL API interactions
- **Webhook Schema Types**: Comprehensive webhook type definitions
- **Real-time Types**: Types for Socket Mode and RTM connections
- **Analytics Types**: Types for metrics and reporting systems

## Dependencies

### Core Dependencies
- TypeScript 4.5+ for advanced type features
- Strict mode enabled for maximum type safety
- ESLint TypeScript rules for code quality
- Type-only imports for better tree shaking

### Development Dependencies
- Type testing utilities for compile-time validation
- JSON Schema to TypeScript converters
- API documentation generators from types
- Type coverage analysis tools

---

**Note**: This types library is designed to be the single source of truth for all TypeScript type definitions across the Slack integration. Types should be implemented with strict type safety, performance, and developer experience as primary concerns.