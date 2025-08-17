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

// Configuration exports
export {
  AGENT_CAPABILITIES,
  AGENT_SELECTION_CONFIG,
  AGENT_WORKFLOW_CONFIG,
  AGENT_METRICS,
  getAgentByRole
} from './config/index.js';
export type { AgentCapability as AgentCapabilityConfig } from './config/agent-capabilities.js';