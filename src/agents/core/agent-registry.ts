import { AgentRole } from '../types/agent-types.js';
import { BaseAgent } from './base-agent.js';

/**
 * Interface for agent constructor that can be instantiated by the factory
 */
export interface AgentConstructor {
  new (...args: any[]): BaseAgent;
}

/**
 * Interface for agent registration configuration
 */
export interface AgentRegistration {
  role: AgentRole;
  constructor: AgentConstructor;
  dependencies?: string[];
  singleton?: boolean;
}

/**
 * Registry for managing agent class registrations
 * Supports dependency injection and singleton patterns
 */
export class AgentRegistry {
  private registrations = new Map<AgentRole, AgentRegistration>();
  private singletonInstances = new Map<AgentRole, BaseAgent>();

  /**
   * Register an agent class with the registry
   */
  register(registration: AgentRegistration): void {
    if (this.registrations.has(registration.role)) {
      throw new Error(`Agent with role ${registration.role} is already registered`);
    }

    this.registrations.set(registration.role, registration);
  }

  /**
   * Unregister an agent class from the registry
   */
  unregister(role: AgentRole): boolean {
    const removed = this.registrations.delete(role);
    if (removed) {
      this.singletonInstances.delete(role);
    }
    return removed;
  }

  /**
   * Check if an agent role is registered
   */
  isRegistered(role: AgentRole): boolean {
    return this.registrations.has(role);
  }

  /**
   * Get agent registration by role
   */
  getRegistration(role: AgentRole): AgentRegistration | undefined {
    return this.registrations.get(role);
  }

  /**
   * Get all registered agent roles
   */
  getRegisteredRoles(): AgentRole[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get all registrations
   */
  getAllRegistrations(): Map<AgentRole, AgentRegistration> {
    return new Map(this.registrations);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registrations.clear();
    this.singletonInstances.clear();
  }

  /**
   * Get singleton instance if exists
   */
  getSingletonInstance(role: AgentRole): BaseAgent | undefined {
    return this.singletonInstances.get(role);
  }

  /**
   * Set singleton instance
   */
  setSingletonInstance(role: AgentRole, instance: BaseAgent): void {
    this.singletonInstances.set(role, instance);
  }

  /**
   * Check if role is configured as singleton
   */
  isSingleton(role: AgentRole): boolean {
    const registration = this.registrations.get(role);
    return registration?.singleton === true;
  }

  /**
   * Get dependencies for an agent role
   */
  getDependencies(role: AgentRole): string[] {
    const registration = this.registrations.get(role);
    return registration?.dependencies || [];
  }

  /**
   * Validate that all dependencies are satisfied
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [role, registration] of this.registrations) {
      if (registration.dependencies) {
        for (const dependency of registration.dependencies) {
          // For now, we just check if dependency is a string
          // In the future, this could be extended to check actual service availability
          if (typeof dependency !== 'string' || dependency.trim() === '') {
            errors.push(`Invalid dependency '${dependency}' for agent ${role}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default global agent registry instance
 */
export const defaultAgentRegistry = new AgentRegistry();