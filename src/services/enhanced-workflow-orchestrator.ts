/**
 * Enhanced Workflow Orchestrator
 * Coordinates the enhanced workflow steps 4-7 after initial Slack message
 */

import { SlackService } from './integrations/slack';
import { MultiAgentService } from './multi-agent-service.js';
import { AIService } from './ai/ai-service.js';
import { ZendeskTicket, TicketAnalysis } from '../types/index.js';
import { MultiAgentResponse, AgentRole } from '../agents/types/agent-types.js';
import { 
  getMentionsForTicket, 
  formatMentionMessage,
  generateEnhancedTeamAssignmentMessage,
  generateSmartFooter,
  generateProfessionalFooter,
  generateMinimalFooter,
  generateFeatureFooter
} from '../config/team-assignments.js';

export interface EnhancedWorkflowContext {
  ticket: ZendeskTicket;
  clickUpTaskUrl?: string;
  initialSlackTs?: string; // Timestamp of initial Slack message for threading
  channel: string;
  existingAiAnalysis?: TicketAnalysis; // Optional existing AI analysis to avoid redundancy
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
  // Enhanced metrics for footer generation
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
      // Step 4: AI Thread Continuation (skip if we have existing analysis)
      let aiAnalysis = context.existingAiAnalysis;
      if (!aiAnalysis) {
        const aiStep = await this.executeStep4_AIThreadContinuation(context);
        this.addStepResult(result, aiStep);
        aiAnalysis = aiStep.data;
      } else {
        console.log('🔄 Reusing existing AI analysis from main workflow');
      }

      // Step 5: AI Ticket Analysis (enhanced) - use existing or generated analysis
      const analysisStep = await this.executeStep5_AITicketAnalysis(context, aiAnalysis);
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
      const mentionStep = await this.executeStep7_TeamMemberMentions(context, result.aiAnalysis, result.agentResponse);
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
      const analysisText = typeof aiSummary === 'string' ? aiSummary : 
        `**AI Analysis Summary**\n\n` +
        `📋 **Summary:** ${aiSummary.summary}\n` +
        `🎯 **Priority:** ${aiSummary.priority}\n` +
        `📂 **Category:** ${aiSummary.category}\n` +
        `😊 **Sentiment:** ${aiSummary.sentiment}\n` +
        `⚡ **Complexity:** ${aiSummary.estimated_complexity}\n` +
        `🎯 **Suggested Team:** ${aiSummary.suggested_team}\n` +
        `📊 **Confidence:** ${(aiSummary.confidence_score * 100).toFixed(1)}%\n\n` +
        `**Action Items:**\n${aiSummary.action_items.map(item => `• ${item}`).join('\n')}`;
      
      const slackResponse = await this.slackService.sendThreadedAIAnalysis(
        context.channel,
        context.initialSlackTs || '',
        analysisText
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
    context: EnhancedWorkflowContext,
    existingAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`🔍 Step 5: AI Ticket Analysis for ticket ${context.ticket.id}`);

      // Use existing analysis from Step 4 if available, otherwise generate new one
      let analysis: TicketAnalysis;
      if (existingAnalysis) {
        analysis = existingAnalysis;
      } else {
        analysis = await this.aiService.analyzeTicket(`${context.ticket.subject} ${context.ticket.description}`);
        if (!analysis) {
          throw new Error('Failed to get AI analysis');
        }
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
   * Step 6: Enhanced Multi-Agent Analysis
   * Use improved multi-agent system with PM coordination
   */
  private async executeStep6_IntelligentAgentAssignment(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`👥 Step 6: Enhanced Multi-Agent Analysis for ticket ${context.ticket.id}`);

      // Get comprehensive multi-agent analysis
      const multiAgentResponse = await this.multiAgentService.processTicket(context.ticket.id.toString());
      
      // Format enhanced analysis message with blocks
      const analysisBlocks = this.formatMultiAgentAnalysis(multiAgentResponse, aiAnalysis);
      
      // Send enhanced agent analysis in thread with block formatting
      await this.slackService.sendThreadedMessage(
        context.channel,
        context.initialSlackTs, // Thread to original message
        `Multi-Agent Analysis for Ticket #${multiAgentResponse.ticketId}`,
        analysisBlocks
      );

      return {
        success: true,
        stepName: 'enhanced_multi_agent_analysis',
        data: multiAgentResponse
      };

    } catch (error) {
      console.error('❌ Step 6 failed:', error);
      return {
        success: false,
        stepName: 'enhanced_multi_agent_analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 7: Team Member Mentions
   * Mention relevant team members based on ticket category, urgency, and agent analysis
   */
  private async executeStep7_TeamMemberMentions(
    context: EnhancedWorkflowContext,
    aiAnalysis?: TicketAnalysis,
    agentResponse?: MultiAgentResponse
  ): Promise<WorkflowStepResult> {
    try {
      console.log(`👥 Step 7: Team Member Mentions for ticket ${context.ticket.id}`);

      const category = aiAnalysis?.category || 'general';
      const urgency = aiAnalysis?.priority || 'medium';
      const ticketContent = `${context.ticket.subject} ${context.ticket.description}`;
      
      // Extract agent role and recommendations from agent response
      let agentRole: string | undefined;
      let agentRecommendations: string[] = [];
      let estimatedTime: string | undefined;
      
      if (agentResponse) {
        // Get the primary agent role (last agent in the workflow)
        agentRole = agentResponse.agentsInvolved?.[agentResponse.agentsInvolved.length - 1];
        
        // Extract recommendations from final recommendations or agent analyses
        if (agentResponse.finalRecommendations && agentResponse.finalRecommendations.length > 0) {
          agentRecommendations = agentResponse.finalRecommendations;
        } else if (agentResponse.agentAnalyses && agentResponse.agentAnalyses.length > 0) {
          // Get recommendations from the latest agent analysis
          const latestAnalysis = agentResponse.agentAnalyses[agentResponse.agentAnalyses.length - 1];
          if (latestAnalysis.recommendedActions) {
            agentRecommendations = latestAnalysis.recommendedActions;
          }
          estimatedTime = latestAnalysis.estimatedTime;
        }
      }
      
      // Generate enhanced team assignment message with business context
      const mentionMessage = generateEnhancedTeamAssignmentMessage(
        category,
        urgency,
        context.ticket.id.toString(),
        context.ticket.subject,
        context.ticket.description,
        agentRole,
        agentRecommendations,
        estimatedTime,
        agentResponse,
        {
          confidence: agentResponse?.confidence || 0.8,
          processingTime: agentResponse?.processingTimeMs || 1000,
          agentsInvolved: agentResponse?.agentsInvolved || [agentRole || 'AI']
        }
      );

      // Get team mentions with agent context
      const mentionData = getMentionsForTicket(category, urgency, agentRole, ticketContent);
      const mentions = [...mentionData.engineers, ...mentionData.projectManagers];
      
      // Send team mentions in thread
      const slackResponse = await this.slackService.sendThreadedTeamMentions(
        context.channel,
        context.initialSlackTs || '',
        mentions,
        mentionMessage,
        urgency,
        this.generateNextSteps(aiAnalysis)
      );

      console.log(`✅ Team mentions sent for ticket ${context.ticket.id}:`, {
        agentRole,
        category,
        urgency,
        mentionsCount: mentions.length,
        recommendationsCount: agentRecommendations.length
      });

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
   * Format multi-agent analysis for Slack display with block formatting
   */
  private formatMultiAgentAnalysis(multiAgentResponse: MultiAgentResponse, aiAnalysis?: TicketAnalysis): any[] {
    const confidence = Math.round(multiAgentResponse.confidence * 100);
    const agentsInvolved = multiAgentResponse.agentsInvolved.join(', ');
    
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔍 *Multi-Agent Analysis for Ticket #${multiAgentResponse.ticketId}*`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Confidence:* ${confidence}%`
          },
          {
            type: 'mrkdwn',
            text: `*Handoffs:* ${multiAgentResponse.handoffCount}`
          }
        ]
      }
    ];

    // Add individual agent analyses (limit to 3 most relevant)
    if (multiAgentResponse.agentAnalyses && multiAgentResponse.agentAnalyses.length > 0) {
      const topAnalyses = multiAgentResponse.agentAnalyses.slice(0, 3);
      
      topAnalyses.forEach((analysis) => {
        const agentEmoji = this.getAgentEmoji(analysis.agentRole);
        let analysisText = `${agentEmoji} *${analysis.agentRole}*\n${analysis.analysis}`;
        
        if (analysis.priority && analysis.estimatedTime) {
          analysisText += `\n• *Priority:* ${analysis.priority} | *Est. Time:* ${analysis.estimatedTime}`;
        }
        
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: analysisText
          }
        });
      });
    }
    
    // Add final recommendations (limit to 3)
    if (multiAgentResponse.finalRecommendations && multiAgentResponse.finalRecommendations.length > 0) {
      const topRecommendations = multiAgentResponse.finalRecommendations.slice(0, 3);
      const recommendationsText = topRecommendations.map(rec => `• ${rec}`).join('\n');
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💡 *Key Recommendations:*\n${recommendationsText}`
        }
      });
    }
    
    // Add processing time footer
    if (multiAgentResponse.processingTimeMs) {
      const processingTime = Math.round(multiAgentResponse.processingTimeMs / 1000 * 100) / 100;
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏱️ Processing time: ${processingTime}s | Agents: ${agentsInvolved}`
        }
      });
    }
    
    return blocks;
  }
  
  /**
   * Get emoji for agent role
   */
  private getAgentEmoji(agentRole: string): string {
    const emojiMap: Record<string, string> = {
      'PROJECT_MANAGER': ':briefcase:',
      'SOFTWARE_ENGINEER': ':computer:',
      'WORDPRESS_DEVELOPER': ':globe_with_meridians:',
      'DEVOPS': ':gear:',
      'QA_TESTER': ':mag:',
      'BUSINESS_ANALYST': ':chart_with_upwards_trend:'
    };
    return emojiMap[agentRole] || ':robot_face:';
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