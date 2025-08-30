/**
 * @ai-metadata
 * @component: ServiceInterfaces
 * @description: Combined service interfaces for dependency injection - imports from domain-specific interface files
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/service-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./ai-interfaces.ts", "./zendesk-interfaces.ts", "./clickup-interfaces.ts"]
 * @tests: ["./tests/service-interfaces.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Combined service interfaces for dependency injection, organized by domain"
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

// Import domain-specific interfaces
import { IAIService, isAIService } from './ai-interfaces';
import { IZendeskService, isZendeskService } from './zendesk-interfaces';
import { IClickUpService, isClickUpService } from './clickup-interfaces';

// Re-export interfaces for backward compatibility
export { IAIService } from './ai-interfaces';
export { IZendeskService, ZendeskTicket } from './zendesk-interfaces';
export { IClickUpService, ClickUpTask, UserOAuthData } from './clickup-interfaces';

/**
 * Combined services interface for dependency injection
 */
export interface IExternalServices {
  ai?: IAIService;
  zendesk?: IZendeskService;
  clickup?: IClickUpService;
}

// Re-export type guards for backward compatibility
export { isAIService } from './ai-interfaces';
export { isZendeskService } from './zendesk-interfaces';
export { isClickUpService } from './clickup-interfaces';