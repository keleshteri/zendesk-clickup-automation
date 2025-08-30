/**
 * @ai-metadata
 * @component: AIUtilsIndex
 * @description: Barrel export for AI utility classes providing centralized access to error handling, validation, prompt building, and performance monitoring
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-utils-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./ai-error-handler.ts", "./validation.ts", "./prompt-builder.ts", "./performance-monitor.ts"]
 * @tests: ["./tests/index.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export hub for all AI utility classes and functions"
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

// Error handling utilities
export {
  AIErrorHandler,
  type AIErrorContext,
  type AIErrorResult
} from './ai-error-handler';

// Validation utilities
export {
  ValidationUtils,
  type ValidationResult,
  type ValidationRule
} from './validation';

// Prompt building utilities
export {
  PromptBuilder,
  type PromptTemplate,
  type PromptContext
} from './prompt-builder';

// Performance monitoring utilities
export {
  PerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceStats,
  type PerformanceThresholds
} from './performance-monitor';

import { performanceMonitor } from './performance-monitor';
import { ValidationUtils } from './validation';
import { PromptBuilder } from './prompt-builder';
import { AIErrorHandler } from './ai-error-handler';

// Convenience re-exports for common operations
export const aiUtils = {
  // Error handling
  handleOperation: AIErrorHandler.handleOperation.bind(AIErrorHandler),
  
  // Validation
  validateZendeskTicket: ValidationUtils.validateZendeskTicket.bind(ValidationUtils),
  validateTicketAnalysis: ValidationUtils.validateTicketAnalysis.bind(ValidationUtils),
  sanitizeText: ValidationUtils.sanitizeText.bind(ValidationUtils),
  parseJsonResponse: ValidationUtils.parseJsonResponse.bind(ValidationUtils),
  
  // Prompt building
  buildFromTemplate: PromptBuilder.buildFromTemplate.bind(PromptBuilder),
  getAvailableTemplates: PromptBuilder.getAvailableTemplates.bind(PromptBuilder),
  
  // Performance monitoring
  startOperation: performanceMonitor.startOperation.bind(performanceMonitor),
  endOperation: performanceMonitor.endOperation.bind(performanceMonitor),
  monitorOperation: performanceMonitor.monitorOperation.bind(performanceMonitor),
  getStats: performanceMonitor.getStats.bind(performanceMonitor)
};