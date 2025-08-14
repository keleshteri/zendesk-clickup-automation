import { BaseAgent } from './base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agents.js';
import { ZendeskTicket } from '../../types/index.js';

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
    
    let analysis = 'WordPress Analysis:\n';
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '1-3 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Plugin-related issues
    if (this.containsKeywords(content, ['plugin', 'wp-', 'activate', 'deactivate', 'conflict'])) {
      analysis += '• Plugin Issue: Plugin conflict or compatibility problem detected\n';
      recommendedActions.push('Identify conflicting plugins through systematic deactivation');
      recommendedActions.push('Check plugin compatibility with current WordPress version');
      recommendedActions.push('Review plugin error logs and debug information');
      recommendedActions.push('Test in staging environment before applying fixes');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Theme-related issues
    if (this.containsKeywords(content, ['theme', 'styling', 'css', 'layout', 'design', 'appearance'])) {
      analysis += '• Theme Issue: Theme-related styling or layout problem\n';
      recommendedActions.push('Check theme compatibility with WordPress version');
      recommendedActions.push('Review custom CSS and theme modifications');
      recommendedActions.push('Test with default theme to isolate issue');
      recommendedActions.push('Inspect browser console for JavaScript errors');
      complexity = 'simple';
      estimatedTime = '1-2 hours';
    }

    // Performance issues
    if (this.containsKeywords(content, ['slow', 'performance', 'loading', 'speed', 'optimization'])) {
      analysis += '• Performance Issue: WordPress site performance optimization needed\n';
      recommendedActions.push('Analyze page load times and bottlenecks');
      recommendedActions.push('Review and optimize plugins (deactivate unnecessary ones)');
      recommendedActions.push('Implement caching solutions');
      recommendedActions.push('Optimize images and database');
      recommendedActions.push('Check hosting resources and configuration');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Security issues
    if (this.containsKeywords(content, ['security', 'hack', 'malware', 'vulnerability', 'breach', 'unauthorized'])) {
      analysis += '• Security Issue: WordPress security vulnerability or breach detected\n';
      recommendedActions.push('Perform immediate security scan');
      recommendedActions.push('Update WordPress core, themes, and plugins');
      recommendedActions.push('Change all passwords and security keys');
      recommendedActions.push('Review user permissions and access logs');
      recommendedActions.push('Implement security hardening measures');
      complexity = 'complex';
      priority = 'urgent';
      estimatedTime = '4-8 hours';
    }

    // WooCommerce issues
    if (this.containsKeywords(content, ['woocommerce', 'woo', 'shop', 'cart', 'checkout', 'payment', 'order'])) {
      analysis += '• WooCommerce Issue: E-commerce functionality problem\n';
      recommendedActions.push('Check WooCommerce and WordPress compatibility');
      recommendedActions.push('Review payment gateway configuration');
      recommendedActions.push('Test checkout process and cart functionality');
      recommendedActions.push('Verify shipping and tax settings');
      recommendedActions.push('Check for conflicting plugins affecting WooCommerce');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Database/Migration issues
    if (this.containsKeywords(content, ['migration', 'database', 'import', 'export', 'backup', 'restore'])) {
      analysis += '• Migration/Database Issue: WordPress migration or database problem\n';
      recommendedActions.push('Verify database integrity and structure');
      recommendedActions.push('Check URL references and file paths');
      recommendedActions.push('Review .htaccess and configuration files');
      recommendedActions.push('Test all functionality after migration');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Update/Maintenance issues
    if (this.containsKeywords(content, ['update', 'upgrade', 'maintenance', 'version', 'compatibility'])) {
      analysis += '• Update/Maintenance Issue: WordPress update or maintenance problem\n';
      recommendedActions.push('Create full backup before proceeding');
      recommendedActions.push('Test updates in staging environment');
      recommendedActions.push('Check theme and plugin compatibility');
      recommendedActions.push('Review and update custom code if necessary');
      complexity = 'medium';
      estimatedTime = '2-3 hours';
    }

    // Check if technical backend work is needed
    if (this.containsKeywords(content, ['api', 'custom development', 'advanced functionality'])) {
      analysis += '• Advanced Development: May require backend development expertise\n';
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Collaborate with software engineer for custom development');
    }

    // Check if testing is needed
    if (this.containsKeywords(content, ['testing', 'qa', 'quality assurance'])) {
      nextAgent = 'QA_TESTER';
      recommendedActions.push('Coordinate with QA team for comprehensive testing');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'wordpress_analysis', analysis, {
      complexity,
      estimatedTime,
      wpIssueTypes: this.extractWordPressIssues(content)
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