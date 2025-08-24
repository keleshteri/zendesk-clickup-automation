# Code Quality Standards

## Overview
This document defines general code quality standards, formatting rules, and maintainability guidelines for the Zendesk-ClickUp Automation project. These rules complement the TypeScript-specific guidelines and apply to all code regardless of language.

---

## General Code Quality Principles

### SOLID Principles
- **Single Responsibility**: Each class/function should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### DRY (Don't Repeat Yourself)
```typescript
// ❌ BAD - Code duplication
function validateZendeskTicket(ticket: ZendeskTicket): boolean {
  if (!ticket.id || ticket.id.trim() === '') return false;
  if (!ticket.subject || ticket.subject.trim() === '') return false;
  return true;
}

function validateClickUpTask(task: ClickUpTask): boolean {
  if (!task.id || task.id.trim() === '') return false;
  if (!task.name || task.name.trim() === '') return false;
  return true;
}

// ✅ GOOD - Reusable validation
function validateRequiredString(value: string | undefined, fieldName: string): boolean {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required and cannot be empty`);
  }
  return true;
}

function validateZendeskTicket(ticket: ZendeskTicket): boolean {
  validateRequiredString(ticket.id, 'Ticket ID');
  validateRequiredString(ticket.subject, 'Subject');
  return true;
}
```

---

## Naming Conventions

### Variables and Functions
```typescript
// ✅ GOOD - Descriptive names
const activeTicketCount = getActiveTicketCount();
const userPreferences = await fetchUserPreferences(userId);

// ❌ BAD - Unclear abbreviations
const cnt = getActTktCnt();
const prefs = await fetchUsrPrefs(uid);
```

### Constants
```typescript
// ✅ GOOD - Descriptive constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const ZENDESK_API_BASE_URL = 'https://api.zendesk.com';

// ❌ BAD - Magic numbers
if (retryCount > 3) { /* ... */ }
setTimeout(callback, 5000);
```

### File and Directory Names
```
✅ GOOD
src/
├── services/
│   ├── zendesk-service.ts
│   ├── clickup-service.ts
│   └── notification-service.ts
├── utils/
│   ├── date-formatter.ts
│   ├── url-builder.ts
│   └── validation-helpers.ts

❌ BAD
src/
├── services/
│   ├── zd.ts
│   ├── cu.ts
│   └── notif.ts
├── utils/
│   ├── dt.ts
│   ├── url.ts
│   └── val.ts
```

---

## Code Organization

### File Structure
```typescript
// File: zendesk-service.ts

// 1. Imports (external libraries first, then internal)
import axios from 'axios';
import { Logger } from 'winston';

import { ZendeskTicket, ApiResponse } from '../types';
import { validateTicket } from '../utils/validation';
import { buildApiUrl } from '../utils/url-builder';

// 2. Types and interfaces specific to this file
interface ZendeskServiceConfig {
  apiKey: string;
  subdomain: string;
  timeout: number;
}

// 3. Constants
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// 4. Main class/function implementation
export class ZendeskService {
  // Implementation
}

// 5. Helper functions (if any)
function formatTicketData(rawData: unknown): ZendeskTicket {
  // Implementation
}
```

### Function Length and Complexity
```typescript
// ✅ GOOD - Single responsibility, readable
async function processTicket(ticket: ZendeskTicket): Promise<ProcessingResult> {
  const validationResult = validateTicket(ticket);
  if (!validationResult.isValid) {
    return { success: false, error: validationResult.error };
  }

  const mappedData = mapTicketToTask(ticket);
  const result = await createClickUpTask(mappedData);
  
  return result;
}

// ❌ BAD - Too complex, multiple responsibilities
async function processTicketComplex(ticket: any): Promise<any> {
  // 50+ lines of validation, mapping, API calls, error handling
  // Multiple nested if statements
  // Mixed concerns
}
```

---

## Error Handling Standards

### Custom Error Classes
```typescript
// Base error class
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class ApiError extends AppError {
  readonly code = 'API_ERROR';
  readonly statusCode = 500;
  
  constructor(
    message: string,
    public readonly apiResponse?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }
}
```

### Error Handling Patterns
```typescript
// ✅ GOOD - Specific error handling
async function fetchTicket(id: string): Promise<ZendeskTicket> {
  try {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new NotFoundError(`Ticket ${id} not found`);
      }
      if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid API credentials');
      }
    }
    throw new ApiError('Failed to fetch ticket', error, { ticketId: id });
  }
}

// ❌ BAD - Generic error handling
async function fetchTicketBad(id: string): Promise<any> {
  try {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    console.log('Error:', error);
    throw error;
  }
}
```

---

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Processes a Zendesk ticket and creates corresponding ClickUp task
 * 
 * @param ticket - The Zendesk ticket to process
 * @param options - Processing options and configuration
 * @returns Promise resolving to processing result
 * 
 * @throws {ValidationError} When ticket data is invalid
 * @throws {ApiError} When ClickUp API call fails
 * 
 * @example
 * ```typescript
 * const result = await processTicket(ticket, { priority: 'high' });
 * if (result.success) {
 *   console.log('Task created:', result.data.id);
 * }
 * ```
 */
async function processTicket(
  ticket: ZendeskTicket,
  options: ProcessingOptions
): Promise<ProcessingResult<ClickUpTask>> {
  // Implementation
}
```

### Inline Comments
```typescript
// ✅ GOOD - Explains why, not what
function calculatePriority(ticket: ZendeskTicket): ClickUpPriority {
  // Business rule: Urgent Zendesk tickets always map to High in ClickUp
  // to ensure they don't get lost in ClickUp's Urgent filter
  if (ticket.priority === 'urgent') {
    return 'high';
  }
  
  // Standard mapping for other priorities
  return PRIORITY_MAPPING[ticket.priority];
}

// ❌ BAD - States the obvious
function calculatePriorityBad(ticket: ZendeskTicket): ClickUpPriority {
  // Check if priority is urgent
  if (ticket.priority === 'urgent') {
    // Return high priority
    return 'high';
  }
  
  // Return mapped priority
  return PRIORITY_MAPPING[ticket.priority];
}
```

---

## Performance Guidelines

### Efficient Data Structures
```typescript
// ✅ GOOD - Use Map for frequent lookups
const ticketCache = new Map<string, ZendeskTicket>();

function getCachedTicket(id: string): ZendeskTicket | undefined {
  return ticketCache.get(id); // O(1) lookup
}

// ❌ BAD - Array.find for frequent lookups
const ticketArray: ZendeskTicket[] = [];

function getCachedTicketSlow(id: string): ZendeskTicket | undefined {
  return ticketArray.find(ticket => ticket.id === id); // O(n) lookup
}
```

### Async/Await Best Practices
```typescript
// ✅ GOOD - Parallel execution when possible
async function fetchTicketData(ticketId: string): Promise<TicketData> {
  const [ticket, comments, attachments] = await Promise.all([
    fetchTicket(ticketId),
    fetchComments(ticketId),
    fetchAttachments(ticketId)
  ]);
  
  return { ticket, comments, attachments };
}

// ❌ BAD - Sequential execution
async function fetchTicketDataSlow(ticketId: string): Promise<TicketData> {
  const ticket = await fetchTicket(ticketId);
  const comments = await fetchComments(ticketId);
  const attachments = await fetchAttachments(ticketId);
  
  return { ticket, comments, attachments };
}
```

---

## Testing Standards

### Test Organization
```typescript
// test/services/zendesk-service.test.ts

describe('ZendeskService', () => {
  describe('fetchTicket', () => {
    it('should return ticket when ID exists', async () => {
      // Arrange
      const ticketId = 'ticket-123';
      const expectedTicket = createMockTicket({ id: ticketId });
      mockApi.get.mockResolvedValue({ data: expectedTicket });
      
      // Act
      const result = await zendeskService.fetchTicket(ticketId);
      
      // Assert
      expect(result).toEqual(expectedTicket);
      expect(mockApi.get).toHaveBeenCalledWith(`/tickets/${ticketId}`);
    });
    
    it('should throw NotFoundError when ticket does not exist', async () => {
      // Arrange
      const ticketId = 'nonexistent';
      mockApi.get.mockRejectedValue(new AxiosError('Not Found', '404'));
      
      // Act & Assert
      await expect(zendeskService.fetchTicket(ticketId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

### Test Naming
```typescript
// ✅ GOOD - Descriptive test names
it('should create ClickUp task when Zendesk ticket is valid')
it('should throw ValidationError when ticket subject is empty')
it('should retry API call up to 3 times on network failure')

// ❌ BAD - Vague test names
it('should work')
it('should handle errors')
it('should test the function')
```

---

## Code Review Checklist

### Before Submitting Code
- [ ] All functions have explicit return types
- [ ] No magic numbers or strings (use constants)
- [ ] Error handling is specific and informative
- [ ] Functions are single-purpose and reasonably sized
- [ ] Variable names are descriptive and clear
- [ ] Comments explain "why" not "what"
- [ ] Tests cover happy path and error cases
- [ ] No console.log statements in production code
- [ ] Imports are organized and unused imports removed
- [ ] Code follows established patterns in the codebase

### During Code Review
- [ ] Logic is easy to follow and understand
- [ ] Edge cases are handled appropriately
- [ ] Performance implications are considered
- [ ] Security best practices are followed
- [ ] Documentation is accurate and helpful
- [ ] Tests are meaningful and comprehensive
- [ ] Code is consistent with project standards

---

## Formatting and Style

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### ESLint Rules
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn"
  }
}
```

---

## Maintenance Guidelines

### Code Refactoring
- Refactor when adding new features that would duplicate existing logic
- Extract common patterns into reusable utilities
- Simplify complex conditional logic
- Remove dead code and unused dependencies
- Update documentation when behavior changes

### Technical Debt Management
- Document technical debt with TODO comments including context
- Prioritize debt that impacts development velocity
- Address security-related debt immediately
- Plan regular refactoring sessions
- Track debt in project management tools

### Dependency Management
- Keep dependencies up to date
- Audit dependencies for security vulnerabilities
- Prefer well-maintained packages with active communities
- Document why specific versions are pinned
- Regularly review and remove unused dependencies

---

These code quality standards ensure maintainable, readable, and robust code across the Zendesk-ClickUp automation project. All team members and AI assistants must follow these guidelines consistently.