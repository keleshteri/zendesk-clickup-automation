/**
 * @ai-metadata
 * @component: Core AI Interfaces
 * @description: Core AI provider and service interfaces for abstraction and dependency injection
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/core-ai-interfaces.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines core abstractions for AI providers and services - enables clean architecture"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "interface-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { TokenUsage } from '../../../types';

/**
 * Core AI Provider interface - defines the contract for all AI providers
 */
export interface IAIProvider {
  readonly name: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  
  /**
   * Test if the provider is properly configured and accessible
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Generate content using the AI provider
   */
  generateContent(prompt: string): Promise<string>;
  
  /**
   * Generate content with token usage tracking
   */
  generateContentWithUsage(prompt: string): Promise<{
    content: string;
    tokenUsage: TokenUsage;
  }>;
  
  /**
   * Summarize content
   */
  summarize(content: string): Promise<string>;
}

/**
 * AI Service Configuration interface
 */
export interface IAIServiceConfig {
  provider: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * Core AI Service interface - orchestrates AI operations
 */
export interface IAIService {
  /**
   * Check if AI service is properly initialized and working
   */
  isAvailable(): boolean;
  
  /**
   * Test AI service connection
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Get the current provider name
   */
  getProviderName(): string;
  
  /**
   * Check if service is configured
   */
  isConfigured(): boolean;
  
  /**
   * Generate general AI responses
   */
  generateResponse(prompt: string): Promise<string>;
  
  /**
   * Generate AI responses with token usage tracking
   */
  generateResponseWithUsage(prompt: string): Promise<{
    response: string;
    tokenUsage: TokenUsage;
  }>;
}

/**
 * AI Operation Result interface
 */
export interface IAIOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tokenUsage?: TokenUsage;
  processingTime: number;
  timestamp: string;
}

/**
 * AI Provider Factory interface
 */
export interface IAIProviderFactory {
  /**
   * Create an AI provider instance
   */
  createProvider(config: IAIServiceConfig): IAIProvider;
  
  /**
   * Get supported provider names
   */
  getSupportedProviders(): string[];
  
  /**
   * Validate provider configuration
   */
  validateConfig(config: IAIServiceConfig): boolean;
}