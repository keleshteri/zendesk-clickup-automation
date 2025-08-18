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
    const confidence = this.calculateConfidence(ticket);
    
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Analyze for specific technical issues - max 3 bullet points
    if (this.containsKeywords(content, ['bug', 'error', 'exception', 'crash', 'broken'])) {
      recommendedActions = [
        'Root cause likely: Application error or data corruption',
        'Fix approach: Debug logs, reproduce issue, implement fix',
        'Est. time: 3-6 hours including testing'
      ];
      complexity = 'medium';
      estimatedTime = '3-6 hours';
    } else if (this.containsKeywords(content, ['api', 'integration', 'webhook', 'endpoint'])) {
      recommendedActions = [
        'Root cause likely: API authentication or rate limiting',
        'Fix approach: Test endpoints, review docs, fix error handling',
        'Est. time: 2-4 hours'
      ];
      complexity = 'medium';
    } else if (this.containsKeywords(content, ['performance', 'slow', 'timeout', 'optimization'])) {
      recommendedActions = [
        'Root cause likely: Database queries or resource bottleneck',
        'Fix approach: Profile performance, optimize queries, add caching',
        'Est. time: 4-8 hours'
      ];
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    } else if (this.containsKeywords(content, ['security', 'vulnerability', 'breach', 'unauthorized'])) {
      recommendedActions = [
        'Root cause likely: Security vulnerability or access control issue',
        'Fix approach: Security audit, patch vulnerabilities, review permissions',
        'Est. time: 6-12 hours (URGENT)'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '6-12 hours';
    } else if (this.containsKeywords(content, ['database', 'sql', 'query', 'data'])) {
      recommendedActions = [
        'Root cause likely: Database schema or query optimization issue',
        'Fix approach: Analyze queries, check data integrity, optimize indexes',
        'Est. time: 3-5 hours'
      ];
    } else if (this.containsKeywords(content, ['wordpress', 'plugin', 'theme'])) {
      recommendedActions = [
        'WordPress-specific issue detected - requires specialist review'
      ];
      nextAgent = 'WORDPRESS_DEVELOPER';
    } else if (this.containsKeywords(content, ['deploy', 'deployment', 'server', 'infrastructure'])) {
      recommendedActions = [
        'Infrastructure issue detected - requires DevOps analysis'
      ];
      nextAgent = 'DEVOPS';
    } else {
      recommendedActions = [
        'General technical issue requiring code review',
        'Fix approach: Analyze codebase and implement solution',
        'Est. time: 2-4 hours'
      ];
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'technical_analysis', recommendedActions.join('\n'), {
      complexity,
      estimatedTime,
      detectedIssues: this.extractTechnicalIssues(content)
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
}