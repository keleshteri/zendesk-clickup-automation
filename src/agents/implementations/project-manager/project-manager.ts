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
    
    console.log(`🔀 PM Agent Routing Decision for Ticket #${ticket.id}:`);
    console.log(`📄 Content keywords: ${content.substring(0, 100)}...`);
    
    // PRIORITY 1: WordPress Issues (Check first to handle WordPress crashes properly)
    if (content.includes('wordpress') || 
        content.includes('wp-') || 
        content.includes('plugin') ||
        content.includes('theme') ||
        content.includes('woocommerce') ||
        content.includes('wp_')) {
      console.log(`✅ Routing to WORDPRESS_DEVELOPER (WordPress issue detected)`);
      return 'WORDPRESS_DEVELOPER';
    }
    
    // PRIORITY 2: Technical Issues (Override everything else except WordPress)
    if (content.includes('500 error') || 
        content.includes('server error') || 
        content.includes('internal server error') ||
        content.includes('database error') ||
        content.includes('api error') ||
        content.includes('timeout') ||
        content.includes('fatal error') ||
        content.includes('500') ||
        content.includes('crash') ||
        content.includes('exception')) {
      console.log(`✅ Routing to SOFTWARE_ENGINEER (Technical error detected)`);
      return 'SOFTWARE_ENGINEER';
    }
    
    // PRIORITY 3: Infrastructure/Deployment
    if (content.includes('deployment') || 
        content.includes('server down') ||
        content.includes('infrastructure') ||
        content.includes('hosting') ||
        content.includes('docker') ||
        content.includes('kubernetes') ||
        content.includes('aws') ||
        content.includes('cloud') ||
        content.includes('ssl') ||
        content.includes('domain') ||
        content.includes('dns')) {
      console.log(`✅ Routing to DEVOPS (Infrastructure issue detected)`);
      return 'DEVOPS';
    }
    
    // PRIORITY 4: Testing and QA
    if (content.includes('test') || 
        content.includes('testing') ||
        content.includes('qa') ||
        content.includes('quality') ||
        content.includes('defect') ||
        content.includes('validation') ||
        content.includes('verification')) {
      console.log(`✅ Routing to QA_TESTER (Testing issue detected)`);
      return 'QA_TESTER';
    }
    
    // PRIORITY 5: Business Analysis (Only for non-technical issues)
    if ((content.includes('timeline') || 
         content.includes('project plan') ||
         content.includes('requirements') ||
         content.includes('business process') ||
         content.includes('specification') ||
         content.includes('documentation')) &&
        !content.includes('error') && 
        !content.includes('500') &&
        !content.includes('bug') &&
        !content.includes('crash')) {
      console.log(`✅ Routing to BUSINESS_ANALYST (Business planning)`);
      return 'BUSINESS_ANALYST';
    }
    
    // Default: For analytics/dashboard issues that are NOT technical errors
    if (content.includes('analytics') && 
        !content.includes('error') && 
        !content.includes('500') &&
        !content.includes('bug') &&
        !content.includes('crash')) {
      console.log(`✅ Routing to BUSINESS_ANALYST (Analytics planning)`);
      return 'BUSINESS_ANALYST';
    }
    
    console.log(`⚠️ No routing match found, completing workflow`);
    return null; // Workflow complete
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
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
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