/**
 * @ai-metadata
 * @component: AI Domain Interfaces
 * @description: Barrel export for all AI domain interfaces
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-interfaces.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Central export point for AI domain interfaces - provides clean separation of concerns"
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

// Core AI Provider Interfaces
export * from './core';

// Natural Language Processing Interfaces
export * from './nlp';

// Ticket Analysis Domain Interfaces
export * from './analysis';

// Response Generation Interfaces
export * from './response';

// Domain-specific types and models
export * from './types';