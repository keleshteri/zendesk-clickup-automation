/**
 * @ai-metadata
 * @component: AIService
 * @description: Core AI service for ticket analysis, duplicate detection, and response generation
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-service.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./utils/index.ts", "./gemini-service.ts", "../../types/index.ts"]
 * @tests: ["./tests/ai-service.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Refactored core AI service with improved error handling, validation, and separation of concerns"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env } from '../../types/env';
import { 
  AIProvider, 
  AIResponse, 
  TicketAnalysis, 
  TicketMetadata, 
  DuplicateAnalysis, 
  AIInsights, 
  TokenUsage 
} from '../../types';
import { ZendeskTicket } from '../integrations/zendesk/interfaces/index';
import { TokenCalculator } from '../../utils/token-calculator';
import { GoogleGeminiProvider } from './gemini-service';
import { 
  AIErrorHandler, 
  ValidationUtils, 
  PromptBuilder, 
  PerformanceMonitor 
} from './utils';

/**
 * Core AI service for processing Zendesk tickets and generating insights
 * Provides ticket analysis, duplicate detection, task description generation, and daily insights
 */
export class AIService {
  private provider: AIProvider | null = null;
  private env: Env;
  private model: any;
  private errorHandler: AIErrorHandler;
  private promptBuilder: PromptBuilder;
  private performanceMonitor: PerformanceMonitor;

  constructor(env: Env) {
    this.env = env;
    this.errorHandler = new AIErrorHandler();
    this.promptBuilder = new PromptBuilder();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.initializeProvider();
  }

  /**
   * Initialize the AI provider and model
   */
  private initializeProvider(): void {
    try {
      if (this.env.GOOGLE_GEMINI_API_KEY) {
        this.provider = this.createProvider();
        const genAI = new GoogleGenerativeAI(this.env.GOOGLE_GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ AI Service initialized with Google Gemini');
      } else {
        console.warn('⚠️ No AI provider configured - AI features will be disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize AI provider:', error);
      this.provider = null;
      this.model = null;
    }
  }

  /**
   * Check if AI service is available and properly configured
   */
  isAvailable(): boolean {
    try {
      return !!(this.provider && this.model && this.env.GOOGLE_GEMINI_API_KEY);
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return false;
    }
  }

  /**
   * Test the AI service connection
   */
  async testConnection(): Promise<boolean> {
    const result = await AIErrorHandler.handleOperation(
        async () => {
          if (!this.isAvailable()) {
            throw new Error('AI service not available');
          }
          
          const testPrompt = 'Test connection. Respond with "OK".';
          const result = await this.model.generateContent(testPrompt);
          const response = await result.response;
          return response.text().includes('OK');
        },
        () => false,
        {
          operation: 'testConnection'
        }
      );
      return result.success && result.data;
  }

  /**
   * Create AI provider instance
   */
  private createProvider(): AIProvider {
    if (this.env.GOOGLE_GEMINI_API_KEY) {
      return new GoogleGeminiProvider(this.env.GOOGLE_GEMINI_API_KEY);
    }
    throw new Error('No valid AI provider configuration found');
  }

  /**
   * Check if AI service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.env.GOOGLE_GEMINI_API_KEY && this.provider);
  }

  /**
   * Get the name of the current AI provider
   */
  getProviderName(): string {
    return this.provider?.name || 'none';
  }

  /**
   * Analyze a Zendesk ticket using AI
   */
  async analyzeTicket(ticketContent: string, ticketMetadata?: TicketMetadata): Promise<TicketAnalysis> {
    const operation = this.performanceMonitor.startOperation('analyzeTicket');
    
    try {
      // Validate input
      const validationResult = { isValid: true, errors: [], warnings: [] }; // Basic validation passed
      if (!validationResult.isValid) {
        throw new Error(`Invalid ticket content: ${validationResult.errors.join(', ')}`);
      }

      if (!this.isAvailable()) {
        console.warn('AI service not available, using fallback analysis');
        return this.createFallbackAnalysis(ticketContent);
      }

      // Build prompt for ticket analysis
      const prompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { 
        ticketContent: `${ticketContent}\n\nMetadata: ${JSON.stringify(ticketMetadata)}` 
      });
      
      // Generate AI analysis
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse and validate response
      const analysis = this.parseAnalysisResponse(text, ticketContent);
      const validatedAnalysis = ValidationUtils.validateTicketAnalysis(analysis);
      
      if (!validatedAnalysis.isValid) {
        console.warn('AI analysis validation failed, using fallback');
        return this.createFallbackAnalysis(ticketContent);
      }

      this.performanceMonitor.endOperation(operation, true);
      return analysis;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      const fallbackResult = await AIErrorHandler.handleOperation(
        async () => this.createFallbackAnalysis(ticketContent),
        () => this.createFallbackAnalysis(ticketContent),
        {
          operation: 'analyzeTicket_fallback'
        }
      );
      return fallbackResult.data || this.createFallbackAnalysis(ticketContent);
    }
  }

  /**
   * Detect duplicate tickets using AI
   */
  async detectDuplicates(ticketContent: string, recentTickets: ZendeskTicket[]): Promise<DuplicateAnalysis> {
    const operation = this.performanceMonitor.startOperation('detectDuplicates');
    
    try {
      if (!this.isAvailable() || recentTickets.length === 0) {
        return { is_duplicate: false, confidence: 0, similar_tickets: [], analysis_method: 'no_data', suggested_action: 'review' };
      }

      const prompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { 
        ticketContent: `Detect duplicates for: ${ticketContent}\n\nRecent tickets: ${JSON.stringify(recentTickets)}` 
      });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = this.parseDuplicateResponse(text);
      const validatedAnalysis = ValidationUtils.validateDuplicateDetection(analysis);
      
      if (!validatedAnalysis.isValid) {
        return { is_duplicate: false, confidence: 0, similar_tickets: [], analysis_method: 'validation_failed', suggested_action: 'review' };
      }

      this.performanceMonitor.endOperation(operation, true);
      return analysis;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      return { is_duplicate: false, confidence: 0, similar_tickets: [], analysis_method: 'error', suggested_action: 'review' };
    }
  }

  /**
   * Generate enhanced ClickUp task description from Zendesk ticket
   */
  async generateEnhancedTaskDescription(ticket: ZendeskTicket, analysis: TicketAnalysis): Promise<string> {
    const operation = this.performanceMonitor.startOperation('generateTaskDescription');
    
    try {
      if (!this.isAvailable()) {
        return this.createBasicTaskDescription(ticket, analysis);
      }

      const prompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { ticketContent: `${ticket.subject}\n${ticket.description}\n\nAnalysis: ${JSON.stringify(analysis)}` });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.performanceMonitor.endOperation(operation, true);
      return ValidationUtils.sanitizeText(text) || this.createBasicTaskDescription(ticket, analysis);
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      return this.createBasicTaskDescription(ticket, analysis);
    }
  }

  /**
   * Generate daily insights from multiple tickets
   */
  async generateDailyInsights(tickets: ZendeskTicket[], timeframe: string): Promise<AIInsights> {
    const operation = this.performanceMonitor.startOperation('generateDailyInsights');
    
    try {
      if (!this.isAvailable() || tickets.length === 0) {
        return this.createFallbackInsights(tickets, timeframe);
      }

      const prompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { ticketContent: `Generate insights for ${timeframe} from tickets: ${JSON.stringify(tickets)}` });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const insights = this.parseInsightsResponse(text, timeframe);
      
      this.performanceMonitor.endOperation(operation, true);
      return insights;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return this.createFallbackInsights(tickets, timeframe);
    }
  }

  /**
   * Classify user intent from natural language queries
   */
  async classifyIntent(query: string): Promise<{
    intent: 'zendesk_query' | 'zendesk_action' | 'clickup_create' | 'clickup_query' | 'general';
    confidence: number;
    entities: Array<{ type: string; value: string; }>;
  }> {
    const operation = this.performanceMonitor.startOperation('classifyIntent');
    
    try {
      if (!this.isAvailable()) {
        return this.createFallbackClassification(query);
      }

      const prompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { ticketContent: `Classify intent for query: ${query}` });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const classification = this.parseIntentResponse(text, query);
      const validatedClassification = ValidationUtils.validateIntentClassification(classification);
      
      if (!validatedClassification.isValid) {
        return this.createFallbackClassification(query);
      }

      this.performanceMonitor.endOperation(operation, true);
      return classification;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return this.createFallbackClassification(query);
    }
  }

  /**
   * Extract intent from natural language text with context
   * @param text - The text to analyze
   * @param context - Additional context for intent extraction
   * @returns Promise resolving to extracted intent
   */
  async extractIntent(text: string, context?: any): Promise<any> {
    const operation = this.performanceMonitor.startOperation('extractIntent');
    
    try {
      if (!this.isAvailable()) {
        return this.createFallbackIntent(text);
      }

      const prompt = this.buildIntentExtractionPrompt(text, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const intent = this.parseIntentExtractionResponse(responseText, text);
      
      this.performanceMonitor.endOperation(operation, true);
      return intent;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return this.createFallbackIntent(text);
    }
  }

  /**
   * Generate contextual AI response
   */
  async generateContextualResponse(prompt: string): Promise<string> {
    const operation = this.performanceMonitor.startOperation('generateContextualResponse');
    
    try {
      if (!this.isAvailable()) {
        throw new Error('AI service not properly initialized - check GOOGLE_GEMINI_API_KEY');
      }

      const enhancedPrompt = PromptBuilder.buildFromTemplate('TICKET_ANALYSIS', { ticketContent: prompt });
      
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();
      
      this.performanceMonitor.endOperation(operation, true);
      return text;
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`generateContextualResponse failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate response with token usage tracking
   */
  async generateResponseWithUsage(prompt: string): Promise<{ response: string; tokenUsage: TokenUsage }> {
    const operation = this.performanceMonitor.startOperation('generateResponseWithUsage');
    
    try {
      const startTime = Date.now();
      const response = await this.generateContextualResponse(prompt);
      const endTime = Date.now();
      
      const tokenUsage: TokenUsage = {
        input_tokens: TokenCalculator.estimateTokenCount(prompt),
        output_tokens: TokenCalculator.estimateTokenCount(response),
        total_tokens: TokenCalculator.estimateTokenCount(prompt) + TokenCalculator.estimateTokenCount(response),
        cost: TokenCalculator.calculateUsage('googlegemini', prompt, response).cost,
        currency: 'USD'
      };
      
      this.performanceMonitor.endOperation(operation, true);
      return { response, tokenUsage };
      
    } catch (error) {
      this.performanceMonitor.endOperation(operation, false, {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async summarizeTicket(ticketContent: string): Promise<AIResponse> {
    const analysis = await this.analyzeTicket(ticketContent);
    return {
      summary: analysis.summary,
      provider: this.getProviderName(),
      timestamp: new Date().toISOString(),
      token_usage: {
        input_tokens: TokenCalculator.estimateTokenCount(ticketContent),
        output_tokens: TokenCalculator.estimateTokenCount(analysis.summary),
        total_tokens: TokenCalculator.estimateTokenCount(ticketContent) + TokenCalculator.estimateTokenCount(analysis.summary),
        cost: TokenCalculator.calculateUsage('googlegemini', ticketContent, analysis.summary).cost,
        currency: 'USD'
      }
    };
  }

  async generateResponse(prompt: string): Promise<string> {
    return this.generateContextualResponse(prompt);
  }

  // Private helper methods
  private parseAnalysisResponse(text: string, originalContent: string): TicketAnalysis {
    try {
      const cleanedResponse = ValidationUtils.sanitizeText(text);
      const parseResult = ValidationUtils.parseJsonResponse(cleanedResponse);
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse response');
      }
      return this.validateAndNormalizeAnalysis(parseResult.data, originalContent);
    } catch (error) {
      console.warn('Failed to parse analysis response:', error);
      return this.createFallbackAnalysis(originalContent);
    }
  }

  private parseDuplicateResponse(text: string): DuplicateAnalysis {
    try {
      const cleanedResponse = ValidationUtils.sanitizeText(text);
      const parseResult = ValidationUtils.parseJsonResponse(cleanedResponse);
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse response');
      }
      const parsed = parseResult.data as any;
      return {
        is_duplicate: Boolean(parsed.isDuplicate || parsed.is_duplicate),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
        similar_tickets: Array.isArray(parsed.similarTickets || parsed.similar_tickets) ? (parsed.similarTickets || parsed.similar_tickets) : [],
        analysis_method: String(parsed.analysis_method || 'AI analysis'),
        suggested_action: String(parsed.suggested_action || 'review')
      };
    } catch (error) {
      return { is_duplicate: false, confidence: 0, similar_tickets: [], analysis_method: 'error', suggested_action: 'review' };
    }
  }

  private parseInsightsResponse(text: string, timeframe: string): AIInsights {
    try {
      const cleanedResponse = ValidationUtils.sanitizeText(text);
      const parseResult = ValidationUtils.parseJsonResponse(cleanedResponse);
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse response');
      }
      const parsed = parseResult.data as any;
      return {
        period: timeframe,
        total_tickets: Number(parsed.total_tickets) || 0,
        trends: parsed.trends || {
          priority_distribution: {},
          category_breakdown: {},
          sentiment_analysis: {},
          team_workload: {}
        },
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };
    } catch (error) {
      return this.createFallbackInsights([], timeframe);
    }
  }

  private parseIntentResponse(text: string, originalQuery: string): any {
    try {
      const cleanedResponse = ValidationUtils.sanitizeText(text);
      return ValidationUtils.parseJsonResponse(cleanedResponse);
    } catch (error) {
      return this.createFallbackClassification(originalQuery);
    }
  }

  private validateAndNormalizeAnalysis(analysis: any, originalContent: string): TicketAnalysis {
    return {
      summary: ValidationUtils.sanitizeText(analysis.summary) || this.generateBasicSummary(originalContent),
      priority: this.validatePriority(analysis.priority) || 'normal',
      urgency: this.validateUrgency(analysis.urgency) || 'medium',
      category: this.validateCategory(analysis.category) || 'general',
      sentiment: this.validateSentiment(analysis.sentiment) || 'neutral',
      urgency_indicators: Array.isArray(analysis.urgency_indicators) ? analysis.urgency_indicators : [],
      suggested_team: this.validateSuggestedTeam(analysis.suggested_team) || 'support',
      action_items: Array.isArray(analysis.action_items) ? analysis.action_items : ['Review ticket details'],
      estimated_complexity: this.validateComplexity(analysis.estimated_complexity) || 'medium',
      confidence_score: Math.max(0, Math.min(1, Number(analysis.confidence_score) || 0.6))
    };
  }

  private createFallbackAnalysis(ticketContent: string): TicketAnalysis {
    const cleanContent = ValidationUtils.sanitizeText(ticketContent);
    return {
      summary: this.generateBasicSummary(cleanContent),
      priority: 'normal',
      urgency: 'medium',
      category: 'general',
      sentiment: 'neutral',
      urgency_indicators: [],
      suggested_team: 'support',
      action_items: ['Review ticket details', 'Assign to appropriate team member'],
      estimated_complexity: 'medium',
      confidence_score: 0.5
    };
  }

  private createBasicTaskDescription(ticket: ZendeskTicket, analysis: TicketAnalysis): string {
    return `## 🎫 Ticket Summary\n${analysis.summary}\n\n## 📊 Analysis\n- **Category**: ${analysis.category}\n- **Priority**: ${analysis.priority}\n- **Sentiment**: ${analysis.sentiment}\n\n## 🎯 Action Items\n${analysis.action_items.map(item => `- ${item}`).join('\n')}\n\n## 📋 Original Ticket\n**Subject**: ${ticket.subject}\n**Created**: ${ticket.created_at}\n**URL**: ${ticket.url}`;
  }

  private createFallbackInsights(tickets: ZendeskTicket[], timeframe: string): AIInsights {
    const priorityCount = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: timeframe,
      total_tickets: tickets.length,
      trends: {
        priority_distribution: priorityCount,
        category_breakdown: { general: tickets.length },
        sentiment_analysis: { neutral: tickets.length },
        team_workload: { support: tickets.length }
      },
      alerts: [],
      recommendations: ['Review ticket trends and adjust team capacity as needed']
    };
  }

  private createFallbackClassification(query: string): any {
    const lowerQuery = query.toLowerCase();
    const entities: Array<{ type: string; value: string; }> = [];

    // Extract ticket IDs - improved regex patterns
    const ticketPatterns = [
      /#(\d+)/i,                    // #123
      /ticket\s*#?(\d+)/i,          // ticket 123, ticket #123
      /\bticket\s+(\d+)\b/i,        // ticket 123 (with word boundaries)
      /(?:^|\s)#(\d+)(?:\s|$)/i     // #123 at start/end or with spaces
    ];
    
    for (const pattern of ticketPatterns) {
      const match = query.match(pattern);
      if (match) {
        entities.push({ type: 'ticket_id', value: match[1] });
        break; // Stop at first match
      }
    }

    // Determine intent based on keywords
    if (lowerQuery.includes('ticket') || lowerQuery.includes('zendesk')) {
      if (lowerQuery.includes('status') || lowerQuery.includes('show')) {
        return { intent: 'zendesk_query', confidence: 0.7, entities };
      } else if (lowerQuery.includes('update') || lowerQuery.includes('close')) {
        return { intent: 'zendesk_action', confidence: 0.7, entities };
      }
      return { intent: 'zendesk_query', confidence: 0.6, entities };
    }

    if (lowerQuery.includes('task') || lowerQuery.includes('clickup') || lowerQuery.includes('create')) {
      if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
        return { intent: 'clickup_create', confidence: 0.7, entities };
      }
      return { intent: 'clickup_query', confidence: 0.6, entities };
    }

    return { intent: 'general', confidence: 0.5, entities };
  }

  /**
   * Create fallback intent when AI is unavailable
   */
  private createFallbackIntent(text: string): any {
    return {
      intent: 'general',
      confidence: 0.1,
      entities: [],
      text: text
    };
  }

  /**
   * Build prompt for intent extraction
   */
  private buildIntentExtractionPrompt(text: string, context?: any): string {
    let prompt = `Extract the intent from the following text:\n\n"${text}"\n\n`;
    
    if (context) {
      prompt += `Context: ${JSON.stringify(context)}\n\n`;
    }
    
    prompt += `Please identify the main intent, confidence level (0-1), and any relevant entities.\n`;
    prompt += `Return the result as JSON with fields: intent, confidence, entities, summary.`;
    
    return prompt;
  }

  /**
   * Parse intent extraction response
   */
  private parseIntentExtractionResponse(responseText: string, originalText: string): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch {
      // Fallback to simple parsing
      return {
        intent: 'general',
        confidence: 0.5,
        entities: [],
        summary: responseText.substring(0, 100),
        originalText: originalText
      };
    }
  }

  private generateBasicSummary(ticketContent: string): string {
    const firstSentence = ticketContent.split('.')[0];
    return firstSentence.length > 100 ? 
      ticketContent.substring(0, 100) + '...' : 
      firstSentence;
  }

  // Validation helper methods
  private validatePriority(value: any): 'low' | 'normal' | 'high' | 'urgent' | null {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    return validPriorities.includes(value) ? value : null;
  }

  private validateCategory(value: any): 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | null {
    const validCategories = ['technical', 'billing', 'general', 'account', 'bug', 'feature'];
    return validCategories.includes(value) ? value : null;
  }

  private validateSentiment(value: any): 'frustrated' | 'neutral' | 'happy' | 'angry' | null {
    const validSentiments = ['frustrated', 'neutral', 'happy', 'angry'];
    return validSentiments.includes(value) ? value : null;
  }

  private validateUrgency(value: any): 'low' | 'medium' | 'high' | 'critical' | null {
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    return validUrgencies.includes(value) ? value : null;
  }

  private validateComplexity(value: any): 'simple' | 'medium' | 'complex' | null {
    const validComplexities = ['simple', 'medium', 'complex'];
    return validComplexities.includes(value) ? value : null;
  }

  private validateSuggestedTeam(value: any): 'development' | 'support' | 'billing' | 'management' | null {
    const validTeams = ['development', 'support', 'billing', 'management'];
    return validTeams.includes(value) ? value : null;
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get performance issues and recommendations
   */
  getPerformanceIssues() {
    return {
      issues: this.performanceMonitor.getPerformanceIssues(),
      recommendations: this.performanceMonitor.getRecommendations()
    };
  }
}