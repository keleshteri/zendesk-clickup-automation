/**
 * @ai-metadata
 * @component: InterfacesIndex
 * @description: Barrel export for centralized interface definitions
 * @last-update: 2025-01-27
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/interfaces-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./route-interfaces.ts", "./endpoint-categories.ts"]
 * @tests: ["./tests/interfaces/index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Central export point for all interface definitions"
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

// Route and endpoint interfaces
export type {
  HttpMethod,
  AuthenticationType,
  CorsPolicy,
  ParameterType,
  EndpointInfo,
  EndpointCategory,
  RouteDiscoveryConfig,
  RouteMetadata,
  RouteConfig,
  RouteDefinition,
  EndpointMetadata,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  RouteParams,
  QueryParams,
  RequestValidator,
  EndpointHandler
} from './route-interfaces';

// Endpoint categories and registry
export {
  DEFAULT_CATEGORIES,
  ENDPOINT_REGISTRY
} from './endpoint-categories';
export * from './api-interfaces';
export * from './circuit-breaker-interfaces';
export * from './error-logger-interfaces';
export * from './middleware-interfaces';
export * from './retry-interfaces';
export * from './token-calculator-interfaces';
export * from './utility-interfaces';

// Domain-specific service interfaces
export * from './ai-interfaces';
export * from './zendesk-interfaces';
export * from './clickup-interfaces';
export * from './service-interfaces';