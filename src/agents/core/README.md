# Core Infrastructure & Base Classes 🏗️

This directory contains the foundational infrastructure and base classes for the agent system.

## Purpose

The `core` directory provides:
- Abstract base classes for all agent types
- Common interfaces and contracts
- Shared utilities and helper functions
- Core infrastructure components
- Base agent lifecycle management

## Key Components

- **BaseAgent**: Abstract base class that all agents inherit from
- **AgentInterface**: Core interface defining agent capabilities
- **AgentLifecycle**: Manages agent initialization, execution, and cleanup
- **CoreUtilities**: Shared utility functions used across agents
- **ErrorHandling**: Centralized error handling and logging

## Usage

All specific agent implementations should extend the base classes provided here to ensure consistency and proper integration with the agent orchestration system.

```typescript
import { BaseAgent } from './BaseAgent';

class MyCustomAgent extends BaseAgent {
  // Implementation details
}
```

## Dependencies

This is a foundational layer with minimal external dependencies, focusing on providing stable abstractions for the entire agent system.