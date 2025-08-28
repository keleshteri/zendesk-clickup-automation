/**
 * @ai-metadata
 * @component: Shared Types
 * @description: Shared TypeScript type definitions used across the application
 * @last-update: 2025-01-17
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./env.ts", "../services/integrations/zendesk/interfaces", "../services/integrations/clickup/interfaces"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Central barrel export for shared types and re-exports from domain-specific interfaces"
 */

// Re-export environment types
export * from './env';

// Re-export centralized API interfaces
export * from '../interfaces/api-interfaces';