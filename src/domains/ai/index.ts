/**
 * @ai-metadata
 * @description: Main entry point for the AI domain
 * @edit-permission: "read-only"
 * @approved-by: null
 * @breaking-risk: "high"
 * @dependencies: ["./interfaces", "./types", "./enums", "./services"]
 * @review-required: "yes"
 */
/**
 * @type: domain
 * @domain: ai
 * @purpose: AI service integration with Gemini API and POML prompt management
 * @pattern: Interface-driven design with dependency injection
 *
 * This domain provides AI functionality for text generation and prompt management.
 * It currently integrates with Google's Gemini API but is designed to be
 * provider-agnostic for future flexibility.
 *
 * Key components:
 * - Generic AI client interface for text generation
 * - Gemini API integration
 * - POML-based prompt template management
 * - Type-safe configuration with Zod validation
 */

// Export interfaces
export * from './interfaces';

// Export services
export * from './services';

// Export types
export * from './types';