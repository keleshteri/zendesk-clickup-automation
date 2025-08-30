/**
 * @ai-metadata
 * @component: Response Generation Interfaces
 * @description: Interfaces for AI-powered response generation and contextual communication
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/response-interfaces.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines response generation interfaces for contextual AI communication and intelligent replies"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "response-template-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { UserIntent, ContextualResponse, TicketAnalysis } from '../../../types';

/**
 * Response Generator interface for creating AI-powered responses
 */
export interface IResponseGenerator {
  /**
   * Generate a contextual response based on intent and data
   */
  generateContextualResponse(intent: UserIntent, data: any): Promise<ContextualResponse>;
  
  /**
   * Generate a response with specific tone and style
   */
  generateStyledResponse(content: string, style: ResponseStyle): Promise<string>;
  
  /**
   * Generate follow-up questions based on context
   */
  generateFollowUpQuestions(context: any): Promise<string[]>;
  
  /**
   * Generate suggested actions based on intent
   */
  generateSuggestedActions(intent: UserIntent): Promise<string[]>;
}

/**
 * Contextual Responder interface for maintaining conversation context
 */
export interface IContextualResponder {
  /**
   * Generate response considering conversation history
   */
  respondWithContext(message: string, conversationHistory: ConversationMessage[]): Promise<ContextualResponse>;
  
  /**
   * Update conversation context
   */
  updateContext(conversationId: string, message: ConversationMessage): Promise<void>;
  
  /**
   * Get conversation summary
   */
  getConversationSummary(conversationId: string): Promise<string>;
  
  /**
   * Clear conversation context
   */
  clearContext(conversationId: string): Promise<void>;
}

/**
 * Template Manager interface for response templates
 */
export interface ITemplateManager {
  /**
   * Get response template by category and intent
   */
  getTemplate(category: string, intent: string): Promise<ResponseTemplate | null>;
  
  /**
   * Create or update a response template
   */
  saveTemplate(template: ResponseTemplate): Promise<void>;
  
  /**
   * Render template with dynamic data
   */
  renderTemplate(templateId: string, data: Record<string, any>): Promise<string>;
  
  /**
   * Get all templates for a category
   */
  getTemplatesByCategory(category: string): Promise<ResponseTemplate[]>;
}

/**
 * Smart Reply interface for intelligent response suggestions
 */
export interface ISmartReply {
  /**
   * Generate smart reply suggestions
   */
  generateReplySuggestions(message: string, context?: any): Promise<Array<{
    text: string;
    confidence: number;
    intent: string;
    tone: 'professional' | 'friendly' | 'helpful' | 'apologetic';
  }>>;
  
  /**
   * Rank reply suggestions by relevance
   */
  rankSuggestions(suggestions: any[], context: any): Promise<any[]>;
  
  /**
   * Learn from user feedback on suggestions
   */
  learnFromFeedback(suggestionId: string, feedback: 'positive' | 'negative' | 'neutral'): Promise<void>;
}

/**
 * Auto-Response interface for automated ticket responses
 */
export interface IAutoResponse {
  /**
   * Generate automatic response for a ticket
   */
  generateAutoResponse(ticket: any, analysis: TicketAnalysis): Promise<{
    response: string;
    shouldSend: boolean;
    confidence: number;
    requiresHumanReview: boolean;
  }>;
  
  /**
   * Check if ticket qualifies for auto-response
   */
  canAutoRespond(ticket: any, analysis: TicketAnalysis): Promise<boolean>;
  
  /**
   * Get auto-response rules
   */
  getAutoResponseRules(): Promise<Array<{
    condition: string;
    template: string;
    confidence: number;
  }>>;
}

/**
 * Personalization interface for customized responses
 */
export interface IPersonalization {
  /**
   * Personalize response based on user profile
   */
  personalizeResponse(response: string, userProfile: UserProfile): Promise<string>;
  
  /**
   * Get user communication preferences
   */
  getUserPreferences(userId: string): Promise<UserPreferences>;
  
  /**
   * Update user preferences based on interactions
   */
  updateUserPreferences(userId: string, interactions: any[]): Promise<void>;
}

/**
 * Multi-language Support interface
 */
export interface IMultiLanguageSupport {
  /**
   * Detect language of input text
   */
  detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
  }>;
  
  /**
   * Translate response to target language
   */
  translateResponse(response: string, targetLanguage: string): Promise<string>;
  
  /**
   * Generate response in specific language
   */
  generateLocalizedResponse(intent: UserIntent, language: string): Promise<ContextualResponse>;
  
  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[];
}

/**
 * Response Quality Assessor interface
 */
export interface IResponseQualityAssessor {
  /**
   * Assess quality of generated response
   */
  assessQuality(response: string, context: any): Promise<{
    score: number; // 0-1
    issues: string[];
    suggestions: string[];
    passesThreshold: boolean;
  }>;
  
  /**
   * Get quality metrics for responses
   */
  getQualityMetrics(responses: string[]): Promise<{
    averageScore: number;
    distribution: Record<string, number>;
    commonIssues: string[];
  }>;
}

// Supporting Types

export interface ResponseStyle {
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic' | 'apologetic';
  length: 'brief' | 'moderate' | 'detailed';
  formality: 'low' | 'medium' | 'high';
  includeEmojis?: boolean;
  includeGreeting?: boolean;
  includeClosing?: boolean;
}

export interface ConversationMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'agent';
  timestamp: Date;
  intent?: UserIntent;
  metadata?: Record<string, any>;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  intent: string;
  template: string;
  variables: string[];
  style: ResponseStyle;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  language: string;
  timezone: string;
  communicationStyle: 'formal' | 'casual';
  preferredResponseLength: 'brief' | 'detailed';
  topics: string[];
  interactionHistory: any[];
}

export interface UserPreferences {
  language: string;
  responseStyle: ResponseStyle;
  notificationSettings: Record<string, boolean>;
  customFields: Record<string, any>;
}

/**
 * Response Pipeline interface for orchestrating response generation
 */
export interface IResponsePipeline {
  /**
   * Execute complete response generation pipeline
   */
  generateResponse(input: {
    message: string;
    intent: UserIntent;
    context?: any;
    userProfile?: UserProfile;
  }): Promise<{
    response: ContextualResponse;
    processingSteps: string[];
    qualityScore: number;
    processingTime: number;
  }>;
  
  /**
   * Configure response pipeline
   */
  configurePipeline(config: {
    enablePersonalization: boolean;
    enableQualityAssessment: boolean;
    enableMultiLanguage: boolean;
    qualityThreshold: number;
  }): void;
  
  /**
   * Get pipeline performance metrics
   */
  getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    averageQualityScore: number;
    successRate: number;
    languageDistribution: Record<string, number>;
  }>;
}