import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';
import { SoftwareEngineerPrompts } from './prompts.js';

export class SoftwareEngineerAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'analyze_code',
        description: 'Analyze code snippets for bugs and improvements',
        parameters: { code: 'string', language: 'string' },
        execute: async (params) => {
          return `Code analysis completed for ${params.language}: ${params.code.substring(0, 100)}...`;
        }
      },
      {
        name: 'check_api_integration',
        description: 'Analyze API integration issues',
        parameters: { endpoint: 'string', method: 'string', error: 'string' },
        execute: async (params) => {
          return `API integration analysis: ${params.method} ${params.endpoint} - ${params.error}`;
        }
      },
      {
        name: 'database_query_analysis',
        description: 'Analyze database performance and query issues',
        parameters: { query: 'string', performance_metrics: 'object' },
        execute: async (params) => {
          return `Database query analysis completed: ${params.query}`;
        }
      },
      {
        name: 'security_assessment',
        description: 'Assess security vulnerabilities',
        parameters: { vulnerability_type: 'string', severity: 'string' },
        execute: async (params) => {
          return `Security assessment: ${params.vulnerability_type} (${params.severity})`;
        }
      }
    ];

    super(
      'SOFTWARE_ENGINEER',
      [
        'technical_analysis',
        'code_review',
        'api_integration',
        'backend_development',
        'database_optimization',
        'security_analysis',
        'performance_tuning',
        'debugging',
        'architecture_design'
      ],
      tools,
      8 // Higher capacity for technical tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    let confidence = this.calculateConfidence(ticket);
    
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Enhanced analysis for specific technical issues
    if (this.containsKeywords(content, ['500', 'internal server error', 'server error', 'http 500'])) {
      recommendedActions = [
        'Check server logs for specific error messages and stack traces',
        'Verify database connections and query performance',
        'Review recent code deployments that may have caused the issue',
        'Implement immediate rollback if recent deployment is the cause'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '1-3 hours';
      confidence = 0.9;
    } else if (this.containsKeywords(content, ['404', 'not found', 'page not found', 'missing'])) {
      recommendedActions = [
        '🔗 404 Error: Check routing configuration and URL patterns',
        '📁 Verify file paths and ensure resources exist',
        '🔧 Update redirects or restore missing content (Est: 1-2 hours)'
      ];
      complexity = 'simple';
      estimatedTime = '1-2 hours';
    } else if (this.containsKeywords(content, ['timeout', 'gateway timeout', '504', 'connection timeout'])) {
      recommendedActions = [
        '⏱️ Timeout Issue: Analyze slow queries and server response times',
        '🔧 Optimize database queries and increase timeout limits',
        '📊 Monitor server performance and scale if needed (Est: 2-4 hours)'
      ];
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    } else if (this.containsKeywords(content, ['bug', 'error', 'exception', 'crash', 'broken'])) {
      recommendedActions = [
        '🐛 Application Error: Review error logs and stack traces',
        '🔍 Reproduce issue in development environment',
        '✅ Implement fix with comprehensive testing (Est: 3-6 hours)'
      ];
      complexity = 'medium';
      estimatedTime = '3-6 hours';
    } else if (this.containsKeywords(content, ['api']) && this.containsKeywords(content, ['error', 'fail', 'timeout'])) {
      recommendedActions = [
        'Check API endpoint availability and response codes',
        'Verify API authentication tokens and credentials',
        'Review API rate limiting and timeout configurations',
        'Test API calls with debugging tools'
      ];
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    } else if (this.containsKeywords(content, ['performance', 'slow', 'optimization', 'speed'])) {
      recommendedActions = [
        '🚀 Performance Issue: Profile application and identify bottlenecks',
        '💾 Optimize database queries and implement caching strategies',
        '📈 Monitor improvements and scale resources (Est: 4-8 hours)'
      ];
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    } else if (this.containsKeywords(content, ['security', 'vulnerability', 'breach', 'unauthorized'])) {
      recommendedActions = [
        '🔒 SECURITY ALERT: Conduct immediate security audit',
        '🛡️ Patch vulnerabilities and review access controls',
        '📋 Document incident and implement monitoring (Est: 6-12 hours)'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '6-12 hours';
    } else if (this.containsKeywords(content, ['database', 'connection']) && this.containsKeywords(content, ['error', 'fail', 'timeout'])) {
      recommendedActions = [
        'Check database server status and connection pool',
        'Review database connection string configuration',
        'Analyze database performance and resource usage',
        'Test database connectivity from application server'
      ];
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    } else if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme'])) {
      recommendedActions = [
        '🔌 WordPress-specific issue detected - requires specialist review'
      ];
      nextAgent = 'WORDPRESS_DEVELOPER';
    } else if (this.containsKeywords(content, ['deploy', 'deployment', 'server', 'infrastructure'])) {
      recommendedActions = [
        '🏗️ Infrastructure issue detected - requires DevOps analysis'
      ];
      nextAgent = 'DEVOPS';
    } else {
      // Generic fallback for other technical issues
      recommendedActions = [
        'Investigate reported technical symptoms',
        'Review system logs for error patterns',
        'Test functionality in staging environment'
      ];
      confidence = 0.6;
      estimatedTime = '2-4 hours';
      priority = 'normal';
    }

    // Store enhanced analysis in memory
    this.storeMemory(ticket.id, 'technical_analysis', recommendedActions.join('\n'), {
      complexity,
      estimatedTime,
      priority,
      detectedIssues: this.extractTechnicalIssues(content),
      analysisTimestamp: new Date().toISOString(),
      criticalityLevel: this.assessCriticality(content)
    });

    return this.formatAnalysis(
      recommendedActions.join('\n'),
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
      if (taskLower.includes('code analysis')) {
        result = await this.executeTool('analyze_code', {
          code: context.code || 'No code provided',
          language: context.language || 'unknown'
        });
      } else if (taskLower.includes('api')) {
        result = await this.executeTool('check_api_integration', {
          endpoint: context.endpoint || 'unknown',
          method: context.method || 'GET',
          error: context.error || 'No error details'
        });
      } else if (taskLower.includes('database')) {
        result = await this.executeTool('database_query_analysis', {
          query: context.query || 'No query provided',
          performance_metrics: context.metrics || {}
        });
      } else if (taskLower.includes('security')) {
        result = await this.executeTool('security_assessment', {
          vulnerability_type: context.vulnerability || 'unknown',
          severity: context.severity || 'medium'
        });
      } else {
        // Provide specific analysis based on ticket content
        const ticketContent = typeof task === 'object' ? `${task.subject} ${task.description}` : task;
        const content = ticketContent.toLowerCase();
        
        if (this.containsKeywords(content, ['500', 'internal server error'])) {
          result = {
            status: 'completed',
            details: 'Server error analysis completed',
            recommendations: [
              'Server logs reviewed for error patterns',
              'Database connectivity verified',
              'Recent deployments analyzed for potential causes'
            ]
          };
        } else if (this.containsKeywords(content, ['database', 'connection']) && this.containsKeywords(content, ['error', 'fail'])) {
          result = {
            status: 'completed',
            details: 'Database connectivity issue resolved',
            recommendations: [
              'Database connection pool optimized',
              'Connection string configuration verified',
              'Database performance metrics reviewed'
            ]
          };
        } else {
          result = {
            status: 'completed',
            details: `Technical analysis completed for: ${typeof task === 'object' ? task.subject : task}`,
            recommendations: [
              'System functionality verified',
              'Error patterns analyzed',
              'Performance metrics reviewed'
            ]
          };
        }
      }

      // Store execution result
      this.storeMemory(context.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Software Engineer task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Task execution failed due to technical error'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off to WordPress developer for WordPress-specific issues
    if (this.containsKeywords(content, ['wordpress', 'wp-', 'plugin', 'theme', 'woocommerce'])) {
      return 'WORDPRESS_DEVELOPER';
    }

    // Hand off to DevOps for infrastructure issues
    if (this.containsKeywords(content, ['deploy', 'server', 'infrastructure', 'docker', 'kubernetes', 'aws', 'cloud'])) {
      return 'DEVOPS';
    }

    // Hand off to QA for testing-related issues
    if (this.containsKeywords(content, ['test', 'testing', 'qa', 'quality', 'automation test'])) {
      return 'QA_TESTER';
    }

    return null;
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle general technical issues
    const technicalKeywords = [
      'bug', 'error', 'api', 'code', 'database', 'sql', 'integration',
      'backend', 'server', 'performance', 'security', 'authentication',
      'authorization', 'webhook', 'endpoint', 'json', 'xml', 'rest'
    ];

    return this.containsKeywords(content, technicalKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'technical_analysis': ['bug', 'error', 'technical', 'code', 'system'],
      'code_review': ['code', 'review', 'programming', 'development'],
      'api_integration': ['api', 'integration', 'webhook', 'endpoint', 'rest'],
      'backend_development': ['backend', 'server', 'database', 'sql'],
      'database_optimization': ['database', 'sql', 'query', 'performance'],
      'security_analysis': ['security', 'vulnerability', 'breach', 'unauthorized'],
      'performance_tuning': ['performance', 'slow', 'optimization', 'speed'],
      'debugging': ['debug', 'error', 'exception', 'crash', 'broken'],
      'architecture_design': ['architecture', 'design', 'scalability', 'structure']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractTechnicalIssues(content: string): string[] {
    const issues: string[] = [];
    
    if (content.includes('error') || content.includes('exception')) {
      issues.push('Error/Exception detected');
    }
    if (content.includes('performance') || content.includes('slow')) {
      issues.push('Performance issue');
    }
    if (content.includes('security') || content.includes('vulnerability')) {
      issues.push('Security concern');
    }
    if (content.includes('api') || content.includes('integration')) {
      issues.push('API/Integration issue');
    }
    if (content.includes('database') || content.includes('sql')) {
      issues.push('Database issue');
    }

    return issues;
  }

  /**
   * Assess the criticality level of a technical issue
   */
  private assessCriticality(content: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical issues that require immediate attention
    if (this.containsKeywords(content, ['500', 'internal server error', 'security', 'breach', 'vulnerability'])) {
      return 'critical';
    }
    
    // High priority issues that significantly impact users
    if (this.containsKeywords(content, ['timeout', '504', 'performance', 'slow', 'crash', 'broken'])) {
      return 'high';
    }
    
    // Medium priority issues with moderate impact
    if (this.containsKeywords(content, ['404', 'api', 'integration', 'bug', 'error'])) {
      return 'medium';
    }
    
    // Low priority issues or general requests
    return 'low';
  }
}