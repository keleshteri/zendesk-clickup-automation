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
        'progress_monitoring'
      ],
      tools,
      10 // Highest capacity for coordination tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    let analysis = 'Project Management Analysis:\n';
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Project planning and initiation
    if (this.containsKeywords(content, ['project', 'planning', 'initiation', 'scope', 'timeline', 'milestone'])) {
      analysis += '• Project Planning: New project requires planning and coordination\n';
      analysis += `\n${ProjectManagerPrompts.projectPlanning.projectInitiation}\n`;
      recommendedActions.push('Define project scope, objectives, and success criteria');
      recommendedActions.push('Create detailed project timeline with milestones');
      recommendedActions.push('Identify required resources and team members');
      recommendedActions.push('Establish project governance and communication plan');
      recommendedActions.push('Set up project tracking and monitoring systems');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Resource and team management
    if (this.containsKeywords(content, ['resource', 'team', 'allocation', 'assignment', 'workload', 'capacity'])) {
      analysis += '• Resource Management: Team resource allocation and management needed\n';
      analysis += `\n${ProjectManagerPrompts.projectPlanning.resourcePlanning}\n`;
      recommendedActions.push('Assess current team capacity and availability');
      recommendedActions.push('Allocate resources based on skills and priorities');
      recommendedActions.push('Balance workload across team members');
      recommendedActions.push('Identify resource gaps and hiring needs');
      recommendedActions.push('Create resource utilization reports');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Timeline and scheduling issues
    if (this.containsKeywords(content, ['deadline', 'schedule', 'delay', 'timeline', 'urgent', 'priority'])) {
      analysis += '• Timeline Management: Schedule optimization and deadline management\n';
      recommendedActions.push('Review current project timelines and dependencies');
      recommendedActions.push('Identify critical path and potential bottlenecks');
      recommendedActions.push('Adjust schedules to accommodate urgent priorities');
      recommendedActions.push('Communicate timeline changes to stakeholders');
      recommendedActions.push('Implement schedule monitoring and early warning systems');
      complexity = 'medium';
      priority = 'high';
      estimatedTime = '1-3 hours';
    }

    // Risk and issue management
    if (this.containsKeywords(content, ['risk', 'issue', 'problem', 'blocker', 'escalation', 'mitigation'])) {
      analysis += '• Risk Management: Project risks and issues require management\n';
      analysis += `\n${ProjectManagerPrompts.riskAssessment.riskIdentification}\n`;
      recommendedActions.push('Identify and assess project risks and issues');
      recommendedActions.push('Develop risk mitigation and contingency plans');
      recommendedActions.push('Escalate critical issues to appropriate stakeholders');
      recommendedActions.push('Implement risk monitoring and early detection');
      recommendedActions.push('Update risk register and communication plans');
      complexity = 'complex';
      priority = 'high';
      estimatedTime = '2-5 hours';
    }

    // Stakeholder communication and reporting
    if (this.containsKeywords(content, ['stakeholder', 'communication', 'report', 'update', 'meeting', 'status'])) {
      analysis += '• Stakeholder Communication: Enhanced communication and reporting needed\n';
      recommendedActions.push('Identify all project stakeholders and their needs');
      recommendedActions.push('Create comprehensive communication plan');
      recommendedActions.push('Establish regular reporting and update schedules');
      recommendedActions.push('Prepare executive summaries and status reports');
      recommendedActions.push('Schedule stakeholder meetings and reviews');
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Quality and deliverable management
    if (this.containsKeywords(content, ['quality', 'deliverable', 'review', 'approval', 'standard', 'criteria'])) {
      analysis += '• Quality Management: Quality assurance and deliverable review process\n';
      recommendedActions.push('Define quality standards and acceptance criteria');
      recommendedActions.push('Establish deliverable review and approval process');
      recommendedActions.push('Coordinate quality reviews with relevant teams');
      recommendedActions.push('Track quality metrics and improvement opportunities');
      recommendedActions.push('Ensure compliance with organizational standards');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Budget and cost management
    if (this.containsKeywords(content, ['budget', 'cost', 'expense', 'financial', 'roi', 'investment'])) {
      analysis += '• Budget Management: Project budget and cost control needed\n';
      recommendedActions.push('Review project budget and cost allocations');
      recommendedActions.push('Track actual expenses against planned budget');
      recommendedActions.push('Identify cost optimization opportunities');
      recommendedActions.push('Prepare budget variance reports');
      recommendedActions.push('Coordinate with finance team for budget approvals');
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Integration and coordination
    if (this.containsKeywords(content, ['integration', 'coordination', 'dependency', 'workflow', 'process'])) {
      analysis += '• Integration Management: Cross-team coordination and integration\n';
      recommendedActions.push('Map project dependencies and integration points');
      recommendedActions.push('Coordinate activities across multiple teams');
      recommendedActions.push('Establish integration testing and validation processes');
      recommendedActions.push('Manage change requests and scope modifications');
      recommendedActions.push('Ensure seamless workflow between project phases');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Performance and metrics tracking
    if (this.containsKeywords(content, ['performance', 'metrics', 'kpi', 'tracking', 'monitoring', 'dashboard'])) {
      analysis += '• Performance Monitoring: Project performance tracking and metrics\n';
      recommendedActions.push('Define key performance indicators (KPIs)');
      recommendedActions.push('Set up project monitoring dashboards');
      recommendedActions.push('Track progress against planned milestones');
      recommendedActions.push('Analyze performance trends and patterns');
      recommendedActions.push('Implement corrective actions for performance gaps');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Determine next agent based on technical needs
    if (this.containsKeywords(content, ['technical', 'development', 'coding', 'api', 'database'])) {
      analysis += '• Technical Coordination: Technical implementation coordination needed\n';
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Coordinate with software engineering team for technical implementation');
    }

    // Check if specialized expertise is needed
    if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme'])) {
      nextAgent = 'WORDPRESS_DEVELOPER';
      recommendedActions.push('Coordinate with WordPress development team');
    } else if (this.containsKeywords(content, ['infrastructure', 'deployment', 'devops'])) {
      nextAgent = 'DEVOPS';
      recommendedActions.push('Coordinate with DevOps team for infrastructure management');
    } else if (this.containsKeywords(content, ['testing', 'qa', 'quality assurance'])) {
      nextAgent = 'QA_TESTER';
      recommendedActions.push('Coordinate with QA team for testing and validation');
    } else if (this.containsKeywords(content, ['business analysis', 'requirements', 'data analysis'])) {
      nextAgent = 'BUSINESS_ANALYST';
      recommendedActions.push('Coordinate with business analyst for requirements and analysis');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'project_analysis', analysis, {
      complexity,
      estimatedTime,
      managementAreas: this.extractManagementAreas(content)
    });

    return this.formatAnalysis(
      analysis,
      confidence,
      recommendedActions,
      nextAgent,
      priority as 'low' | 'normal' | 'high' | 'urgent',
      estimatedTime,
      complexity
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
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off technical issues to appropriate specialists
    
    // WordPress-specific issues
    if (this.containsKeywords(content, ['wordpress', 'wp-', 'plugin', 'theme', 'woocommerce'])) {
      return 'WORDPRESS_DEVELOPER';
    }
    
    // Server/Infrastructure issues
    if (this.containsKeywords(content, ['500 error', 'internal server error', 'server error', 'server down', 'deployment', 'infrastructure', 'hosting', 'ssl', 'domain', 'dns', 'docker', 'kubernetes', 'aws', 'cloud'])) {
      return 'DEVOPS';
    }
    
    // Software/API/Database issues
    if (this.containsKeywords(content, ['api error', 'api', 'database error', 'database', 'code', 'bug', 'crash', 'not working', 'broken', 'integration', 'backend', 'frontend', 'application error'])) {
      return 'SOFTWARE_ENGINEER';
    }
    
    // Testing and QA issues
    if (this.containsKeywords(content, ['testing', 'qa', 'quality', 'test case', 'regression', 'validation'])) {
      return 'QA_TESTER';
    }
    
    // Business analysis and data issues
    if (this.containsKeywords(content, ['analytics', 'data', 'report', 'business', 'roi', 'metrics', 'analysis'])) {
      return 'BUSINESS_ANALYST';
    }

    return null; // Project Manager coordinates when no specific handoff is needed
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
}