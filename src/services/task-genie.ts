import { NLPRouter, NLPResponse } from './nlp-router.js';
import { AIService } from './ai/ai-service.js';
import { ZendeskService } from './integrations/zendesk/zendesk.js';
import { MultiAgentService } from './multi-agent-service.js';
import { Env } from '../types/index.js';

export interface TaskGenieConfig {
  enableLogging: boolean;
  maxQueryLength: number;
  responseTimeout: number;
  enableContextMemory: boolean;
}

export interface TaskGenieContext {
  userId?: string;
  sessionId?: string;
  previousQueries: string[];
  conversationHistory: Array<{
    query: string;
    response: NLPResponse;
    timestamp: string;
  }>;
}

export interface TaskGenieResponse {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  executedTools: string[];
  processingTime: number;
  confidence: number;
  context?: TaskGenieContext;
  tokenUsage?: import('../types/index.js').TokenUsage;
  aiProvider?: string;
}

/**
 * TaskGenie - The AI-powered natural language interface
 * Provides conversational AI experience for Zendesk and ClickUp automation
 */
export class TaskGenie {
  private nlpRouter: NLPRouter;
  private config: TaskGenieConfig;
  private contexts: Map<string, TaskGenieContext>;
  private env: Env;

  constructor(
    env: Env,
    aiService: AIService,
    zendeskService: ZendeskService,
    multiAgentService: MultiAgentService,
    clickupService: any,
    config?: Partial<TaskGenieConfig>
  ) {
    this.env = env;
    this.nlpRouter = new NLPRouter(
      env,
      aiService,
      zendeskService,
      multiAgentService,
      clickupService
    );
    
    this.config = {
      enableLogging: true,
      maxQueryLength: 1000,
      responseTimeout: 30000,
      enableContextMemory: true,
      ...config
    };
    
    this.contexts = new Map();
  }

  /**
   * Main entry point for TaskGenie interactions
   */
  async chat(query: string, userId?: string, sessionId?: string): Promise<TaskGenieResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!query || query.trim().length === 0) {
        return this.createErrorResponse('Please provide a query', startTime);
      }
      
      if (query.length > this.config.maxQueryLength) {
        return this.createErrorResponse(
          `Query too long. Maximum ${this.config.maxQueryLength} characters allowed.`,
          startTime
        );
      }

      // Get or create context
      const contextKey = this.getContextKey(userId, sessionId);
      const context = this.getContext(contextKey);
      
      // Log interaction
      if (this.config.enableLogging) {
        console.log(`🤖 TaskGenie received query from ${userId || 'anonymous'}: "${query}"`);
      }

      // Process with timeout
      const nlpResponse = await Promise.race([
        this.nlpRouter.processQuery(query, userId),
        this.createTimeoutPromise()
      ]);

      // Update context
      if (this.config.enableContextMemory) {
        this.updateContext(contextKey, query, nlpResponse);
      }

      // Generate suggestions
      const suggestions = await this.generateSuggestions(query, nlpResponse, context);

      const response: TaskGenieResponse = {
        success: nlpResponse.success,
        message: nlpResponse.message,
        data: nlpResponse.data,
        suggestions,
        executedTools: nlpResponse.executedTools,
        processingTime: Date.now() - startTime,
        confidence: nlpResponse.confidence,
        context: this.config.enableContextMemory ? context : undefined,
        tokenUsage: nlpResponse.tokenUsage,
        aiProvider: nlpResponse.aiProvider
      };

      if (this.config.enableLogging) {
        console.log(`✅ TaskGenie response (${response.processingTime}ms):`, {
          success: response.success,
          confidence: response.confidence,
          toolsUsed: response.executedTools.length
        });
      }

      return response;

    } catch (error) {
      console.error('❌ TaskGenie error:', error);
      return this.createErrorResponse(
        `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime
      );
    }
  }

  /**
   * Get available commands and help
   */
  async getHelp(): Promise<TaskGenieResponse> {
    const helpResponse = await this.nlpRouter.processQuery('help');
    
    return {
      success: true,
      message: helpResponse.message,
      suggestions: [
        'Try: "How many open tickets are there?"',
        'Try: "Analyze ticket 12345"',
        'Try: "Show agent status"',
        'Try: "Create task from ticket 67890"'
      ],
      executedTools: [],
      processingTime: 0,
      confidence: 1.0
    };
  }

  /**
   * Get system status and metrics
   */
  async getStatus(): Promise<TaskGenieResponse> {
    const statusResponse = await this.nlpRouter.processQuery('show system insights');
    
    return {
      success: true,
      message: statusResponse.message,
      data: {
        ...statusResponse.data,
        taskGenieStatus: {
          activeContexts: this.contexts.size,
          config: this.config,
          uptime: 'Available'
        }
      },
      suggestions: [
        'Ask about ticket counts',
        'Request agent status',
        'Get workflow metrics'
      ],
      executedTools: statusResponse.executedTools,
      processingTime: 0,
      confidence: 1.0
    };
  }

  /**
   * Clear conversation context for a user/session
   */
  clearContext(userId?: string, sessionId?: string): boolean {
    const contextKey = this.getContextKey(userId, sessionId);
    return this.contexts.delete(contextKey);
  }

  /**
   * Get conversation history for a user/session
   */
  getConversationHistory(userId?: string, sessionId?: string): TaskGenieContext | null {
    const contextKey = this.getContextKey(userId, sessionId);
    return this.contexts.get(contextKey) || null;
  }

  /**
   * Process multiple queries in batch
   */
  async batchProcess(queries: string[], userId?: string): Promise<TaskGenieResponse[]> {
    const results: TaskGenieResponse[] = [];
    
    for (const query of queries) {
      try {
        const result = await this.chat(query, userId);
        results.push(result);
        
        // Small delay between batch requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push(this.createErrorResponse(
          `Batch processing failed for query: ${query}`,
          Date.now()
        ));
      }
    }
    
    return results;
  }

  /**
   * Get context key for user/session
   */
  private getContextKey(userId?: string, sessionId?: string): string {
    return `${userId || 'anonymous'}_${sessionId || 'default'}`;
  }

  /**
   * Get or create context for user/session
   */
  private getContext(contextKey: string): TaskGenieContext {
    if (!this.contexts.has(contextKey)) {
      this.contexts.set(contextKey, {
        previousQueries: [],
        conversationHistory: []
      });
    }
    return this.contexts.get(contextKey)!;
  }

  /**
   * Update context with new interaction
   */
  private updateContext(contextKey: string, query: string, response: NLPResponse): void {
    const context = this.getContext(contextKey);
    
    context.previousQueries.push(query);
    context.conversationHistory.push({
      query,
      response,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 interactions to prevent memory bloat
    if (context.previousQueries.length > 10) {
      context.previousQueries = context.previousQueries.slice(-10);
    }
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }
  }

  /**
   * Generate contextual suggestions based on query and response
   */
  private async generateSuggestions(
    query: string,
    response: NLPResponse,
    context: TaskGenieContext
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Add suggestions based on response type
    if (response.success && response.data) {
      if (response.executedTools.includes('ZendeskService.getTicket')) {
        suggestions.push('Analyze this ticket with AI');
        suggestions.push('Create ClickUp task from this ticket');
      }
      
      if (response.executedTools.includes('ZendeskService.getTicketsByStatus')) {
        suggestions.push('Get detailed status breakdown');
        suggestions.push('Show recent ticket trends');
      }
      
      if (response.executedTools.includes('MultiAgentService.processTicket')) {
        suggestions.push('Create tasks from this analysis');
        suggestions.push('Route to specific agent');
      }
    }
    
    // Add general suggestions if no specific ones
    if (suggestions.length === 0) {
      suggestions.push(
        'Ask about ticket counts',
        'Request system status',
        'Get help with commands'
      );
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Create timeout promise for query processing
   */
  private createTimeoutPromise(): Promise<NLPResponse> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query processing timed out after ${this.config.responseTimeout}ms`));
      }, this.config.responseTimeout);
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(message: string, startTime: number): TaskGenieResponse {
    return {
      success: false,
      message,
      suggestions: [
        'Try asking for help: "@TaskGenie help"',
        'Check system status: "@TaskGenie status"',
        'Ask about tickets: "How many open tickets?"'
      ],
      executedTools: [],
      processingTime: Date.now() - startTime,
      confidence: 0
    };
  }

  /**
   * Get TaskGenie statistics
   */
  getStats(): {
    totalContexts: number;
    totalInteractions: number;
    averageResponseTime: number;
    config: TaskGenieConfig;
  } {
    let totalInteractions = 0;
    let totalResponseTime = 0;
    
    for (const context of Array.from(this.contexts.values())) {
      totalInteractions += context.conversationHistory.length;
      totalResponseTime += context.conversationHistory.reduce(
        (sum, interaction) => sum + (interaction.response.processingTime || 0),
        0
      );
    }
    
    return {
      totalContexts: this.contexts.size,
      totalInteractions,
      averageResponseTime: totalInteractions > 0 ? totalResponseTime / totalInteractions : 0,
      config: this.config
    };
  }
}