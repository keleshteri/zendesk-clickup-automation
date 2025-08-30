/**
 * @ai-metadata
 * @component: AIInterfaces
 * @description: TypeScript interfaces for AI service domain
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../types/index.ts", "./zendesk-interfaces.ts"]
 * @tests: ["./tests/ai-interfaces.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "AI service interfaces for natural language processing and ticket analysis"
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

import { TicketAnalysis, AIResponse } from '../types';
import { ZendeskTicket } from './zendesk-interfaces';

/**
 * Interface for AI Service
 * Provides natural language processing, ticket analysis, and AI-powered responses
 */
export interface IAIService {
  /**
   * Check if AI service is properly initialized and working
   */
  isAvailable(): boolean;

  /**
   * Test AI service with a simple prompt
   */
  testConnection(): Promise<boolean>;

  /**
   * Generate AI response for natural language queries
   * @param prompt - The user's natural language query
   * @returns Promise resolving to AI-generated response
   */
  generateResponse(prompt: string): Promise<string>;

  /**
   * Summarize a Zendesk ticket using AI
   * @param ticketContent - The ticket content to summarize
   * @returns Promise resolving to AI response with summary
   */
  summarizeTicket(ticketContent: string): Promise<AIResponse>;

  /**
   * Analyze a ticket for priority, category, and sentiment
   * @param ticketContent - The ticket content to analyze
   * @returns Promise resolving to ticket analysis
   */
  analyzeTicket(ticketContent: string): Promise<TicketAnalysis>;

  /**
   * Generate enhanced task description for ClickUp
   * @param ticket - The Zendesk ticket
   * @param analysis - The ticket analysis
   * @returns Promise resolving to enhanced description
   */
  generateEnhancedTaskDescription(ticket: ZendeskTicket, analysis: TicketAnalysis): Promise<string>;

  /**
   * Check if AI service is configured
   */
  isConfigured(): boolean;

  /**
   * Get the name of the AI provider
   */
  getProviderName(): string;

  /**
   * Classify user intent from natural language
   * @param query - The user's natural language query
   * @returns Promise resolving to classified intent
   */
  classifyIntent(query: string): Promise<{
    intent: 'zendesk_query' | 'zendesk_action' | 'clickup_create' | 'clickup_query' | 'general';
    confidence: number;
    entities: Array<{ type: string; value: string; }>;
  }>;

  /**
   * Generate enhanced AI response with TaskGenie context
   * @param prompt - The user's natural language query
   * @returns Promise resolving to contextual AI response
   */
  generateContextualResponse?(prompt: string): Promise<string>;
}

/**
 * Type guard to check if an object implements IAIService
 */
export function isAIService(service: any): service is IAIService {
  return service && 
    typeof service.isAvailable === 'function' &&
    typeof service.generateResponse === 'function' &&
    typeof service.classifyIntent === 'function';
}