/**
 * @ai-metadata
 * @component: DependencyInjectionContainer
 * @description: TSyringe dependency injection container configuration
 * @last-update: 2024-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/di-container.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["tsyringe", "reflect-metadata"]
 * @tests: ["./tests/di-container.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central configuration for dependency injection using TSyringe"
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

import 'reflect-metadata';
import { container, injectable, singleton, inject } from 'tsyringe';

/**
 * Dependency injection tokens for service registration
 */
export const DI_TOKENS = {
  // Core Services
  AI_SERVICE: 'AIService',
  SLACK_SERVICE: 'SlackService',
  ZENDESK_SERVICE: 'ZendeskService',
  CLICKUP_SERVICE: 'ClickUpService',
  OAUTH_SERVICE: 'OAuthService',
  
  // Automation Services
  AUTOMATION_SERVICE: 'AutomationService',
  TASK_GENIE: 'TaskGenie',
  WORKFLOW_ORCHESTRATOR: 'WorkflowOrchestrator',
  
  // Configuration
  ENVIRONMENT: 'Environment',
  LOGGER: 'Logger'
} as const;

/**
 * Type definitions for dependency injection tokens
 */
export type DIToken = typeof DI_TOKENS[keyof typeof DI_TOKENS];

/**
 * Central dependency injection container instance
 */
export const diContainer = container;

/**
 * Helper function to register a service in the DI container
 */
export function registerService<T>(token: string, implementation: new (...args: any[]) => T): void {
  diContainer.register(token, { useClass: implementation });
}

/**
 * Helper function to register a singleton service in the DI container
 */
export function registerSingleton<T>(token: string, implementation: new (...args: any[]) => T): void {
  diContainer.registerSingleton(token, implementation);
}

/**
 * Helper function to register an instance in the DI container
 */
export function registerInstance<T>(token: string, instance: T): void {
  diContainer.registerInstance(token, instance);
}

/**
 * Helper function to resolve a service from the DI container
 */
export function resolveService<T>(token: string): T {
  return diContainer.resolve<T>(token);
}

/**
 * Export decorators for convenience
 */
export { injectable, singleton, inject };

/**
 * Example usage:
 * 
 * @injectable()
 * class MyService {
 *   constructor(
 *     @inject(DI_TOKENS.AI_SERVICE) private aiService: AIService,
 *     @inject(DI_TOKENS.LOGGER) private logger: Logger
 *   ) {}
 * }
 * 
 * // Register the service
 * registerSingleton(DI_TOKENS.MY_SERVICE, MyService);
 * 
 * // Resolve the service
 * const myService = resolveService<MyService>(DI_TOKENS.MY_SERVICE);
 */