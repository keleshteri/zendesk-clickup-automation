/**
 * @ai-metadata
 * @component: NLP Domain Interfaces
 * @description: Natural Language Processing interfaces for intent classification and entity extraction
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/nlp-interfaces.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines NLP domain interfaces for intent classification, entity extraction, and language understanding"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "nlp-model-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { UserIntent, NLPResponse, ContextualResponse } from '../../../types';

/**
 * Intent Classification interface
 */
export interface IIntentClassifier {
  /**
   * Classify user intent from natural language text
   */
  classifyIntent(text: string): Promise<UserIntent>;
  
  /**
   * Get supported intent categories
   */
  getSupportedCategories(): string[];
  
  /**
   * Validate intent classification result
   */
  validateIntent(intent: UserIntent): boolean;
}

/**
 * Entity Extraction interface
 */
export interface IEntityExtractor {
  /**
   * Extract entities from text based on intent
   */
  extractEntities(text: string, intent: UserIntent): Promise<Record<string, any>>;
  
  /**
   * Get supported entity types for a given intent category
   */
  getSupportedEntities(category: string): string[];
  
  /**
   * Validate extracted entities
   */
  validateEntities(entities: Record<string, any>, intent: UserIntent): boolean;
}

/**
 * Natural Language Processor interface - orchestrates NLP operations
 */
export interface INLPProcessor {
  /**
   * Process natural language text and return structured response
   */
  processText(text: string): Promise<NLPResponse>;
  
  /**
   * Extract actionable information from text
   */
  extractActionableInfo(text: string, intent: UserIntent): Promise<Record<string, any>>;
  
  /**
   * Check if NLP processor is available
   */
  isAvailable(): boolean;
}

/**
 * Context Manager interface for maintaining conversation context
 */
export interface IContextManager {
  /**
   * Store context for a conversation
   */
  storeContext(conversationId: string, context: Record<string, any>): Promise<void>;
  
  /**
   * Retrieve context for a conversation
   */
  getContext(conversationId: string): Promise<Record<string, any> | null>;
  
  /**
   * Update context with new information
   */
  updateContext(conversationId: string, updates: Record<string, any>): Promise<void>;
  
  /**
   * Clear context for a conversation
   */
  clearContext(conversationId: string): Promise<void>;
}

/**
 * Language Understanding interface
 */
export interface ILanguageUnderstanding {
  /**
   * Understand user intent and extract relevant information
   */
  understand(text: string, context?: Record<string, any>): Promise<{
    intent: UserIntent;
    entities: Record<string, any>;
    confidence: number;
    context?: Record<string, any>;
  }>;
  
  /**
   * Get confidence threshold for intent classification
   */
  getConfidenceThreshold(): number;
  
  /**
   * Set confidence threshold for intent classification
   */
  setConfidenceThreshold(threshold: number): void;
}

/**
 * NLP Pipeline interface for processing workflow
 */
export interface INLPPipeline {
  /**
   * Add a processing step to the pipeline
   */
  addStep(step: INLPStep): void;
  
  /**
   * Remove a processing step from the pipeline
   */
  removeStep(stepId: string): void;
  
  /**
   * Execute the entire NLP pipeline
   */
  execute(input: string): Promise<NLPResponse>;
  
  /**
   * Get pipeline configuration
   */
  getConfiguration(): INLPPipelineConfig;
}

/**
 * NLP Processing Step interface
 */
export interface INLPStep {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  
  /**
   * Process the input and return modified result
   */
  process(input: any, context?: Record<string, any>): Promise<any>;
  
  /**
   * Validate if this step can process the input
   */
  canProcess(input: any): boolean;
}

/**
 * NLP Pipeline Configuration
 */
export interface INLPPipelineConfig {
  steps: INLPStep[];
  timeout: number;
  retryAttempts: number;
  fallbackEnabled: boolean;
}

/**
 * Text Preprocessing interface
 */
export interface ITextPreprocessor {
  /**
   * Clean and normalize text for processing
   */
  preprocess(text: string): string;
  
  /**
   * Remove sensitive information from text
   */
  sanitize(text: string): string;
  
  /**
   * Tokenize text into meaningful units
   */
  tokenize(text: string): string[];
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text: string): string[];
}