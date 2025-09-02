/**
 * @type: infrastructure
 * @domain: shared
 * @purpose: Dependency injection exports
 */

// Core DI types and functions
export type { Dependencies, Env, EnvironmentConfig } from './dependencies';
export { 
  createDependencies, 
  validateEnvironment, 
  getEnvironmentConfig 
} from './dependencies';

// DI Container
export type { 
  DIContainer, 
  HonoContextWithDI, 
  DIContext 
} from './container';
export { 
  createDIContainer, 
  createDIMiddleware, 
  getDependencies, 
  getContainer, 
  ServiceLocator, 
  createServiceLocator 
} from './container';