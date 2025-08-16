# Memory Management 🧠

This directory contains memory management systems for agents, including conversation history, working memory, and persistent storage capabilities.

## Purpose

The `memory` directory provides:
- Agent memory interfaces and implementations
- Conversation history management
- Working memory for temporary data storage
- Memory persistence and retrieval mechanisms
- Context management across agent interactions

## Key Components

### Core Memory Interface
- **AgentMemory**: Abstract memory interface for all memory types
- **MemoryManager**: Centralized memory management system
- **MemoryStore**: Persistent storage backend for memory data
- **MemorySerializer**: Serialization and deserialization utilities

### Conversation Memory
- **ConversationMemory**: Manages conversation history and context
- **DialogueTracker**: Tracks dialogue state and flow
- **ContextWindow**: Manages conversation context windows
- **MessageHistory**: Stores and retrieves message history

### Working Memory
- **WorkingMemory**: Temporary memory for active tasks
- **TaskContext**: Context specific to current tasks
- **VariableStore**: Temporary variable storage
- **SessionMemory**: Session-specific memory management

## Memory Types

### Short-term Memory
- Current conversation context
- Active task variables
- Temporary calculations
- Session-specific data

### Long-term Memory
- Historical conversations
- Learned patterns and preferences
- Agent knowledge base
- Persistent configurations

### Episodic Memory
- Specific interaction episodes
- Task execution history
- Error and success patterns
- Performance metrics

## Usage

```typescript
import { AgentMemory, ConversationMemory, WorkingMemory } from './memory';

// Initialize memory systems
const conversationMemory = new ConversationMemory();
const workingMemory = new WorkingMemory();

// Store conversation context
await conversationMemory.addMessage({
  role: 'user',
  content: 'Create a new ticket',
  timestamp: new Date()
});

// Store working variables
workingMemory.set('currentTicketId', '12345');
workingMemory.set('assigneeId', 'user123');

// Retrieve memory data
const recentMessages = await conversationMemory.getRecentMessages(10);
const ticketId = workingMemory.get('currentTicketId');
```

## Features

- **Context Preservation**: Maintain context across interactions
- **Memory Persistence**: Persistent storage for long-term memory
- **Memory Compression**: Efficient storage of large memory datasets
- **Context Retrieval**: Smart retrieval of relevant context
- **Memory Cleanup**: Automatic cleanup of expired memory
- **Memory Sharing**: Shared memory between related agents