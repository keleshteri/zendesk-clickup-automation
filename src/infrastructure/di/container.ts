/**
 * @type: infrastructure
 * @domain: shared
 * @purpose: DI container with Hono middleware integration
 * @pattern: Manual DI for Cloudflare Workers
 */

import type { Context, Next } from 'hono';
import type { Dependencies, Env } from './dependencies';
import { createDependencies } from './dependencies';

/**
 * DI Container interface
 * Provides access to application dependencies
 */
export interface DIContainer {
  readonly dependencies: Dependencies;
  readonly isInitialized: boolean;
  
  // Container management
  initialize(env: Env): void;
  getDependencies(): Dependencies;
  
  // Service access helpers
  getOAuthService(): Dependencies['clickUpOAuthService'];
  getAuthClient(): Dependencies['clickUpAuthClient'];
}

/**
 * DI Container implementation
 * Manages dependency lifecycle and provides service access
 */
export class DIContainerImpl implements DIContainer {
  private _dependencies: Dependencies | null = null;
  private _isInitialized = false;
  
  get dependencies(): Dependencies {
    if (!this._dependencies) {
      throw new Error('DI Container not initialized. Call initialize() first.');
    }
    return this._dependencies;
  }
  
  get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * Initialize container with environment configuration
   */
  initialize(env: Env): void {
    if (this._isInitialized) {
      throw new Error('DI Container already initialized');
    }
    
    try {
      this._dependencies = createDependencies(env);
      this._isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize DI Container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Get all dependencies
   */
  getDependencies(): Dependencies {
    return this.dependencies;
  }
  
  /**
   * Get OAuth service instance
   */
  getOAuthService(): Dependencies['clickUpOAuthService'] {
    return this.dependencies.clickUpOAuthService;
  }
  
  /**
   * Get auth client instance
   */
  getAuthClient(): Dependencies['clickUpAuthClient'] {
    return this.dependencies.clickUpAuthClient;
  }
  
  /**
   * Reset container (useful for testing)
   */
  reset(): void {
    this._dependencies = null;
    this._isInitialized = false;
  }
}

/**
 * Create DI container instance
 */
export function createDIContainer(): DIContainer {
  return new DIContainerImpl();
}

/**
 * Hono context extension for dependency injection
 */
export interface HonoContextWithDI {
  deps: Dependencies;
  container: DIContainer;
}

/**
 * Hono middleware for dependency injection
 * Initializes and provides dependencies to route handlers
 */
export function createDIMiddleware(container?: DIContainer) {
  const diContainer = container || createDIContainer();
  
  return async (c: DIContext, next: Next) => {
    try {
      // Initialize container if not already done
      if (!diContainer.isInitialized) {
        diContainer.initialize(c.env);
      }
      
      // Add dependencies to context
      c.set('deps', diContainer.getDependencies());
      c.set('container', diContainer);
      
      await next();
    } catch (error) {
      console.error('DI Middleware Error:', error);
      
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to initialize application dependencies',
          ...(c.env.APP_ENVIRONMENT === 'development' && {
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
        500
      );
    }
  };
}

/**
 * Type helper for Hono context with DI
 */
export type DIContext<T = {}> = Context<{
  Bindings: Env;
  Variables: HonoContextWithDI & T;
}>;

/**
 * Helper function to get dependencies from Hono context
 */
export function getDependencies(c: DIContext): Dependencies {
  const deps = c.get('deps');
  if (!deps) {
    throw new Error('Dependencies not available in context. Ensure DI middleware is configured.');
  }
  return deps;
}

/**
 * Helper function to get DI container from Hono context
 */
export function getContainer(c: DIContext): DIContainer {
  const container = c.get('container');
  if (!container) {
    throw new Error('DI Container not available in context. Ensure DI middleware is configured.');
  }
  return container;
}

/**
 * Service locator pattern for accessing specific services
 * Use sparingly - prefer direct dependency injection
 */
export class ServiceLocator {
  constructor(private readonly dependencies: Dependencies) {}
  
  getOAuthService() {
    return this.dependencies.clickUpOAuthService;
  }
  
  getAuthClient() {
    return this.dependencies.clickUpAuthClient;
  }
  
  // TODO: Add API service getters when implemented
  // getClickUpClient() {
  //   return this.dependencies.clickUpClient;
  // }
  
  // getTaskService() {
  //   return this.dependencies.clickUpTaskService;
  // }
  
  // getSpaceService() {
  //   return this.dependencies.clickUpSpaceService;
  // }
}

/**
 * Create service locator from Hono context
 */
export function createServiceLocator(c: DIContext): ServiceLocator {
  return new ServiceLocator(getDependencies(c));
}