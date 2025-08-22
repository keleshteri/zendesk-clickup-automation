import { AgentRole, WorkflowState, MultiAgentResponse, WorkflowMetrics, AgentAnalysis } from '../types/agent-types.js';
import { ZendeskTicket } from '../../types/index.js';
import { ProjectManagerAgent } from '../implementations/project-manager/project-manager.js';
import { SoftwareEngineerAgent } from '../implementations/software-engineer/software-engineer.js';
import { WordPressDeveloperAgent } from '../implementations/wordpress-developer/wordpress-developer.js';
import { DevOpsAgent } from '../implementations/devops/devops.js';
import { QATesterAgent } from '../implementations/qa-tester/qa-tester.js';
import { BusinessAnalystAgent } from '../implementations/business-analyst/business-analyst.js';
import { BaseAgent } from '../core/base-agent.js';

/**
 * Simplified Orchestrator for Cloudflare Workers
 * This implementation doesn't use LangGraphJS to maintain compatibility
 */
export class Orchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private workflowMetrics: WorkflowMetrics;
  private aiService: any;

  constructor(aiService?: any) {
    this.agents = new Map();
    this.aiService = aiService;
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
    for (const role of Array.from(this.agents.keys())) {
      this.workflowMetrics.agentUtilization.set(role, {
        tasksHandled: 0,
        averageConfidence: 0,
        successRate: 0,
        averageProcessingTime: 0
      });
    }
  }


  /**
   * Process a Zendesk ticket through the multi-agent workflow
   */
  async processTicket(ticket: ZendeskTicket): Promise<MultiAgentResponse> {
    const startTime = Date.now();
    this.workflowMetrics.totalWorkflows++;

    try {
      // Enhanced workflow - ensure both PM and technical agent provide analysis
      const workflowState: WorkflowState = {
        ticketId: ticket.id,
        currentAgent: 'PROJECT_MANAGER',
        previousAgents: [],
        context: {
          ticket,
          insights: [],
          recommendations: [],
          confidence: 0
        },
        isComplete: false,
        handoffReason: ''
      };

      // Execute enhanced workflow that guarantees both PM and technical analysis
      const workflow = await this.executeEnhancedWorkflow(workflowState);
      const processingTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(workflow, processingTime, true);
      this.workflowMetrics.successfulWorkflows++;

      return {
        ticketId: ticket.id,
        workflow,
        finalRecommendations: workflow.context.recommendations,
        confidence: workflow.context.confidence,
        processingTimeMs: processingTime,
        agentsInvolved: [workflow.currentAgent, ...workflow.previousAgents],
        handoffCount: workflow.previousAgents.length,
        agentAnalyses: workflow.context.insights
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(null, processingTime, false);
      
      throw new Error(`Multi-agent processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced workflow that ensures both Project Manager and technical agent analysis
   */
  private async executeEnhancedWorkflow(state: WorkflowState): Promise<WorkflowState> {
    console.log(`🚀 Starting enhanced workflow for ticket ${state.ticketId}`);
    
    // Step 1: Project Manager Analysis (always first)
    const pmAgent = this.agents.get('PROJECT_MANAGER')!;
    const pmAnalysis = await pmAgent.analyze(state.context.ticket);
    state.context.insights.push(pmAnalysis);
    
    console.log(`📋 PM Analysis completed for ticket ${state.ticketId}`);
    
    // Step 2: Execute PM tasks and add initial recommendations
    const pmExecution = await pmAgent.execute(state.context.ticket);
    if (pmExecution && pmExecution.recommendations && Array.isArray(pmExecution.recommendations)) {
      state.context.recommendations.push(...pmExecution.recommendations);
    }
    
    // Step 3: Determine technical agent for handoff using NEW AI-POWERED ROUTING
    const targetAgent = await pmAgent.shouldHandoff(state.context.ticket);
    
    if (targetAgent) {
      console.log(`🔄 AI-powered handoff: ticket ${state.ticketId} from PM to ${targetAgent}`);
      
      // Step 4: Technical Agent Analysis and Execution
      const techAgent = this.agents.get(targetAgent);
      if (techAgent) {
        // Technical agent analysis
        const techAnalysis = await techAgent.analyze(state.context.ticket);
        state.context.insights.push(techAnalysis);
        
        // Execute technical agent tasks
        const techExecution = await techAgent.execute(state.context.ticket);
        if (techExecution && techExecution.recommendations && Array.isArray(techExecution.recommendations)) {
          state.context.recommendations.push(...techExecution.recommendations);
        }
        
        // Update state to reflect handoff
        state.previousAgents.push(state.currentAgent);
        state.currentAgent = targetAgent;
        state.handoffReason = `AI-powered handoff from PROJECT_MANAGER to ${targetAgent}`;
        this.workflowMetrics.handoffCount++;
        
        // Update agent utilization metrics
        this.updateAgentUtilization(targetAgent);
        
        console.log(`🤖 ${targetAgent} AI-routed analysis completed for ticket ${state.ticketId}`);
      } else {
        console.warn(`⚠️ Target agent ${targetAgent} not found, continuing with PM only`);
      }
    } else {
      console.log(`📋 AI determined PM should handle ticket ${state.ticketId} without technical handoff`);
    }
    
    // Calculate final confidence and complete workflow
    state.context.confidence = this.calculateCombinedConfidence(state.context.insights);
    state.isComplete = true;
    
    console.log(`✅ AI-enhanced workflow completed for ticket ${state.ticketId} with ${state.context.insights.length} agent analyses`);
    
    return state;
  }

  /**
   * Route a ticket directly to a specific agent
   */
  async routeToAgent(ticket: ZendeskTicket, targetAgent: AgentRole): Promise<any> {
    const agent = this.agents.get(targetAgent);
    if (!agent) {
      throw new Error(`Agent with role ${targetAgent} not found`);
    }

    const canHandle = await agent.canHandle(ticket);
    if (!canHandle) {
      throw new Error(`Agent ${targetAgent} cannot handle this ticket type`);
    }

    return await agent.analyze(ticket);
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(): WorkflowMetrics {
    return {
      ...this.workflowMetrics,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses() {
    const agents = Array.from(this.agents.entries()).map(([role, agent]) => ({
      agentId: agent.id || role,
      role,
      status: 'active',
      tasksProcessed: agent.getMetrics().tasksProcessed || 0,
      successRate: agent.getMetrics().successRate || 0,
      averageProcessingTime: agent.getMetrics().averageProcessingTime || 0,
      lastActive: new Date().toISOString(),
      capabilities: agent.getCapabilities(),
      currentLoad: 0,
      maxConcurrency: 1
    }));
    
    return {
      agents,
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics for all agents and orchestrator
   */
  resetMetrics(): void {
    for (const [role, agent] of Array.from(this.agents)) {
      // Reset agent metrics if the method exists
      if (typeof (agent as any).resetMetrics === 'function') {
        (agent as any).resetMetrics();
      }
    }
    
    // Reset orchestrator metrics
    this.workflowMetrics = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      averageProcessingTime: 0,
      agentUtilization: new Map(),
      handoffCount: 0,
      lastUpdated: new Date().toISOString()
    };

    // Reinitialize agent utilization metrics
    for (const role of Array.from(this.agents.keys())) {
      this.workflowMetrics.agentUtilization.set(role, {
        tasksHandled: 0,
        averageConfidence: 0,
        successRate: 0,
        averageProcessingTime: 0
      });
    }
  }

  /**
   * Calculate combined confidence from multiple analyses
   */
  private calculateCombinedConfidence(insights: AgentAnalysis[]): number {
    if (insights.length === 0) return 0;
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return totalConfidence / insights.length;
  }

  /**
   * Update agent utilization metrics
   */
  private updateAgentUtilization(agentRole: AgentRole): void {
    const utilization = this.workflowMetrics.agentUtilization.get(agentRole);
    if (utilization) {
      utilization.tasksHandled++;
    }
  }

  /**
   * Update workflow metrics
   */
  private updateMetrics(workflow: WorkflowState | null, processingTime: number, success: boolean): void {
    // Update average processing time
    const currentAvg = this.workflowMetrics.averageProcessingTime;
    const totalWorkflows = this.workflowMetrics.totalWorkflows;
    this.workflowMetrics.averageProcessingTime = 
      (currentAvg * (totalWorkflows - 1) + processingTime) / totalWorkflows;

    if (workflow && success) {
      // Update agent utilization
      const agentsUsed = [workflow.currentAgent, ...workflow.previousAgents];
      
      for (const agentRole of agentsUsed) {
        const utilization = this.workflowMetrics.agentUtilization.get(agentRole);
        if (utilization) {
          utilization.tasksHandled++;
          
          // Update average confidence
          const agentInsights = workflow.context.insights.filter(insight => 
            insight.agentRole === agentRole
          );
          
          if (agentInsights.length > 0) {
            const avgConfidence = agentInsights.reduce((sum, insight) => 
              sum + insight.confidence, 0
            ) / agentInsights.length;
            
            utilization.averageConfidence = 
              (utilization.averageConfidence * (utilization.tasksHandled - 1) + avgConfidence) / 
              utilization.tasksHandled;
          }
          
          // Update success rate
          utilization.successRate = success ? 
            (utilization.successRate * (utilization.tasksHandled - 1) + 1) / utilization.tasksHandled :
            utilization.successRate * (utilization.tasksHandled - 1) / utilization.tasksHandled;
          
          // Update processing time
          utilization.averageProcessingTime = 
            (utilization.averageProcessingTime * (utilization.tasksHandled - 1) + processingTime) / 
            utilization.tasksHandled;
        }
      }
    }
  }
}
