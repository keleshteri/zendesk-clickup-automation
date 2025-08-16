import { AgentRole, AgentTool } from '../types/agent-types.js';
import { BaseAgent } from './base-agent.js';
import { AgentRegistry, AgentConstructor, defaultAgentRegistry } from './agent-registry.js';

/**
 * Interface for dependency injection container
 */
export interface DependencyContainer {
  get<T>(key: string): T;
  has(key: string): boolean;
}

/**
 * Configuration options for agent creation
 */
export interface AgentCreationOptions {
  capabilities?: string[];
  tools?: AgentTool[];
  maxConcurrentTasks?: number;
  dependencies?: Record<string, any>;
}

/**
 * Factory for creating agent instances with dependency injection support
 */
export class AgentFactory {
  private registry: AgentRegistry;
  private dependencyContainer?: DependencyContainer;

  constructor(registry: AgentRegistry = defaultAgentRegistry, dependencyContainer?: DependencyContainer) {
    this.registry = registry;
    this.dependencyContainer = dependencyContainer;
  }

  /**
   * Create an agent instance by role
   */
  createAgent(role: AgentRole, options: AgentCreationOptions = {}): BaseAgent {
    const registration = this.registry.getRegistration(role);
    if (!registration) {
      throw new Error(`No agent registered for role: ${role}`);
    }

    // Check if singleton and instance already exists
    if (registration.singleton) {
      const existingInstance = this.registry.getSingletonInstance(role);
      if (existingInstance) {
        return existingInstance;
      }
    }

    // Resolve dependencies
    const resolvedDependencies = this.resolveDependencies(registration.dependencies || []);

    // Create constructor arguments
    const constructorArgs = this.buildConstructorArgs(role, options, resolvedDependencies);

    // Create instance
    const instance = new registration.constructor(...constructorArgs);

    // Store singleton if configured
    if (registration.singleton) {
      this.registry.setSingletonInstance(role, instance);
    }

    return instance;
  }

  /**
   * Create multiple agents by roles
   */
  createAgents(roles: AgentRole[], options: AgentCreationOptions = {}): Map<AgentRole, BaseAgent> {
    const agents = new Map<AgentRole, BaseAgent>();
    
    for (const role of roles) {
      try {
        const agent = this.createAgent(role, options);
        agents.set(role, agent);
      } catch (error) {
        throw new Error(`Failed to create agent ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return agents;
  }

  /**
   * Create all registered agents
   */
  createAllAgents(options: AgentCreationOptions = {}): Map<AgentRole, BaseAgent> {
    const registeredRoles = this.registry.getRegisteredRoles();
    return this.createAgents(registeredRoles, options);
  }

  /**
   * Check if an agent can be created for the given role
   */
  canCreateAgent(role: AgentRole): boolean {
    return this.registry.isRegistered(role);
  }

  /**
   * Get available agent roles that can be created
   */
  getAvailableRoles(): AgentRole[] {
    return this.registry.getRegisteredRoles();
  }

  /**
   * Set dependency container for dependency injection
   */
  setDependencyContainer(container: DependencyContainer): void {
    this.dependencyContainer = container;
  }

  /**
   * Resolve dependencies from the container
   */
  private resolveDependencies(dependencies: string[]): Record<string, any> {
    const resolved: Record<string, any> = {};

    if (!this.dependencyContainer) {
      return resolved;
    }

    for (const dependency of dependencies) {
      if (this.dependencyContainer.has(dependency)) {
        resolved[dependency] = this.dependencyContainer.get(dependency);
      } else {
        throw new Error(`Dependency '${dependency}' not found in container`);
      }
    }

    return resolved;
  }

  /**
   * Build constructor arguments for agent creation
   */
  private buildConstructorArgs(
    role: AgentRole, 
    options: AgentCreationOptions, 
    dependencies: Record<string, any>
  ): any[] {
    // Default constructor arguments based on BaseAgent constructor
    const args: any[] = [
      role,
      options.capabilities || [],
      options.tools || [],
      options.maxConcurrentTasks || 5
    ];

    // Add resolved dependencies if any
    if (Object.keys(dependencies).length > 0) {
      args.push(dependencies);
    }

    // Add custom dependencies from options
    if (options.dependencies) {
      args.push(options.dependencies);
    }

    return args;
  }

  /**
   * Validate that all registered agents can be created
   */
  validateRegistrations(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const registeredRoles = this.registry.getRegisteredRoles();

    // Validate registry dependencies first
    const registryValidation = this.registry.validateDependencies();
    if (!registryValidation.valid) {
      errors.push(...registryValidation.errors);
    }

    // Try to validate each registration
    for (const role of registeredRoles) {
      try {
        const registration = this.registry.getRegistration(role);
        if (!registration) {
          errors.push(`Registration not found for role: ${role}`);
          continue;
        }

        // Check if constructor is valid
        if (typeof registration.constructor !== 'function') {
          errors.push(`Invalid constructor for role: ${role}`);
        }

        // Check dependencies if dependency container is available
        if (this.dependencyContainer && registration.dependencies) {
          for (const dependency of registration.dependencies) {
            if (!this.dependencyContainer.has(dependency)) {
              errors.push(`Missing dependency '${dependency}' for role: ${role}`);
            }
          }
        }
      } catch (error) {
        errors.push(`Validation error for role ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default global agent factory instance
 */
export const defaultAgentFactory = new AgentFactory();