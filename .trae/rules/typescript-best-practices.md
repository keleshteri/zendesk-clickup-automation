# TypeScript Best Practices & Strict Type Safety Rules

## Overview
This document defines mandatory TypeScript standards for the Zendesk-ClickUp Automation project. All AI assistants and developers must follow these rules to ensure maximum type safety, code quality, and maintainability.

---

## Mandatory TypeScript Standards

### Variable and Function Typing
```typescript
// ❌ BAD - Implicit types
const data = fetchData();
function processTicket(ticket) {
  return ticket.id;
}

// ✅ GOOD - Explicit types
const data: TicketData[] = fetchData();
function processTicket(ticket: ZendeskTicket): string {
  return ticket.id;
}
```

### TypeScript Configuration Requirements
```json
// tsconfig.json - MANDATORY settings
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,            // Error on implicit 'any' type
    "noImplicitReturns": true,        // Error when not all code paths return
    "noImplicitThis": true,           // Error on 'this' expressions with implied 'any'
    "noUnusedLocals": true,           // Error on unused local variables
    "noUnusedParameters": true,       // Error on unused parameters
    "exactOptionalPropertyTypes": true, // Strict optional property checks
    "noUncheckedIndexedAccess": true, // Add undefined to index signature results
    "noPropertyAccessFromIndexSignature": true // Require bracket notation for dynamic properties
  }
}
```

---

## Class and Method Requirements

### Class Property Typing
```typescript
class TicketProcessor {
  // ❌ BAD - implicit types
  private cache = new Map();
  private config = {};
  
  // ✅ GOOD - explicit types
  private cache: Map<string, CachedTicket> = new Map();
  private config: ProcessorConfig = {};
  
  // REQUIRED: All method parameters and returns typed
  public processTicket(
    ticket: ZendeskTicket,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    // Implementation
  }
  
  // REQUIRED: Private methods also need full typing
  private validateTicket(ticket: ZendeskTicket): boolean {
    return ticket.id !== undefined && ticket.status !== null;
  }
}
```

---

## Interface and Type Definitions

### Interface Standards
```typescript
// REQUIRED: Use interfaces for object shapes
interface ZendeskTicket {
  readonly id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: User; // Optional properties explicitly marked
  tags: readonly string[]; // Use readonly for immutable arrays
  createdAt: Date;
  updatedAt: Date;
}

// REQUIRED: Use union types for strict value constraints
type TicketStatus = 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

// REQUIRED: Use generic types for reusable components
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}
```

---

## Error Handling Type Safety

### Typed Error Patterns
```typescript
// REQUIRED: Typed error handling
type ProcessingError = {
  code: 'VALIDATION_ERROR' | 'API_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, unknown>;
};

type ProcessingResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ProcessingError;
};

// REQUIRED: Functions that can fail must return Result types
async function processTicket(ticket: ZendeskTicket): Promise<ProcessingResult<ClickUpTask>> {
  try {
    const task = await createClickUpTask(ticket);
    return { success: true, data: task };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { ticketId: ticket.id }
      }
    };
  }
}
```

---

## Utility Type Usage

### TypeScript Utility Types
```typescript
// REQUIRED: Use TypeScript utility types appropriately
type PartialTicket = Partial<ZendeskTicket>; // For updates
type RequiredTicketFields = Required<Pick<ZendeskTicket, 'id' | 'subject' | 'status'>>;
type TicketWithoutId = Omit<ZendeskTicket, 'id'>; // For creation
type TicketKeys = keyof ZendeskTicket; // For dynamic property access
```

---

## Function Signature Requirements

### Function Typing Standards
```typescript
// ❌ BAD - No types
function mapTicketToTask(ticket, config) {
  // Implementation
}

// ✅ GOOD - Full typing
function mapTicketToTask(
  ticket: ZendeskTicket,
  config: MappingConfig
): ClickUpTaskInput {
  // Implementation
}

// REQUIRED: Async functions must specify Promise return type
async function fetchTickets(filters: TicketFilters): Promise<ZendeskTicket[]> {
  // Implementation
}

// REQUIRED: Higher-order functions with proper generic typing
function withRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // Implementation
  };
}
```

---

## Array and Object Type Safety

### Collection Typing
```typescript
// REQUIRED: Specify array element types
const ticketIds: string[] = ['1', '2', '3'];
const tickets: ZendeskTicket[] = await fetchTickets();

// REQUIRED: Use readonly for immutable data
const PRIORITY_WEIGHTS: readonly Record<TicketPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4
} as const;

// REQUIRED: Proper object typing with index signatures
interface TicketCache {
  [ticketId: string]: ZendeskTicket;
}

// REQUIRED: Use const assertions for literal types
const TICKET_STATUSES = ['new', 'open', 'pending'] as const;
type TicketStatus = typeof TICKET_STATUSES[number];
```

---

## AI Assistant Enforcement Rules

### Pre-Code Generation Checks
1. **Check existing patterns**: Review similar files for consistency
2. **Validate imports**: Ensure proper import organization and types
3. **Type safety first**: Never use `any` without explicit justification
4. **Interface compliance**: Verify new code matches existing interfaces

### During Code Generation
- **Explicit typing**: Always provide return types and parameter types
- **Error boundaries**: Include proper error handling with typed errors
- **Validation**: Add runtime validation for external data
- **Documentation**: Include JSDoc for complex functions

### Post-Code Generation
1. **Type check**: Ensure TypeScript compilation succeeds
2. **Import cleanup**: Remove unused imports, organize remaining ones
3. **Consistency check**: Verify naming conventions are followed
4. **Test coverage**: Ensure new code has appropriate tests

---

## Code Quality Checklist

### ✅ Good Patterns
```typescript
// Explicit types and error handling
interface UserData {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

async function fetchUser(id: string): Promise<UserData | null> {
  try {
    const response = await api.get(`/users/${id}`);
    if (!isUserData(response.data)) {
      throw new ValidationError('Invalid user data format');
    }
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
```

### ❌ Bad Patterns
```typescript
// Any types and poor error handling
function getUser(id: any): any {
  return api.get('/users/' + id).then(r => r.data);
}
```

---

## Validation Scripts

### Required Package.json Scripts
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "type-coverage": "npx type-coverage --strict --at-least 95",
    "validate": "npm run typecheck && npm run type-coverage"
  }
}
```

### Pre-Commit Requirements
```bash
# MANDATORY: Must pass before any commit
npm run typecheck  # Runs: tsc --noEmit

# REQUIRED: Zero TypeScript errors allowed
# If typecheck fails, fix all errors before proceeding
```

---

## Component-Specific Rules

### Agents (`src/agents/`)
```typescript
// REQUIRED: All agent classes must implement proper interfaces
interface Agent<TInput, TOutput> {
  readonly name: string;
  readonly version: string;
  process(input: TInput): Promise<AgentResult<TOutput>>;
  validate(input: TInput): ValidationResult;
}

// REQUIRED: Strict error handling
type AgentResult<T> = {
  success: true;
  data: T;
  metadata: AgentMetadata;
} | {
  success: false;
  error: AgentError;
  recoverable: boolean;
};
```

### Services (`src/services/`)
```typescript
// REQUIRED: All service methods must have explicit return types
interface ZendeskService {
  getTicket(id: string): Promise<ServiceResult<ZendeskTicket>>;
  updateTicket(id: string, updates: Partial<ZendeskTicket>): Promise<ServiceResult<void>>;
  searchTickets(query: TicketSearchQuery): Promise<ServiceResult<ZendeskTicket[]>>;
}

// REQUIRED: Proper generic constraints
interface ApiService<TEntity, TCreateInput, TUpdateInput> {
  create(input: TCreateInput): Promise<ServiceResult<TEntity>>;
  update(id: string, input: TUpdateInput): Promise<ServiceResult<TEntity>>;
  delete(id: string): Promise<ServiceResult<void>>;
}
```

### Config (`src/config/`)
```typescript
// REQUIRED: All config objects must be strongly typed and readonly
interface ProjectMappingConfig {
  readonly zendesk: {
    readonly fieldMappings: ReadonlyMap<string, string>;
    readonly statusMappings: Readonly<Record<ZendeskStatus, ClickUpStatus>>;
    readonly priorityMappings: Readonly<Record<ZendeskPriority, ClickUpPriority>>;
  };
  readonly clickup: {
    readonly spaceId: string;
    readonly listId: string;
    readonly customFields: ReadonlyArray<ClickUpCustomField>;
  };
}

// REQUIRED: Use const assertions for configuration
export const PROJECT_MAPPINGS = {
  'support-team': {
    zendeskViewId: 'view_123',
    clickupListId: 'list_456',
    slackChannel: '#support'
  }
} as const satisfies Record<string, ProjectMapping>;
```

### Types (`src/types/`)
```typescript
// REQUIRED: Comprehensive type definitions with JSDoc
/**
 * Represents a Zendesk ticket with all required and optional fields
 * @template TCustomFields - Custom field types for ticket customization
 */
interface ZendeskTicket<TCustomFields = Record<string, unknown>> {
  /** Unique ticket identifier */
  readonly id: string;
  /** Ticket subject line */
  subject: string;
  /** Current ticket status */
  status: ZendeskTicketStatus;
  /** Ticket priority level */
  priority: ZendeskTicketPriority;
  /** Assigned user, if any */
  assignee?: ZendeskUser;
  /** Ticket requester */
  readonly requester: ZendeskUser;
  /** Custom fields specific to this ticket type */
  customFields: TCustomFields;
  /** Ticket creation timestamp */
  readonly createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
}
```

---

## Error Resolution Process

### TypeScript Error Categories
```typescript
// REQUIRED: Categorized error types for better handling
type TypeScriptValidationError = 
  | { type: 'MISSING_TYPE_ANNOTATION'; location: CodeLocation; suggestion: string }
  | { type: 'IMPLICIT_ANY'; location: CodeLocation; suggestion: string }
  | { type: 'UNSAFE_ASSIGNMENT'; location: CodeLocation; suggestion: string }
  | { type: 'MISSING_RETURN_TYPE'; location: CodeLocation; suggestion: string }
  | { type: 'UNHANDLED_PROMISE'; location: CodeLocation; suggestion: string };

interface CodeLocation {
  file: string;
  line: number;
  column: number;
}

// REQUIRED: Detailed error reporting
interface TypeCheckReport {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  errors: TypeScriptValidationError[];
  suggestions: string[];
  coveragePercentage: number;
}
```

### When TypeScript Errors Occur
1. **Immediate Stop**: Do not proceed with any file modifications
2. **Error Analysis**: Parse and categorize each TypeScript error
3. **Fix Strategy**: Provide specific fixes for each error type
4. **Re-validation**: Run typecheck after each fix
5. **Documentation**: Update metadata with fix details

---

## Quality Gates

### Pre-Commit Requirements (All Must Pass)
1. `npm run typecheck` - Zero TypeScript errors
2. `npm run type-coverage` - Minimum 95% type coverage
3. All files must have proper type annotations
4. No `any` types without explicit justification

### Pre-Deployment Requirements
1. All quality gates passed
2. Type coverage above 95%
3. Integration tests passing
4. Performance benchmarks met

---

This document ensures maximum type safety and code quality for the Zendesk-ClickUp automation project. All AI assistants must follow these rules strictly to maintain the highest standards of TypeScript development.