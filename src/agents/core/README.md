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
- **AgentFactory**: Factory class for creating agent instances with dependency injection
- **AgentRegistry**: Registry for managing agent class registrations and configurations
- **AgentInterface**: Core interface defining agent capabilities
- **AgentLifecycle**: Manages agent initialization, execution, and cleanup
- **CoreUtilities**: Shared utility functions used across agents
- **ErrorHandling**: Centralized error handling and logging

## Usage

All specific agent implementations should extend the base classes provided here to ensure consistency and proper integration with the agent orchestration system.

### Basic Agent Implementation
```typescript
import { BaseAgent } from './base-agent.js';
import { AgentRole } from '../types/agent-types.js';

class MyCustomAgent extends BaseAgent {
  constructor() {
    super('PROJECT_MANAGER', ['planning', 'coordination']);
  }
  
  async analyze(ticket) {
    // Implementation details
  }
  
  async execute(task) {
    // Implementation details
  }
  
  async shouldHandoff(context) {
    // Implementation details
  }
  
  async canHandle(ticket) {
    // Implementation details
  }
}
```

### Using AgentFactory and AgentRegistry
```typescript
import { AgentRegistry, AgentFactory } from './index.js';

// Register an agent
const registry = new AgentRegistry();
registry.register({
  role: 'PROJECT_MANAGER',
  constructor: MyCustomAgent,
  singleton: true
});

// Create agents using factory
const factory = new AgentFactory(registry);
const agent = factory.createAgent('PROJECT_MANAGER', {
  capabilities: ['planning', 'coordination'],
  maxConcurrentTasks: 3
});
```

## Dependencies

This is a foundational layer with minimal external dependencies, focusing on providing stable abstractions for the entire agent system.