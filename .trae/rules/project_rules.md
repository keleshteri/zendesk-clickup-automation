# Zendesk-ClickUp Automation Project Rules

## Project Overview
**Project**: Zendesk-ClickUp Automation 
**Description**: Automates Zendesk tickets and ClickUp tasks using NLP routing and AI-assisted agents.
**Status**: In development
**stack**: Zendesk, ClickUp, TypeScript, Cloudflare Workers, Multi-agent architecture, NLP routing, AI Memory MCP, Project Tracking
**Architecture**: Multi-agent TypeScript system with Cloudflare Workers  
**Tech Stack**: TypeScript, Cloudflare Workers, Multi-agent architecture, NLP routing  
**Memory System**: AI Memory MCP with persistent project tracking  

---

## AI Metadata System

### File Header Template
```javascript
/**
 * @ai-metadata
 * @component: ComponentName
 * @description: Brief description of the component's purpose
 * @last-update: YYYY-MM-DD
 * @last-editor: email@domain.com
 * @changelog: ./docs/changelog/component-name.md
 * @stability: stable | experimental | deprecated
 * @edit-permissions: "full" | "add-only" | "read-only" | "method-specific"
 * @method-permissions: { "methodName": "read-only" | "allow" }
 * @dependencies: ["file1.ts", "file2.ts"]
 * @tests: ["./tests/component.test.ts"]
 * @breaking-changes-risk: high | medium | low
 * @review-required: true | false
 * @ai-context: "Context about this component's role in the system"
 * 
 * @approvals:
 *   - dev-approved: true | false
 *   - dev-approved-by: "email@domain.com"
 *   - dev-approved-date: "YYYY-MM-DDTHH:mm:ssZ"
 *   - code-review-approved: true | false
 *   - code-review-approved-by: "reviewer@domain.com"
 *   - code-review-date: "YYYY-MM-DDTHH:mm:ssZ"
 *   - qa-approved: true | false
 *   - qa-approved-by: "qa@domain.com"
 *   - qa-approved-date: "YYYY-MM-DDTHH:mm:ssZ"
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */
```

---

## Memory MCP Integration Rules

### Session Management
```javascript
// REQUIRED: Start session for any development work
start_session("Description of the task or feature being worked on")

// REQUIRED: Record each completed step
add_session_step(step, filesModified, description)

// REQUIRED: Record important technical decisions
add_decision(key, value, reasoning)
```

### Project Structure
```
zendesk-clickup-automation/
├── .ai-memory/
│   ├── project-memory.json     # Persistent project state
│   ├── approval-states.json    # File approval tracking
│   └── decision-log.json       # Important decisions
├── src/
│   ├── agents/                 # Multi-agent components
│   ├── services/               # Business logic & integrations
│   ├── config/                 # Project mappings & settings
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Shared utilities
└── docs/
    └── changelog/              # Component changelogs
```

---

## AI Assistant Workflow Rules

### BEFORE ANY FILE MODIFICATION:
1. **Check AI Metadata**: Parse file header for @ai-metadata
2. **MCP Check**: Call `check_before_modification(filePath)`
3. **Permission Validation**:
   - If `"allowed": false` → STOP and explain why
   - If warnings exist → Ask user for confirmation
   - If `@edit-permissions: "read-only"` → NEVER modify
   - If `@breaking-changes-risk: "high"` → Require approval first

### PERMISSION ENFORCEMENT:
- `@edit-permissions: "read-only"` → NEVER modify
- `@edit-permissions: "add-only"` → Only append new code
- `@edit-permissions: "method-specific"` → Check individual method permissions
- `@breaking-changes-risk: "high"` → Require dev approval first
- `@review-required: true` → Block modification without approvals

### AFTER ANY MODIFICATION:
1. **MCP Actions**: Call `get_modification_actions(filePath)`
2. **Execute Actions**: Invalidate approvals, update changelog, etc.
3. **Update Metadata**:
   - SET `@dev-approved: false` (needs re-approval)
   - SET `@code-review-approved: false` (needs re-review)
   - UPDATE `@last-update` timestamp
   - UPDATE `@last-editor` with current user
4. **Session Tracking**: Call `add_session_step()` with changes made

---

## Approval Workflow

### Approval Types
- **Dev Approval**: Required for breaking changes, security-related modifications
- **Code Review**: Required for all changes
- **QA Approval**: Required for production-ready code

### Approval Commands
```javascript
// User approval
"I approve this" → SET @dev-approved: true

// AI code reviewer approval
AI_REVIEWER.approve() → SET @code-review-approved: true

// QA team approval
"QA approved" → SET @qa-approved: true
```

### MCP Approval Functions
```javascript
// Set approval status
set_file_approval(filePath, approvalType, approvedBy)

// Check approval status
get_file_approval_status(filePath)
```

---

## Component-Specific Rules

### Agents (`src/agents/`)
- **High Risk**: Core multi-agent orchestration
- **Required Approvals**: Dev + Code Review
- **Breaking Changes**: Always require QA approval
- **Dependencies**: Must update integration tests

### Services (`src/services/`)
- **Medium Risk**: Business logic and external integrations
- **Required Approvals**: Code Review
- **API Changes**: Require dev approval
- **Integration Changes**: Update documentation

### Config (`src/config/`)
- **High Risk**: Project mappings and team assignments
- **Required Approvals**: Dev + QA
- **Changes**: Always require approval before modification
- **Validation**: Must pass project assignment tests

### Types (`src/types/`)
- **Medium Risk**: TypeScript definitions
- **Required Approvals**: Code Review
- **Breaking Changes**: Require dev approval
- **Dependencies**: Update all dependent files

---

## Memory MCP Commands Reference

### Session Management
```javascript
// Start new session
start_session(task)

// Add completed step
add_session_step(step, filesModified, description)

// Record decision
add_decision(key, value, reasoning)

// Get project memory
get_project_memory()
```

### File Management
```javascript
// Check before modification
check_before_modification(filePath)

// Get modification actions
get_modification_actions(filePath)

// Parse file metadata
parse_file_metadata(filePath)

// Update file metadata
update_file_metadata(filePath, updates)
```

### Approval Management
```javascript
// Set approval
set_file_approval(filePath, approvalType, approvedBy)

// Get approval status
get_file_approval_status(filePath)

// Find files with metadata
find_files_with_metadata(pattern)
```

### Changelog Management
```javascript
// Add changelog entry
add_changelog_entry(description, filesChanged, type, breakingChange, impact)

// Get file changelog
get_file_changelog(filePath)

// Get recent changes
get_recent_changes(days)
```

---

## Security & Safety Rules

### Critical Files (NEVER modify without explicit approval)
- `src/config/project-mappings.ts`
- `src/config/team-assignments.ts`
- `wrangler.production.jsonc`
- `.env` files

### Deployment Files
- **Wrangler configs**: Require QA approval
- **Package.json**: Require dev approval for dependency changes
- **TypeScript config**: Require code review

### Testing Requirements
- **New features**: Must include tests
- **Breaking changes**: Must update existing tests
- **Config changes**: Must pass project assignment tests

---

## Error Handling

### When MCP Commands Fail
1. Log the error with context
2. Inform user of the failure
3. Provide alternative approach if possible
4. Do not proceed with file modifications

### When Approvals are Missing
1. Clearly explain what approval is needed
2. Provide instructions for obtaining approval
3. Block the modification until approval is granted
4. Suggest alternative approaches if available

### When Edit Permissions are Restricted
When AI agent encounters `@edit-permissions` restrictions:

#### For `@edit-permissions: "read-only"` files:
1. **NEVER attempt modification**
2. **Explain the restriction**: "This file is marked as read-only and cannot be modified by AI agents"
3. **Request user action**: "Would you like to:
   - Grant temporary edit access by updating the @edit-permissions metadata?
   - Make the changes manually yourself?
   - Provide specific approval to override this restriction?"
4. **Suggest alternatives**: Offer to create new files or modify related components instead

#### For `@edit-permissions: "add-only"` files:
1. **Explain the limitation**: "This file only allows appending new code, not modifying existing code"
2. **Offer options**: "I can:
   - Add new functions/methods at the end of the file
   - Create a separate file for the modifications
   - Wait for you to grant full edit permissions"

#### For `@edit-permissions: "method-specific"` files:
1. **Check individual method permissions** in `@method-permissions`
2. **Explain specific restrictions**: "Method X is read-only, but I can modify method Y"
3. **Request clarification**: "Would you like to update the method permissions or handle this differently?"

#### User Override Commands:
```javascript
// Temporary permission grant
"Grant edit access to [filename]" → Update @edit-permissions temporarily

// Permanent permission change
"Change [filename] to full edit permissions" → Update @edit-permissions permanently

// Override for specific task
"Override read-only for this task" → Allow modification with explicit user consent
```

---

## Development Workflow

### Starting New Work
1. Call `start_session("Task description")`
2. Review existing project memory
3. Check for related decisions and context
4. Plan the implementation approach

### During Development
1. Check file permissions before each modification
2. Record each significant step with `add_session_step()`
3. Document important decisions with `add_decision()`
4. Update file metadata after modifications

### Completing Work
1. Ensure all files have proper approvals
2. Update changelogs for modified components
3. Run tests and validate changes
4. Record final session summary

---

## TypeScript Best Practices

### Code Quality Standards
- **Strict TypeScript**: Use `strict: true` in tsconfig.json
- **No `any` types**: Use proper typing or `unknown` with type guards
- **Interface over Type**: Prefer interfaces for object shapes, types for unions/intersections
- **Explicit return types**: Always specify return types for functions
- **Readonly properties**: Use `readonly` for immutable data

### Naming Conventions
- **PascalCase**: Classes, interfaces, types, enums
- **camelCase**: Variables, functions, methods, properties
- **SCREAMING_SNAKE_CASE**: Constants and enum values
- **kebab-case**: File names (e.g., `user-service.ts`)
- **Prefix interfaces**: Use `I` prefix only when needed for disambiguation

### File Organization
- **Barrel exports**: Use `index.ts` files for clean imports
- **Single responsibility**: One main export per file
- **Co-location**: Keep related types, tests, and implementations together
- **Absolute imports**: Use path mapping in tsconfig for `src/` imports

### Type Safety Patterns
```typescript
// Use discriminated unions for state management
type RequestState = 
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: string };

// Use type guards for runtime validation
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Use generic constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
}
```

### Error Handling
- **Custom error classes**: Extend `Error` with specific error types
- **Result pattern**: Use `Result<T, E>` type for operations that can fail
- **Async error handling**: Always handle Promise rejections
- **Validation**: Use schema validation libraries (Zod, Joi)

### Performance Guidelines
- **Lazy loading**: Use dynamic imports for large modules
- **Tree shaking**: Structure exports to enable dead code elimination
- **Type-only imports**: Use `import type` when importing only for types
- **Avoid deep nesting**: Keep type complexity manageable

### Documentation Requirements
- **JSDoc comments**: Document all public APIs
- **Type annotations**: Self-documenting code through types
- **README files**: Include usage examples with TypeScript
- **Inline comments**: Explain complex business logic

### Testing Standards
- **Type testing**: Use `@ts-expect-error` for negative type tests
- **Mock typing**: Properly type mocks and stubs
- **Test utilities**: Create typed test helpers
- **Coverage**: Ensure type coverage with tools like `type-coverage`

### AI Assistant Enforcement Rules

#### BEFORE Writing TypeScript Code:
1. **Check existing patterns**: Review similar files for consistency
2. **Validate imports**: Ensure proper import organization and types
3. **Type safety first**: Never use `any` without explicit justification
4. **Interface compliance**: Verify new code matches existing interfaces

#### DURING Code Generation:
- **Explicit typing**: Always provide return types and parameter types
- **Error boundaries**: Include proper error handling with typed errors
- **Validation**: Add runtime validation for external data
- **Documentation**: Include JSDoc for complex functions

#### AFTER Code Changes:
1. **Type check**: Ensure TypeScript compilation succeeds
2. **Import cleanup**: Remove unused imports, organize remaining ones
3. **Consistency check**: Verify naming conventions are followed
4. **Test coverage**: Ensure new code has appropriate tests

#### Code Quality Checklist:
```typescript
// ✅ Good: Explicit types and error handling
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

// ❌ Bad: Any types and poor error handling
function getUser(id: any): any {
  return api.get('/users/' + id).then(r => r.data);
}
```

---

## Integration Points

### Zendesk Integration
- **Location**: `src/services/integrations/zendesk/`
- **Risk Level**: High (external API)
- **Required Approvals**: Dev + Code Review + QA
- **Testing**: Must include integration tests

### ClickUp Integration
- **Location**: `src/services/integrations/clickup/`
- **Risk Level**: High (external API)
- **Required Approvals**: Dev + Code Review + QA
- **Testing**: Must include integration tests

### Multi-Agent Orchestration
- **Location**: `src/agents/orchestration/`
- **Risk Level**: Critical (core system)
- **Required Approvals**: Dev + Code Review + QA
- **Testing**: Comprehensive unit and integration tests

---

This document serves as the authoritative guide for AI assistants working on the Zendesk-ClickUp automation project. All modifications must follow these rules to ensure code quality, security, and maintainability.