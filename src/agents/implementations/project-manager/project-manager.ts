import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';
import { ProjectManagerPrompts } from './prompts.js';

export class ProjectManagerAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'project_planning',
        description: 'Create and manage project plans, timelines, and milestones',
        parameters: { project_name: 'string', scope: 'string', timeline: 'string', resources: 'array' },
        execute: async (params) => {
          return `Project plan created: ${params.project_name} - Scope: ${params.scope}, Timeline: ${params.timeline}, Resources: ${params.resources.join(', ')}`;
        }
      },
      {
        name: 'resource_allocation',
        description: 'Allocate and manage project resources and team assignments',
        parameters: { project: 'string', team_members: 'array', roles: 'array', workload: 'string' },
        execute: async (params) => {
          return `Resource allocation for ${params.project}: Team: ${params.team_members.join(', ')}, Roles: ${params.roles.join(', ')}, Workload: ${params.workload}`;
        }
      },
      {
        name: 'risk_management',
        description: 'Identify, assess, and mitigate project risks',
        parameters: { risks: 'array', impact_level: 'string', mitigation_strategies: 'array' },
        execute: async (params) => {
          return `Risk management: Risks identified: ${params.risks.join(', ')}, Impact: ${params.impact_level}, Mitigation: ${params.mitigation_strategies.join(', ')}`;
        }
      },
      {
        name: 'progress_tracking',
        description: 'Track project progress and milestone completion',
        parameters: { project: 'string', completed_tasks: 'number', total_tasks: 'number', milestones: 'array' },
        execute: async (params) => {
          const progress = Math.round((params.completed_tasks / params.total_tasks) * 100);
          return `Progress tracking for ${params.project}: ${progress}% complete (${params.completed_tasks}/${params.total_tasks} tasks), Milestones: ${params.milestones.join(', ')}`;
        }
      },
      {
        name: 'project_monitoring',
        description: 'Monitor ongoing project progress, identify blockers, and track deliverables',
        parameters: { project: 'string', status: 'string', blockers: 'array', next_actions: 'array', timeline_status: 'string' },
        execute: async (params) => {
          return `Project monitoring for ${params.project}: Status: ${params.status}, Timeline: ${params.timeline_status}, Blockers: ${params.blockers.join(', ')}, Next actions: ${params.next_actions.join(', ')}`;
        }
      },
      {
         name: 'client_coordination',
         description: 'Coordinate with clients, manage expectations, and facilitate communication',
         parameters: { client: 'string', communication_type: 'string', topics: 'array', action_items: 'array', follow_up: 'string' },
         execute: async (params) => {
           return `Client coordination with ${params.client}: ${params.communication_type} regarding ${params.topics.join(', ')}, Action items: ${params.action_items.join(', ')}, Follow-up: ${params.follow_up}`;
         }
       },
       {
        name: 'stakeholder_communication',
        description: 'Manage stakeholder communication and reporting',
        parameters: { stakeholders: 'array', communication_type: 'string', frequency: 'string', updates: 'array' },
        execute: async (params) => {
          return `Stakeholder communication: ${params.communication_type} to ${params.stakeholders.join(', ')} ${params.frequency}, Updates: ${params.updates.join(', ')}`;
        }
      },
      {
        name: 'quality_assurance',
        description: 'Ensure project quality standards and deliverable reviews',
        parameters: { deliverable: 'string', quality_criteria: 'array', review_status: 'string' },
        execute: async (params) => {
          return `Quality assurance for ${params.deliverable}: Criteria: ${params.quality_criteria.join(', ')}, Status: ${params.review_status}`;
        }
      }
    ];

    super(
      'PROJECT_MANAGER',
      [
        'project_planning',
        'resource_management',
        'timeline_management',
        'risk_management',
        'stakeholder_communication',
        'quality_assurance',
        'budget_management',
        'team_coordination',
        'progress_monitoring',
        'project_monitoring',
        'client_coordination'
      ],
      tools,
      10 // Highest capacity for coordination tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    // Analyze business impact and coordination needs
    const impactAnalysis = this.assessBusinessImpact(ticket, content);
    const routingDecision = await this.determineOptimalAgent(ticket, content);
    
    // Add project monitoring and client coordination analysis
    const monitoringNeeds = this.assessMonitoringNeeds(content, impactAnalysis);
    const clientCoordinationNeeds = this.assessClientCoordinationNeeds(content, impactAnalysis);
    
    let analysis = `Business Impact Assessment:\n${impactAnalysis.impact}\n\nCoordination Plan:\n${impactAnalysis.coordination}`;
    
    if (monitoringNeeds.required) {
      analysis += `\n\nProject Monitoring Plan:\n${monitoringNeeds.plan}`;
    }
    
    if (clientCoordinationNeeds.required) {
      analysis += `\n\nClient Coordination Strategy:\n${clientCoordinationNeeds.strategy}`;
    }
    
    if (routingDecision.agent) {
      analysis += `\n\nRouting Decision:\n• Assigning to ${routingDecision.agent} for technical analysis\n• Reason: ${routingDecision.reasoning}`;
    }
    
    const recommendedActions = [
      'Assess stakeholder impact and communication needs',
      'Coordinate resource allocation for resolution',
      'Monitor project progress and identify blockers',
      'Coordinate with client and manage expectations',
      'Track deliverables and milestone completion',
      'Escalate issues and provide regular status updates'
    ];

    // Store analysis in memory
    this.storeMemory(ticket.id, 'project_analysis', analysis, {
      complexity: impactAnalysis.complexity,
      estimatedTime: impactAnalysis.estimatedTime,
      businessImpact: impactAnalysis.impact,
      routingAgent: routingDecision.agent
    });

    return this.formatAnalysis(
      analysis,
      confidence,
      routingDecision.agent,
      impactAnalysis.priority as 'low' | 'normal' | 'high' | 'urgent',
      impactAnalysis.estimatedTime,
      impactAnalysis.complexity,
      recommendedActions
    );
  }

  async execute(task: string | ZendeskTicket, context?: any): Promise<any> {
    const taskLower = (typeof task === 'string' ? task : task.description || '').toLowerCase();
    let result: any = { status: 'completed', details: '' };
    
    // Ensure context is defined and extract ticketId
    const ticketId = typeof task === 'object' && task.id ? task.id : (context?.ticketId || 0);
    const safeContext = {
      ...context,
      ticketId: ticketId
    };

    try {
      if (taskLower.includes('planning') || taskLower.includes('project plan')) {
        result = await this.executeTool('project_planning', {
          project_name: safeContext.project_name || 'New Project',
          scope: safeContext.scope || 'To be defined',
          timeline: safeContext.timeline || '3 months',
          resources: safeContext.resources || ['team_lead', 'developers']
        });
      } else if (taskLower.includes('resource') || taskLower.includes('allocation')) {
        result = await this.executeTool('resource_allocation', {
          project: safeContext.project || 'Current Project',
          team_members: safeContext.team_members || ['developer', 'designer'],
          roles: safeContext.roles || ['development', 'design'],
          workload: safeContext.workload || 'balanced'
        });
      } else if (taskLower.includes('risk') || taskLower.includes('issue')) {
        result = await this.executeTool('risk_management', {
          risks: safeContext.risks || ['timeline risk'],
          impact_level: safeContext.impact_level || 'medium',
          mitigation_strategies: safeContext.mitigation_strategies || ['contingency planning']
        });
      } else if (taskLower.includes('progress') || taskLower.includes('tracking')) {
        result = await this.executeTool('progress_tracking', {
          project: safeContext.project || 'Current Project',
          completed_tasks: safeContext.completed_tasks || 0,
          total_tasks: safeContext.total_tasks || 10,
          milestones: safeContext.milestones || ['Phase 1']
        });
      } else if (taskLower.includes('stakeholder') || taskLower.includes('communication')) {
        result = await this.executeTool('stakeholder_communication', {
          stakeholders: safeContext.stakeholders || ['client', 'team'],
          communication_type: safeContext.communication_type || 'status_update',
          frequency: safeContext.frequency || 'weekly',
          updates: safeContext.updates || ['progress update']
        });
      } else if (taskLower.includes('quality') || taskLower.includes('review')) {
        result = await this.executeTool('quality_assurance', {
          deliverable: safeContext.deliverable || 'project_deliverable',
          quality_criteria: safeContext.quality_criteria || ['functionality', 'performance'],
          review_status: safeContext.review_status || 'pending'
        });
      } else {
        result = {
          status: 'completed',
          details: `Project management task executed: ${task}`,
          recommendations: [
            'Project coordination and planning completed',
            'Team resources allocated and managed',
            'Stakeholder communication established',
            'Quality standards and timelines maintained'
          ]
        };
      }

      // Store execution result
      this.storeMemory(safeContext.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Project Manager task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Project management task execution failed'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    const ticket = context.ticket || context;
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    console.log(`🤖 AI-Powered Agent Routing for Ticket #${ticket.id}:`);
    console.log(`📄 Analyzing content: ${content.substring(0, 100)}...`);
    
    // FIRST: Filter out simple inquiries that don't need technical analysis
    if (this.isSimpleInquiry(content)) {
      console.log(`📝 Simple inquiry detected, no agent routing needed`);
      return null; // Complete workflow without technical agents
    }
    
    try {
      // Use AI to analyze the ticket and determine the best agent
      const aiRoutingDecision = await this.getAIRoutingDecision(ticket);
      
      if (aiRoutingDecision.agent) {
        console.log(`🎯 AI Routing Decision: ${aiRoutingDecision.agent}`);
        console.log(`📊 Confidence: ${Math.round(aiRoutingDecision.confidence * 100)}%`);
        console.log(`💭 Reasoning: ${aiRoutingDecision.reasoning}`);
        return aiRoutingDecision.agent;
      }
      
      console.log(`⚠️ AI recommends PM-only handling`);
      return null;
      
    } catch (error) {
      console.error(`❌ AI routing failed, falling back to rule-based routing:`, error);
      
      // Fallback to rule-based routing if AI fails
      return this.getFallbackRoutingDecision(content);
    }
  }

  /**
   * Use AI to determine the best agent for handling this ticket
   */
  /**
   * Use AI to determine the best agent for handling this ticket
   */
  private async getAIRoutingDecision(ticket: ZendeskTicket): Promise<{
    agent: AgentRole | null;
    confidence: number;
    reasoning: string;
  }> {
    // Create a prompt for AI to analyze the ticket and recommend the best agent
    const agentDescriptions = {
      'SOFTWARE_ENGINEER': 'Handles API errors, database issues, code bugs, 500 errors, system crashes, integration problems, and technical development work',
      'WORDPRESS_DEVELOPER': 'Specializes in WordPress plugins, themes, WooCommerce, WordPress core issues, site performance, and WordPress-specific problems', 
      'DEVOPS': 'Manages infrastructure, deployments, server configuration, hosting issues, SSL, DNS, cloud services, and system administration',
      'QA_TESTER': 'Handles testing, bug validation, quality assurance, user acceptance testing, and defect management',
      'BUSINESS_ANALYST': 'Manages requirements gathering, process analysis, business logic, project planning, and non-technical planning work'
    };

    const analysisPrompt = `
Analyze this support ticket and determine which technical specialist should handle it.

TICKET DETAILS:
Subject: ${ticket.subject}
Description: ${ticket.description}
Priority: ${ticket.priority || 'normal'}

AVAILABLE SPECIALISTS:
${Object.entries(agentDescriptions).map(([role, desc]) => `- ${role}: ${desc}`).join('\n')}

ROUTING RULES:
1. If this is a simple inquiry (pricing, contact info, general questions), return null
2. If technical expertise is needed, choose the MOST SPECIFIC specialist
3. WordPress issues ALWAYS go to WORDPRESS_DEVELOPER (even if they involve errors)
4. Server/API errors go to SOFTWARE_ENGINEER
5. Infrastructure/hosting go to DEVOPS  
6. Testing/validation go to QA_TESTER
7. Planning/requirements go to BUSINESS_ANALYST
8. If description is too vague (like "problem on website" or "help me"), return null

EXAMPLES:
- "WordPress plugin causing 500 error" → WORDPRESS_DEVELOPER (WordPress takes priority)
- "API returning 500 internal server error" → SOFTWARE_ENGINEER
- "Dashboard login works but analytics shows blank page with 500 errors" → SOFTWARE_ENGINEER
- "Can you help me with my project?" → null (simple inquiry)
- "We have problem on website ask team fix it" → null (too vague)
- "Server deployment failed" → DEVOPS

Respond ONLY with JSON in this exact format:
{
  "agent": "AGENT_NAME_OR_NULL",
  "confidence": 0.85,
  "reasoning": "Explanation of why this agent was chosen"
}
`;

    try {
      // Call AI service to get routing decision
      const aiService = this.getAIService();
      if (!aiService) {
        throw new Error('AI service not available');
      }
      
      const response = await aiService.generateResponse(analysisPrompt);
      
      // Parse AI response
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const decision = JSON.parse(cleanResponse);
      
      // Validate the decision
      if (decision.agent && !Object.keys(agentDescriptions).includes(decision.agent)) {
        throw new Error(`Invalid agent recommended: ${decision.agent}`);
      }
      
      return {
        agent: decision.agent as AgentRole | null,
        confidence: Math.min(Math.max(decision.confidence || 0.5, 0), 1),
        reasoning: decision.reasoning || 'AI analysis completed'
      };
      
    } catch (error) {
      console.error('AI routing analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get AI service instance (you'll need to inject this)
   */
  /**
   * Get AI service instance (gets it from context or memory)
   */
  private getAIService(): any {
    // Try to get from context/memory - this will be injected by the orchestrator
    const aiServiceData = this.memory.get(-1); // Use -1 as special key for AI service
    if (aiServiceData && aiServiceData.context && typeof aiServiceData.context.generateResponse === 'function') {
      return aiServiceData.context;
    }
    
    // Return null to trigger fallback
    return null;
  }

  /**
   * Set AI service instance (to be called by orchestrator)
   */
  public setAIService(aiService: any): void {
    this.storeMemory(-1, 'ai_service', 'AI Service instance', aiService);
  }

  /**
   * Fallback rule-based routing when AI is unavailable
   */
  private getFallbackRoutingDecision(content: string): AgentRole | null {
    console.log(`🔄 Using fallback rule-based routing`);
    
    // Simplified priority-based rules as backup
    if (content.includes('wordpress') || content.includes('wp-') || content.includes('plugin')) {
      console.log(`✅ Fallback: WORDPRESS_DEVELOPER (WordPress keywords)`);
      return 'WORDPRESS_DEVELOPER';
    }
    
    if (content.includes('500') || content.includes('error') || content.includes('crash')) {
      console.log(`✅ Fallback: SOFTWARE_ENGINEER (Error keywords)`);
      return 'SOFTWARE_ENGINEER';
    }
    
    if (content.includes('deployment') || content.includes('server') || content.includes('hosting')) {
      console.log(`✅ Fallback: DEVOPS (Infrastructure keywords)`);
      return 'DEVOPS';
    }
    
    if (content.includes('test') || content.includes('bug') || content.includes('qa')) {
      console.log(`✅ Fallback: QA_TESTER (Testing keywords)`);
      return 'QA_TESTER';
    }
    
    console.log(`⚠️ Fallback: No routing needed`);
    return null;
  }
  
  /**
   * Enhanced agent assignment logic with correct priority matrix
   * @deprecated - Use shouldHandoff() method instead for proper priority handling
   */
  private async determineOptimalAgent(ticket: any, content: string): Promise<{
    agent: AgentRole | null;
    confidence: number;
    reasoning: string;
  }> {
    // This method is kept for backward compatibility but shouldHandoff() now handles routing directly
    const result = await this.shouldHandoff(ticket);
    
    if (result === 'SOFTWARE_ENGINEER') {
      return { agent: result, confidence: 0.9, reasoning: 'Technical issue priority routing' };
    } else if (result === 'WORDPRESS_DEVELOPER') {
      return { agent: result, confidence: 0.95, reasoning: 'WordPress issue priority routing' };
    } else if (result === 'DEVOPS') {
      return { agent: result, confidence: 0.85, reasoning: 'Infrastructure issue priority routing' };
    } else if (result === 'QA_TESTER') {
      return { agent: result, confidence: 0.8, reasoning: 'Testing issue priority routing' };
    } else if (result === 'BUSINESS_ANALYST') {
      return { agent: result, confidence: 0.7, reasoning: 'Business analysis priority routing' };
    } else {
      return { agent: null, confidence: 1.0, reasoning: 'No specialization needed - PM coordination' };
    }
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle project management and coordination related issues
    const projectKeywords = [
      'project', 'planning', 'coordination', 'management', 'timeline',
      'milestone', 'resource', 'team', 'stakeholder', 'communication',
      'deadline', 'schedule', 'priority', 'scope', 'deliverable',
      'quality', 'budget', 'risk', 'issue', 'escalation'
    ];

    return this.containsKeywords(content, projectKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'project_planning': ['project', 'planning', 'scope', 'timeline'],
      'resource_management': ['resource', 'team', 'allocation', 'capacity'],
      'timeline_management': ['timeline', 'schedule', 'deadline', 'milestone'],
      'risk_management': ['risk', 'issue', 'problem', 'mitigation'],
      'stakeholder_communication': ['stakeholder', 'communication', 'reporting', 'update'],
      'quality_assurance': ['quality', 'standard', 'review', 'deliverable'],
      'budget_management': ['budget', 'cost', 'expense', 'financial'],
      'team_coordination': ['team', 'coordination', 'collaboration', 'workflow'],
      'progress_monitoring': ['progress', 'tracking', 'monitoring', 'metrics']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword));
  }

  private isSimpleInquiry(content: string): boolean {
    const inquiryPatterns = [
      'how can i work with you',
      'can you help me',
      'need your company help',
      'need your company\'s help',
      'how do i contact',
      'what services do you provide',
      'how much does it cost',
      'can we schedule a call',
      'i need a quote',
      'what do you do',
      'tell me about your services',
      'how to get started',
      'pricing information',
      'contact information',
      'business inquiry',
      'general question',
      'help me on my project',
      'work with you on my project',
      'we have problem on website ask team fix it', // Very vague
      'problem on website',
      'can you help',
      'test ticket'
    ];
    
    // Also check if content is very short and vague
    const words = content.trim().split(/\s+/);
    const isVeryShort = words.length <= 15;
    const hasNoSpecifics = !content.includes('error') && 
                          !content.includes('dashboard') && 
                          !content.includes('500') && 
                          !content.includes('plugin') && 
                          !content.includes('database') &&
                          !content.includes('api') &&
                          !content.includes('login') &&
                          !content.includes('deployment');
    
    const matchesPattern = inquiryPatterns.some(pattern => content.includes(pattern));
    const isVagueRequest = isVeryShort && hasNoSpecifics && 
                          (content.includes('help') || content.includes('problem') || content.includes('fix'));
    
    return matchesPattern || isVagueRequest;
  }

  private assessBusinessImpact(ticket: ZendeskTicket, content: string): {
    impact: string;
    coordination: string;
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTime: string;
    priority: string;
  } {
    let impact = '';
    let coordination = '';
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority || 'normal';

    // Assess user impact
    const userImpactMatch = content.match(/(\d+)\s+users?\s+(affected|impacted|blocked)/);
    if (userImpactMatch) {
      const userCount = userImpactMatch[1];
      impact += `• ${userCount} users currently affected\n`;
      if (parseInt(userCount) > 10) {
        priority = 'high';
        complexity = 'complex';
      }
    }

    // Check for deadline/time sensitivity
    if (content.includes('deadline') || content.includes('friday') || content.includes('urgent')) {
      impact += '• Time-sensitive issue with approaching deadline\n';
      priority = 'urgent';
      estimatedTime = '1-2 hours';
    }

    // Assess system impact
    if (content.includes('dashboard') || content.includes('analytics') || content.includes('reports')) {
      impact += '• Critical business system affected (reporting/analytics)\n';
      coordination += '• Coordinate with business stakeholders on report delays\n';
    }

    // Check for error severity
    if (content.includes('500') || content.includes('error') || content.includes('crash')) {
      impact += '• System error preventing normal operations\n';
      coordination += '• Escalate to technical team for immediate investigation\n';
      complexity = 'medium';
    }

    // Default impact if none detected
    if (!impact) {
      impact = '• Analyzing ticket content for business impact assessment\n';
    }

    // Default coordination if none detected
    if (!coordination) {
      coordination = '• Coordinate with appropriate technical team for resolution\n';
    }

    return {
      impact: impact.trim(),
      coordination: coordination.trim(),
      complexity,
      estimatedTime,
      priority
    };
  }

  private extractManagementAreas(content: string): string[] {
    const areas: string[] = [];
    
    if (content.includes('planning') || content.includes('scope')) {
      areas.push('Project Planning');
    }
    if (content.includes('resource') || content.includes('team')) {
      areas.push('Resource Management');
    }
    if (content.includes('timeline') || content.includes('schedule')) {
      areas.push('Timeline Management');
    }
    if (content.includes('risk') || content.includes('issue')) {
      areas.push('Risk Management');
    }
    if (content.includes('stakeholder') || content.includes('communication')) {
      areas.push('Stakeholder Communication');
    }
    if (content.includes('quality') || content.includes('deliverable')) {
      areas.push('Quality Management');
    }
    if (content.includes('budget') || content.includes('cost')) {
      areas.push('Budget Management');
    }
    if (content.includes('coordination') || content.includes('integration')) {
      areas.push('Integration Management');
    }

    return areas;
  }

  private assessMonitoringNeeds(content: string, impactAnalysis: any): {
    required: boolean;
    plan: string;
  } {
    const monitoringKeywords = ['monitor', 'track', 'progress', 'status', 'blocker', 'deliverable', 'milestone', 'deadline'];
    const hasMonitoringNeeds = this.containsKeywords(content, monitoringKeywords) || 
                              impactAnalysis.complexity !== 'simple' ||
                              impactAnalysis.priority === 'high' || impactAnalysis.priority === 'urgent';
    
    if (!hasMonitoringNeeds) {
      return { required: false, plan: '' };
    }
    
    let plan = '• Establish regular progress check-ins and status reporting\n';
    plan += '• Identify and track key milestones and deliverables\n';
    plan += '• Monitor for blockers and dependencies\n';
    
    if (impactAnalysis.complexity === 'complex') {
      plan += '• Implement detailed project tracking with daily standups\n';
      plan += '• Create risk monitoring dashboard for early warning\n';
    }
    
    if (impactAnalysis.priority === 'urgent' || impactAnalysis.priority === 'high') {
      plan += '• Escalate immediately if progress deviates from plan\n';
      plan += '• Provide real-time updates to stakeholders\n';
    }
    
    return { required: true, plan };
  }

  private assessClientCoordinationNeeds(content: string, impactAnalysis: any): {
    required: boolean;
    strategy: string;
  } {
    const clientKeywords = ['client', 'customer', 'stakeholder', 'expectation', 'communication', 'coordinate', 'follow-up'];
    const hasClientNeeds = this.containsKeywords(content, clientKeywords) ||
                          impactAnalysis.priority === 'high' || impactAnalysis.priority === 'urgent' ||
                          impactAnalysis.complexity !== 'simple';
    
    if (!hasClientNeeds) {
      return { required: false, strategy: '' };
    }
    
    let strategy = '• Establish clear communication channels with client\n';
    strategy += '• Set and manage client expectations regarding timeline and deliverables\n';
    strategy += '• Provide regular status updates and progress reports\n';
    
    if (this.containsKeywords(content, ['urgent', 'critical', 'emergency'])) {
      strategy += '• Implement immediate escalation protocol for urgent issues\n';
      strategy += '• Ensure 24/7 communication availability during critical periods\n';
    }
    
    if (impactAnalysis.complexity === 'complex') {
      strategy += '• Schedule weekly client review meetings\n';
      strategy += '• Create detailed project documentation for client visibility\n';
      strategy += '• Establish change management process for scope adjustments\n';
    }
    
    strategy += '• Document all client interactions and decisions\n';
    strategy += '• Coordinate follow-up actions and ensure accountability\n';
    
    return { required: true, strategy };
  }
}