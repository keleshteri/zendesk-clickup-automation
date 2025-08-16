// Core agent exports
export { BaseAgent } from './core/base-agent.js';
export { 
  AgentFactory, 
  defaultAgentFactory,
  type DependencyContainer,
  type AgentCreationOptions 
} from './core/agent-factory.js';
export { 
  AgentRegistry, 
  defaultAgentRegistry,
  type AgentConstructor,
  type AgentRegistration 
} from './core/agent-registry.js';

// Type exports
export * from './types/agent-types.js';