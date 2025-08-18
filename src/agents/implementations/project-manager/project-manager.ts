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
    
    // Analyze business impact and coordination needs
    const impactAnalysis = this.assessBusinessImpact(ticket, content);
    const routingDecision = this.determineOptimalAgent(ticket, content);
    
    let analysis = `Business Impact Assessment:\n${impactAnalysis.impact}\n\nCoordination Plan:\n${impactAnalysis.coordination}`;
    
    if (routingDecision.agent) {
      analysis += `\n\nRouting Decision:\n• Assigning to ${routingDecision.agent} for technical analysis\n• Reason: ${routingDecision.reasoning}`;
    }
    
    const recommendedActions = [
      'Assess stakeholder impact and communication needs',
      'Coordinate resource allocation for resolution',
      'Monitor progress and escalate if needed'
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
        keywords: ['api', 'code', 'programming', 'development', 'feature', 'function', 'integration', 'backend', 'frontend', 'error', '500', 'bug', 'crash', 'exception', 'server', 'database'],
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
}