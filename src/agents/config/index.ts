/**
 * Agent Configuration Module Index
 * Centralized exports for all agent configuration modules
 */

// Export all agent capabilities and configurations
export * from './agent-capabilities.js';

// Re-export commonly used agent configurations for convenience
export {
  AGENT_CAPABILITIES,
  AGENT_SELECTION_CONFIG,
  AGENT_WORKFLOW_CONFIG,
  AGENT_METRICS
} from './agent-capabilities.js';

// Configuration utility functions
export const getAgentByRole = (role: string) => {
  const { AGENT_CAPABILITIES } = require('./agent-capabilities.js');
  return AGENT_CAPABILITIES[role as keyof typeof AGENT_CAPABILITIES];
};