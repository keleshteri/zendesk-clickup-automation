/**
 * @ai-metadata
 * @component: GoogleGeminiProvider
 * @description: Refactored Google Gemini AI provider using domain-specific implementations
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/gemini-service.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@google/generative-ai", "./providers/gemini-nlp.ts", "./providers/gemini-analysis.ts", "./providers/gemini-response.ts"]
 * @tests: ["./tests/gemini-service.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Refactored AI provider using domain-specific implementations for better separation of concerns"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, TicketAnalysis, DuplicateAnalysis, AIInsights, TokenUsage, UserIntent, NLPResponse, ContextualResponse } from '../../types';
import { ZendeskTicket } from '../integrations/zendesk/interfaces';
import { TokenCalculator } from '../../utils/token-calculator';
import { GeminiNLPProcessor } from './providers/gemini-nlp';
import { GeminiTicketAnalyzer } from './providers/gemini-analysis';
import { GeminiResponseGenerator } from './providers/gemini-response';
import { IAIProvider } from './interfaces/core';
import { INLPProcessor } from './interfaces/nlp';
import { ITicketAnalyzer, IDuplicateDetector, IInsightsGenerator } from './interfaces/analysis';
import { IResponseGenerator } from './interfaces/response';

export class GoogleGeminiProvider implements AIProvider, IAIProvider {
  name: 'googlegemini' = 'googlegemini';
  model?: string;
  private genAI: GoogleGenerativeAI;
  private geminiModel: any;
  
  // Domain-specific processors
  private nlpProcessor: INLPProcessor;
  private ticketAnalyzer: ITicketAnalyzer;
  private responseGenerator: IResponseGenerator;
  private duplicateDetector: IDuplicateDetector;
  private insightsGenerator: IInsightsGenerator;

  constructor(apiKey: string, modelName?: string) {
    this.model = modelName || 'gemini-1.5-flash';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = this.genAI.getGenerativeModel({ model: this.model });
    
    // Initialize domain-specific processors
    this.nlpProcessor = new GeminiNLPProcessor(apiKey, this.model);
    const geminiAnalyzer = new GeminiTicketAnalyzer(apiKey, this.model);
    this.ticketAnalyzer = geminiAnalyzer;
    this.duplicateDetector = geminiAnalyzer.duplicateDetectorInstance;
    this.insightsGenerator = geminiAnalyzer.insightsGeneratorInstance;
    this.responseGenerator = new GeminiResponseGenerator(apiKey, this.model);
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async generateContentWithUsage(prompt: string): Promise<{
    content: string;
    tokenUsage: TokenUsage;
  }> {
    const content = await this.generateContent(prompt);
    const tokenUsage = await this.calculateTokenUsage(prompt + content);
    
    return {
      content,
      tokenUsage
    };
  }

  async summarize(text: string): Promise<string> {
    // Use generateStyledResponse for summarization
    return this.responseGenerator.generateStyledResponse(text, { tone: 'professional', length: 'moderate', formality: 'medium' });
  }

  async analyzeTicket(ticketContent: string, metadata?: any): Promise<TicketAnalysis> {
    return this.ticketAnalyzer.analyzeTicket(ticketContent, metadata);
  }

  async detectDuplicates(tickets: any[]): Promise<DuplicateAnalysis> {
    // Extract the first ticket as the new ticket and the rest as existing tickets
    const [newTicket, ...existingTickets] = tickets;
    const ticketContent = typeof newTicket === 'string' ? newTicket : newTicket.description || newTicket.subject || '';
    return this.duplicateDetector.detectDuplicates(ticketContent, existingTickets);
  }

  async generateTaskDescription(ticket: ZendeskTicket, analysis?: TicketAnalysis): Promise<string> {
    // Use generateStyledResponse for task description generation
    const context = analysis ? `Priority: ${analysis.priority}, Category: ${analysis.category}, Summary: ${analysis.summary}` : `Subject: ${ticket.subject}, Description: ${ticket.description}`;
    return this.responseGenerator.generateStyledResponse(context, { tone: 'professional', length: 'moderate', formality: 'medium' });
  }

  async getInsights(tickets: ZendeskTicket[]): Promise<AIInsights> {
    // Convert tickets to the format expected by the insights generator
    const ticketData = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      created_at: ticket.created_at,
      tags: ticket.tags
    }));
    
    return this.insightsGenerator.generateInsights(ticketData, '30d');
  }

  async calculateTokenUsage(text: string): Promise<TokenUsage> {
    const inputTokens = TokenCalculator.estimateTokenCount(text);
    const outputTokens = Math.round(inputTokens * 0.3); // Estimate output tokens
    const usage = TokenCalculator.calculateUsage('googlegemini', text, '', inputTokens, outputTokens);
    
    return usage;
  }

  /**
   * Classify user intent from natural language text
   */
  async classifyUserIntent(text: string): Promise<NLPResponse> {
    const result = await this.nlpProcessor.processText(text);
    return result;
  }

  /**
   * Extract actionable information from text based on intent
   */
  async extractActionableInfo(text: string, intent: string): Promise<Record<string, any>> {
    // Convert intent string to UserIntent object
    const userIntent: UserIntent = {
      category: this.mapIntentToCategory(intent),
      action: 'extract',
      confidence: 0.8,
      entities: {}
    };
    return this.nlpProcessor.extractActionableInfo(text, userIntent);
  }

  /**
   * Generate contextual response based on intent and data
   */
  async generateContextualResponse(intent: string, data: any): Promise<ContextualResponse> {
    // Convert intent string to UserIntent object
    const userIntent: UserIntent = {
      category: this.mapIntentToCategory(intent),
      action: 'respond',
      confidence: 0.8,
      entities: {}
    };
    return this.responseGenerator.generateContextualResponse(userIntent, data);
  }

  /**
   * Map intent string to valid UserIntent category
   */
  private mapIntentToCategory(intent: string): 'zendesk_query' | 'zendesk_action' | 'clickup_create' | 'clickup_query' | 'general' {
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('zendesk') && (intentLower.includes('query') || intentLower.includes('search') || intentLower.includes('find'))) {
      return 'zendesk_query';
    }
    if (intentLower.includes('zendesk') && (intentLower.includes('action') || intentLower.includes('update') || intentLower.includes('create'))) {
      return 'zendesk_action';
    }
    if (intentLower.includes('clickup') && (intentLower.includes('create') || intentLower.includes('add') || intentLower.includes('new'))) {
      return 'clickup_create';
    }
    if (intentLower.includes('clickup') && (intentLower.includes('query') || intentLower.includes('search') || intentLower.includes('find'))) {
      return 'clickup_query';
    }
    
    return 'general';
  }

  // Legacy method compatibility - delegates to domain processors
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple prompt to verify API connectivity
      const result = await this.geminiModel.generateContent('Test');
      return !!result;
    } catch (error) {
      console.error('Google Gemini availability check failed:', error);
      return false;
    }
  }
}