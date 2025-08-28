/**
 * @ai-metadata
 * @component: RouteInterfaces
 * @description: Generic route and endpoint type definitions for cross-domain use
 * @last-update: 2025-01-27
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/route-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/interfaces/route-interfaces.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Centralized type definitions for routing, endpoints, and API documentation"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * HTTP methods supported by the routing system
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Authentication types for endpoints
 */
export type AuthenticationType = 'none' | 'bearer' | 'webhook' | 'oauth';

/**
 * CORS policy options
 */
export type CorsPolicy = 'public' | 'restricted' | 'webhook';

/**
 * Parameter types for API documentation
 */
export type ParameterType = 'query' | 'path' | 'header' | 'body';

/**
 * Endpoint information interface
 */
export interface EndpointInfo {
  method: string;
  path: string;
  description?: string;
  category: string;
  tags?: string[];
  deprecated?: boolean;
  authentication?: AuthenticationType;
  auth?: string[]; // Legacy support for auth array
  cors?: CorsPolicy;
  parameters?: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
  responses?: Record<string, {
    description: string;
    example?: any;
  }>;
  examples?: Array<{
    request?: any;
    response?: any;
    description?: string;
  }>;
}

/**
 * Endpoint category configuration
 */
export interface EndpointCategory {
  name: string;
  description: string;
  icon?: string;
  order: number;
}

/**
 * Route discovery configuration
 */
export interface RouteDiscoveryConfig {
  categories: Record<string, EndpointCategory>;
  endpoints: EndpointInfo[];
  metadata: {
    title: string;
    version: string;
    description: string;
    baseUrl?: string;
  };
}

/**
 * Route metadata for documentation
 */
export interface RouteMetadata {
  title?: string;
  version?: string;
  description?: string;
  baseUrl?: string;
  category?: string;
  parameters?: Array<{
    request?: any;
    response?: any;
  }>;
  responses?: Record<string, {
    description: string;
    example?: any;
  }>;
  examples?: Array<{
    request?: any;
    response?: any;
    description?: string;
  }>;
}

/**
 * Configuration for automatic route registration
 */
export interface RouteConfig {
  /** Base path for the route group */
  basePath: string;
  /** Category for grouping endpoints */
  category: string;
  /** Description of the route group */
  description?: string;
  /** Default tags to apply to all endpoints */
  defaultTags?: string[];
  /** Default authentication requirements */
  defaultAuth?: string[];
  /** Default CORS policy */
  defaultCors?: CorsPolicy;
}

/**
 * Individual route configuration
 */
export interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handler: any;
  auth?: string[];
  metadata?: EndpointMetadata;
}

/**
 * Metadata for individual route endpoints
 */
export interface EndpointMetadata {
  /** Endpoint description */
  description: string;
  /** HTTP method */
  method: HttpMethod;
  /** Relative path from base */
  path: string;
  /** Category for grouping endpoints */
  category?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Authentication requirements */
  auth?: string[];
  /** CORS policy override */
  cors?: CorsPolicy;
  /** Request/response examples */
  examples?: {
    request?: any;
    response?: any;
  };
  /** Parameter descriptions */
  parameters?: Array<{
    name: string;
    type: ParameterType;
    required: boolean;
    description: string;
    example?: any;
  }>;
  /** Response descriptions */
  responses?: Record<string, {
    description: string;
    example?: any;
  }>;
}

/**
 * API response structure for success responses
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  meta?: any;
  timestamp: string;
}

/**
 * API response structure for error responses
 */
export interface ApiErrorResponse {
  error: true;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Route parameter extraction type
 */
export type RouteParams<T extends Record<string, string> = Record<string, string>> = T;

/**
 * Query parameter extraction type
 */
export type QueryParams<T extends Record<string, string | undefined> = Record<string, string | undefined>> = T;

/**
 * Request validation function type
 */
export type RequestValidator<T> = (data: unknown) => data is T;

/**
 * Endpoint handler function type
 */
export type EndpointHandler<TParams = any, TQuery = any, TBody = any, TResponse = any> = (
  params: TParams,
  query: TQuery,
  body: TBody
) => Promise<TResponse> | TResponse;