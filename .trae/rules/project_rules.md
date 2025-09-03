# Zendesk-ClickUp Automation - Enhanced Project Rules

## Project Overview
**Project**: Zendesk-ClickUp Automation  
**Tech Stack**: TypeScript, Hono, Cloudflare Workers  
**Architecture**: SOLID principles, Interface-driven, Modular design  
**MCP tools can use**: mcp-memory, Cloudflare, Context7

---

## 🛡️ AI Code Generation Validation Rules (CRITICAL PRIORITY)

### MANDATORY: Pre-Generation Validation Checklist

Before generating ANY code, AI MUST verify ALL of the following conditions:

```typescript
// AI MUST run this validation before code generation
interface CodeGenerationValidation {
  // Type Safety Requirements
  strictModeEnabled: boolean;           // ✓ TypeScript strict mode active?
  noImplicitAny: boolean;              // ✓ All types explicitly declared?
  noUnknownAccess: boolean;            // ✓ No property access on unknown types?
  returnTypesExplicit: boolean;        // ✓ All functions have return types?
  nullChecksPresent: boolean;          // ✓ Null/undefined safety checks?
  
  // Syntax Validation
  validTypeScript: boolean;            // ✓ Syntactically correct TypeScript?
  noSyntaxErrors: boolean;             // ✓ No compilation errors?
  properImports: boolean;              // ✓ All imports properly declared?
  exportConsistency: boolean;          // ✓ Exports match file structure?
  
  // Logical Consistency
  interfaceImplementation: boolean;     // ✓ Classes implement declared interfaces?
  solidPrinciples: boolean;            // ✓ SOLID principles followed?
  dependencyInjection: boolean;        // ✓ DI patterns correctly applied?
  errorHandling: boolean;              // ✓ Proper error handling present?
  
  // Architecture Compliance
  fileOrganization: boolean;           // ✓ Files in correct directories?
  namingConventions: boolean;          // ✓ Consistent naming patterns?
  sizeConstraints: boolean;            // ✓ Files under size limits?
  separationOfConcerns: boolean;       // ✓ Types/interfaces separated?
}
```

### 🚫 CRITICAL: TypeScript Error Prevention Rules

#### Rule 1: NEVER Access Properties Without Type Guards

```typescript
// ❌ FORBIDDEN - Will cause TS18046 errors
function processData(data: unknown) {
  const id = data.id;                  // ERROR: Property 'id' does not exist on type 'unknown'
  const nested = data.task.id;         // ERROR: Object is possibly 'undefined'
}

// ✅ REQUIRED - Type guard first, then access
function processData(data: unknown): string | null {
  // Step 1: Type guard
  if (!isValidData(data)) {
    return null;
  }
  
  // Step 2: Safe access with optional chaining
  return data.task?.id ?? null;
}

function isValidData(data: unknown): data is { task?: { id: string } } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (!('task' in data) || 
     (typeof (data as any).task === 'object' && 
      'id' in (data as any).task &&
      typeof (data as any).task.id === 'string'))
  );
}
```

#### Rule 2: Zod Validation for ALL External Data

```typescript
// MANDATORY for ALL API responses, webhooks, and external data
import { z } from 'zod';

// Step 1: Define schema
const TaskResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    task: z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['open', 'in_progress', 'closed'])
    })
  }).optional(),
  error: z.object({
    message: z.string(),
    code: z.string()
  }).optional()
});

// Step 2: Infer type
type TaskResponse = z.infer<typeof TaskResponseSchema>;

// Step 3: Validate before use
function handleTaskResponse(rawResponse: unknown): TaskResponse {
  try {
    return TaskResponseSchema.parse(rawResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid response structure: ${error.message}`);
    }
    throw error;
  }
}

// Step 4: Type-safe usage
const response = handleTaskResponse(apiResponse);
if (response.success && response.data?.task) {
  const taskId = response.data.task.id; // ✓ Type-safe access
}
```

#### Rule 3: Explicit Return Types for ALL Functions

```typescript
// ❌ FORBIDDEN - Implicit return types
function createTask(data) {                    // Missing parameter type
  return processTaskData(data);                // Missing return type
}

// ✅ REQUIRED - Explicit types everywhere
function createTask(data: CreateTaskRequest): Promise<TaskCreationResult> {
  return processTaskData(data);
}

// For arrow functions
const transformData = (input: RawData): ProcessedData => {
  // implementation
};

// For async functions
async function fetchUserData(id: string): Promise<User | null> {
  // implementation
}
```

#### Rule 4: Optional Chaining and Nullish Coalescing EVERYWHERE

```typescript
// ❌ FORBIDDEN - Direct property access
const value = data.nested.property.deep.value;
const firstItem = items[0].id;
const result = config.settings.timeout;

// ✅ REQUIRED - Safe property access
const value = data?.nested?.property?.deep?.value ?? 'default';
const firstItem = items?.[0]?.id ?? null;
const result = config?.settings?.timeout ?? 5000;

// For method calls
const processResult = processor?.process?.(data) ?? null;
```

#### Rule 5: Type Assertion Functions for Complex Validation

```typescript
// For complex objects that need runtime validation
function assertValidTaskResult(
  result: unknown
): asserts result is { success: true; task: { id: string; name: string } } {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid result: not an object');
  }
  
  const typed = result as any;
  
  if (typed.success !== true) {
    throw new Error('Task operation failed');
  }
  
  if (!typed.task || typeof typed.task !== 'object') {
    throw new Error('Invalid result: missing task data');
  }
  
  if (typeof typed.task.id !== 'string' || typeof typed.task.name !== 'string') {
    throw new Error('Invalid result: task missing required properties');
  }
}

// Usage - eliminates type errors
const result = await createTaskAPI(data);
assertValidTaskResult(result);
// TypeScript now knows result.task.id and result.task.name exist
const taskId = result.task.id; // ✓ No type errors
```

### 🎯 AI Code Generation Workflow

#### STEP 1: Type Definition FIRST (Always)
```typescript
// AI: "Defining types with Zod validation for [FEATURE]"

// 1. Input validation schema
const CreateTaskRequestSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

// 2. Response type definition
interface TaskCreationResponse {
  success: boolean;
  data?: {
    task: {
      id: string;
      name: string;
      status: string;
      createdAt: string;
    };
  };
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}
```

#### STEP 2: Type Guards and Validators
```typescript
// AI: "Creating type guards for safe property access"

function isTaskCreationSuccess(
  response: unknown
): response is TaskCreationResponse & { success: true; data: NonNullable<TaskCreationResponse['data']> } {
  return (
    response !== null &&
    typeof response === 'object' &&
    'success' in response &&
    (response as any).success === true &&
    'data' in response &&
    typeof (response as any).data === 'object' &&
    (response as any).data !== null &&
    'task' in (response as any).data &&
    typeof (response as any).data.task === 'object' &&
    'id' in (response as any).data.task &&
    typeof (response as any).data.task.id === 'string'
  );
}

function validateCreateTaskRequest(data: unknown): CreateTaskRequest {
  try {
    return CreateTaskRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid task data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
```

#### STEP 3: Implementation with Full Type Safety
```typescript
// AI: "Implementing with complete type safety and error prevention"

export class TaskService implements ITaskService {
  constructor(
    private readonly client: IClickUpClient,
    private readonly logger: ILogger
  ) {}

  async createTask(rawRequest: unknown): Promise<string> {
    // Step 1: Validate input with Zod
    const validRequest = validateCreateTaskRequest(rawRequest);
    
    // Step 2: Make API call with proper error handling
    let response: unknown;
    try {
      response = await this.client.post('/tasks', validRequest);
    } catch (error) {
      this.logger.error('API call failed', { error, request: validRequest });
      throw new Error('Failed to create task: API error');
    }
    
    // Step 3: Validate response structure
    if (!isTaskCreationSuccess(response)) {
      this.logger.error('Invalid API response', { response });
      throw new Error('Failed to create task: Invalid response');
    }
    
    // Step 4: Safe access (TypeScript knows the type)
    const taskId = response.data.task.id; // ✓ No type errors!
    
    this.logger.info('Task created successfully', { taskId });
    return taskId;
  }
}
```

### 🔍 AI Self-Verification Protocol

Before EVERY code submission, AI MUST verify:

```typescript
interface PreSubmissionCheck {
  // Type Safety Verification
  noImplicitAny: boolean;              // ✓ No 'any' types used
  noUnknownAccess: boolean;            // ✓ No direct property access on 'unknown'
  allReturnsTyped: boolean;            // ✓ All functions have explicit return types
  nullSafetyChecks: boolean;           // ✓ Null/undefined handled everywhere
  
  // Validation Verification
  zodSchemasPresent: boolean;          // ✓ External data validated with Zod
  typeGuardsImplemented: boolean;      // ✓ Type guards for complex objects
  optionalChainingUsed: boolean;       // ✓ ?. operator used for nested access
  assertionFunctionsCreated: boolean;  // ✓ Assertion functions for complex validation
  
  // Error Prevention
  properErrorHandling: boolean;        // ✓ Try-catch blocks for external calls
  meaningfulErrorMessages: boolean;    // ✓ Descriptive error messages
  loggingImplemented: boolean;         // ✓ Proper logging for debugging
  
  // Architecture Compliance
  solidPrinciplesFollowed: boolean;    // ✓ SOLID principles maintained
  interfacesImplemented: boolean;      // ✓ Proper interface implementation
  dependencyInjectionUsed: boolean;   // ✓ DI patterns correctly applied
  fileSizeLimitsRespected: boolean;    // ✓ Files under 300 lines
}
```

### 🚨 Common Error Patterns and Mandatory Fixes

#### Pattern 1: Unknown Type Access (TS18046)
```typescript
// ❌ ERROR: 'data' is of type 'unknown'
function processWebhook(data: unknown) {
  return data.ticket.id; // TS18046: 'data' is of type 'unknown'
}

// ✅ FIX: Type guard + optional chaining
function processWebhook(data: unknown): string | null {
  if (!isWebhookData(data)) {
    return null;
  }
  return data.ticket?.id ?? null;
}

function isWebhookData(data: unknown): data is { ticket?: { id: string } } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (!('ticket' in data) || 
     (typeof (data as any).ticket === 'object' &&
      'id' in (data as any).ticket &&
      typeof (data as any).ticket.id === 'string'))
  );
}
```

#### Pattern 2: Possibly Undefined (TS2532)
```typescript
// ❌ ERROR: Object is possibly 'undefined'
function getUserName(user?: User) {
  return user.name; // TS2532: Object is possibly 'undefined'
}

// ✅ FIX: Optional chaining with fallback
function getUserName(user?: User): string {
  return user?.name ?? 'Anonymous';
}
```

#### Pattern 3: Property Does Not Exist (TS2339)
```typescript
// ❌ ERROR: Property 'task' does not exist on type 'unknown'
function getTaskId(response: unknown) {
  return response.task.id; // TS2339: Property 'task' does not exist
}

// ✅ FIX: Proper typing with validation
interface TaskResponse {
  task?: { id: string };
}

function getTaskId(response: unknown): string | null {
  const validated = response as TaskResponse;
  return validated.task?.id ?? null;
}
```

### 📋 AI Error Prevention Template

When generating ANY code, AI MUST follow this template:

```typescript
/**
 * STEP 1: Define all types with Zod schemas
 */
const InputSchema = z.object({
  // Define input structure
});
type Input = z.infer<typeof InputSchema>;

/**
 * STEP 2: Create type guards for runtime validation
 */
function isValidInput(data: unknown): data is Input {
  return InputSchema.safeParse(data).success;
}

function assertValidResponse(
  response: unknown
): asserts response is ExpectedResponse {
  // Runtime validation logic
}

/**
 * STEP 3: Implement with explicit types and comprehensive safety
 */
export async function processData(rawInput: unknown): Promise<ProcessedResult> {
  // Validate input
  if (!isValidInput(rawInput)) {
    throw new Error('Invalid input data structure');
  }
  
  // Process with type safety
  let result: unknown;
  try {
    result = await externalOperation(rawInput);
  } catch (error) {
    logger.error('External operation failed', { error, input: rawInput });
    throw new Error('Processing failed');
  }
  
  // Validate output
  assertValidResponse(result);
  
  // Return with confidence
  return result;
}
```

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

## Interface & Type Organization Rules

### CRITICAL: No Types/Interfaces in Service Files

#### Bad Practice (FORBIDDEN):
```typescript
// ❌ BAD: Types defined inside service file
// src/domains/clickup/services/clickup-http-client.service.ts

export interface HTTPConfig { ... }           // Should be in types/
export type HTTPHeaders = { ... };            // Should be in types/  
export interface ClickUpAPIResponse<T> { ... } // Should be in interfaces/
export interface ClickUpHttpClientConfig { ... } // Should be in interfaces/

export class ClickUpHttpClient {
  // Service implementation
}
```

#### Good Practice (REQUIRED):
```typescript
// ✅ GOOD: Separated concerns

// src/domains/clickup/interfaces/http-client.interface.ts
export interface IClickUpHttpClient {
  get<T>(url: string): Promise<ClickUpAPIResponse<T>>;
  post<T>(url: string, data: any): Promise<ClickUpAPIResponse<T>>;
}

export interface ClickUpAPIResponse<T> {
  data: T;
  status: number;
  headers: HTTPHeaders;
  rateLimitInfo: ClickUpRateLimitInfo | null;
}

// src/domains/clickup/types/http.types.ts
export type HTTPHeaders = Record<string, string>;

export type HTTPConfig = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly headers?: HTTPHeaders;
  readonly body?: string;
  readonly timeout?: number;
};

export type ClickUpHttpClientConfig = {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
  readonly userAgent?: string;
};

// src/domains/clickup/services/clickup-http-client.service.ts
import type { IClickUpHttpClient, ClickUpAPIResponse } from '../interfaces/http-client.interface';
import type { HTTPConfig, ClickUpHttpClientConfig } from '../types/http.types';

export class ClickUpHttpClient implements IClickUpHttpClient {
  // Clean service implementation only
}
```

### AI Enforcement Rules

#### BEFORE Creating Any Service:
```
AI: "I'm about to create [ServiceName]. I detect these types/interfaces needed:
- Interface: I[ServiceName] → goes to interfaces/[service-name].interface.ts
- Types: [TypeName1, TypeName2] → goes to types/[category].types.ts
- Config: [ConfigName] → goes to types/config.types.ts

Should I create the interfaces and types first in separate files? [YES required]"
```

#### When AI Detects Inline Types/Interfaces:
```
AI: "🚫 VIOLATION DETECTED: [ServiceFile] contains inline type definitions.

Found violations:
- HTTPConfig interface (line X) → should be in types/http.types.ts
- ClickUpAPIResponse interface (line Y) → should be in interfaces/api.interface.ts

REQUIRED ACTION: I must extract these to proper files before continuing.
Shall I extract them now? [YES required to continue]"
```

### File Organization Rules

#### Types vs Interfaces Decision Matrix:
| Use **interfaces/** for: | Use **types/** for: |
|-------------------------|---------------------|
| Service contracts (IUserService) | Data structures (User, UserData) |
| API response shapes | Configuration objects |
| Repository contracts | Union types (Status \| Error) |
| Client contracts | Primitive combinations |
| Abstract behaviors | Utility type definitions |

#### Naming Conventions:
```typescript
// Interfaces (contracts/behaviors)
interfaces/
├── user-service.interface.ts     // IUserService
├── http-client.interface.ts      // IHttpClient, IAPIResponse
└── repository.interface.ts       // IUserRepository

// Types (data structures)  
types/
├── user.types.ts                 // User, UserData, CreateUserRequest
├── api.types.ts                  // APIResponse<T>, HTTPHeaders
├── config.types.ts               // AppConfig, DatabaseConfig
└── common.types.ts               // ID, Timestamp, Status
```

### AI Extraction Workflow

#### Step 1: Detection
```typescript
// AI scans service files for violations
function detectInlineTypes(serviceFile: string): Violation[] {
  const violations = [];
  
  // Detect exported interfaces
  if (contains(serviceFile, 'export interface')) {
    violations.push({
      type: 'interface',
      suggestion: 'Extract to interfaces/ directory'
    });
  }
  
  // Detect exported types
  if (contains(serviceFile, 'export type')) {
    violations.push({
      type: 'type',
      suggestion: 'Extract to types/ directory'
    });
  }
  
  return violations;
}
```

#### Step 2: Extraction Plan
```
AI: "Extraction plan for [ServiceName]:

1. Create interfaces/[service].interface.ts:
   - IClickUpHttpClient (service contract)
   - ClickUpAPIResponse<T> (API response shape)

2. Create types/http.types.ts:
   - HTTPConfig (configuration data)
   - HTTPHeaders (utility type)

3. Update [ServiceName] imports:
   - Import from new interface file
   - Import from new types file

4. Update other files that might import these types

Proceed with extraction? [confirmation required]"
```

#### Step 3: Automated Extraction
```typescript
// AI creates properly organized files
// interfaces/clickup-http-client.interface.ts
/**
 * @type: interface
 * @domain: clickup
 * @purpose: HTTP client contract for ClickUp API
 * @exports: [IClickUpHttpClient, ClickUpAPIResponse]
 */

// types/http.types.ts  
/**
 * @type: types
 * @domain: clickup
 * @purpose: HTTP-related data structures
 * @exports: [HTTPConfig, HTTPHeaders, ClickUpHttpClientConfig]
 */

// services/clickup-http-client.service.ts
/**
 * @type: service
 * @domain: clickup
 * @purpose: HTTP client implementation
 * @implements: IClickUpHttpClient
 * @dependencies: [ClickUpAPIError]
 */
```

### Import Organization Rules

#### Clean Import Structure:
```typescript
// ✅ GOOD: Organized imports in service files
// External dependencies first
import { ClickUpAPIError } from '../errors/clickup-api.error';

// Interface imports (contracts)
import type { IClickUpHttpClient, ClickUpAPIResponse } from '../interfaces/http-client.interface';

// Type imports (data structures)
import type { 
  HTTPConfig, 
  HTTPHeaders, 
  ClickUpHttpClientConfig 
} from '../types/http.types';

// Shared types
import type { ClickUpRateLimitInfo } from '../types/api.types';
```

#### Import Rules:
- **Interface imports**: Use `import type` for interfaces
- **Type imports**: Always use `import type` for types
- **Group by category**: External → Interfaces → Types → Shared
- **Alphabetical within groups**: Keep imports sorted

### Violation Prevention

#### Service File Template:
```typescript
/**
 * @type: service
 * @domain: [domain]
 * @purpose: [single line purpose]
 * @implements: [IInterfaceName]
 * @dependencies: [list]
 * @tested: no
 */

// IMPORTS ONLY - NO TYPE DEFINITIONS ALLOWED
import type { ... } from '../interfaces/...';
import type { ... } from '../types/...';

// SERVICE IMPLEMENTATION ONLY
export class [ServiceName] implements [IServiceName] {
  // Implementation only - no type definitions
}

// NO EXPORTS OF TYPES OR INTERFACES ALLOWED
```

#### AI Pre-Check Before Service Creation:
```typescript
function validateServiceFileStructure(content: string): ValidationResult {
  const violations = [];
  
  if (content.includes('export interface')) {
    violations.push('Contains interface definition - should be in interfaces/');
  }
  
  if (content.includes('export type')) {
    violations.push('Contains type definition - should be in types/');
  }
  
  if (violations.length > 0) {
    return {
      valid: false,
      violations,
      action: 'Extract types/interfaces to proper directories first'
    };
  }
  
  return { valid: true };
}
```

### Benefits of Proper Organization:

1. **Reusability**: Types/interfaces can be imported by multiple services
2. **Maintainability**: Changes to types don't affect service logic
3. **Testability**: Easier to mock interfaces separately
4. **Clarity**: Service files focus only on business logic
5. **Circular Dependencies**: Prevents import cycles
6. **Bundle Size**: Better tree-shaking for unused types

---

## Code Size & Complexity Rules

### File Size Limits (STRICT ENFORCEMENT)
- **Maximum 300 lines per service class** (excluding imports/exports)
- **Maximum 500 lines total per file** (including everything)
- **Maximum 50 lines per method/function**
- **Maximum 5 public methods per service class**

### AI Actions When Limits Exceeded

#### When Service Approaches 250+ Lines:
```
AI: "⚠️ WARNING: [ServiceName] is approaching 250 lines. 
Current responsibilities detected:
1. [Responsibility 1]
2. [Responsibility 2]  
3. [Responsibility 3]

Should I:
A) Split into separate services by responsibility?
B) Extract utility methods to helper classes?
C) Create domain-specific sub-services?

RECOMMENDATION: Split by [specific reason based on analysis]"
```

#### When Service Exceeds 300 Lines:
```
AI: "🚫 BLOCKED: [ServiceName] exceeds 300 lines (current: X lines).
This violates SRP and maintainability rules.

REQUIRED ACTION: I must split this service before adding more code.

Detected split opportunities:
1. Extract [SpecificFeature]Service (lines X-Y)
2. Extract [AnotherFeature]Service (lines A-B)
3. Create [Helper]Utils for shared logic (lines C-D)

Shall I proceed with the split? [YES required to continue]"
```

### Service Splitting Strategies

#### 1. By Business Domain
```typescript
// ❌ BAD: One large service (500+ lines)
class TaskManagementService {
  // ClickUp operations (150 lines)
  createClickUpTask() { ... }
  updateClickUpTask() { ... }
  
  // Zendesk operations (150 lines)
  createZendeskTicket() { ... }
  updateZendeskTicket() { ... }
  
  // Synchronization logic (200 lines)
  syncTaskToTicket() { ... }
  syncTicketToTask() { ... }
}

// ✅ GOOD: Split by domain
class ClickUpTaskService {
  createTask() { ... }
  updateTask() { ... }
}

class ZendeskTicketService {
  createTicket() { ... }
  updateTicket() { ... }
}

class TaskSyncService {
  constructor(
    private clickUpService: IClickUpTaskService,
    private zendeskService: IZendeskTicketService
  ) {}
  
  syncTaskToTicket() { ... }
  syncTicketToTask() { ... }
}
```

#### 2. By Operation Type (CQRS Pattern)
```typescript
// ❌ BAD: Mixed read/write operations
class UserService {
  // Read operations (200 lines)
  getUser() { ... }
  searchUsers() { ... }
  getUserStats() { ... }
  
  // Write operations (300 lines)  
  createUser() { ... }
  updateUser() { ... }
  deleteUser() { ... }
}

// ✅ GOOD: Separate read/write
class UserQueryService {
  getUser() { ... }
  searchUsers() { ... }
  getUserStats() { ... }
}

class UserCommandService {
  createUser() { ... }
  updateUser() { ... }
  deleteUser() { ... }
}
```

#### 3. By Layer Responsibility
```typescript
// ❌ BAD: Mixed concerns (400+ lines)
class TaskService {
  // Data validation (100 lines)
  validateTaskData() { ... }
  
  // Business logic (150 lines)
  processTask() { ... }
  
  // External API calls (150 lines)
  callClickUpAPI() { ... }
  callZendeskAPI() { ... }
}

// ✅ GOOD: Separate by layer
class TaskValidator {
  validateTaskData() { ... }
}

class TaskBusinessLogic {
  processTask() { ... }
}

class TaskApiClient {
  callClickUpAPI() { ... }
  callZendeskAPI() { ... }
}

class TaskService {
  constructor(
    private validator: TaskValidator,
    private businessLogic: TaskBusinessLogic,
    private apiClient: TaskApiClient
  ) {}
  
  async handleTask(data: TaskData) {
    const validData = await this.validator.validateTaskData(data);
    const result = await this.businessLogic.processTask(validData);
    return await this.apiClient.callClickUpAPI(result);
  }
}
```

### Automated Size Checking Rules

#### AI Must Check Before Adding Code:
```typescript
// AI internal check before modification
function checkServiceSize(filePath: string): SizeCheckResult {
  const currentLines = countLines(filePath);
  
  if (currentLines > 300) {
    return {
      allowed: false,
      reason: "Service exceeds 300 lines - must split first",
      recommendations: analyzeSplitOpportunities(filePath)
    };
  }
  
  if (currentLines > 250) {
    return {
      allowed: true,
      warning: "Approaching size limit - consider splitting",
      recommendations: suggestSplitStrategies(filePath)
    };
  }
  
  return { allowed: true };
}
```

#### Method Complexity Limits:
```typescript
// AI checks method complexity
function checkMethodComplexity(method: string): boolean {
  const lines = countMethodLines(method);
  const cyclomaticComplexity = calculateComplexity(method);
  
  return lines <= 50 && cyclomaticComplexity <= 10;
}
```

### Split Decision Matrix

| Service Type | Split Strategy | Example |
|-------------|---------------|---------|
| **CRUD Service** | By Entity | UserService → User + Profile + Settings |
| **Integration Service** | By External System | ApiService → ClickUp + Zendesk + Slack |
| **Business Logic** | By Use Case | OrderService → Create + Update + Cancel |
| **Data Processing** | By Stage | ProcessService → Validate + Transform + Store |

### AI Refactoring Workflow

#### Step 1: Analysis
```
AI: "Analyzing [ServiceName] (X lines):
- Primary responsibilities: [list]
- External dependencies: [list]  
- Public interface complexity: [score]
- Recommended split: [strategy] because [reason]

Proceed with analysis? [confirmation required]"
```

#### Step 2: Interface Design
```
AI: "Creating split interfaces:

interface ITaskCreationService {
  createTask(data: CreateTaskData): Promise<Task>;
}

interface ITaskUpdateService {  
  updateTask(id: string, data: UpdateTaskData): Promise<Task>;
}

interface ITaskQueryService {
  getTask(id: string): Promise<Task | null>;
  searchTasks(query: SearchQuery): Promise<Task[]>;
}

Approve these interfaces? [confirmation required]"
```

#### Step 3: Implementation Split
```
AI: "Extracting services:
1. Move lines X-Y to TaskCreationService
2. Move lines A-B to TaskUpdateService  
3. Move lines C-D to TaskQueryService
4. Update dependency injection
5. Update tests

Begin extraction? [confirmation required]"
```

#### Step 4: Integration Update
```
AI: "Updating service consumers:
- Update 3 route handlers
- Update 2 other services
- Update test files
- Verify all imports

This will maintain the same public API. Proceed? [confirmation required]"
```

### Prevention Rules

#### AI Must Ask Before Creating Large Services:
```
AI: "This service will handle:
1. [Feature A] (~100 lines estimated)
2. [Feature B] (~150 lines estimated)  
3. [Feature C] (~200 lines estimated)

Total estimate: ~450 lines - approaching limit.

Should I:
A) Create separate services from the start?
B) Build as one service and split later?
C) Redesign the approach to reduce complexity?

RECOMMENDATION: Option A - separate services"
```

#### Complexity Budget Tracking:
```typescript
// AI tracks complexity budget
interface ServiceBudget {
  maxLines: 300;
  currentLines: number;
  maxMethods: 5;
  currentMethods: number;
  remainingBudget: number;
}
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