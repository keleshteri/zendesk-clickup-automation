# TypeScript Interfaces 📝

This directory contains TypeScript type definitions, interfaces, and type utilities for the agent system, ensuring type safety and consistency across the codebase.

## Purpose

The `types` directory provides:
- Comprehensive type definitions for all agent components
- Shared interfaces and contracts
- Type utilities and helper types
- API response and request type definitions
- Event and message type definitions

## Key Type Categories

### Core Agent Types
- **AgentTypes**: Base agent interfaces and abstract types
- **AgentCapabilities**: Type definitions for agent capabilities
- **AgentState**: Agent lifecycle and state management types
- **AgentMetadata**: Agent metadata and configuration types

### Communication Types
- **MessageTypes**: Inter-agent message type definitions
- **EventTypes**: Event system type definitions
- **RequestResponse**: Request-response pattern types
- **ChannelTypes**: Communication channel type definitions

### Integration Types
- **ZendeskTypes**: Zendesk API and data structure types
- **ClickUpTypes**: ClickUp API and workspace types
- **SyncTypes**: Data synchronization type definitions
- **WebhookTypes**: Webhook payload and event types

## Core Interfaces

### Agent Interface
```typescript
interface IAgent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  state: AgentState;
  execute(task: Task): Promise<TaskResult>;
  initialize(config: AgentConfig): Promise<void>;
  shutdown(): Promise<void>;
}
```

### Task Interface
```typescript
interface Task {
  id: string;
  type: TaskType;
  priority: Priority;
  payload: unknown;
  metadata: TaskMetadata;
  dependencies?: string[];
  timeout?: number;
}
```

### Message Interface
```typescript
interface Message<T = unknown> {
  id: string;
  type: MessageType;
  sender: string;
  recipient: string;
  payload: T;
  timestamp: Date;
  correlationId?: string;
}
```

## Type Utilities

### Generic Utilities
- **Optional**: Makes specified properties optional
- **Required**: Makes specified properties required
- **Partial**: Creates partial types for updates
- **Pick**: Selects specific properties from types

### Agent-Specific Utilities
- **AgentFactory**: Factory function type definitions
- **AgentRegistry**: Agent registration type utilities
- **TaskBuilder**: Task creation helper types
- **ConfigBuilder**: Configuration builder types

### API Types
- **APIResponse**: Generic API response wrapper
- **PaginatedResponse**: Paginated API response types
- **ErrorResponse**: Standardized error response types
- **WebhookPayload**: Webhook event payload types

## Integration-Specific Types

### Zendesk Types
```typescript
interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id?: number;
  requester_id: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  custom_fields: CustomField[];
}
```

### ClickUp Types
```typescript
interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignees: User[];
  due_date?: string;
  start_date?: string;
  tags: Tag[];
  custom_fields: CustomField[];
}
```

## Event Types

### System Events
```typescript
type SystemEvent = 
  | AgentStartedEvent
  | AgentStoppedEvent
  | TaskCompletedEvent
  | ErrorOccurredEvent
  | ConfigUpdatedEvent;
```

### Business Events
```typescript
type BusinessEvent = 
  | TicketCreatedEvent
  | TicketUpdatedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | SyncCompletedEvent;
```

## Usage

```typescript
import { IAgent, Task, TaskResult } from './AgentTypes';
import { ZendeskTicket } from './ZendeskTypes';
import { Message } from './MessageTypes';

class TicketProcessorAgent implements IAgent {
  async execute(task: Task<ZendeskTicket>): Promise<TaskResult> {
    // Type-safe task processing
    const ticket = task.payload;
    // Process ticket with full type safety
  }
}

// Type-safe message handling
function handleMessage(message: Message<ZendeskTicket>) {
  // Message payload is properly typed
  const ticket = message.payload;
}
```

## Type Organization

```
types/
├── agents/           # Agent-related types
├── communication/    # Communication and messaging types
├── integrations/     # Third-party integration types
├── events/          # Event system types
├── api/             # API request/response types
├── utilities/       # Type utilities and helpers
└── index.ts         # Main type exports
```

## Benefits

- **Type Safety**: Compile-time error detection and prevention
- **IntelliSense**: Enhanced IDE support and autocompletion
- **Documentation**: Types serve as living documentation
- **Refactoring**: Safe refactoring with type checking
- **API Contracts**: Clear contracts between system components
- **Consistency**: Enforced consistency across the codebase