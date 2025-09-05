# AI Coding Rules - Simplified & Enforceable

## 🔴 CRITICAL: Task Size Limits

### HARD STOPS - AI MUST REFUSE IF:
- Single task exceeds **100 lines of actual code** (excluding types/interfaces)
- Single file exceeds **300 lines total**
- Single response contains more than **3 files**

### When limit approached:
```
AI: "⚠️ Task too large (estimated X lines). Breaking into subtasks:
1. Create interfaces/types (Task 1)
2. Implement core logic (Task 2)
3. Add tests (Task 3)

Which task should I do first?"
```

---

## 🔴 CRITICAL: File Permission System

### BEFORE ANY FILE EDIT:
```typescript
/**
 * @ai-metadata
 * @description: description of the file
 * @edit-permission: "full" | "read-only" | "add-only"
 * @approved-by: "user@email.com" | null
 * @breaking-risk: "high" | "medium" | "low"
 * @dependencies: ["file1.ts", "file2.ts"]
 * @review-required: "yes" | "no"
 */
```

### ENFORCEMENT PROTOCOL:
```
1. CHECK permission → If "read-only" → STOP
   AI: "❌ Cannot edit [filename] - marked read-only. Need permission?"

2. CHECK approval → If high-risk && !approved → STOP
   AI: "⚠️ High-risk file needs approval. Request edit permission?"

3. CHECK size → If >250 lines → WARN
   AI: "⚠️ File approaching limit. Should I split it first?"
```

---

## 🔴 CRITICAL: Code Organization (ENFORCED ORDER)

### MANDATORY FILE STRUCTURE:
```typescript
// 1️⃣ IMPORTS (grouped & sorted)
import type { ... } from '../interfaces/...';
import type { ... } from '../types/...';

// 2️⃣ TYPE DEFINITIONS (if needed locally)
type LocalType = { ... };
enum LocalEnum { ... }

// 3️⃣ INTERFACES (if needed locally)  
interface LocalInterface { ... }

// 4️⃣ CONSTANTS
const CONFIG = { ... };
const DEFAULTS = { ... };

// 5️⃣ IMPLEMENTATION (classes/functions)
export class ServiceName { ... }
```

### VIOLATIONS = AUTOMATIC STOP:
```
AI detects wrong order → MUST fix before continuing
AI: "❌ Code organization violation. Fixing structure first..."
```

---

## 📁 Project Structure (ENFORCED)

```
src/
├── domains/          # Business domains
│   ├── clickup/
│   │   ├── interfaces/   # *.interface.ts ONLY
│   │   ├── types/        # *.types.ts ONLY
│   │   └── services/     # *.service.ts ONLY
│   └── zendesk/
├── shared/           # Shared utilities
└── infrastructure/   # DI, config, setup
```

### SEPARATION RULES:
- **NEVER** put types/interfaces in service files
- **ALWAYS** extract to proper directories
- **VIOLATION** = Stop and refactor first

---

## 🛠️ Development Workflow (STRICT SEQUENCE)

### Step 1: Define Contract
```typescript
// AI: "Creating interface first. Approve?"
interface ITaskService {
  createTask(data: CreateTaskDto): Promise<Task>;
}
// WAIT for: "approved" or changes
```

### Step 2: Define Types
```typescript
// AI: "Creating types with Zod. Approve?"
const CreateTaskDto = z.object({
  name: z.string(),
  priority: z.enum(['low', 'medium', 'high'])
});
type CreateTaskDto = z.infer<typeof CreateTaskDto>;
// WAIT for: "approved"
```

### Step 3: Implement (MAX 100 lines)
```typescript
// AI: "Implementing service (est. 80 lines). Proceed?"
export class TaskService implements ITaskService {
  async createTask(data: CreateTaskDto): Promise<Task> {
    // Implementation
  }
}
// If >100 lines: MUST split into sub-services
```

---

## 🚫 TypeScript Safety (NON-NEGOTIABLE)

### FORBIDDEN (Auto-reject):
```typescript
// ❌ NEVER
data.property              // No type guard
any                        // No any type
result as Type            // No unsafe casting
// @ts-ignore              // No ignoring errors
```

### REQUIRED (Every time):
```typescript
// ✅ ALWAYS
data?.property ?? default  // Optional chaining
unknown + type guard       // Type safety
z.parse() for external     // Validation
explicit return types      // Type clarity
```

---

## 📊 Enforcement Metrics

### AI MUST TRACK:
```typescript
interface TaskMetrics {
  linesWritten: number;      // Stop at 100
  filesModified: number;     // Stop at 3
  violationsFound: number;   // Stop at 1
  approvalsNeeded: string[]; // Request before continuing
}
```

### AUTOMATIC STOPS:
1. **Size violation** → Split task
2. **Permission denied** → Request approval
3. **Structure wrong** → Fix first
4. **Type unsafe** → Add guards

---

## 🎯 Quick Reference Commands

### User Commands:
- `"approve"` → Continue with current task
- `"grant edit to [file]"` → Override read-only
- `"split this task"` → Break into subtasks
- `"skip approval"` → Bypass approval (use carefully)

### AI Responses:
- `"❌ Cannot proceed: [reason]"`
- `"⚠️ Warning: [issue]. Continue?"`
- `"✅ Ready to implement. Approve?"`
- `"📋 Task too large. Split into: [list]"`

---

## 🔥 Priority Enforcement Order

1. **File Permissions** - Check first, always
2. **Task Size** - Never exceed 100 lines
3. **Code Organization** - Types → Interfaces → Implementation
4. **Type Safety** - No unsafe operations
5. **Approval Flow** - Wait for user confirmation

---

## 💡 AI Self-Check Protocol

Before EVERY code generation:
```
□ Permission checked?
□ Under 100 lines?
□ Types defined first?
□ Zod validation added?
□ No 'any' types?
□ Approval received?

If ANY unchecked → STOP and fix
```

---

## 🚨 Common Violations & Fixes

### Violation: "File too large"
```
FIX: AI: "Splitting into:
- user-query.service.ts (50 lines)
- user-command.service.ts (50 lines)"
```

### Violation: "No permission"
```
FIX: AI: "Need edit permission for [file].
Options:
1. Grant temporary access
2. Create new file instead
3. Skip this change"
```

### Violation: "Types in service file"
```
FIX: AI: "Moving types to proper location:
- IUserService → interfaces/user.interface.ts
- UserDto → types/user.types.ts"
```

---

## ⚡ Quick Decision Tree

```
Start Task
    ↓
Check Permission → Denied? → ASK USER
    ↓ OK
Check Size → >100 lines? → SPLIT TASK
    ↓ OK
Check Structure → Wrong? → FIX FIRST
    ↓ OK
Implement → Wait for approval
```

---

## 🎮 Example Enforcement

### Good AI Behavior:
```typescript
// AI: "Task: Create user service"
// AI: "Step 1: Checking permissions... ✅"
// AI: "Step 2: Creating interface (20 lines)... Need approval"
// User: "approved"
// AI: "Step 3: Creating types with Zod (15 lines)... Need approval"
// User: "approved"
// AI: "Step 4: Implementing service (45 lines)... Need approval"
// User: "approved"
// AI: "✅ Task complete: 80 lines across 3 files"
```

### Bad AI Behavior (AUTO-BLOCKED):
```typescript
// AI: "Here's the complete implementation:" [500 lines]
// SYSTEM: "❌ BLOCKED: Exceeded 100-line limit"
// AI: "Sorry, splitting into smaller tasks..."
```