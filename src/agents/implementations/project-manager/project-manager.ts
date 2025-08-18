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
      analysis = '• Define project scope, timeline, and resource requirements\n• Establish governance structure and communication plan\n• Set up tracking systems and milestone checkpoints';
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Resource and team management
    if (this.containsKeywords(content, ['resource', 'team', 'allocation', 'assignment', 'workload', 'capacity'])) {
      analysis = '• Assess team capacity and skill alignment for optimal allocation\n• Balance workload distribution across available resources\n• Identify gaps and coordinate hiring or contractor needs';
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Timeline and scheduling issues
    if (this.containsKeywords(content, ['deadline', 'schedule', 'delay', 'timeline', 'urgent', 'priority'])) {
      analysis = '• Analyze critical path and identify schedule bottlenecks\n• Adjust timeline priorities and communicate changes to stakeholders\n• Implement monitoring system for early deadline risk detection';
      complexity = 'medium';
      priority = 'high';
      estimatedTime = '1-3 hours';
    }

    // Risk and issue management
    if (this.containsKeywords(content, ['risk', 'issue', 'problem', 'blocker', 'escalation', 'mitigation'])) {
      analysis = '• Assess risk impact and develop mitigation strategies\n• Escalate critical blockers to appropriate decision makers\n• Update risk register and implement monitoring protocols';
      complexity = 'complex';
      priority = 'high';
      estimatedTime = '2-5 hours';
    }

    // Stakeholder communication and reporting
    if (this.containsKeywords(content, ['stakeholder', 'communication', 'report', 'update', 'meeting', 'status'])) {
      analysis = '• Map stakeholder needs and establish communication cadence\n• Create executive summaries and regular status reports\n• Schedule review meetings and feedback collection sessions';
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Quality and deliverable management
    if (this.containsKeywords(content, ['quality', 'deliverable', 'review', 'approval', 'standard', 'criteria'])) {
      analysis = '• Define quality standards and acceptance criteria for deliverables\n• Establish review and approval workflow with relevant teams\n• Track quality metrics and ensure compliance standards';
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Budget and cost management
    if (this.containsKeywords(content, ['budget', 'cost', 'expense', 'financial', 'roi', 'investment'])) {
      analysis = '• Review budget allocations and track actual vs planned expenses\n• Identify cost optimization opportunities and variance causes\n• Coordinate with finance team for approvals and reporting';
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Integration and coordination
    if (this.containsKeywords(content, ['integration', 'coordination', 'dependency', 'workflow', 'process'])) {
      analysis = '• Map dependencies and coordinate activities across teams\n• Establish integration testing and validation workflows\n• Manage change requests and ensure seamless phase transitions';
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Performance and metrics tracking
    if (this.containsKeywords(content, ['performance', 'metrics', 'kpi', 'tracking', 'monitoring', 'dashboard'])) {
      analysis = '• Define KPIs and set up monitoring dashboards\n• Track progress against milestones and analyze trends\n• Implement corrective actions for performance gaps';
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Determine next agent based on technical needs
    if (this.containsKeywords(content, ['technical', 'development', 'coding', 'api', 'database'])) {
      nextAgent = 'SOFTWARE_ENGINEER';
    }

    // Check if specialized expertise is needed
    if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme'])) {
      nextAgent = 'WORDPRESS_DEVELOPER';
    } else if (this.containsKeywords(content, ['infrastructure', 'deployment', 'devops'])) {
      nextAgent = 'DEVOPS';
    } else if (this.containsKeywords(content, ['testing', 'qa', 'quality assurance'])) {
      nextAgent = 'QA_TESTER';
    } else if (this.containsKeywords(content, ['business analysis', 'requirements', 'data analysis'])) {
      nextAgent = 'BUSINESS_ANALYST';
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
      nextAgent,
      priority as 'low' | 'normal' | 'high' | 'urgent',
      estimatedTime,
      complexity,
      []
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
    
    // Enhanced PM coordination logic
    const agentAssignment = this.determineOptimalAgent(ticket, content);
    
    // Log PM decision making
    console.log(`🎯 PM Agent Decision for ticket ${ticket.id}:`, {
      ticketSubject: ticket.subject,
      recommendedAgent: agentAssignment.agent,
      confidence: agentAssignment.confidence,
      reasoning: agentAssignment.reasoning
    });
    
    return agentAssignment.agent;
  }
  
  /**
   * Enhanced agent assignment logic with confidence scoring
   */
  private determineOptimalAgent(ticket: any, content: string): {
    agent: AgentRole | null;
    confidence: number;
    reasoning: string;
  } {
    const assignments = [
      {
        agent: 'DEVOPS' as AgentRole,
        keywords: ['server', 'deployment', 'infrastructure', 'docker', 'kubernetes', 'aws', 'cloud', 'database', 'performance', 'monitoring'],
        weight: 0.9
      },
      {
        agent: 'SOFTWARE_ENGINEER' as AgentRole,
        keywords: ['api', 'code', 'programming', 'development', 'feature', 'function', 'integration', 'backend', 'frontend'],
        weight: 0.8
      },
      {
        agent: 'WORDPRESS_DEVELOPER' as AgentRole,
        keywords: ['wordpress', 'wp', 'plugin', 'theme', 'cms', 'gutenberg', 'woocommerce'],
        weight: 0.95
      },
      {
        agent: 'QA_TESTER' as AgentRole,
        keywords: ['test', 'testing', 'qa', 'quality', 'bug', 'defect', 'validation', 'verification'],
        weight: 0.85
      },
      {
        agent: 'BUSINESS_ANALYST' as AgentRole,
        keywords: ['requirements', 'analysis', 'business', 'process', 'workflow', 'specification', 'documentation'],
        weight: 0.7
      }
    ];
    
    let bestMatch = { agent: null as AgentRole | null, score: 0, reasoning: '' };
    
    for (const assignment of assignments) {
      const matchCount = assignment.keywords.filter(keyword => content.includes(keyword)).length;
      const score = (matchCount / assignment.keywords.length) * assignment.weight;
      
      if (score > bestMatch.score && score > 0.3) { // Minimum confidence threshold
        bestMatch = {
          agent: assignment.agent,
          score,
          reasoning: `Matched ${matchCount}/${assignment.keywords.length} keywords for ${assignment.agent}`
        };
      }
    }
    
    // If no clear match, PM handles coordination
    if (bestMatch.score < 0.4) {
      bestMatch = {
        agent: null,
        score: 1.0,
        reasoning: 'No clear specialization match - PM will coordinate'
      };
    }
    
    return {
      agent: bestMatch.agent,
      confidence: bestMatch.score,
      reasoning: bestMatch.reasoning
    };
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