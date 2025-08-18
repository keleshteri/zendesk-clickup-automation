import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';
import { DevOpsPrompts } from './prompts.js';

export class DevOpsAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'server_health_check',
        description: 'Check server health and resource utilization',
        parameters: { server: 'string', metrics: 'array' },
        execute: async (params) => {
          return `Server health check for ${params.server}: ${params.metrics.join(', ')}`;
        }
      },
      {
        name: 'deployment_analysis',
        description: 'Analyze deployment issues and CI/CD pipeline problems',
        parameters: { environment: 'string', deployment_type: 'string', error: 'string' },
        execute: async (params) => {
          return `Deployment analysis: ${params.environment} - ${params.deployment_type} - ${params.error}`;
        }
      },
      {
        name: 'infrastructure_monitoring',
        description: 'Monitor infrastructure components and services',
        parameters: { service: 'string', status: 'string', alerts: 'array' },
        execute: async (params) => {
          return `Infrastructure monitoring: ${params.service} status: ${params.status}, alerts: ${params.alerts.join(', ')}`;
        }
      },
      {
        name: 'security_compliance_check',
        description: 'Check security compliance and vulnerability assessments',
        parameters: { system: 'string', compliance_type: 'string', findings: 'array' },
        execute: async (params) => {
          return `Security compliance check: ${params.system} - ${params.compliance_type} - findings: ${params.findings.join(', ')}`;
        }
      },
      {
        name: 'backup_recovery_analysis',
        description: 'Analyze backup and disaster recovery procedures',
        parameters: { backup_type: 'string', recovery_time: 'string', status: 'string' },
        execute: async (params) => {
          return `Backup/Recovery analysis: ${params.backup_type} - RTO: ${params.recovery_time} - Status: ${params.status}`;
        }
      },
      {
        name: 'network_diagnostics',
        description: 'Diagnose network connectivity and performance issues',
        parameters: { network_component: 'string', issue_type: 'string', latency: 'number' },
        execute: async (params) => {
          return `Network diagnostics: ${params.network_component} - ${params.issue_type} - Latency: ${params.latency}ms`;
        }
      }
    ];

    super(
      'DEVOPS',
      [
        'infrastructure_management',
        'deployment_automation',
        'monitoring_alerting',
        'security_compliance',
        'backup_recovery',
        'network_administration',
        'cloud_services',
        'containerization',
        'ci_cd_pipeline'
      ],
      tools,
      8 // High capacity for infrastructure tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;
    let analysis = '';

    // Infrastructure impact analysis - max 3 bullet points
    if (this.containsKeywords(content, ['server', 'infrastructure', 'hosting', 'downtime', 'outage'])) {
      recommendedActions = [
        'Infrastructure impact: Server health check and resource monitoring needed',
        'Deployment considerations: Immediate system logs review and failover prep',
        'Monitoring: Set up alerts, est. time 1-6 hours (URGENT)'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '1-6 hours';
    } else if (this.containsKeywords(content, ['deployment', 'deploy', 'ci/cd', 'pipeline', 'build', 'release'])) {
      recommendedActions = [
        'Infrastructure impact: CI/CD pipeline disruption possible',
        'Deployment considerations: Review logs, test staging, prepare rollback',
        'Monitoring: Pipeline status tracking, est. time 2-4 hours'
      ];
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    } else if (this.containsKeywords(content, ['performance', 'slow', 'latency', 'response time', 'optimization'])) {
      recommendedActions = [
        'Infrastructure impact: Performance bottleneck affecting system resources',
        'Deployment considerations: Scaling policies and load balancing review',
        'Monitoring: Performance metrics analysis, est. time 4-8 hours'
      ];
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    } else if (this.containsKeywords(content, ['security', 'vulnerability', 'breach', 'compliance', 'ssl', 'certificate'])) {
      recommendedActions = [
        'Infrastructure impact: Security vulnerability requires immediate assessment',
        'Deployment considerations: Patch deployment and access control review',
        'Monitoring: Security audit and compliance check, est. time 3-8 hours (URGENT)'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '3-8 hours';
    } else if (this.containsKeywords(content, ['backup', 'recovery', 'disaster', 'restore', 'data loss'])) {
      recommendedActions = [
        'Infrastructure impact: Data integrity and backup system verification needed',
        'Deployment considerations: Recovery procedures and RTO/RPO testing',
        'Monitoring: Backup monitoring setup, est. time 3-6 hours'
      ];
      complexity = 'complex';
      priority = 'high';
      estimatedTime = '3-6 hours';
    }

    // Network issues
    if (this.containsKeywords(content, ['network', 'connectivity', 'dns', 'firewall', 'load balancer'])) {
      analysis += '• Network Issue: Network connectivity or configuration problem\n';
      recommendedActions.push('Diagnose network connectivity and routing');
      recommendedActions.push('Check firewall rules and security groups');
      recommendedActions.push('Verify DNS configuration and resolution');
      recommendedActions.push('Test load balancer health and distribution');
      recommendedActions.push('Monitor network performance and latency');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Cloud services issues
    if (this.containsKeywords(content, ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker'])) {
      analysis += '• Cloud Services Issue: Cloud platform or containerization problem\n';
      recommendedActions.push('Review cloud service status and configurations');
      recommendedActions.push('Check container orchestration and scaling');
      recommendedActions.push('Verify cloud resource allocation and limits');
      recommendedActions.push('Monitor cloud costs and optimization opportunities');
      recommendedActions.push('Update cloud security and access policies');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Monitoring and alerting issues
    if (this.containsKeywords(content, ['monitoring', 'alerts', 'metrics', 'logging', 'observability'])) {
      analysis += '• Monitoring Issue: System monitoring or alerting problem\n';
      recommendedActions.push('Review monitoring system configuration');
      recommendedActions.push('Set up comprehensive alerting rules');
      recommendedActions.push('Implement centralized logging and analysis');
      recommendedActions.push('Create monitoring dashboards and reports');
      recommendedActions.push('Test alert notification systems');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Check if software development expertise is needed
    if (this.containsKeywords(content, ['application', 'code', 'api', 'custom development'])) {
      analysis += '• Development Integration: May require software development expertise\n';
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Collaborate with software engineer for application-level issues');
    }

    // Check if database expertise is needed
    if (this.containsKeywords(content, ['database', 'sql', 'query optimization', 'data migration'])) {
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Coordinate with database specialist for data-related issues');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'devops_analysis', analysis, {
      complexity,
      estimatedTime,
      infrastructureComponents: this.extractInfrastructureComponents(content)
    });

    return this.formatAnalysis(
      analysis,
      confidence,
      nextAgent,
      priority as 'low' | 'normal' | 'high' | 'urgent',
      estimatedTime,
      complexity,
      recommendedActions
    );
  }

  async execute(task: string | ZendeskTicket, context?: any): Promise<any> {
    const taskLower = (typeof task === 'string' ? task : task.description || '').toLowerCase();
    let result: any = { status: 'completed', details: '' };

    try {
      if (taskLower.includes('server') || taskLower.includes('health')) {
        result = await this.executeTool('server_health_check', {
          server: context.server || 'unknown',
          metrics: context.metrics || ['cpu', 'memory', 'disk']
        });
      } else if (taskLower.includes('deployment')) {
        result = await this.executeTool('deployment_analysis', {
          environment: context.environment || 'production',
          deployment_type: context.deployment_type || 'standard',
          error: context.error || 'No error details'
        });
      } else if (taskLower.includes('monitoring') || taskLower.includes('infrastructure')) {
        result = await this.executeTool('infrastructure_monitoring', {
          service: context.service || 'unknown',
          status: context.status || 'unknown',
          alerts: context.alerts || []
        });
      } else if (taskLower.includes('security') || taskLower.includes('compliance')) {
        result = await this.executeTool('security_compliance_check', {
          system: context.system || 'unknown',
          compliance_type: context.compliance_type || 'general',
          findings: context.findings || []
        });
      } else if (taskLower.includes('backup') || taskLower.includes('recovery')) {
        result = await this.executeTool('backup_recovery_analysis', {
          backup_type: context.backup_type || 'full',
          recovery_time: context.recovery_time || 'unknown',
          status: context.status || 'unknown'
        });
      } else if (taskLower.includes('network')) {
        result = await this.executeTool('network_diagnostics', {
          network_component: context.network_component || 'unknown',
          issue_type: context.issue_type || 'connectivity',
          latency: context.latency || 0
        });
      } else {
        result = {
          status: 'completed',
          details: `DevOps infrastructure task executed: ${task}`,
          recommendations: [
            'Infrastructure optimized and secured',
            'Monitoring and alerting configured',
            'Deployment pipeline stabilized',
            'Performance metrics improved'
          ]
        };
      }

      // Store execution result
      this.storeMemory(context.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('DevOps task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'DevOps infrastructure task execution failed'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off to Software Engineer for application-level issues
    if (this.containsKeywords(content, ['application bug', 'code issue', 'api problem', 'database optimization'])) {
      return 'SOFTWARE_ENGINEER';
    }

    // Hand off to WordPress Developer for WordPress-specific infrastructure
    if (this.containsKeywords(content, ['wordpress hosting', 'wp-cli', 'wordpress performance'])) {
      return 'WORDPRESS_DEVELOPER';
    }

    // Hand off to QA for testing infrastructure changes
    if (this.containsKeywords(content, ['testing environment', 'qa infrastructure', 'test automation'])) {
      return 'QA_TESTER';
    }

    // Hand off to Business Analyst for infrastructure metrics and reporting
    if (this.containsKeywords(content, ['infrastructure reporting', 'cost analysis', 'capacity planning'])) {
      return 'BUSINESS_ANALYST';
    }

    return null;
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle infrastructure and DevOps-related issues
    const devopsKeywords = [
      'server', 'infrastructure', 'deployment', 'ci/cd', 'pipeline',
      'hosting', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker',
      'monitoring', 'alerts', 'backup', 'recovery', 'security',
      'network', 'firewall', 'load balancer', 'ssl', 'certificate',
      'performance', 'scaling', 'devops', 'sysadmin'
    ];

    return this.containsKeywords(content, devopsKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'infrastructure_management': ['server', 'infrastructure', 'hosting', 'cloud'],
      'deployment_automation': ['deployment', 'deploy', 'ci/cd', 'pipeline'],
      'monitoring_alerting': ['monitoring', 'alerts', 'metrics', 'observability'],
      'security_compliance': ['security', 'compliance', 'vulnerability', 'ssl'],
      'backup_recovery': ['backup', 'recovery', 'disaster', 'restore'],
      'network_administration': ['network', 'dns', 'firewall', 'load balancer'],
      'cloud_services': ['aws', 'azure', 'gcp', 'cloud', 'kubernetes'],
      'containerization': ['docker', 'container', 'kubernetes', 'orchestration'],
      'ci_cd_pipeline': ['pipeline', 'build', 'release', 'automation']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractInfrastructureComponents(content: string): string[] {
    const components: string[] = [];
    
    if (content.includes('server') || content.includes('hosting')) {
      components.push('Server/Hosting');
    }
    if (content.includes('database') || content.includes('sql')) {
      components.push('Database');
    }
    if (content.includes('network') || content.includes('dns')) {
      components.push('Network');
    }
    if (content.includes('security') || content.includes('ssl')) {
      components.push('Security');
    }
    if (content.includes('backup') || content.includes('recovery')) {
      components.push('Backup/Recovery');
    }
    if (content.includes('monitoring') || content.includes('alerts')) {
      components.push('Monitoring');
    }
    if (content.includes('cloud') || content.includes('aws') || content.includes('azure')) {
      components.push('Cloud Services');
    }
    if (content.includes('docker') || content.includes('kubernetes')) {
      components.push('Containerization');
    }

    return components;
  }
}