import { MultiAgentOrchestrator } from './agents/multi-agent-orchestrator.js';
import { AIService } from './ai/ai-service.js';
import { ZendeskTicket, ClickUpTask, AIResponse, TicketAnalysis } from '../types/index.js';
import { MultiAgentResponse, AgentRole, WorkflowMetrics } from '../agents/types/agent-types.js';

/**
 * Enhanced AI Service that integrates the multi-agent system
 * with existing Zendesk and ClickUp functionality
 */
export class MultiAgentService {
  private orchestrator: MultiAgentOrchestrator;
  private aiService: AIService;
  private zendeskService: any;
  private clickupService: any;
  private isInitialized: boolean = false;

  constructor(env: any, aiService: AIService, zendeskService: any, clickupService: any) {
    this.aiService = aiService;
    this.zendeskService = zendeskService;
    this.clickupService = clickupService;
    this.orchestrator = new MultiAgentOrchestrator();
    this.isInitialized = true;
  }

  /**
   * Process a Zendesk ticket using the multi-agent system
   */
  async processTicket(ticketId: string): Promise<MultiAgentResponse> {
    if (!this.isInitialized) {
      throw new Error('MultiAgentService not initialized');
    }

    try {
      // Get ticket from Zendesk
      const ticket = await this.zendeskService.getTicket(ticketId);
      
      // Process ticket through multi-agent workflow
      const agentResponse = await this.orchestrator.processTicket(ticket);
      
      // Log the multi-agent processing result
      console.log(`Multi-agent processing completed for ticket ${ticket.id}:`, {
        agentsInvolved: agentResponse.agentsInvolved,
        confidence: agentResponse.confidence,
        handoffCount: agentResponse.handoffCount
      });

      return agentResponse;
    } catch (error) {
      console.error('Multi-agent ticket processing failed:', error);
      throw error;
    }
  }

  /**
   * Analyze ticket and create ClickUp tasks based on agent recommendations
   */
  async analyzeAndCreateTasks(
    ticketId: string,
    listId?: string
  ): Promise<{
    agentResponse: MultiAgentResponse;
    clickUpTasks: ClickUpTask[];
    aiAnalysis: TicketAnalysis;
  }> {
    // Get ticket from Zendesk
    const ticket = await this.zendeskService.getTicket(ticketId);
    
    // Get multi-agent analysis
    const agentResponse = await this.processTicket(ticketId);
    
    // Get traditional AI analysis for comparison
    const aiAnalysis = await this.aiService.analyzeTicket(ticket);
    
    // Create ClickUp tasks based on agent recommendations
    const clickUpTasks = await this.createClickUpTasksFromAgentResponse(
      ticket, 
      agentResponse
    );

    return {
      agentResponse,
      clickUpTasks,
      aiAnalysis
    };
  }

  /**
   * Get comprehensive ticket insights combining AI and multi-agent analysis
   */
  async getComprehensiveInsights(
    ticketId: string
  ): Promise<{
    multiAgentResponse: MultiAgentResponse;
    aiInsights: AIResponse;
    combinedRecommendations: string[];
    confidenceScore: number;
  }> {
    // Get ticket from Zendesk
    const ticket = await this.zendeskService.getTicket(ticketId);
    
    // Run both AI and multi-agent analysis in parallel
    const [multiAgentResponse, aiInsights] = await Promise.all([
      this.processTicket(ticketId),
      this.aiService.generateDailyInsights([ticket], 'current')
    ]);

    // Combine recommendations from both systems
    const combinedRecommendations = this.combineRecommendations(
      multiAgentResponse.finalRecommendations,
      aiInsights.recommendations || []
    );

    // Calculate combined confidence score
    const confidenceScore = this.calculateCombinedConfidence(
      multiAgentResponse.confidence,
      0.8
    );

    // Convert AIInsights to AIResponse format
    const aiResponse: AIResponse = {
      summary: `AI Analysis for ${aiInsights.period}: ${aiInsights.total_tickets} tickets analyzed`,
      provider: 'multi-agent-ai',
      timestamp: new Date().toISOString()
    };

    return {
      multiAgentResponse,
      aiInsights: aiResponse,
      combinedRecommendations,
      confidenceScore
    };
  }

  /**
   * Route ticket to specific agent
   */
  async routeToAgent(
    ticketId: string,
    targetAgent: AgentRole
  ): Promise<any> {
    try {
      // Get ticket from Zendesk
      const ticket = await this.zendeskService.getTicket(ticketId);
      
      // Route to specific agent
      const analysis = await this.orchestrator.routeToAgent(ticket, targetAgent);
      
      return {
        ticketId,
        targetAgent,
        analysis,
        success: true
      };
    } catch (error) {
      console.error('Failed to route ticket to agent:', error);
      throw error;
    }
  }

  /**
   * Route ticket to specific agent based on content analysis
   */
  async routeTicketToAgent(
    ticket: ZendeskTicket,
    preferredAgent?: AgentRole
  ): Promise<{
    recommendedAgent: AgentRole;
    confidence: number;
    reasoning: string;
  }> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // If preferred agent is specified, validate it can handle the ticket
    if (preferredAgent) {
      const agent = this.orchestrator['agents'].get(preferredAgent);
      if (agent && await agent.canHandle(ticket)) {
        return {
          recommendedAgent: preferredAgent,
          confidence: 0.9,
          reasoning: `Manually routed to ${preferredAgent} and validated as capable`
        };
      }
    }

    // Determine best agent based on content analysis
    let recommendedAgent = 'PROJECT_MANAGER';
    let confidence = 0.6;
    let reasoning = 'Default routing to Project Manager for coordination';

    // WordPress-specific content
    if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme', 'wp-', 'woocommerce'])) {
      recommendedAgent = 'WORDPRESS_DEVELOPER';
      confidence = 0.85;
      reasoning = 'WordPress-related keywords detected';
    }
    // Infrastructure and DevOps
    else if (this.containsKeywords(content, ['server', 'deployment', 'infrastructure', 'docker', 'aws', 'hosting'])) {
      recommendedAgent = 'DEVOPS';
      confidence = 0.8;
      reasoning = 'Infrastructure and deployment keywords detected';
    }
    // Testing and QA
    else if (this.containsKeywords(content, ['bug', 'testing', 'qa', 'quality', 'regression', 'test case'])) {
      recommendedAgent = 'QA_TESTER';
      confidence = 0.8;
      reasoning = 'Testing and quality assurance keywords detected';
    }
    // Business analysis and data
    else if (this.containsKeywords(content, ['analytics', 'data', 'report', 'business', 'roi', 'metrics'])) {
      recommendedAgent = 'BUSINESS_ANALYST';
      confidence = 0.75;
      reasoning = 'Business analysis and data keywords detected';
    }
    // Software development
    else if (this.containsKeywords(content, ['api', 'code', 'development', 'programming', 'database', 'integration'])) {
      recommendedAgent = 'SOFTWARE_ENGINEER';
      confidence = 0.8;
      reasoning = 'Software development keywords detected';
    }
    // Project management
    else if (this.containsKeywords(content, ['project', 'timeline', 'coordination', 'planning', 'resource', 'stakeholder'])) {
      recommendedAgent = 'PROJECT_MANAGER';
      confidence = 0.75;
      reasoning = 'Project management keywords detected';
    }

    return {
      recommendedAgent: recommendedAgent as AgentRole,
      confidence,
      reasoning
    };
  }

  /**
   * Get workflow metrics and agent performance data
   */
  getWorkflowMetrics(): WorkflowMetrics {
    return this.orchestrator.getWorkflowMetrics();
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses(): any {
    return this.orchestrator.getAgentStatuses();
  }

  /**
   * Get status of all agents
   */
  getAllAgentsStatus(): any[] {
    const statuses = this.orchestrator.getAgentStatuses();
    return statuses.agents || [];
  }

  /**
   * Get status of a specific agent
   */
  getAgentStatus(role: AgentRole): any {
    const statuses = this.orchestrator.getAgentStatuses();
    return statuses[role] || null;
  }

  /**
   * Reset workflow metrics
   */
  resetMetrics(): void {
    this.orchestrator.resetMetrics();
  }

  // Private helper methods

  /**
   * Process ticket with agents using enhanced context
   */
  async processTicketWithAgents(
    ticket: ZendeskTicket,
    context?: any
  ): Promise<MultiAgentResponse> {
    const enhancedContext = await this.enhanceContext(ticket, context);
    return await this.orchestrator.processTicket(ticket);
  }

  private async enhanceContext(ticket: ZendeskTicket, context?: any): Promise<any> {
    try {
      // Get basic AI analysis to enhance context
      const aiSummary = await this.aiService.summarizeTicket(ticket.description);
      
      return {
        ...context,
        aiSummary: aiSummary.summary,
        ticketMetadata: {
          id: ticket.id,
          priority: ticket.priority,
          status: ticket.status,
          tags: ticket.tags || [],
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at
        },
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to enhance context with AI analysis:', error);
      return context || {};
    }
  }

  private async createClickUpTasksFromAgentResponse(
    ticket: ZendeskTicket,
    agentResponse: MultiAgentResponse
  ): Promise<ClickUpTask[]> {
    const tasks: ClickUpTask[] = [];

    // Create main task based on primary agent analysis
    const now = new Date().toISOString();
    const mainTask: ClickUpTask = {
      id: `task_${ticket.id}_main`,
      name: `[${agentResponse.workflow?.currentAgent || 'Multi-Agent'}] ${ticket.subject}`,
      description: this.formatTaskDescription(ticket, agentResponse),
      status: {
        id: 'todo',
        status: 'to do',
        color: '#d3d3d3',
        orderindex: 0,
        type: 'open'
      },
      orderindex: '1',
      date_created: now,
      date_updated: now,
      creator: {
        id: 0,
        username: 'zendesk-automation',
        email: 'automation@zendesk.com',
        color: '#7b68ee'
      },
      priority: {
        id: '2',
        priority: 'normal',
        color: '#ffcc00',
        orderindex: '2'
      },
      assignees: [],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [
        { name: agentResponse.workflow?.currentAgent?.toLowerCase() || 'multi-agent' },
        { name: `confidence-${Math.round(agentResponse.confidence * 100)}` },
        { name: `zendesk-${ticket.id}` }
      ],
      custom_fields: [
        {
          id: 'zendesk_ticket_id',
          name: 'Zendesk Ticket ID',
          type: 'text',
          value: ticket.id.toString()
        },
        {
          id: 'primary_agent',
          name: 'Primary Agent',
          type: 'text',
          value: agentResponse.workflow?.currentAgent || 'Multi-Agent'
        },
        {
          id: 'confidence_score',
          name: 'Confidence Score',
          type: 'number',
          value: agentResponse.confidence
        },
        {
          id: 'processing_time',
          name: 'Processing Time (ms)',
          type: 'number',
          value: agentResponse.processingTimeMs
        }
      ],
      list: {
        id: 'default',
        name: 'Zendesk Tasks'
      },
      folder: {
        id: 'default',
        name: 'Zendesk Integration'
      },
      space: {
        id: 'default'
      },
      url: `https://app.clickup.com/t/task_${ticket.id}_main`
    };
    tasks.push(mainTask);

    // Create subtasks for each recommendation
    (agentResponse.finalRecommendations || []).slice(0, 5).forEach((recommendation, index) => {
      const subtask: ClickUpTask = {
        id: `task_${ticket.id}_sub_${index + 1}`,
        name: recommendation.substring(0, 100),
        description: `Subtask for Zendesk ticket #${ticket.id}\n\nAction: ${recommendation}`,
        status: {
          id: 'todo',
          status: 'to do',
          color: '#d3d3d3',
          orderindex: 0,
          type: 'open'
        },
        orderindex: (index + 2).toString(),
        date_created: now,
        date_updated: now,
        creator: {
          id: 0,
          username: 'zendesk-automation',
          email: 'automation@zendesk.com',
          color: '#7b68ee'
        },
        priority: {
          id: '2',
          priority: 'normal',
          color: '#ffcc00',
          orderindex: '2'
        },
        assignees: [],
        tags: [
          { name: 'subtask' },
          { name: agentResponse.workflow?.currentAgent?.toLowerCase() || 'multi-agent' },
          { name: `zendesk-${ticket.id}` }
        ],

        custom_fields: [
          {
            id: 'zendesk_ticket_id',
            name: 'Zendesk Ticket ID',
            type: 'text',
            value: ticket.id.toString()
          },
          {
            id: 'parent_task',
            name: 'Parent Task',
            type: 'text',
            value: mainTask.id
          },
          {
            id: 'recommendation_index',
            name: 'Recommendation Index',
            type: 'number',
            value: index + 1
          }
        ],
        list: {
          id: 'default',
          name: 'Zendesk Tasks'
        },
        folder: {
          id: 'default',
          name: 'Zendesk Integration'
        },
        space: {
          id: 'default'
        },
        url: `https://app.clickup.com/t/task_${ticket.id}_sub_${index + 1}`
      };
      tasks.push(subtask);
    });

    return tasks;
  }

  private formatTaskDescription(ticket: ZendeskTicket, agentResponse: MultiAgentResponse): string {
    let description = `**Zendesk Ticket #${ticket.id}**\n\n`;
    description += `**Original Description:**\n${ticket.description}\n\n`;
    description += `**Multi-Agent Analysis:**\n`;
    description += `- Primary Agent: ${agentResponse.workflow?.currentAgent || 'Multi-Agent'}\n`;
    description += `- Confidence: ${Math.round(agentResponse.confidence * 100)}%\n`;
    description += `- Processing Time: ${agentResponse.processingTimeMs}ms\n\n`;
    
    if (agentResponse.agentsInvolved && agentResponse.agentsInvolved.length > 1) {
      description += `**Collaborating Agents:** ${agentResponse.agentsInvolved.join(', ')}\n\n`;
    }
    
    description += `**Recommended Actions:**\n`;
    (agentResponse.finalRecommendations || []).forEach((rec, index) => {
      description += `${index + 1}. ${rec}\n`;
    });

    return description;
  }

  private mapPriorityToClickUp(priority: string): string {
    const priorityMap: Record<string, string> = {
      'urgent': 'urgent',
      'high': 'high',
      'normal': 'normal',
      'low': 'low'
    };
    return priorityMap[priority] || 'normal';
  }

  private calculateDueDate(estimatedTime: string): string {
    const now = new Date();
    let hoursToAdd = 24; // Default 1 day

    // Parse estimated time to determine due date
    if (estimatedTime.includes('hour')) {
      const hours = parseInt(estimatedTime.match(/\d+/)?.[0] || '4');
      hoursToAdd = Math.max(hours * 2, 4); // Double the estimate with minimum 4 hours
    } else if (estimatedTime.includes('day')) {
      const days = parseInt(estimatedTime.match(/\d+/)?.[0] || '1');
      hoursToAdd = days * 24;
    }

    const dueDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    return dueDate.toISOString();
  }

  private combineRecommendations(agentRecs: string[], aiRecs: string[]): string[] {
    const combined = [...agentRecs, ...aiRecs];
    // Remove duplicates and similar recommendations
    const unique = Array.from(new Set(combined));
    return unique.slice(0, 10); // Limit to top 10 recommendations
  }

  private calculateCombinedConfidence(agentConfidence: number, aiConfidence: number): number {
    // Weighted average with slight preference for multi-agent system
    return (agentConfidence * 0.6 + aiConfidence * 0.4);
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }
}