/**
 * @ai-metadata
 * @component: AutomationService
 * @description: Unified automation service combining multi-agent orchestration and conversational AI interface
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/automation-service.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["./orchestration/unified-orchestrator.ts", "./nlp-router.ts", "./ai/ai-service.ts"]
 * @tests: ["./tests/automation-service.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Unified service that consolidates MultiAgentService and TaskGenie functionality for comprehensive automation"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { UnifiedOrchestrator, EnhancedWorkflowContext, EnhancedWorkflowResult } from './orchestration/unified-orchestrator.js';
import { NLPRouter, NLPResponse } from './nlp-router.js';
import { AIService } from './ai/ai-service.js';
import { SlackService } from './integrations/slack/index.js';
import { ZendeskService } from './integrations/zendesk/zendesk.js';
import { ZendeskTicket, ClickUpTask, AIResponse, TicketAnalysis, Env, TokenUsage } from '../types/index.js';
import { MultiAgentResponse, AgentRole, WorkflowMetrics } from '../agents/types/agent-types.js';

export interface AutomationConfig {
  enableLogging: boolean;
  maxQueryLength: number;
  responseTimeout: number;
  enableContextMemory: boolean;
  enableMultiAgent: boolean;
  enableEnhancedWorkflow: boolean;
}

export interface ConversationContext {
  userId?: string;
  sessionId?: string;
  previousQueries: string[];
  conversationHistory: Array<{
    query: string;
    response: NLPResponse;
    timestamp: string;
  }>;
}

export interface AutomationResponse {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  executedTools: string[];
  processingTime: number;
  confidence: number;
  context?: ConversationContext;
  tokenUsage?: TokenUsage;
  aiProvider?: string;
  agentResponse?: MultiAgentResponse;
  workflowResult?: EnhancedWorkflowResult;
}

export interface ComprehensiveInsights {
  multiAgentResponse: MultiAgentResponse;
  aiInsights: TicketAnalysis;
  combinedRecommendations: string[];
  confidenceScore: number;
  workflowMetrics: WorkflowMetrics;
}

/**
 * Unified Automation Service
 * Combines multi-agent orchestration, conversational AI, and workflow automation
 */
export class AutomationService {
  private orchestrator: UnifiedOrchestrator;
  private nlpRouter: NLPRouter;
  private aiService: AIService;
  private slackService: SlackService;
  private zendeskService: ZendeskService;
  private clickupService: any;
  private config: AutomationConfig;
  private contexts: Map<string, ConversationContext>;
  private env: Env;
  private isInitialized: boolean = false;

  constructor(
    env: Env,
    aiService: AIService,
    slackService: SlackService,
    zendeskService: ZendeskService,
    clickupService: any,
    config?: Partial<AutomationConfig>
  ) {
    this.env = env;
    this.aiService = aiService;
    this.slackService = slackService;
    this.zendeskService = zendeskService;
    this.clickupService = clickupService;
    this.contexts = new Map();
    
    // Initialize orchestrator
    this.orchestrator = new UnifiedOrchestrator(slackService, aiService);
    
    // Initialize NLP router
    this.nlpRouter = new NLPRouter(
      env,
      aiService,
      zendeskService,
      this, // Pass self for multi-agent integration
      clickupService
    );
    
    // Set default configuration
    this.config = {
      enableLogging: true,
      maxQueryLength: 2000,
      responseTimeout: 30000,
      enableContextMemory: true,
      enableMultiAgent: true,
      enableEnhancedWorkflow: true,
      ...config
    };
    
    this.isInitialized = true;
  }

  // ===== CONVERSATIONAL AI INTERFACE =====

  /**
   * Main chat interface for natural language queries
   */
  async chat(query: string, userId?: string, sessionId?: string): Promise<AutomationResponse> {
    const startTime = Date.now();
    const contextKey = this.getContextKey(userId, sessionId);
    
    try {
      // Validate query length
      if (query.length > this.config.maxQueryLength) {
        return this.createErrorResponse(
          `Query too long. Maximum length is ${this.config.maxQueryLength} characters.`,
          startTime
        );
      }

      // Get conversation context
      const context = this.getContext(contextKey);
      
      // Process query through NLP router with timeout
      const timeoutPromise = this.createTimeoutPromise();
      const nlpPromise = this.nlpRouter.processQuery(query, userId);
      
      const response = await Promise.race([nlpPromise, timeoutPromise]);
      
      // Update context if enabled
      if (this.config.enableContextMemory) {
        this.updateContext(contextKey, query, response);
      }
      
      // Generate suggestions
      const suggestions = await this.generateSuggestions(query, response, context);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: response.success,
        message: response.message,
        data: response.data,
        suggestions,
        executedTools: response.executedTools || [],
        processingTime,
        confidence: response.confidence,
        context: this.config.enableContextMemory ? context : undefined,
        tokenUsage: response.tokenUsage,
        aiProvider: response.aiProvider
      };
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        startTime
      );
    }
  }

  /**
   * Get help information
   */
  async getHelp(): Promise<AutomationResponse> {
    return {
      success: true,
      message: "I'm TaskGenie, your AI assistant for Zendesk and ClickUp automation!",
      suggestions: [
        "Show me ticket #12345",
        "Create a task for urgent bug fix",
        "Analyze recent tickets",
        "Get project status",
        "Route ticket to development team"
      ],
      executedTools: [],
      processingTime: 0,
      confidence: 100
    };
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<AutomationResponse> {
    const metrics = this.getWorkflowMetrics();
    const agentStatuses = this.getAgentStatuses();
    
    return {
      success: true,
      message: "System status retrieved successfully",
      data: {
        workflowMetrics: metrics,
        agentStatuses,
        activeContexts: this.contexts.size,
        configuration: this.config
      },
      executedTools: ['status_check'],
      processingTime: 0,
      confidence: 100
    };
  }

  // ===== MULTI-AGENT ORCHESTRATION =====

  /**
   * Process a Zendesk ticket using the multi-agent system
   */
  async processTicket(ticketId: string): Promise<MultiAgentResponse> {
    if (!this.isInitialized) {
      throw new Error('AutomationService not initialized');
    }

    try {
      // Get ticket from Zendesk
      const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
      
      // Process ticket through multi-agent workflow
      const agentResponse = await this.orchestrator.processTicket(ticket);
      
      // Log the multi-agent processing result
      if (this.config.enableLogging) {
        console.log(`Multi-agent processing completed for ticket ${ticket.id}:`, {
          // finalAgent property removed as it doesn't exist on MultiAgentResponse
          confidence: agentResponse.confidence,
          processingTime: agentResponse.processingTimeMs
        });
      }

      return agentResponse;
    } catch (error) {
      console.error('Multi-agent ticket processing failed:', error);
      throw error;
    }
  }

  /**
   * Execute enhanced workflow for Slack integration
   */
  async executeEnhancedWorkflow(
    context: EnhancedWorkflowContext
  ): Promise<EnhancedWorkflowResult> {
    if (!this.config.enableEnhancedWorkflow) {
      throw new Error('Enhanced workflow is disabled');
    }

    const result = await this.orchestrator.executeEnhancedWorkflow(context);
    // Ensure we return EnhancedWorkflowResult type
    if ('success' in result && 'completedSteps' in result) {
      return result as EnhancedWorkflowResult;
    }
    // If it's a WorkflowState, convert it to EnhancedWorkflowResult
    throw new Error('Unexpected result type from orchestrator');
  }

  /**
   * Analyze ticket and create ClickUp tasks
   */
  async analyzeAndCreateTasks(
    ticketId: string,
    listId?: string
  ): Promise<{
    agentResponse: MultiAgentResponse;
    clickUpTasks: ClickUpTask[];
  }> {
    // Process ticket through multi-agent system
    const agentResponse = await this.processTicket(ticketId);
    
    // Get the original ticket
    const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
    
    // Create ClickUp tasks based on agent response
    const clickUpTasks = await this.createClickUpTasksFromAgentResponse(ticket, agentResponse, listId);
    
    return {
      agentResponse,
      clickUpTasks
    };
  }

  /**
   * Get comprehensive insights combining AI and multi-agent analysis
   */
  async getComprehensiveInsights(ticketId: string): Promise<ComprehensiveInsights> {
    // Get multi-agent response
    const multiAgentResponse = await this.processTicket(ticketId);
    
    // Get AI insights
    const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
    const aiInsights = await this.aiService.analyzeTicket(ticket.subject + '\n' + ticket.description);
    
    // Combine recommendations
    const combinedRecommendations = this.combineRecommendations(
      multiAgentResponse.finalRecommendations || [],
      aiInsights.action_items || []
    );
    
    // Calculate combined confidence
    const confidenceScore = this.calculateCombinedConfidence(
      multiAgentResponse.confidence || 0,
      aiInsights.confidence_score || 0
    );
    
    return {
      multiAgentResponse,
      aiInsights,
      combinedRecommendations,
      confidenceScore,
      workflowMetrics: this.getWorkflowMetrics()
    };
  }

  /**
   * Route ticket to specific agent
   */
  async routeToAgent(ticketId: string, targetAgent: AgentRole): Promise<any> {
    const ticket = await this.zendeskService.getTicket(parseInt(ticketId));
    return await this.orchestrator.routeToAgent(ticket, targetAgent);
  }

  /**
   * Get intelligent agent assignment recommendation
   */
  async getIntelligentAgentAssignment(
    ticket: ZendeskTicket,
    aiAnalysis: TicketAnalysis
  ): Promise<{
    recommendedAgent: AgentRole;
    confidence: number;
    reasoning: string;
    feedback: string;
    recommendations: string[];
  }> {
    // Use AI analysis to determine best agent
    const recommendedAgent = this.determineRecommendedAgent(aiAnalysis, ticket);
    
    // Generate feedback and recommendations
    const feedback = await this.generateAgentFeedback(ticket, aiAnalysis, recommendedAgent);
    const recommendations = await this.generateAgentRecommendations(ticket, aiAnalysis, recommendedAgent);
    
    return {
      recommendedAgent,
      confidence: 75,
      reasoning: 'Based on ticket content and AI analysis',
      feedback,
      recommendations
    };
  }

  // ===== WORKFLOW METRICS AND STATUS =====

  getWorkflowMetrics(): WorkflowMetrics {
    return this.orchestrator.getWorkflowMetrics();
  }

  getAgentStatuses(): any {
    return this.orchestrator.getAgentStatuses();
  }

  resetMetrics(): void {
    this.orchestrator.resetMetrics();
  }

  // ===== CONTEXT MANAGEMENT =====

  clearContext(userId?: string, sessionId?: string): boolean {
    const contextKey = this.getContextKey(userId, sessionId);
    return this.contexts.delete(contextKey);
  }

  getConversationHistory(userId?: string, sessionId?: string): ConversationContext | null {
    const contextKey = this.getContextKey(userId, sessionId);
    return this.contexts.get(contextKey) || null;
  }

  /**
   * Process multiple queries in batch
   */
  async batchProcess(queries: string[], userId?: string): Promise<AutomationResponse[]> {
    const results: AutomationResponse[] = [];
    
    for (const query of queries) {
      try {
        const result = await this.chat(query, userId);
        results.push(result);
      } catch (error) {
        results.push(this.createErrorResponse(
          error instanceof Error ? error.message : 'Batch processing error',
          Date.now()
        ));
      }
    }
    
    return results;
  }

  // ===== PRIVATE HELPER METHODS =====

  private getContextKey(userId?: string, sessionId?: string): string {
    return `${userId || 'anonymous'}_${sessionId || 'default'}`;
  }

  private getContext(contextKey: string): ConversationContext {
    if (!this.contexts.has(contextKey)) {
      this.contexts.set(contextKey, {
        previousQueries: [],
        conversationHistory: []
      });
    }
    return this.contexts.get(contextKey)!;
  }

  private updateContext(contextKey: string, query: string, response: NLPResponse): void {
    const context = this.getContext(contextKey);
    
    // Add to previous queries (keep last 10)
    context.previousQueries.push(query);
    if (context.previousQueries.length > 10) {
      context.previousQueries.shift();
    }
    
    // Add to conversation history (keep last 20)
    context.conversationHistory.push({
      query,
      response,
      timestamp: new Date().toISOString()
    });
    if (context.conversationHistory.length > 20) {
      context.conversationHistory.shift();
    }
  }

  private async generateSuggestions(
    query: string,
    response: NLPResponse,
    context: ConversationContext
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Context-based suggestions
    if (response.success) {
      suggestions.push('Analyze this ticket with AI', 'Create ClickUp task for this ticket');
    }
    
    if (response.success) {
      suggestions.push('Show me the created task', 'Create another related task');
    }
    
    // General suggestions based on conversation history
    const recentIntents: string[] = [];
    
    if (!recentIntents.includes('get_tickets')) {
      suggestions.push('Show me recent tickets');
    }
    
    if (!recentIntents.includes('get_projects')) {
      suggestions.push('List my projects');
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private createTimeoutPromise(): Promise<NLPResponse> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.config.responseTimeout);
    });
  }

  private createErrorResponse(message: string, startTime: number): AutomationResponse {
    return {
      success: false,
      message,
      suggestions: [
        'Try rephrasing your question',
        'Check the help documentation',
        'Contact support if the issue persists'
      ],
      executedTools: [],
      processingTime: Date.now() - startTime,
      confidence: 0
    };
  }

  private async createClickUpTasksFromAgentResponse(
    ticket: ZendeskTicket,
    agentResponse: MultiAgentResponse,
    listId?: string
  ): Promise<ClickUpTask[]> {
    const tasks: ClickUpTask[] = [];
    
    try {
      // Create main task based on ticket
      const mainTask = {
        name: `[Zendesk #${ticket.id}] ${ticket.subject}`,
        description: this.formatTaskDescription(ticket, agentResponse),
        status: 'to do',
        priority: this.mapPriorityToClickUp(ticket.priority || 'normal'),
        due_date: this.calculateDueDate('2 days'),
        assignees: [], // Will be populated based on agent recommendations
        tags: [
          'zendesk',
          `agent-${agentResponse.workflow.currentAgent.toLowerCase()}`,
          ...(ticket.tags || [])
        ]
      };
      
      const createdTask = await this.clickupService.createTask(listId, mainTask);
      tasks.push(createdTask);
      
      // Create subtasks based on agent recommendations
      if (agentResponse.finalRecommendations && agentResponse.finalRecommendations.length > 0) {
        for (const recommendation of agentResponse.finalRecommendations.slice(0, 3)) {
          const subtask = {
            name: recommendation,
            description: `Subtask for Zendesk ticket #${ticket.id}`,
            status: 'to do',
            priority: 'normal',
            parent: createdTask.id,
            tags: ['zendesk', 'subtask']
          };
          
          const createdSubtask = await this.clickupService.createTask(listId, subtask);
          tasks.push(createdSubtask);
        }
      }
      
    } catch (error) {
      console.error('Failed to create ClickUp tasks:', error);
      throw error;
    }
    
    return tasks;
  }

  private formatTaskDescription(ticket: ZendeskTicket, agentResponse: MultiAgentResponse): string {
    let description = `**Zendesk Ticket #${ticket.id}**\n\n`;
    description += `**Subject:** ${ticket.subject}\n\n`;
    description += `**Description:**\n${ticket.description}\n\n`;
    description += `**Priority:** ${ticket.priority || 'Normal'}\n\n`;
    
    if (agentResponse.agentAnalyses && agentResponse.agentAnalyses.length > 0) {
      description += `**AI Analysis:**\n`;
      agentResponse.agentAnalyses?.forEach((insight, index) => {
        description += `${index + 1}. ${insight.analysis || insight.reasoning}\n`;
      });
      description += '\n';
    }
    
    if (agentResponse.finalRecommendations && agentResponse.finalRecommendations.length > 0) {
      description += `**Recommendations:**\n`;
      agentResponse.finalRecommendations.forEach((rec, index) => {
        description += `${index + 1}. ${rec}\n`;
      });
    }
    
    return description;
  }

  private mapPriorityToClickUp(priority: string): string {
    const priorityMap: Record<string, string> = {
      'urgent': 'urgent',
      'high': 'high',
      'normal': 'normal',
      'low': 'low'
    };
    return priorityMap[priority.toLowerCase()] || 'normal';
  }

  private calculateDueDate(estimatedTime: string): string {
    const now = new Date();
    const timeMap: Record<string, number> = {
      '1 hour': 1,
      '2 hours': 2,
      '4 hours': 4,
      '1 day': 24,
      '2 days': 48,
      '1 week': 168
    };
    
    const hours = timeMap[estimatedTime] || 48; // Default to 2 days
    now.setHours(now.getHours() + hours);
    return now.getTime().toString();
  }

  private combineRecommendations(agentRecs: string[], aiRecs: string[]): string[] {
    const combined = [...agentRecs, ...aiRecs];
    return Array.from(new Set(combined)); // Remove duplicates
  }

  private calculateCombinedConfidence(agentConfidence: number, aiConfidence: number): number {
    return Math.round((agentConfidence + aiConfidence) / 2);
  }

  private determineRecommendedAgent(
    aiAnalysis: TicketAnalysis,
    ticket: ZendeskTicket
  ): AgentRole {
    if (aiAnalysis.recommendedAgent) {
      return aiAnalysis.recommendedAgent as AgentRole;
    }
    
    // Fallback logic based on ticket content
    const subject = ticket.subject?.toLowerCase() || '';
    const description = ticket.description?.toLowerCase() || '';
    
    if (subject.includes('wordpress') || description.includes('wordpress')) {
      return 'WORDPRESS_DEVELOPER';
    }
    if (subject.includes('deploy') || description.includes('deploy')) {
      return 'DEVOPS';
    }
    if (subject.includes('test') || description.includes('bug')) {
      return 'QA_TESTER';
    }
    if (subject.includes('code') || description.includes('development')) {
      return 'SOFTWARE_ENGINEER';
    }
    
    return 'PROJECT_MANAGER'; // Default
  }

  private async generateAgentFeedback(
    ticket: ZendeskTicket,
    aiAnalysis: TicketAnalysis,
    agentType: AgentRole
  ): Promise<string> {
    const agentTypeMap: Record<AgentRole, string> = {
      'PROJECT_MANAGER': 'project management and coordination',
      'SOFTWARE_ENGINEER': 'software development and technical implementation',
      'WORDPRESS_DEVELOPER': 'WordPress development and customization',
      'DEVOPS': 'deployment, infrastructure, and DevOps practices',
      'QA_TESTER': 'quality assurance and testing',
      'BUSINESS_ANALYST': 'business analysis and requirements gathering'
    };
    
    return `This ticket has been assigned to the ${agentType.replace('_', ' ').toLowerCase()} team for ${agentTypeMap[agentType]}. Based on the AI analysis, this appears to be a ${aiAnalysis.priority || 'normal'} priority issue that requires specialized attention.`;
  }

  private async generateAgentRecommendations(
    ticket: ZendeskTicket,
    aiAnalysis: TicketAnalysis,
    agentType: AgentRole
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Agent-specific recommendations
    switch (agentType) {
      case 'SOFTWARE_ENGINEER':
        recommendations.push('Review code implementation', 'Check for technical dependencies', 'Estimate development time');
        break;
      case 'WORDPRESS_DEVELOPER':
        recommendations.push('Check WordPress version compatibility', 'Review plugin dependencies', 'Test on staging environment');
        break;
      case 'DEVOPS':
        recommendations.push('Review deployment pipeline', 'Check infrastructure requirements', 'Plan rollback strategy');
        break;
      case 'QA_TESTER':
        recommendations.push('Create test cases', 'Set up test environment', 'Plan regression testing');
        break;
      case 'PROJECT_MANAGER':
        recommendations.push('Coordinate with stakeholders', 'Update project timeline', 'Communicate progress');
        break;
      case 'BUSINESS_ANALYST':
        recommendations.push('Gather detailed requirements', 'Analyze business impact', 'Document user stories');
        break;
    }
    
    return recommendations;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalContexts: number;
    totalInteractions: number;
    averageResponseTime: number;
    config: AutomationConfig;
    workflowMetrics: WorkflowMetrics;
  } {
    const workflowMetrics = this.getWorkflowMetrics();
    const totalInteractions = Array.from(this.contexts.values())
      .reduce((sum, context) => sum + context.conversationHistory.length, 0);
    
    const averageResponseTime = workflowMetrics.averageProcessingTime || 0;
    
    return {
      totalContexts: this.contexts.size,
      totalInteractions,
      averageResponseTime,
      config: this.config,
      workflowMetrics
    };
  }
}