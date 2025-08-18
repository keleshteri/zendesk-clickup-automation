/**
 * Enhanced Workflow Orchestrator
 * Coordinates the enhanced workflow steps 4-7 after initial Slack message
 */

import { SlackService } from './integrations/slack/slack.js';
import { MultiAgentService } from './multi-agent-service.js';
import { AIService } from './ai/ai-service.js';
import { ZendeskTicket, TicketAnalysis } from '../types/index.js';
import { MultiAgentResponse, AgentRole } from '../agents/types/agent-types.js';
import { getMentionsForTicket, formatMentionMessage } from '../config/team-assignments.js';

export interface EnhancedWorkflowContext {
  ticket: ZendeskTicket;
  clickUpTaskUrl?: string;
  initialSlackTs?: string; // Timestamp of initial Slack message for threading
  channel: string;
}

export interface WorkflowStepResult {
  success: boolean;
  stepName: string;
  data?: any;
  error?: string;
  slackTs?: string; // For threading
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
}

/**
 * Orchestrates the enhanced workflow steps after initial Slack notification
 */
export class EnhancedWorkflowOrchestrator {
  private slackService: SlackService;
  private multiAgentService: MultiAgentService;
  private aiService: AIService;
  private isInitialized: boolean = false;

  constructor(
    slackService: SlackService,
    multiAgentService: MultiAgentService,
    aiService: AIService
  ) {
    this.slackService = slackService;
    this.multiAgentService = multiAgentService;
    this.aiService = aiService;
    this.isInitialized = true;
  }

  /**
   * Execute the complete enhanced workflow
   */
  async executeEnhancedWorkflow(
    context: EnhancedWorkflowContext
  ): Promise<EnhancedWorkflowResult> {
    if (!this.isInitialized) {
      throw new Error('EnhancedWorkflowOrchestrator not initialized');
    }

    const result: EnhancedWorkflowResult = {
      success: false,
      completedSteps: [],
      failedSteps: [],
      totalSteps: 4, // Steps 4-7
      errors: []
    };

    console.log(`🚀 Starting enhanced workflow for ticket ${context.ticket.id}`);

    try {
      // Step 4: AI Thread Continuation
      const aiStep = await this.executeStep4_AIThreadContinuation(context);
      this.addStepResult(result, aiStep);

      // Step 5: AI Ticket Analysis (enhanced)
      const analysisStep = await this.executeStep5_AITicketAnalysis(context);
      this.addStepResult(result, analysisStep);
      if (analysisStep.success && analysisStep.data) {
        result.aiAnalysis = analysisStep.data;
      }

      // Step 6: Intelligent Agent Assignment
      const agentStep = await this.executeStep6_IntelligentAgentAssignment(context, result.aiAnalysis);
      this.addStepResult(result, agentStep);
      if (agentStep.success && agentStep.data) {
        result.agentResponse = agentStep.data;
      }

      // Step 7: Team Member Mentions
      const mentionStep = await this.executeStep7_TeamMemberMentions(context, result.aiAnalysis);
      this.addStepResult(result, mentionStep);
      if (mentionStep.success && mentionStep.data) {
        result.teamMentions = mentionStep.data;
      }

      // Determine overall success
      result.success = result.failedSteps.length === 0 || 
                      (result.completedSteps.length > 0 && result.failedSteps.length <= 2);

      console.log(`✅ Enhanced workflow completed for ticket ${context.ticket.id}:`, {
        success: result.success,
        completedSteps: result.completedSteps.length,
        failedSteps: result.failedSteps.length
      });

    } catch (error) {
      console.error(`❌ Enhanced workflow failed for ticket ${context.ticket.id}:`, error);
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failedSteps.push({
        success: false,
        stepName: 'workflow_execution',
        error: errorMessage
      });
      result.errors?.push(errorMessage);
    }

    return result;
  }

  /**
   * Step 4: AI Thread Continuation
   * Continue in the same Slack thread with AI ticket summarization
   */
  private async executeStep4_AIThreadContinuation(
    context: EnhancedWorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`🤖 Step 4: AI Thread Continuation for ticket ${context.ticket.id}`);

      // Generate AI summary
      const aiSummary = await this.aiService.analyzeTicket(`${context.ticket.subject} ${context.ticket.description}`);
      
      if (!aiSummary) {
        throw new Error('Failed to generate AI summary');
      }

      // Send threaded reply with AI analysis
      const slackResponse = await this.slackService.sendThreadedAIAnalysis(
        context.channel,
        context.initialSlackTs || '',
        context.ticket,
        aiSummary
      );

      return {
        success: true,
        stepName: 'ai_thread_continuation',
        data: aiSummary,
        slackTs: slackResponse?.ts
      };

    } catch (error) {
      console.error('❌ Step 4 failed:', error);
      return {
        success: false,
        stepName: 'ai_thread_continuation',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 5: AI Ticket Analysis
   * Enhanced AI analysis for categorization and urgency
   */
  private async executeStep5_AITicketAnalysis(
    context: EnhancedWorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`🔍 Step 5: AI Ticket Analysis for ticket ${context.ticket.id}`);

      // Get comprehensive AI analysis
      const analysis = await this.aiService.analyzeTicket(`${context.ticket.subject} ${context.ticket.description}`);
      
      if (!analysis) {
        throw new Error('Failed to get AI analysis');
      }

      // Enhance analysis with additional categorization
      const enhancedAnalysis = await this.enhanceTicketAnalysis(analysis, context.ticket);

      return {
        success: true,
        stepName: 'ai_ticket_analysis',
        data: enhancedAnalysis
      };

    } catch (error) {
      console.error('❌ Step 5 failed:', error);
      return {
        success: false,
        stepName: 'ai_ticket_analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 6: Intelligent Agent Assignment
   * Use multi-agent system to assign appropriate agent
   */
  private async executeStep6_IntelligentAgentAssignment(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`👥 Step 6: Intelligent Agent Assignment for ticket ${context.ticket.id}`);

      // Determine recommended agent based on analysis
      const recommendedAgent = this.determineRecommendedAgent(aiAnalysis, context.ticket);
      
      // Get agent analysis
      const agentResponse = await this.multiAgentService.routeToAgent(
          context.ticket.id.toString(),
          recommendedAgent
        );

      // Send agent feedback in thread
      const slackResponse = await this.slackService.sendThreadedAgentFeedback(
        context.channel,
        context.initialSlackTs || '',
        recommendedAgent,
        agentResponse.analysis?.summary || 'Agent analysis completed',
        agentResponse.analysis?.recommendations || []
      );

      return {
        success: true,
        stepName: 'intelligent_agent_assignment',
        data: agentResponse,
        slackTs: slackResponse?.ts
      };

    } catch (error) {
      console.error('❌ Step 6 failed:', error);
      return {
        success: false,
        stepName: 'intelligent_agent_assignment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 7: Team Member Mentions
   * Mention relevant team members based on ticket category and urgency
   */
  private async executeStep7_TeamMemberMentions(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`👥 Step 7: Team Member Mentions for ticket ${context.ticket.id}`);

      const category = aiAnalysis?.category || 'general';
      const urgency = aiAnalysis?.priority || 'medium';
      
      // Generate mention message
      const mentionMessage = formatMentionMessage(
        category,
        urgency,
        context.ticket.id.toString()
      );

      // Get team mentions
      const mentionData = getMentionsForTicket(category, urgency);
      const mentions = [...mentionData.engineers, ...mentionData.projectManagers];
      
      // Send team mentions in thread
      const slackResponse = await this.slackService.sendThreadedTeamMentions(
        context.channel,
        context.initialSlackTs || '',
        mentions,
        category,
        urgency,
        this.generateNextSteps(aiAnalysis)
      );

      return {
        success: true,
        stepName: 'team_member_mentions',
        data: mentionMessage,
        slackTs: slackResponse?.ts
      };

    } catch (error) {
      console.error('❌ Step 7 failed:', error);
      return {
        success: false,
        stepName: 'team_member_mentions',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Helper method to add step results
   */
  private addStepResult(result: EnhancedWorkflowResult, stepResult: WorkflowStepResult): void {
    if (stepResult.success) {
      result.completedSteps.push(stepResult);
    } else {
      result.failedSteps.push(stepResult);
    }
  }

  /**
   * Enhance ticket analysis with additional categorization
   */
  private async enhanceTicketAnalysis(
    analysis: TicketAnalysis,
    ticket: ZendeskTicket
  ): Promise<TicketAnalysis> {
    // Add enhanced categorization logic
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Determine more specific category
    let enhancedCategory = analysis.category || 'general';
    
    if (content.includes('wordpress') || content.includes('wp-') || content.includes('plugin')) {
      enhancedCategory = 'technical';
    } else if (content.includes('deploy') || content.includes('server') || content.includes('infrastructure')) {
      enhancedCategory = 'technical';
    } else if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
      enhancedCategory = 'technical';
    } else if (content.includes('feature') || content.includes('enhancement') || content.includes('request')) {
      enhancedCategory = 'general';
    }

    return {
      ...analysis,
      category: enhancedCategory
    };
  }

  /**
   * Determine recommended agent based on analysis
   */
  private determineRecommendedAgent(
    aiAnalysis?: TicketAnalysis,
    ticket?: ZendeskTicket
  ): AgentRole {
    const category = aiAnalysis?.category || 'general';
    const content = ticket ? `${ticket.subject} ${ticket.description}`.toLowerCase() : '';

    // Agent assignment logic
    if (content.includes('wordpress') || content.includes('wp-')) {
      return 'WORDPRESS_DEVELOPER';
    } else if (category === 'technical' || content.includes('deploy') || content.includes('infrastructure')) {
      return 'DEVOPS';
    } else if (content.includes('bug') || content.includes('error')) {
      return 'SOFTWARE_ENGINEER';
    } else if (content.includes('feature') || content.includes('enhancement')) {
      return 'SOFTWARE_ENGINEER';
    } else {
      return 'PROJECT_MANAGER';
    }
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(aiAnalysis?: TicketAnalysis): string[] {
    const category = aiAnalysis?.category || 'general';
    const priority = aiAnalysis?.priority || 'medium';

    const baseSteps = [
      'Review ticket details and requirements',
      'Assign to appropriate team member',
      'Set timeline and milestones'
    ];

    if (priority === 'urgent' || priority === 'high') {
      baseSteps.unshift('Immediate triage and assessment required');
    }

    if (category === 'bug') {
      baseSteps.push('Reproduce issue and identify root cause', 'Implement fix and test');
    } else if (category === 'feature') {
      baseSteps.push('Gather detailed requirements', 'Create technical specification');
    } else if (category === 'technical') {
      baseSteps.push('Check technical environment and dependencies', 'Test in staging environment');
    }

    return baseSteps;
  }

  /**
   * Execute workflow with graceful error handling
   */
  async executeWithFallback(
    context: EnhancedWorkflowContext
  ): Promise<EnhancedWorkflowResult> {
    try {
      return await this.executeEnhancedWorkflow(context);
    } catch (error) {
      console.error('❌ Enhanced workflow failed completely, using fallback:', error);
      
      // Fallback: at least try to send a basic threaded message
      try {
        await this.slackService.sendThreadedMessage(
          context.channel,
          context.initialSlackTs || '',
          '⚠️ Enhanced workflow encountered issues, but ticket has been logged successfully.'
        );
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
      }

      return {
        success: false,
        completedSteps: [],
        failedSteps: [{
          success: false,
          stepName: 'complete_workflow',
          error: error instanceof Error ? error.message : 'Unknown error'
        }],
        totalSteps: 4,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}