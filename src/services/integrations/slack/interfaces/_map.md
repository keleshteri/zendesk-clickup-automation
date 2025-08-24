# 📁 interfaces Module Map

> **Purpose**: Type definitions and interfaces

## 📊 Quick Stats
- **Files**: 5
- **Classes**: 0
- **Interfaces**: 6
- **Functions**: 0

## 🗂️ Files Overview

### `slack-app-mention-event.interface.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `SlackAppMentionEvent`
**Properties**:
- `type: unknown`
- `user: string`
- `text: string`
- `channel: string`
- `ts: string`

---

### `slack-error.interface.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `SlackAPIError`
**Properties**:
- `code: string`
- `data?: unknown`
- `message?: string`
- `original?: Error`

**INTERFACE**: `SlackAPIErrorWithContext`
**Properties**:
- `context?: unknown`
- `timestamp?: Date`

---

### `slack-event.interface.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `SlackEvent`
**Properties**:
- `type: string`
- `event_ts: string`

---

### `slack-member-joined-channel-event.interface.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `SlackMemberJoinedChannelEvent`
**Properties**:
- `type: unknown`
- `user: string`
- `channel: string`

---

### `slack-message-event.interface.ts`
**Purpose**: Type definitions and interfaces | **Risk**: low

**INTERFACE**: `SlackMessageEvent`
**Properties**:
- `type: unknown`
- `user?: string`
- `bot_id?: string`
- `text?: string`
- `channel: string`
- `ts: string`
- `thread_ts?: string`
- `subtype?: string`

---

## 🔗 Dependencies
- `./slack-event.interface`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/24/2025, 2:46:08 PM*
