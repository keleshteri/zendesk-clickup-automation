# Zendesk-ClickUp Automation Project Rules

## Project Overview
**Project**: Zendesk-ClickUp Automation  
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