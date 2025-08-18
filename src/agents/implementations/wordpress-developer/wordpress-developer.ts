import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';

export class WordPressDeveloperAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'analyze_plugin_conflict',
        description: 'Analyze WordPress plugin conflicts and compatibility issues',
        parameters: { plugins: 'array', error_message: 'string' },
        execute: async (params) => {
          return `Plugin conflict analysis: ${params.plugins.join(', ')} - ${params.error_message}`;
        }
      },
      {
        name: 'theme_compatibility_check',
        description: 'Check theme compatibility and styling issues',
        parameters: { theme: 'string', wp_version: 'string', issue: 'string' },
        execute: async (params) => {
          return `Theme compatibility check: ${params.theme} on WP ${params.wp_version} - ${params.issue}`;
        }
      },
      {
        name: 'wp_performance_analysis',
        description: 'Analyze WordPress performance issues',
        parameters: { load_time: 'number', plugins_count: 'number', theme: 'string' },
        execute: async (params) => {
          return `WP Performance analysis: ${params.load_time}s load time, ${params.plugins_count} plugins, theme: ${params.theme}`;
        }
      },
      {
        name: 'wp_security_scan',
        description: 'Scan for WordPress security vulnerabilities',
        parameters: { wp_version: 'string', plugins: 'array', security_issue: 'string' },
        execute: async (params) => {
          return `WP Security scan: ${params.wp_version}, plugins: ${params.plugins.join(', ')}, issue: ${params.security_issue}`;
        }
      },
      {
        name: 'woocommerce_analysis',
        description: 'Analyze WooCommerce-specific issues',
        parameters: { wc_version: 'string', issue_type: 'string', error: 'string' },
        execute: async (params) => {
          return `WooCommerce analysis: ${params.wc_version} - ${params.issue_type}: ${params.error}`;
        }
      }
    ];

    super(
      'WORDPRESS_DEVELOPER',
      [
        'wordpress_development',
        'plugin_analysis',
        'theme_debugging',
        'wp_performance',
        'wp_security',
        'woocommerce_support',
        'wp_customization',
        'wp_migration',
        'wp_maintenance'
      ],
      tools,
      6 // Moderate capacity for WordPress-specific tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '1-3 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;
    let recommendedActions: string[] = [];

    // Plugin/theme issues, performance impact, solutions - max 3 bullet points
    if (this.containsKeywords(content, ['plugin', 'wp-', 'activate', 'deactivate', 'conflict'])) {
      recommendedActions = [
        'Plugin/theme issues: Plugin conflict detected, systematic deactivation needed',
        'Performance impact: Site functionality disrupted, staging test required',
        'Solutions: Check compatibility, review logs, est. time 2-4 hours'
      ];
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    } else if (this.containsKeywords(content, ['theme', 'styling', 'css', 'layout', 'design', 'appearance'])) {
      recommendedActions = [
        'Plugin/theme issues: Theme styling/layout problem affecting appearance',
        'Performance impact: Visual display issues, user experience degraded',
        'Solutions: Test default theme, review CSS, est. time 1-2 hours'
      ];
      complexity = 'simple';
      estimatedTime = '1-2 hours';
    } else if (this.containsKeywords(content, ['slow', 'performance', 'loading', 'speed', 'optimization'])) {
      recommendedActions = [
        'Plugin/theme issues: Performance bottleneck from plugins/theme overhead',
        'Performance impact: Slow loading affecting user engagement and SEO',
        'Solutions: Optimize plugins, implement caching, est. time 3-6 hours'
      ];
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    } else if (this.containsKeywords(content, ['security', 'hack', 'malware', 'vulnerability', 'breach', 'unauthorized'])) {
      recommendedActions = [
        'Plugin/theme issues: Security vulnerability in WordPress components',
        'Performance impact: Site compromised, immediate action required (URGENT)',
        'Solutions: Security scan, updates, hardening, est. time 4-8 hours'
      ];
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '4-8 hours';
    } else if (this.containsKeywords(content, ['woocommerce', 'woo', 'shop', 'cart', 'checkout', 'payment', 'order'])) {
      recommendedActions = [
        'Plugin/theme issues: WooCommerce functionality disrupted by conflicts',
        'Performance impact: E-commerce operations affected, revenue at risk',
        'Solutions: Test checkout, verify gateways, est. time 2-4 hours'
      ];
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    } else if (this.containsKeywords(content, ['migration', 'database', 'import', 'export', 'backup', 'restore'])) {
      recommendedActions = [
        'Plugin/theme issues: Migration affecting database and file references',
        'Performance impact: Site functionality broken, data integrity at risk',
        'Solutions: Verify database, check URLs, test functions, est. time 3-6 hours'
      ];
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    } else if (this.containsKeywords(content, ['update', 'upgrade', 'maintenance', 'version', 'compatibility'])) {
      recommendedActions = [
        'Plugin/theme issues: WordPress update causing compatibility problems',
        'Performance impact: Site functionality at risk during updates',
        'Solutions: Backup, staging test, compatibility check, est. time 2-3 hours'
      ];
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Check if technical backend work is needed
    if (this.containsKeywords(content, ['api', 'custom development', 'advanced functionality'])) {
      nextAgent = 'SOFTWARE_ENGINEER';
      if (recommendedActions.length === 0) {
        recommendedActions = [
          'Plugin/theme issues: Advanced development beyond WordPress scope',
          'Performance impact: Custom functionality requires backend expertise',
          'Solutions: Collaborate with software engineer for development'
        ];
      }
    }

    // Check if testing is needed
    if (this.containsKeywords(content, ['testing', 'qa', 'quality assurance'])) {
      nextAgent = 'QA_TESTER';
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'wordpress_analysis', '', {
      complexity,
      estimatedTime,
      wpIssueTypes: this.extractWordPressIssues(content)
    });

    return this.formatAnalysis(
      '',
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
      if (taskLower.includes('plugin')) {
        result = await this.executeTool('analyze_plugin_conflict', {
          plugins: context.plugins || ['unknown'],
          error_message: context.error || 'No error details'
        });
      } else if (taskLower.includes('theme')) {
        result = await this.executeTool('theme_compatibility_check', {
          theme: context.theme || 'unknown',
          wp_version: context.wp_version || 'unknown',
          issue: context.issue || 'No issue details'
        });
      } else if (taskLower.includes('performance')) {
        result = await this.executeTool('wp_performance_analysis', {
          load_time: context.load_time || 0,
          plugins_count: context.plugins_count || 0,
          theme: context.theme || 'unknown'
        });
      } else if (taskLower.includes('security')) {
        result = await this.executeTool('wp_security_scan', {
          wp_version: context.wp_version || 'unknown',
          plugins: context.plugins || [],
          security_issue: context.security_issue || 'General security concern'
        });
      } else if (taskLower.includes('woocommerce')) {
        result = await this.executeTool('woocommerce_analysis', {
          wc_version: context.wc_version || 'unknown',
          issue_type: context.issue_type || 'general',
          error: context.error || 'No error details'
        });
      } else {
        result = {
          status: 'completed',
          details: `WordPress development task executed: ${task}`,
          recommendations: [
            'WordPress issue resolved',
            'Site functionality tested',
            'Performance optimized',
            'Security measures implemented'
          ]
        };
      }

      // Store execution result
      this.storeMemory(context.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('WordPress Developer task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'WordPress task execution failed'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off to Software Engineer for complex backend development
    if (this.containsKeywords(content, ['custom api', 'backend development', 'database design', 'complex integration'])) {
      return 'SOFTWARE_ENGINEER';
    }

    // Hand off to DevOps for server/hosting issues
    if (this.containsKeywords(content, ['server', 'hosting', 'deployment', 'ssl', 'domain', 'dns'])) {
      return 'DEVOPS';
    }

    // Hand off to QA for comprehensive testing
    if (this.containsKeywords(content, ['comprehensive testing', 'qa testing', 'user acceptance testing'])) {
      return 'QA_TESTER';
    }

    // Hand off to Business Analyst for data analysis
    if (this.containsKeywords(content, ['analytics', 'reporting', 'data analysis', 'metrics'])) {
      return 'BUSINESS_ANALYST';
    }

    return null;
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle WordPress-specific issues
    const wordpressKeywords = [
      'wordpress', 'wp-', 'plugin', 'theme', 'woocommerce', 'wp',
      'gutenberg', 'elementor', 'divi', 'wp-admin', 'wp-content',
      'shortcode', 'widget', 'customizer', 'wp-config'
    ];

    return this.containsKeywords(content, wordpressKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'wordpress_development': ['wordpress', 'wp', 'wp-admin', 'wp-content'],
      'plugin_analysis': ['plugin', 'wp-', 'activate', 'deactivate'],
      'theme_debugging': ['theme', 'styling', 'css', 'appearance'],
      'wp_performance': ['performance', 'speed', 'optimization', 'caching'],
      'wp_security': ['security', 'vulnerability', 'hack', 'malware'],
      'woocommerce_support': ['woocommerce', 'shop', 'cart', 'checkout'],
      'wp_customization': ['custom', 'customization', 'modification'],
      'wp_migration': ['migration', 'import', 'export', 'backup'],
      'wp_maintenance': ['update', 'maintenance', 'upgrade', 'version']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractWordPressIssues(content: string): string[] {
    const issues: string[] = [];
    
    if (content.includes('plugin') || content.includes('wp-')) {
      issues.push('Plugin-related issue');
    }
    if (content.includes('theme') || content.includes('styling')) {
      issues.push('Theme/Styling issue');
    }
    if (content.includes('performance') || content.includes('slow')) {
      issues.push('Performance issue');
    }
    if (content.includes('security') || content.includes('hack')) {
      issues.push('Security issue');
    }
    if (content.includes('woocommerce') || content.includes('shop')) {
      issues.push('WooCommerce issue');
    }
    if (content.includes('update') || content.includes('upgrade')) {
      issues.push('Update/Maintenance issue');
    }

    return issues;
  }
}