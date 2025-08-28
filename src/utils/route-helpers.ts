/**
 * @ai-metadata
 * @component: RouteHelpers
 * @description: Utilities for automatic route registration and endpoint discovery
 * @last-update: 2025-01-27
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/route-helpers.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./route-discovery.ts"]
 * @tests: ["./tests/route-helpers.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Provides utilities for automatic route registration and endpoint discovery"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { Hono } from 'hono';
import { addEndpoint } from './route-discovery';
import {
  EndpointInfo,
  RouteConfig,
  RouteDefinition,
  EndpointMetadata
} from '../interfaces';

/**
 * Enhanced Hono app with automatic endpoint registration
 */
export class EnhancedHono extends Hono {
  private config: RouteConfig;

  constructor(config: RouteConfig) {
    super();
    this.config = config;
  }

  /**
   * Register a GET endpoint with automatic discovery
   */
  getWithMeta(path: string, metadata: Omit<EndpointMetadata, 'method' | 'path'>, handler: any) {
    this.registerEndpoint('GET', path, metadata, handler);
    return this.get(path, handler);
  }

  /**
   * Register a POST endpoint with automatic discovery
   */
  postWithMeta(path: string, metadata: Omit<EndpointMetadata, 'method' | 'path'>, handler: any) {
    this.registerEndpoint('POST', path, metadata, handler);
    return this.post(path, handler);
  }

  /**
   * Register a PUT endpoint with automatic discovery
   */
  putWithMeta(path: string, metadata: Omit<EndpointMetadata, 'method' | 'path'>, handler: any) {
    this.registerEndpoint('PUT', path, metadata, handler);
    return this.put(path, handler);
  }

  /**
   * Register a DELETE endpoint with automatic discovery
   */
  deleteWithMeta(path: string, metadata: Omit<EndpointMetadata, 'method' | 'path'>, handler: any) {
    this.registerEndpoint('DELETE', path, metadata, handler);
    return this.delete(path, handler);
  }

  /**
   * Register a PATCH endpoint with automatic discovery
   */
  patchWithMeta(path: string, metadata: Omit<EndpointMetadata, 'method' | 'path'>, handler: any) {
    this.registerEndpoint('PATCH', path, metadata, handler);
    return this.patch(path, handler);
  }

  /**
   * Internal method to register endpoint with discovery system
   */
  private registerEndpoint(
    method: EndpointMetadata['method'],
    path: string,
    metadata: Omit<EndpointMetadata, 'method' | 'path'>,
    handler: any
  ) {
    const fullPath = this.config.basePath + (path === '/' ? '' : path);
    
    const endpointInfo: EndpointInfo = {
      path: fullPath,
      method,
      description: metadata.description,
      category: this.config.category,
      tags: [...(this.config.defaultTags || []), ...(metadata.tags || [])],
      auth: metadata.auth || this.config.defaultAuth || [],
      cors: metadata.cors || this.config.defaultCors || 'public',
      examples: metadata.examples ? [metadata.examples] : [],
      parameters: metadata.parameters
    };

    addEndpoint(endpointInfo);
  }
}

/**
 * Create an enhanced Hono instance with automatic endpoint registration
 */
export function createEnhancedApp(config: RouteConfig): EnhancedHono {
  return new EnhancedHono(config);
}

/**
 * Decorator for automatic endpoint registration
 */
export function endpoint(metadata: EndpointMetadata) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata for later registration
    if (!target._endpointMetadata) {
      target._endpointMetadata = [];
    }
    target._endpointMetadata.push({
      ...metadata,
      handler: descriptor.value
    });
  };
}

/**
 * Utility to register all decorated endpoints from a class
 */
export function registerClassEndpoints(
  app: Hono,
  instance: any,
  config: RouteConfig
) {
  const metadata = instance.constructor.prototype._endpointMetadata || [];
  
  metadata.forEach((meta: EndpointMetadata & { handler: Function }) => {
    const fullPath = config.basePath + (meta.path === '/' ? '' : meta.path);
    
    // Register with discovery system
    const endpointInfo: EndpointInfo = {
      path: fullPath,
      method: meta.method,
      description: meta.description,
      category: config.category,
      tags: [...(config.defaultTags || []), ...(meta.tags || [])],
      auth: meta.auth || config.defaultAuth || [],
      cors: meta.cors || config.defaultCors || 'public',
      examples: meta.examples ? [meta.examples] : [],
      parameters: meta.parameters
    };
    
    addEndpoint(endpointInfo);
    
    // Register with Hono
    const handler = meta.handler as any;
    switch (meta.method) {
      case 'GET':
        app.get(fullPath, handler);
        break;
      case 'POST':
        app.post(fullPath, handler);
        break;
      case 'PUT':
        app.put(fullPath, handler);
        break;
      case 'DELETE':
        app.delete(fullPath, handler);
        break;
      case 'PATCH':
        app.patch(fullPath, handler);
        break;
    }
  });
}

/**
 * Utility to bulk register endpoints from configuration
 */
export function registerEndpoints(app: Hono, endpoints: RouteDefinition[], basePath = '') {
  endpoints.forEach(endpoint => {
    const fullPath = basePath + (endpoint.path === '/' ? '' : endpoint.path);
    
    // Add to discovery registry
    if (endpoint.metadata) {
      addEndpoint({
        path: fullPath,
        method: endpoint.method,
        description: endpoint.metadata.description || `${endpoint.method} ${fullPath}`,
        category: endpoint.metadata.category || 'API',
        auth: endpoint.auth,
        parameters: endpoint.metadata.parameters,
        responses: endpoint.metadata.responses,
        examples: endpoint.metadata.examples ? [endpoint.metadata.examples] : []
      });
    }
    
    // Register with Hono
    const handler = endpoint.handler as any;
    switch (endpoint.method) {
      case 'GET':
        app.get(fullPath, handler);
        break;
      case 'POST':
        app.post(fullPath, handler);
        break;
      case 'PUT':
        app.put(fullPath, handler);
        break;
      case 'DELETE':
        app.delete(fullPath, handler);
        break;
      case 'PATCH':
        app.patch(fullPath, handler);
        break;
    }
  });
}

/**
 * Middleware to automatically add endpoint metadata to responses
 */
export function endpointMetadataMiddleware() {
  return async (c: any, next: any) => {
    await next();
    
    // Add endpoint metadata to response headers for debugging
    if (c.env?.NODE_ENV === 'development') {
      c.header('X-Endpoint-Path', c.req.path);
      c.header('X-Endpoint-Method', c.req.method);
    }
  };
}

/**
 * Type-safe route parameter extraction
 */
export function getRouteParams<T extends Record<string, string>>(c: any): T {
  return c.req.param() as T;
}

/**
 * Type-safe query parameter extraction
 */
export function getQueryParams<T extends Record<string, string | undefined>>(c: any): T {
  const url = new URL(c.req.url);
  const params: Record<string, string | undefined> = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  
  return params as T;
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  c: any,
  validator: (data: unknown) => data is T
): Promise<T> {
  const body = await c.req.json();
  
  if (!validator(body)) {
    throw new Error('Invalid request body');
  }
  
  return body;
}

/**
 * Standard error response helper
 */
export function errorResponse(
  c: any,
  status: number,
  message: string,
  details?: any
) {
  return c.json({
    error: true,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: c.req.path,
    method: c.req.method
  }, status);
}

/**
 * Standard success response helper
 */
export function successResponse(
  c: any,
  data: any,
  message?: string,
  meta?: any
) {
  return c.json({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
}