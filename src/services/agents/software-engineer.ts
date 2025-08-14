import { BaseAgent } from './base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agents.js';
import { ZendeskTicket } from '../../types/index.js';

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
    const confidence = this.calculateConfidence(ticket);
    
    let analysis = 'Technical Analysis:\n';
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Analyze for different technical issues
    if (this.containsKeywords(content, ['bug', 'error', 'exception', 'crash', 'broken'])) {
      analysis += '• Bug/Error Analysis: Critical issue detected requiring immediate investigation\n';
      recommendedActions.push('Reproduce the issue in development environment');
      recommendedActions.push('Analyze error logs and stack traces');
      recommendedActions.push('Implement fix and create test cases');
      complexity = 'medium';
      estimatedTime = '3-6 hours';
    }

    if (this.containsKeywords(content, ['api', 'integration', 'webhook', 'endpoint'])) {
      analysis += '• API Integration Issue: Requires API analysis and testing\n';
      recommendedActions.push('Test API endpoints and authentication');
      recommendedActions.push('Review API documentation and rate limits');
      recommendedActions.push('Implement proper error handling');
      complexity = 'medium';
    }

    if (this.containsKeywords(content, ['performance', 'slow', 'timeout', 'optimization'])) {
      analysis += '• Performance Issue: Requires optimization and monitoring\n';
      recommendedActions.push('Profile application performance');
      recommendedActions.push('Analyze database queries and indexes');
      recommendedActions.push('Implement caching strategies');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    if (this.containsKeywords(content, ['security', 'vulnerability', 'breach', 'unauthorized'])) {
      analysis += '• Security Issue: Critical security assessment required\n';
      recommendedActions.push('Conduct security audit');
      recommendedActions.push('Review access controls and permissions');
      recommendedActions.push('Implement security patches');
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '6-12 hours';
    }

    if (this.containsKeywords(content, ['database', 'sql', 'query', 'data'])) {
      analysis += '• Database Issue: Requires database analysis and optimization\n';
      recommendedActions.push('Analyze database schema and queries');
      recommendedActions.push('Check data integrity and constraints');
      recommendedActions.push('Optimize database performance');
    }

    if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme'])) {
      analysis += '• WordPress-related technical issue detected\n';
      nextAgent = 'WORDPRESS_DEVELOPER';
      recommendedActions.push('Hand off to WordPress specialist for detailed analysis');
    }

    if (this.containsKeywords(content, ['deploy', 'deployment', 'server', 'infrastructure'])) {
      analysis += '• Infrastructure/Deployment issue detected\n';
      nextAgent = 'DEVOPS';
      recommendedActions.push('Coordinate with DevOps team for infrastructure analysis');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'technical_analysis', analysis, {
      complexity,
      estimatedTime,
      detectedIssues: this.extractTechnicalIssues(content)
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
        result = {
          status: 'completed',
          details: `Software engineering task executed: ${task}`,
          recommendations: [
            'Code review completed',
            'Technical documentation updated',
            'Unit tests implemented'
          ]
        };
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
    const content = context.content?.toLowerCase() || '';
    
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
}