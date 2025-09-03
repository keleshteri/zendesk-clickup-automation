/**
 * @type: infrastructure
 * @domain: shared
 * @purpose: Dependency definitions and factory
 * @pattern: Manual DI for Cloudflare Workers
 */

import type {
  IClickUpOAuthService,
  IClickUpAuthClient,
  IClickUpClient,
  IClickUpTaskService,
  IClickUpSpaceService,
} from '../../domains/clickup/interfaces';
import type { ITokenStorageService } from '../../domains/clickup/interfaces/token-storage.interface';
import type { OAuthConfig } from '../../domains/clickup/types/oauth.types';
import type { ClickUpHttpClientConfig } from '../../domains/clickup/types/http.types';

// Service implementations
import { ClickUpOAuthService } from '../../domains/clickup/services/clickup-oauth.service';
import { ClickUpAuthClient } from '../../domains/clickup/services/clickup-auth-client.service';
import { ClickUpClient } from '../../domains/clickup/services/clickup-client.service';
import { ClickUpTaskService } from '../../domains/clickup/services/clickup-task.service';
import { ClickUpSpaceService } from '../../domains/clickup/services/clickup-space.service';
import { TokenStorageService } from '../../domains/clickup/services/token-storage.service';

/**
 * Environment variables interface for Cloudflare Workers
 */
export interface Env {
  // ClickUp OAuth Configuration
  CLICKUP_CLIENT_ID: string;
  CLICKUP_CLIENT_SECRET: string;
  CLICKUP_REDIRECT_URI: string;
  
  // ClickUp System Token (for health checks and system operations)
  CLICKUP_SYSTEM_TOKEN?: string;
  
  // Application Configuration
  APP_BASE_URL: string;
  APP_ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // CORS Configuration
  CORS_ORIGINS?: string;
  
  // KV Storage bindings
  OAUTH_TOKENS?: KVNamespace;
  USER_SESSIONS?: KVNamespace;
  OAUTH_STATES?: KVNamespace;
  USER_TOKENS?: KVNamespace;
}

/**
 * Application dependencies container
 * Contains all service instances with proper dependency injection
 */
export interface Dependencies {
  // OAuth services
  readonly clickUpOAuthService: IClickUpOAuthService;
  readonly clickUpAuthClient: IClickUpAuthClient;
  readonly tokenStorageService: ITokenStorageService;
  
  // API services
  readonly clickUpClient: IClickUpClient;
  readonly clickUpTaskService: IClickUpTaskService;
  readonly clickUpSpaceService: IClickUpSpaceService;
  
  // Configuration
  readonly oauthConfig: OAuthConfig;
  readonly env: Env;
}

/**
 * Create and configure all application dependencies
 * Follows manual DI pattern for Cloudflare Workers
 */
export function createDependencies(env: Env): Dependencies {
  // Validate required environment variables
  validateEnvironment(env);
  
  // Create OAuth configuration
  const oauthConfig: OAuthConfig = {
    clientId: env.CLICKUP_CLIENT_ID,
    clientSecret: env.CLICKUP_CLIENT_SECRET,
    redirectUri: env.CLICKUP_REDIRECT_URI,
    authorizationUrl: 'https://app.clickup.com/api',
    tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
    scopes: ['read', 'write'], // Default scopes
  };
  
  // Create service instances with dependency injection
  const clickUpAuthClient = new ClickUpAuthClient();
  
  // Create token storage service with KV namespaces
  const tokensKV = env.OAUTH_TOKENS || env.USER_TOKENS;
  const statesKV = env.OAUTH_STATES;
  
  if (!tokensKV || !statesKV) {
    throw new Error('Required KV namespaces (OAUTH_TOKENS/USER_TOKENS and OAUTH_STATES) are not configured');
  }
  
  const tokenStorageService = new TokenStorageService(
    tokensKV,
    statesKV,
    {
      tokenTtl: 3600, // 1 hour
      stateTtl: 600,   // 10 minutes
      keyPrefix: 'oauth',
      enableCleanup: true
    }
  );
  
  const clickUpOAuthService = new ClickUpOAuthService(oauthConfig, clickUpAuthClient, tokenStorageService);
  
  // Create API client services
  const apiClientConfig: ClickUpHttpClientConfig = {
    apiKey: '', // Will be set per request
    baseUrl: 'https://api.clickup.com/api/v2',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  };
  const clickUpClient = new ClickUpClient(apiClientConfig, env.CLICKUP_SYSTEM_TOKEN);
  const clickUpTaskService = new ClickUpTaskService(clickUpClient);
  const clickUpSpaceService = new ClickUpSpaceService(clickUpClient);
  
  return {
    // OAuth services
    clickUpOAuthService,
    clickUpAuthClient,
    tokenStorageService,
    
    // API services
    clickUpClient,
    clickUpTaskService,
    clickUpSpaceService,
    
    // Configuration
    oauthConfig,
    env,
  };
}

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly enableDetailedErrors: boolean;
  readonly corsOrigins: string[];
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(env: Env): EnvironmentConfig {
  const environment = env.APP_ENVIRONMENT || 'development';
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  
  return {
    isDevelopment,
    isProduction,
    enableDetailedErrors: isDevelopment || environment === 'staging',
    corsOrigins: isDevelopment 
      ? ['http://localhost:3000', 'http://localhost:8787']
      : env.CORS_ORIGINS?.split(',') || [env.APP_BASE_URL].filter(Boolean),
    logLevel: isDevelopment ? 'debug' : 'info',
  };
}

/**
 * Validate required environment variables
 * Throws descriptive errors for missing configuration
 */
export function validateEnvironment(env: Env): void {
  const required = [
    'CLICKUP_CLIENT_ID',
    'CLICKUP_CLIENT_SECRET',
    'CLICKUP_REDIRECT_URI',
    'APP_BASE_URL',
  ] as const;
  
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please configure these in your Cloudflare Workers environment.'
    );
  }
  
  // Validate URL formats
  try {
    new URL(env.CLICKUP_REDIRECT_URI);
    new URL(env.APP_BASE_URL);
  } catch (error) {
    throw new Error(
      'Invalid URL format in environment variables. ' +
      'CLICKUP_REDIRECT_URI and APP_BASE_URL must be valid URLs.'
    );
  }
  
  // Validate environment
  const validEnvironments = ['development', 'staging', 'production'];
  if (env.APP_ENVIRONMENT && !validEnvironments.includes(env.APP_ENVIRONMENT)) {
    throw new Error(
      `Invalid APP_ENVIRONMENT: ${env.APP_ENVIRONMENT}. ` +
      `Must be one of: ${validEnvironments.join(', ')}`
    );
  }
}