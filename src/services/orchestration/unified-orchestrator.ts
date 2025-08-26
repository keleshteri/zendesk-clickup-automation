/**
 * @ai-metadata
 * @component: UnifiedOrchestrator
 * @description: Consolidated orchestration service combining multi-agent coordination and enhanced workflow management
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/unified-orchestrator.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../ai/ai-service.ts", "../integrations/slack/index.ts", "../../agents/types/agent-types.ts"]
 * @tests: ["./tests/unified-orchestrator.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Unified orchestration service that consolidates duplicate orchestration logic from agents/orchestration/orchestrator.ts and enhanced-workflow-orchestrator.ts"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { AgentRole, WorkflowState, MultiAgentResponse, WorkflowMetrics, AgentAnalysis } from '../../agents/types/agent-types.js';
import { ZendeskTicket, TicketAnalysis } from '../../types/index.js';
import { ProjectManagerAgent } from '../../agents/implementations/project-manager/project-manager.js';
import { SoftwareEngineerAgent } from '../../agents/implementations/software-engineer/software-engineer.js';
import { WordPressDeveloperAgent } from '../../agents/implementations/wordpress-developer/wordpress-developer.js';
import { DevOpsAgent } from '../../agents/implementations/devops/devops.js';
import { QATesterAgent } from '../../agents/implementations/qa-tester/qa-tester.js';
import { BusinessAnalystAgent } from '../../agents/implementations/business-analyst/business-analyst.js';
import { BaseAgent } from '../../agents/core/base-agent.js';
import { SlackService } from '../integrations/slack/index.js';
import { AIService } from '../ai/ai-service.js';
import { 
  getMentionsForTicket, 
  formatMentionMessage,
  generateEnhancedTeamAssignmentMessage,
  generateSmartFooter,
  generateProfessionalFooter,
  generateMinimalFooter,
  generateFeatureFooter
} from '../../config/team-assignments.js';

export interface EnhancedWorkflowContext {
  ticket: ZendeskTicket;
  clickUpTaskUrl?: string;
  initialSlackTs?: string;
  channel: string;
  existingAiAnalysis?: TicketAnalysis;
}

export interface WorkflowStepResult {
  success: boolean;
  stepName: string;
  data?: any;
  error?: string;
  slackTs?: string;
}

export interface EnhancedWorkflowResult {
  success: boolean;
  completedSteps: WorkflowStepResult[];
  failedSteps: WorkflowStepResult[];
  totalSteps: number;
  errors?: string[];
  aiAnalysis?: TicketAnalysis;
  agentResponse?: MultiAgentResponse;
  teamMentions?: string;
  confidence?: number;
  processingTime?: number;
  agentsInvolved?: string[];
  category?: string;
  urgency?: string;
  teamMembers?: string[];
  projectManagers?: string[];
  ticketId?: string;
  agentFeedback?: {
    estimatedTime?: string;
    businessImpact?: string;
  };
}

/**
 * Unified Orchestrator Service
 * Combines multi-agent coordination and enhanced workflow management
 */
export class UnifiedOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private workflowMetrics: WorkflowMetrics;
  private slackService: SlackService;
  private aiService: AIService;
  private isInitialized: boolean = false;

  constructor(
    slackService: SlackService,
    aiService: AIService
  ) {
    this.slackService = slackService;
    this.aiService = aiService;
    this.agents = new Map();
    this.workflowMetrics = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      averageProcessingTime: 0,
      agentUtilization: new Map(),
      handoffCount: 0,
      lastUpdated: new Date().toISOString()
    };

    this.initializeAgents();
  }

  private initializeAgents(): void {
    const pmAgent = new ProjectManagerAgent();
    
    // Inject AI service into Project Manager if available
    if (this.aiService && typeof (pmAgent as any).setAIService === 'function') {
      (pmAgent as any).setAIService(this.aiService);
    }
    
    this.agents.set('PROJECT_MANAGER', pmAgent);
    this.agents.set('SOFTWARE_ENGINEER', new SoftwareEngineerAgent());
    this.agents.set('WORDPRESS_DEVELOPER', new WordPressDeveloperAgent());
    this.agents.set('DEVOPS', new DevOpsAgent());
    this.agents.set('QA_TESTER', new QATesterAgent());
    this.agents.set('BUSINESS_ANALYST', new BusinessAnalystAgent());

    // Initialize agent utilization metrics
    for (const role of this.agents.keys()) {
      this.workflowMetrics.agentUtilization.set(role, {
        tasksHandled: 0,
        averageConfidence: 0,
        successRate: 0,
        averageProcessingTime: 0,
        totalTasks: 0,
        lastActive: new Date().toISOString()
      });
    }
  }

  /**
   * Process a Zendesk ticket through the multi-agent system
   */
  async processTicket(ticket: ZendeskTicket): Promise<MultiAgentResponse> {
    const startTime = Date.now();
    
    try {
      const initialState: WorkflowState = {
        ticketId: ticket.id,
        currentAgent: 'PROJECT_MANAGER',
        previousAgents: [],
        context: {
          ticket: ticket,
          insights: [],
          recommendations: [],
          confidence: 0
        },
        isComplete: false,
        handoffReason: '',
        status: 'in_progress',
        handoffHistory: []
      };

      const finalState = await this.executeEnhancedWorkflow(initialState);
      const processingTime = Date.now() - startTime;
      
      // Ensure we have a WorkflowState for the response
      const workflowResult = finalState as WorkflowState;
      
      const response: MultiAgentResponse = {
        ticketId: workflowResult.ticketId,
        workflow: workflowResult,
        finalRecommendations: this.generateRecommendations(workflowResult),
        confidence: this.calculateCombinedConfidence(workflowResult.context.insights),
        processingTimeMs: processingTime,
        agentsInvolved: [workflowResult.currentAgent, ...workflowResult.previousAgents],
        handoffCount: workflowResult.handoffHistory.length,
        agentAnalyses: workflowResult.context.insights
      };

      this.updateMetrics(workflowResult, processingTime, workflowResult.status === 'completed');
      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(null, processingTime, false);
      throw error;
    }
  }

  /**
   * Execute the enhanced workflow for Slack integration
   */
  async executeEnhancedWorkflow(
    context: EnhancedWorkflowContext | WorkflowState
  ): Promise<EnhancedWorkflowResult | WorkflowState> {
    // Handle both workflow contexts
    if ('channel' in context) {
      return this.executeSlackWorkflow(context as EnhancedWorkflowContext);
    } else {
      return this.executeAgentWorkflow(context as WorkflowState);
    }
  }

  private async executeSlackWorkflow(
    context: EnhancedWorkflowContext
  ): Promise<EnhancedWorkflowResult> {
    const result: EnhancedWorkflowResult = {
      success: true,
      completedSteps: [],
      failedSteps: [],
      totalSteps: 4
    };

    try {
      // Step 4: AI Thread Continuation
      const step4Result = await this.executeStep4_AIThreadContinuation(context);
      this.addStepResult(result, step4Result);

      // Step 5: AI Ticket Analysis
      const step5Result = await this.executeStep5_AITicketAnalysis(context, context.existingAiAnalysis);
      this.addStepResult(result, step5Result);
      result.aiAnalysis = step5Result.data;

      // Step 6: Intelligent Agent Assignment
      const step6Result = await this.executeStep6_IntelligentAgentAssignment(context, result.aiAnalysis);
      this.addStepResult(result, step6Result);
      result.agentResponse = step6Result.data;

      // Step 7: Team Member Mentions
      const step7Result = await this.executeStep7_TeamMemberMentions(context, result.aiAnalysis, result.agentResponse);
      this.addStepResult(result, step7Result);
      result.teamMentions = step7Result.data;

      result.success = result.failedSteps.length === 0;
      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : String(error)];
      return result;
    }
  }

  private async executeAgentWorkflow(state: WorkflowState): Promise<WorkflowState> {
    let currentState = { ...state };
    const maxIterations = 5;
    let iterations = 0;

    while (currentState.status === 'in_progress' && iterations < maxIterations) {
      const currentAgent = this.agents.get(currentState.currentAgent);
      if (!currentAgent) {
        currentState.status = 'failed';
        break;
      }

      try {
        const analysis = await currentAgent.analyze(currentState.context.ticket);
        currentState.context.insights.push(analysis);
        this.updateAgentUtilization(currentState.currentAgent);

        const nextAgent = analysis.recommendedNextAgent;
        if (nextAgent && nextAgent !== currentState.currentAgent) {
          currentState.handoffHistory.push({
            from: currentState.currentAgent,
            to: nextAgent,
            reason: analysis.reasoning || 'Agent recommendation',
            timestamp: new Date().toISOString()
          });
          currentState.currentAgent = nextAgent;
          this.workflowMetrics.handoffCount++;
        } else {
          currentState.status = 'completed';
        }
      } catch (error) {
        currentState.status = 'failed';
        break;
      }

      iterations++;
    }

    if (iterations >= maxIterations) {
      currentState.status = 'failed';
    }

    return currentState;
  }

  // Slack workflow step implementations
  private async executeStep4_AIThreadContinuation(
    context: EnhancedWorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      if (!context.initialSlackTs) {
        return {
          success: false,
          stepName: 'AI Thread Continuation',
          error: 'No initial Slack timestamp provided for threading'
        };
      }

      const threadMessage = `🤖 **AI Analysis Starting**\n\n` +
        `I'm now analyzing ticket #${context.ticket.id} to provide intelligent insights and recommendations.\n\n` +
        `📊 **Analysis Steps:**\n` +
        `• Ticket content analysis\n` +
        `• Priority and urgency assessment\n` +
        `• Agent assignment recommendation\n` +
        `• Team member identification\n\n` +
        `⏱️ *This usually takes 10-30 seconds...*`;

      await this.slackService.sendMessage(
        context.channel,
        threadMessage,
        context.initialSlackTs || ''
      );

      return {
        success: true,
        stepName: 'AI Thread Continuation',
        data: { message: 'AI analysis thread started' },
        slackTs: context.initialSlackTs
      };
    } catch (error) {
      return {
        success: false,
        stepName: 'AI Thread Continuation',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeStep5_AITicketAnalysis(
    context: EnhancedWorkflowContext,
    existingAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      let analysis: TicketAnalysis;
      
      if (existingAnalysis) {
        analysis = await this.enhanceTicketAnalysis(existingAnalysis, context.ticket);
      } else {
        const ticketContent = `Subject: ${context.ticket.subject}\nDescription: ${context.ticket.description}\nPriority: ${context.ticket.priority}\nStatus: ${context.ticket.status}`;
        analysis = await this.aiService.analyzeTicket(ticketContent);
      }

      return {
        success: true,
        stepName: 'AI Ticket Analysis',
        data: analysis
      };
    } catch (error) {
      return {
        success: false,
        stepName: 'AI Ticket Analysis',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeStep6_IntelligentAgentAssignment(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      const recommendedAgent = this.determineRecommendedAgent(aiAnalysis, context.ticket);
      const agentResponse = await this.routeToAgent(context.ticket, recommendedAgent);

      return {
        success: true,
        stepName: 'Intelligent Agent Assignment',
        data: agentResponse
      };
    } catch (error) {
      return {
        success: false,
        stepName: 'Intelligent Agent Assignment',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeStep7_TeamMemberMentions(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis,
    agentResponse?: MultiAgentResponse
  ): Promise<WorkflowStepResult> {
    try {
      const mentions = getMentionsForTicket(
        aiAnalysis?.category,
        aiAnalysis?.urgency,
        undefined, // agentRole
        undefined, // ticketContent
        context.ticket // ticketData
      );
      const mentionMessage = formatMentionMessage(
        aiAnalysis?.category || 'general',
        aiAnalysis?.urgency || 'medium',
        context.ticket.id?.toString(),
        undefined, // agentRole
        undefined, // agentRecommendations
        undefined, // ticketContent
        context.ticket // ticketData
      );
      
      const enhancedMessage = generateEnhancedTeamAssignmentMessage(
        aiAnalysis?.category || 'general',
        aiAnalysis?.urgency || 'medium',
        context.ticket.id?.toString() || 'unknown',
        context.ticket.subject || 'No subject',
        context.ticket.description || 'No description',
        undefined, // agentRole
        undefined, // agentRecommendations
        undefined, // estimatedTime
        undefined, // agentFeedback
        undefined, // metrics
        context.ticket // ticketData
      );

      await this.slackService.sendMessage(
        context.channel,
        enhancedMessage,
        context.initialSlackTs || ''
      );

      return {
        success: true,
        stepName: 'Team Member Mentions',
        data: mentionMessage,
        slackTs: context.initialSlackTs
      };
    } catch (error) {
      return {
        success: false,
        stepName: 'Team Member Mentions',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Utility methods
  async routeToAgent(ticket: ZendeskTicket, targetAgent: AgentRole): Promise<any> {
    const agent = this.agents.get(targetAgent);
    if (!agent) {
      throw new Error(`Agent ${targetAgent} not found`);
    }

    try {
      const analysis = await agent.analyze(ticket);
      this.updateAgentUtilization(targetAgent);
      return analysis;
    } catch (error) {
      throw new Error(`Failed to route to agent ${targetAgent}: ${error}`);
    }
  }

  getWorkflowMetrics(): WorkflowMetrics {
    return { ...this.workflowMetrics };
  }

  getAgentStatuses() {
    const statuses: Record<string, any> = {};
    
    for (const [role, agent] of this.agents.entries()) {
      const utilization = this.workflowMetrics.agentUtilization.get(role);
      statuses[role] = {
        available: true,
        capabilities: agent.getCapabilities(),
        utilization: utilization || {
          totalTasks: 0,
          successfulTasks: 0,
          averageResponseTime: 0,
          lastActive: new Date().toISOString()
        }
      };
    }
    
    return statuses;
  }

  resetMetrics(): void {
    this.workflowMetrics = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      averageProcessingTime: 0,
      agentUtilization: new Map(),
      handoffCount: 0,
      lastUpdated: new Date().toISOString()
    };

    // Reinitialize agent utilization
    for (const role of this.agents.keys()) {
      this.workflowMetrics.agentUtilization.set(role, {
        tasksHandled: 0,
        averageConfidence: 0,
        successRate: 0,
        averageProcessingTime: 0,
        totalTasks: 0,
        lastActive: new Date().toISOString()
      });
    }
  }

  // Private helper methods
  private generateRecommendations(state: WorkflowState): string[] {
    const recommendations: string[] = [];
    
    if (state.context.insights.length > 0) {
      const latestInsight = state.context.insights[state.context.insights.length - 1];
      if (latestInsight.recommendedActions) {
        recommendations.push(...latestInsight.recommendedActions);
      }
    }
    
    return recommendations;
  }

  private calculateCombinedConfidence(insights: AgentAnalysis[]): number {
    if (insights.length === 0) return 0;
    
    const totalConfidence = insights.reduce((sum, insight) => sum + (insight.confidence || 0), 0);
    return Math.round(totalConfidence / insights.length);
  }

  private updateAgentUtilization(agentRole: AgentRole): void {
    const current = this.workflowMetrics.agentUtilization.get(agentRole);
    if (current) {
      current.totalTasks++;
      current.lastActive = new Date().toISOString();
    }
  }

  private updateMetrics(workflow: WorkflowState | null, processingTime: number, success: boolean): void {
    this.workflowMetrics.totalWorkflows++;
    if (success) {
      this.workflowMetrics.successfulWorkflows++;
    }
    
    // Update average processing time
    const currentAvg = this.workflowMetrics.averageProcessingTime;
    const totalWorkflows = this.workflowMetrics.totalWorkflows;
    this.workflowMetrics.averageProcessingTime = 
      (currentAvg * (totalWorkflows - 1) + processingTime) / totalWorkflows;
    
    this.workflowMetrics.lastUpdated = new Date().toISOString();
  }

  private addStepResult(result: EnhancedWorkflowResult, stepResult: WorkflowStepResult): void {
    if (stepResult.success) {
      result.completedSteps.push(stepResult);
    } else {
      result.failedSteps.push(stepResult);
    }
  }

  private async enhanceTicketAnalysis(
    analysis: TicketAnalysis,
    ticket: ZendeskTicket
  ): Promise<TicketAnalysis> {
    // Add additional analysis layers
    return {
      ...analysis,
      enhancedInsights: {
        ticketComplexity: this.assessTicketComplexity(ticket),
        estimatedResolutionTime: this.estimateResolutionTime(ticket, analysis),
        businessImpact: this.assessBusinessImpact(ticket, analysis)
      }
    };
  }

  private determineRecommendedAgent(
    aiAnalysis?: TicketAnalysis,
    ticket?: ZendeskTicket
  ): AgentRole {
    if (aiAnalysis?.recommendedAgent) {
      return aiAnalysis.recommendedAgent as AgentRole;
    }
    
    // Fallback logic based on ticket content
    const subject = ticket?.subject?.toLowerCase() || '';
    const description = ticket?.description?.toLowerCase() || '';
    
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

  private generateNextSteps(aiAnalysis?: TicketAnalysis): string[] {
    const steps: string[] = [];
    
    if (aiAnalysis?.priority === 'high') {
      steps.push('🚨 Immediate attention required');
    }
    
    if (aiAnalysis?.category) {
      steps.push(`📋 Categorized as: ${aiAnalysis.category}`);
    }
    
    steps.push('👥 Team members have been notified');
    steps.push('📊 Progress will be tracked in ClickUp');
    
    return steps;
  }

  private assessTicketComplexity(ticket: ZendeskTicket): 'low' | 'medium' | 'high' {
    const description = ticket.description || '';
    const subject = ticket.subject || '';
    
    if (description.length > 1000 || subject.includes('complex') || subject.includes('integration')) {
      return 'high';
    }
    if (description.length > 300 || subject.includes('feature') || subject.includes('enhancement')) {
      return 'medium';
    }
    return 'low';
  }

  private estimateResolutionTime(ticket: ZendeskTicket, analysis: TicketAnalysis): string {
    const complexity = this.assessTicketComplexity(ticket);
    const priority = analysis.priority || ticket.priority || 'normal';
    
    if (priority === 'urgent' || priority === 'high') {
      return complexity === 'high' ? '2-4 hours' : '1-2 hours';
    }
    
    switch (complexity) {
      case 'high': return '1-2 days';
      case 'medium': return '4-8 hours';
      case 'low': return '1-4 hours';
      default: return '2-6 hours';
    }
  }

  private assessBusinessImpact(ticket: ZendeskTicket, analysis: TicketAnalysis): 'low' | 'medium' | 'high' {
    const subject = ticket.subject?.toLowerCase() || '';
    const description = ticket.description?.toLowerCase() || '';
    const priority = analysis.priority || ticket.priority || 'normal';
    
    if (priority === 'urgent' || subject.includes('critical') || subject.includes('down')) {
      return 'high';
    }
    if (priority === 'high' || subject.includes('important') || description.includes('customer')) {
      return 'medium';
    }
    return 'low';
  }

  private getAgentEmoji(agentRole: string): string {
    const emojiMap: Record<string, string> = {
      'PROJECT_MANAGER': '👨‍💼',
      'SOFTWARE_ENGINEER': '👨‍💻',
      'WORDPRESS_DEVELOPER': '🔧',
      'DEVOPS': '⚙️',
      'QA_TESTER': '🧪',
      'BUSINESS_ANALYST': '📊'
    };
    return emojiMap[agentRole] || '🤖';
  }

  async executeWithFallback(
    context: EnhancedWorkflowContext
  ): Promise<EnhancedWorkflowResult> {
    try {
      return await this.executeSlackWorkflow(context);
    } catch (error) {
      // Fallback to basic workflow
      return {
        success: false,
        completedSteps: [],
        failedSteps: [{
          success: false,
          stepName: 'Enhanced Workflow',
          error: error instanceof Error ? error.message : String(error)
        }],
        totalSteps: 1,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}