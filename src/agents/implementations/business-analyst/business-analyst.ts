import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';

export class BusinessAnalystAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'requirements_analysis',
        description: 'Analyze business requirements and acceptance criteria',
        parameters: { requirement: 'string', stakeholders: 'array', priority: 'string' },
        execute: async (params) => {
          return `Requirements analysis: ${params.requirement} for stakeholders: ${params.stakeholders.join(', ')} (Priority: ${params.priority})`;
        }
      },
      {
        name: 'data_analysis',
        description: 'Perform data analysis and generate insights',
        parameters: { data_source: 'string', metrics: 'array', time_period: 'string' },
        execute: async (params) => {
          return `Data analysis from ${params.data_source}: ${params.metrics.join(', ')} over ${params.time_period}`;
        }
      },
      {
        name: 'process_optimization',
        description: 'Analyze and optimize business processes',
        parameters: { process: 'string', current_state: 'string', improvement_areas: 'array' },
        execute: async (params) => {
          return `Process optimization for ${params.process}: Current state - ${params.current_state}. Improvements: ${params.improvement_areas.join(', ')}`;
        }
      },
      {
        name: 'roi_analysis',
        description: 'Calculate return on investment and cost-benefit analysis',
        parameters: { investment: 'number', expected_benefits: 'array', timeframe: 'string' },
        execute: async (params) => {
          return `ROI analysis: Investment $${params.investment}, Benefits: ${params.expected_benefits.join(', ')} over ${params.timeframe}`;
        }
      },
      {
        name: 'stakeholder_impact_assessment',
        description: 'Assess impact on different stakeholders',
        parameters: { change: 'string', stakeholders: 'array', impact_level: 'string' },
        execute: async (params) => {
          return `Stakeholder impact assessment: ${params.change} affects ${params.stakeholders.join(', ')} with ${params.impact_level} impact`;
        }
      },
      {
        name: 'reporting_dashboard',
        description: 'Create business intelligence reports and dashboards',
        parameters: { report_type: 'string', kpis: 'array', audience: 'string' },
        execute: async (params) => {
          return `BI Report: ${params.report_type} tracking ${params.kpis.join(', ')} for ${params.audience}`;
        }
      }
    ];

    super(
      'BUSINESS_ANALYST',
      [
        'requirements_gathering',
        'data_analysis',
        'process_optimization',
        'business_intelligence',
        'stakeholder_management',
        'project_planning',
        'risk_assessment',
        'cost_benefit_analysis',
        'reporting_analytics'
      ],
      tools,
      5 // Moderate capacity for analytical tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    let analysis = 'Business Analysis:\n';
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Requirements and specifications
    if (this.containsKeywords(content, ['requirements', 'specification', 'acceptance criteria', 'user story', 'feature request'])) {
      analysis += '• Requirements Analysis: Business requirements need analysis and documentation\n';
      recommendedActions.push('Gather and document detailed business requirements');
      recommendedActions.push('Define clear acceptance criteria and success metrics');
      recommendedActions.push('Identify stakeholders and their needs');
      recommendedActions.push('Create user stories and use cases');
      recommendedActions.push('Validate requirements with stakeholders');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Data analysis and reporting
    if (this.containsKeywords(content, ['data', 'analytics', 'report', 'dashboard', 'metrics', 'kpi', 'insights'])) {
      analysis += '• Data Analysis: Data analysis and business intelligence needed\n';
      recommendedActions.push('Identify relevant data sources and metrics');
      recommendedActions.push('Perform comprehensive data analysis');
      recommendedActions.push('Create visualizations and dashboards');
      recommendedActions.push('Generate actionable business insights');
      recommendedActions.push('Present findings to stakeholders');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Process improvement
    if (this.containsKeywords(content, ['process', 'workflow', 'optimization', 'efficiency', 'improvement', 'automation'])) {
      analysis += '• Process Optimization: Business process analysis and improvement\n';
      recommendedActions.push('Map current business processes and workflows');
      recommendedActions.push('Identify bottlenecks and inefficiencies');
      recommendedActions.push('Design optimized process flows');
      recommendedActions.push('Calculate potential time and cost savings');
      recommendedActions.push('Create implementation roadmap');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Cost-benefit and ROI analysis
    if (this.containsKeywords(content, ['cost', 'budget', 'roi', 'investment', 'benefit', 'financial', 'revenue'])) {
      analysis += '• Financial Analysis: Cost-benefit and ROI analysis required\n';
      recommendedActions.push('Calculate total cost of ownership (TCO)');
      recommendedActions.push('Identify and quantify expected benefits');
      recommendedActions.push('Perform ROI and payback period analysis');
      recommendedActions.push('Assess financial risks and mitigation strategies');
      recommendedActions.push('Create financial justification report');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Stakeholder management
    if (this.containsKeywords(content, ['stakeholder', 'user', 'customer', 'client', 'team', 'communication'])) {
      analysis += '• Stakeholder Analysis: Stakeholder impact and communication planning\n';
      recommendedActions.push('Identify all affected stakeholders');
      recommendedActions.push('Assess impact levels for each stakeholder group');
      recommendedActions.push('Develop stakeholder communication plan');
      recommendedActions.push('Create change management strategy');
      recommendedActions.push('Schedule stakeholder review sessions');
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Project planning and management
    if (this.containsKeywords(content, ['project', 'timeline', 'milestone', 'deliverable', 'scope', 'planning'])) {
      analysis += '• Project Analysis: Project planning and scope analysis needed\n';
      recommendedActions.push('Define project scope and objectives');
      recommendedActions.push('Create detailed project timeline and milestones');
      recommendedActions.push('Identify project dependencies and risks');
      recommendedActions.push('Allocate resources and assign responsibilities');
      recommendedActions.push('Establish project monitoring and control mechanisms');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Risk assessment
    if (this.containsKeywords(content, ['risk', 'compliance', 'audit', 'governance', 'security', 'regulation'])) {
      analysis += '• Risk Assessment: Business risk analysis and compliance review\n';
      recommendedActions.push('Identify potential business and technical risks');
      recommendedActions.push('Assess risk probability and impact levels');
      recommendedActions.push('Develop risk mitigation strategies');
      recommendedActions.push('Review compliance and regulatory requirements');
      recommendedActions.push('Create risk monitoring and reporting framework');
      complexity = 'complex';
      priority = 'high';
      estimatedTime = '3-5 hours';
    }

    // Integration and system analysis
    if (this.containsKeywords(content, ['integration', 'system', 'api', 'workflow', 'automation', 'zendesk', 'clickup'])) {
      analysis += '• System Integration Analysis: Integration requirements and workflow analysis\n';
      recommendedActions.push('Analyze current system integrations and workflows');
      recommendedActions.push('Identify integration gaps and opportunities');
      recommendedActions.push('Design optimal integration architecture');
      recommendedActions.push('Define data flow and transformation requirements');
      recommendedActions.push('Create integration testing and validation plan');
      complexity = 'complex';
      estimatedTime = '4-6 hours';
    }

    // Performance and quality metrics
    if (this.containsKeywords(content, ['performance', 'quality', 'sla', 'benchmark', 'measurement', 'monitoring'])) {
      analysis += '• Performance Analysis: Performance metrics and quality assessment\n';
      recommendedActions.push('Define key performance indicators (KPIs)');
      recommendedActions.push('Establish baseline measurements and benchmarks');
      recommendedActions.push('Create performance monitoring framework');
      recommendedActions.push('Analyze current performance against targets');
      recommendedActions.push('Recommend performance improvement strategies');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Check if technical implementation is needed
    if (this.containsKeywords(content, ['development', 'coding', 'technical implementation', 'api development'])) {
      analysis += '• Technical Implementation: May require software development expertise\n';
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Collaborate with software engineer for technical implementation');
    }

    // Check if testing and validation is needed
    if (this.containsKeywords(content, ['testing', 'validation', 'qa', 'user acceptance testing'])) {
      nextAgent = 'QA_TESTER';
      recommendedActions.push('Coordinate with QA team for comprehensive testing and validation');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'business_analysis', analysis, {
      complexity,
      estimatedTime,
      analysisTypes: this.extractAnalysisTypes(content)
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

    try {
      if (taskLower.includes('requirements') || taskLower.includes('specification')) {
        result = await this.executeTool('requirements_analysis', {
          requirement: context.requirement || 'General requirement',
          stakeholders: context.stakeholders || ['business users'],
          priority: context.priority || 'medium'
        });
      } else if (taskLower.includes('data') || taskLower.includes('analytics')) {
        result = await this.executeTool('data_analysis', {
          data_source: context.data_source || 'system_data',
          metrics: context.metrics || ['performance', 'usage'],
          time_period: context.time_period || 'last_month'
        });
      } else if (taskLower.includes('process') || taskLower.includes('optimization')) {
        result = await this.executeTool('process_optimization', {
          process: context.process || 'business_process',
          current_state: context.current_state || 'baseline',
          improvement_areas: context.improvement_areas || ['efficiency']
        });
      } else if (taskLower.includes('roi') || taskLower.includes('cost')) {
        result = await this.executeTool('roi_analysis', {
          investment: context.investment || 0,
          expected_benefits: context.expected_benefits || ['cost_savings'],
          timeframe: context.timeframe || '12_months'
        });
      } else if (taskLower.includes('stakeholder') || taskLower.includes('impact')) {
        result = await this.executeTool('stakeholder_impact_assessment', {
          change: context.change || 'system_change',
          stakeholders: context.stakeholders || ['end_users'],
          impact_level: context.impact_level || 'medium'
        });
      } else if (taskLower.includes('report') || taskLower.includes('dashboard')) {
        result = await this.executeTool('reporting_dashboard', {
          report_type: context.report_type || 'performance_report',
          kpis: context.kpis || ['efficiency', 'quality'],
          audience: context.audience || 'management'
        });
      } else {
        result = {
          status: 'completed',
          details: `Business analysis task executed: ${task}`,
          recommendations: [
            'Business requirements analyzed and documented',
            'Stakeholder needs identified and prioritized',
            'Process improvements recommended',
            'ROI and cost-benefit analysis completed'
          ]
        };
      }

      // Store execution result
      this.storeMemory(context.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Business Analyst task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Business analysis task execution failed'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off to Software Engineer for technical implementation
    if (this.containsKeywords(content, ['technical implementation', 'api development', 'system integration', 'database design'])) {
      return 'SOFTWARE_ENGINEER';
    }

    // Hand off to QA for testing and validation
    if (this.containsKeywords(content, ['user acceptance testing', 'validation testing', 'quality assurance'])) {
      return 'QA_TESTER';
    }

    // Hand off to DevOps for infrastructure and deployment
    if (this.containsKeywords(content, ['infrastructure planning', 'deployment strategy', 'scalability analysis'])) {
      return 'DEVOPS';
    }

    // Hand off to WordPress Developer for WordPress-specific business analysis
    if (this.containsKeywords(content, ['wordpress business requirements', 'ecommerce analysis', 'content management'])) {
      return 'WORDPRESS_DEVELOPER';
    }

    return null;
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle business analysis and strategic planning issues
    const businessKeywords = [
      'requirements', 'specification', 'analysis', 'data', 'analytics',
      'report', 'dashboard', 'metrics', 'kpi', 'process', 'workflow',
      'optimization', 'efficiency', 'cost', 'budget', 'roi', 'investment',
      'stakeholder', 'business', 'strategy', 'planning', 'project'
    ];

    return this.containsKeywords(content, businessKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'requirements_gathering': ['requirements', 'specification', 'user story', 'acceptance criteria'],
      'data_analysis': ['data', 'analytics', 'insights', 'metrics'],
      'process_optimization': ['process', 'workflow', 'optimization', 'efficiency'],
      'business_intelligence': ['report', 'dashboard', 'kpi', 'intelligence'],
      'stakeholder_management': ['stakeholder', 'communication', 'management', 'user'],
      'project_planning': ['project', 'planning', 'timeline', 'milestone'],
      'risk_assessment': ['risk', 'compliance', 'audit', 'governance'],
      'cost_benefit_analysis': ['cost', 'benefit', 'roi', 'investment'],
      'reporting_analytics': ['reporting', 'analytics', 'visualization', 'insights']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractAnalysisTypes(content: string): string[] {
    const types: string[] = [];
    
    if (content.includes('requirements') || content.includes('specification')) {
      types.push('Requirements Analysis');
    }
    if (content.includes('data') || content.includes('analytics')) {
      types.push('Data Analysis');
    }
    if (content.includes('process') || content.includes('workflow')) {
      types.push('Process Analysis');
    }
    if (content.includes('cost') || content.includes('roi')) {
      types.push('Financial Analysis');
    }
    if (content.includes('stakeholder') || content.includes('impact')) {
      types.push('Stakeholder Analysis');
    }
    if (content.includes('risk') || content.includes('compliance')) {
      types.push('Risk Analysis');
    }
    if (content.includes('project') || content.includes('planning')) {
      types.push('Project Analysis');
    }
    if (content.includes('performance') || content.includes('quality')) {
      types.push('Performance Analysis');
    }

    return types;
  }
}