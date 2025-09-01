# Zendesk-ClickUp Automation - Enhanced Project Rules

## Project Overview
**Project**: Zendesk-ClickUp Automation  
**Tech Stack**: TypeScript, Hono, Cloudflare Workers  
**Architecture**: SOLID principles, Interface-driven, Modular design  
**MCP tools can use**: mcp-memory, Cloudflare, Context7
---

## Framework & Dependencies

### Required Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (latest stable)
- **Language**: TypeScript 5.0+
- **Testing**: Vitest (Cloudflare Workers compatible)
- **Validation**: Zod (for type-safe runtime validation)

### Dependency Rules
- **NO** Node.js specific libraries (incompatible with Workers)
- **NO** filesystem APIs (Workers limitation)
- **AVOID** heavy dependencies (Workers size limits)
- **USE** Workers-compatible packages only

### Testing Framework
```typescript
// Use Vitest with Cloudflare Workers environment
import { describe, it, expect } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';

// Test structure for Workers
describe('Service Tests', () => {
  it('should handle request correctly', async () => {
    // Test implementation
  });
});
```

---

## SOLID Principles Enforcement

### 1. Single Responsibility Principle (SRP)
- **One class, one reason to change**
- **One interface, one specific contract**
- **One service, one business capability**

### 2. Open/Closed Principle (OCP)
- **Extend through interfaces, not modification**
- **Use dependency injection for extensibility**
- **Strategy pattern for varying behaviors**

### 3. Liskov Substitution Principle (LSP)
- **All implementations must honor interface contracts**
- **No exceptions or breaking behaviors in subclasses**
- **Preconditions cannot be strengthened**
- **Postconditions cannot be weakened**

### 4. Interface Segregation Principle (ISP)
- **Small, focused interfaces**
- **Clients depend only on what they use**
- **No fat interfaces with unused methods**

### 5. Dependency Inversion Principle (DIP)
- **Depend on abstractions, not concretions**
- **High-level modules don't depend on low-level**
- **Use dependency injection containers**

---

## Modular Architecture Pattern

### Project Structure
```
src/
├── domains/
│   ├── clickup/
│   │   ├── interfaces/
│   │   │   ├── clickup-client.interface.ts
│   │   │   ├── clickup-repository.interface.ts
│   │   │   └── clickup-service.interface.ts
│   │   ├── types/
│   │   │   ├── clickup-task.type.ts
│   │   │   ├── clickup-space.type.ts
│   │   │   └── clickup-responses.type.ts
│   │   ├── services/
│   │   │   ├── clickup-client.service.ts
│   │   │   ├── clickup-repository.service.ts
│   │   │   └── clickup-task.service.ts
│   │   └── index.ts
│   ├── zendesk/
│   │   ├── interfaces/
│   │   ├── types/
│   │   ├── services/
│   │   └── index.ts
│   └── automation/
│       ├── interfaces/
│       ├── types/
│       ├── services/
│       └── index.ts
├── shared/
│   ├── interfaces/
│   ├── types/
│   ├── utils/
│   └── config/
├── infrastructure/
│   ├── di/               # Dependency injection
│   ├── http/             # Hono setup
│   └── workers/          # Worker configurations
└── main.ts
```

---

## Interface-First Development Pattern

### AI Development Workflow

#### Step 1: Requirements Analysis
```
AI: "I understand you want to implement [FEATURE]. Let me break this down:

1. What specific ClickUp operations do you need?
2. How should this integrate with Zendesk?
3. What data transformations are required?

Can I proceed with defining the interfaces first?"
```

#### Step 2: Interface Design
```typescript
AI: "Based on your requirements, I propose these interfaces:

// ClickUp Task Operations
interface IClickUpTaskService {
  createTask(data: CreateTaskRequest): Promise<ClickUpTask>;
  updateTask(id: string, data: UpdateTaskRequest): Promise<ClickUpTask>;
  getTask(id: string): Promise<ClickUpTask | null>;
}

Should I create this interface? [WAIT FOR CONFIRMATION]"
```

#### Step 3: Type Definition
```typescript
AI: "Now I'll define the supporting types:

type CreateTaskRequest = {
  readonly name: string;
  readonly description?: string;
  readonly assignees?: readonly string[];
  readonly status?: TaskStatus;
};

Shall I proceed with these types? [WAIT FOR CONFIRMATION]"
```

#### Step 4: Implementation Request
```typescript
AI: "Interfaces and types are ready. Should I implement:
1. ClickUpTaskService (implements IClickUpTaskService)
2. Associated unit tests
3. Integration with dependency injection

Which would you like me to start with? [WAIT FOR CONFIRMATION]"
```

---

## AI Sequential Development Rules

### MANDATORY: Step-by-Step Confirmation

#### Before ANY Code Creation:
```
1. AI: "I need to create [COMPONENT] for [PURPOSE]. This will involve:
   - Interface: [INTERFACE_NAME] 
   - Types: [TYPE_NAMES]
   - Implementation: [SERVICE_NAME]
   
   Should I proceed? [YES/NO required]"

2. User confirms: "Yes" or provides modifications

3. AI: "Creating interface first. Here's the contract:
   [SHOW INTERFACE]
   
   Does this match your requirements? [CONFIRMATION required]"

4. Only after confirmation, AI creates the interface
```

### Interface Creation Protocol
```typescript
/**
 * @purpose: Define contract for ClickUp task operations
 * @domain: clickup
 * @implements: SOLID principles
 * @status: pending-review
 */
export interface IClickUpTaskService {
  // Contract definition
}
```

### Type Creation Protocol  
```typescript
/**
 * @purpose: ClickUp task data structure
 * @domain: clickup
 * @readonly: true for immutability
 * @validation: Zod schema required
 */
export type ClickUpTask = {
  readonly id: string;
  readonly name: string;
  // ... other properties
};
```

### Implementation Protocol
```typescript
/**
 * @purpose: ClickUp task service implementation
 * @implements: IClickUpTaskService
 * @dependencies: [IClickUpClient, ILogger]
 * @testing: Unit tests required
 */
export class ClickUpTaskService implements IClickUpTaskService {
  // Implementation
}
```

---

## Dependency Injection Options

### Option 1: @hono/tsyringe (Official)
```typescript
npm install @hono/tsyringe tsyringe reflect-metadata

// infrastructure/di/container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import { tsyringe } from '@hono/tsyringe';

// Register services
container.registerSingleton<IClickUpClient>('ClickUpClient', ClickUpClient);
container.registerSingleton<IZendeskClient>('ZendeskClient', ZendeskClient);

// Hono setup
const app = new Hono();
app.use('*', tsyringe());

app.get('/api/tasks', async (c) => {
  const clickUpClient = c.var.container.resolve<IClickUpClient>('ClickUpClient');
  // Use service
});
```

### Option 2: hono-simple-DI (Lightweight)
```typescript
npm install hono-simple-di

import { Dependency } from 'hono-simple-di';

// Define dependencies
const clickUpClientDep = new Dependency(() => new ClickUpClient());
const taskServiceDep = new Dependency(
  async (c) => new TaskService(await clickUpClientDep.resolve(c))
);

// Use in routes
const app = new Hono()
  .use(taskServiceDep.middleware('taskService'))
  .get('/api/tasks', (c) => {
    const taskService = c.get('taskService');
    // Use service
  });
```

### Option 3: Manual DI (Recommended for Workers)
```typescript
// infrastructure/di/dependencies.ts
export interface Dependencies {
  clickUpClient: IClickUpClient;
  zendeskClient: IZendeskClient;
  taskService: ITaskService;
}

export function createDependencies(env: Env): Dependencies {
  const clickUpClient = new ClickUpClient(env.CLICKUP_API_KEY);
  const zendeskClient = new ZendeskClient(env.ZENDESK_API_KEY);
  const taskService = new TaskService(clickUpClient, zendeskClient);
  
  return {
    clickUpClient,
    zendeskClient,
    taskService,
  };
}

// main.ts
const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const dependencies = createDependencies(c.env);
  c.set('deps', dependencies);
  await next();
});

app.get('/api/tasks', async (c) => {
  const { taskService } = c.get('deps');
  // Use service
});
```

---

## Simplified File Headers

### Interface Files
```typescript
/**
 * @type: interface
 * @domain: clickup | zendesk | automation | shared
 * @purpose: Brief single-line description
 * @solid-principle: SRP | OCP | LSP | ISP | DIP
 */
```

### Implementation Files
```typescript
/**
 * @type: service | client | repository
 * @domain: clickup | zendesk | automation | shared
 * @implements: IInterfaceName
 * @dependencies: [dep1, dep2]
 * @tested: yes | no
 */
```

### Type Definition Files
```typescript
/**
 * @type: types
 * @domain: clickup | zendesk | automation | shared
 * @validation: zod | none
 * @immutable: yes | no
 */
```

---

## AI Pattern Enforcement

### BEFORE Creating Any Code:
1. **Domain Check**: "Which domain does this belong to? (clickup/zendesk/automation/shared)"
2. **SOLID Check**: "Which SOLID principle does this support?"
3. **Interface First**: "Should I create the interface definition first?"
4. **Dependency Check**: "What interfaces will this depend on?"

### Pattern Validation Questions:
```
AI Must Ask:
1. "This service needs IClickUpClient interface. Should I create that first?"
2. "This breaks SRP - should I split into smaller interfaces?"
3. "This violates DIP - should I create an abstraction?"
4. "This implementation doesn't follow LSP - should I revise the contract?"
```

### Sequential Development Commands:
```
User Commands:
"Create interface for X" → AI creates interface only, waits for confirmation
"Implement interface X" → AI creates implementation after interface exists
"Add types for Y" → AI creates type definitions with validation
"Setup DI for Z" → AI configures dependency injection bindings
```

---

## SOLID Examples for AI Reference

### Single Responsibility (SRP)
```typescript
// ✅ GOOD: Single responsibility
interface IClickUpTaskCreator {
  createTask(data: CreateTaskRequest): Promise<ClickUpTask>;
}

// ❌ BAD: Multiple responsibilities  
interface IClickUpTaskManager {
  createTask(data: CreateTaskRequest): Promise<ClickUpTask>;
  sendNotification(task: ClickUpTask): Promise<void>;
  logActivity(action: string): Promise<void>;
}
```

### Open/Closed (OCP)
```typescript
// ✅ GOOD: Extensible through interfaces
interface ITaskProcessor {
  process(task: Task): Promise<void>;
}

class UrgentTaskProcessor implements ITaskProcessor {
  process(task: Task): Promise<void> { /* urgent logic */ }
}

class NormalTaskProcessor implements ITaskProcessor {
  process(task: Task): Promise<void> { /* normal logic */ }
}
```

### Liskov Substitution (LSP)
```typescript
// ✅ GOOD: All implementations honor the contract
interface IDataValidator {
  validate(data: unknown): Promise<ValidationResult>;
}

// Both implementations must:
// - Return ValidationResult
// - Handle any unknown input
// - Not throw for invalid data (return result instead)
```

### Interface Segregation (ISP)
```typescript
// ✅ GOOD: Specific interfaces
interface ITaskReader {
  getTask(id: string): Promise<Task | null>;
}

interface ITaskWriter {
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTask(id: string, data: UpdateTaskRequest): Promise<Task>;
}

// ❌ BAD: Fat interface
interface ITaskRepository {
  getTask(id: string): Promise<Task | null>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTask(id: string, data: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  searchTasks(query: string): Promise<Task[]>;
  exportTasks(): Promise<Buffer>;
  importTasks(data: Buffer): Promise<void>;
}
```

### Dependency Inversion (DIP)
```typescript
// ✅ GOOD: Depends on abstractions
class TaskService {
  constructor(
    private readonly client: IClickUpClient,
    private readonly logger: ILogger,
    private readonly validator: IDataValidator
  ) {}
}

// ❌ BAD: Depends on concrete implementations
class TaskService {
  private client = new ClickUpHttpClient();
  private logger = new ConsoleLogger();
  private validator = new ZodValidator();
}
```

---

## Memory MCP Integration

### Session Tracking for Patterns
```typescript
// Start domain-specific session
start_session("Implementing ClickUp task management domain")

// Track interface creation
add_decision("interface_created", "IClickUpTaskService", "follows ISP principle")

// Track implementation 
add_session_step("implement_service", ["clickup-task.service.ts"], "implements IClickUpTaskService with DI")

// Track SOLID compliance
add_decision("solid_compliance", "ClickUpTaskService", "follows SRP, DIP, LSP principles")
```

### Pattern Validation
```typescript
// Check before creating code
check_before_modification("src/domains/clickup/services/clickup-task.service.ts")

// Validate SOLID compliance
add_decision("solid_check", "TaskService", "SRP: ✓, OCP: ✓, LSP: ✓, ISP: ✓, DIP: ✓")
```

---

## Testing Requirements

### Test Structure for Each Component
```typescript
// tests/domains/clickup/services/clickup-task.service.test.ts
describe('ClickUpTaskService', () => {
  let service: ClickUpTaskService;
  let mockClient: MockClickUpClient;
  
  beforeEach(() => {
    mockClient = new MockClickUpClient();
    service = new ClickUpTaskService(mockClient);
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      // Test LSP compliance - service behaves according to interface
    });

    it('should handle validation errors', async () => {
      // Test error handling per interface contract
    });
  });
});
```

### Testing Patterns
- **Interface Compliance**: Test that implementations honor contracts
- **SOLID Principles**: Verify each principle is followed
- **Error Boundaries**: Test error handling per interface specifications
- **Dependency Injection**: Test with mocked dependencies

---

## AI Command Reference

### Pattern Creation Commands
```
"Create ClickUp domain interface" → AI asks for specific operations, creates interface
"Implement task service" → AI creates service implementing specified interface  
"Setup DI for ClickUp" → AI configures dependency injection bindings
"Create types for tasks" → AI creates type definitions with Zod validation
"Add tests for service" → AI creates comprehensive test suite
```

### Validation Commands
```
"Check SOLID compliance" → AI reviews code against SOLID principles
"Validate LSP adherence" → AI ensures implementations honor contracts
"Review interface design" → AI checks ISP and SRP compliance
"Verify DI setup" → AI validates dependency injection configuration
```

This ruleset ensures AI follows SOLID principles, creates modular domain-driven code, and maintains strict interface-first development with proper TypeScript and Hono integration for Cloudflare Workers.