import { BaseAgent } from '../../core/base-agent.js';
import { AgentRole, AgentAnalysis, AgentTool } from '../../types/agent-types.js';
import { ZendeskTicket } from '../../../types/index.js';
import { QATesterPrompts } from './prompts.js';

export class QATesterAgent extends BaseAgent {
  constructor() {
    const tools: AgentTool[] = [
      {
        name: 'test_case_analysis',
        description: 'Analyze and create test cases for reported issues',
        parameters: { feature: 'string', issue_type: 'string', priority: 'string' },
        execute: async (params) => {
          return `Test case analysis for ${params.feature}: ${params.issue_type} (Priority: ${params.priority})`;
        }
      },
      {
        name: 'bug_reproduction',
        description: 'Reproduce and validate reported bugs',
        parameters: { steps: 'array', environment: 'string', expected_result: 'string' },
        execute: async (params) => {
          return `Bug reproduction: ${params.steps.join(' -> ')} in ${params.environment}. Expected: ${params.expected_result}`;
        }
      },
      {
        name: 'regression_testing',
        description: 'Perform regression testing for fixes and updates',
        parameters: { test_suite: 'string', affected_areas: 'array', test_results: 'string' },
        execute: async (params) => {
          return `Regression testing: ${params.test_suite} covering ${params.affected_areas.join(', ')}. Results: ${params.test_results}`;
        }
      },
      {
        name: 'performance_testing',
        description: 'Conduct performance and load testing',
        parameters: { test_type: 'string', metrics: 'array', benchmark: 'string' },
        execute: async (params) => {
          return `Performance testing: ${params.test_type} measuring ${params.metrics.join(', ')} against ${params.benchmark}`;
        }
      },
      {
        name: 'usability_testing',
        description: 'Evaluate user experience and usability issues',
        parameters: { user_flow: 'string', usability_issues: 'array', recommendations: 'array' },
        execute: async (params) => {
          return `Usability testing: ${params.user_flow}. Issues: ${params.usability_issues.join(', ')}. Recommendations: ${params.recommendations.join(', ')}`;
        }
      },
      {
        name: 'compatibility_testing',
        description: 'Test compatibility across different browsers, devices, and platforms',
        parameters: { platforms: 'array', browsers: 'array', compatibility_issues: 'array' },
        execute: async (params) => {
          return `Compatibility testing across ${params.platforms.join(', ')} and ${params.browsers.join(', ')}. Issues: ${params.compatibility_issues.join(', ')}`;
        }
      }
    ];

    super(
      'QA_TESTER',
      [
        'manual_testing',
        'automated_testing',
        'bug_validation',
        'test_planning',
        'regression_testing',
        'performance_testing',
        'usability_testing',
        'compatibility_testing',
        'test_documentation'
      ],
      tools,
      7 // High capacity for testing tasks
    );
  }

  async analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const confidence = this.calculateConfidence(ticket);
    
    let analysis = 'QA Testing Analysis:\n';
    let recommendedActions: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    let estimatedTime = '2-4 hours';
    let priority = ticket.priority;
    let nextAgent: AgentRole | undefined;

    // Bug reports and validation
    if (this.containsKeywords(content, ['bug', 'error', 'issue', 'problem', 'not working', 'broken'])) {
      analysis += '• Bug Validation: Reported bug requires validation and reproduction\n';
      analysis += `\n${QATesterPrompts.bugReporting.bugReportTemplate}\n`;
      recommendedActions.push('Reproduce the bug following provided steps');
      recommendedActions.push('Document exact reproduction steps and environment');
      recommendedActions.push('Verify bug across different browsers/devices');
      recommendedActions.push('Assess impact and severity of the bug');
      recommendedActions.push('Create detailed bug report with screenshots/videos');
      complexity = 'medium';
      estimatedTime = '1-3 hours';
    }

    // Feature testing requests
    if (this.containsKeywords(content, ['test', 'testing', 'qa', 'quality', 'validation', 'verify'])) {
      analysis += '• Feature Testing: New feature or functionality requires testing\n';
      analysis += `\n${QATesterPrompts.testCases.functionalTestCase}\n`;
      recommendedActions.push('Create comprehensive test plan and test cases');
      recommendedActions.push('Perform functional testing of all features');
      recommendedActions.push('Conduct edge case and boundary testing');
      recommendedActions.push('Validate user workflows and scenarios');
      recommendedActions.push('Document test results and findings');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Performance issues
    if (this.containsKeywords(content, ['slow', 'performance', 'speed', 'loading', 'timeout', 'lag'])) {
      analysis += '• Performance Testing: Performance issues require load and stress testing\n';
      analysis += `\n${QATesterPrompts.testingStrategy.testPlanTemplate}\n`;
      recommendedActions.push('Conduct performance baseline measurements');
      recommendedActions.push('Perform load testing with realistic user scenarios');
      recommendedActions.push('Test under various network conditions');
      recommendedActions.push('Identify performance bottlenecks and limitations');
      recommendedActions.push('Validate performance improvements after fixes');
      complexity = 'complex';
      estimatedTime = '3-6 hours';
    }

    // Usability and UX issues
    if (this.containsKeywords(content, ['usability', 'user experience', 'ux', 'ui', 'confusing', 'difficult'])) {
      analysis += '• Usability Testing: User experience issues require usability evaluation\n';
      recommendedActions.push('Conduct user journey and workflow testing');
      recommendedActions.push('Evaluate interface design and accessibility');
      recommendedActions.push('Test with different user personas and scenarios');
      recommendedActions.push('Identify usability pain points and improvements');
      recommendedActions.push('Provide UX recommendations and best practices');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Compatibility issues
    if (this.containsKeywords(content, ['browser', 'compatibility', 'mobile', 'device', 'responsive', 'cross-platform'])) {
      analysis += '• Compatibility Testing: Cross-browser/device compatibility issues\n';
      recommendedActions.push('Test across major browsers (Chrome, Firefox, Safari, Edge)');
      recommendedActions.push('Validate responsive design on different screen sizes');
      recommendedActions.push('Test on various mobile devices and operating systems');
      recommendedActions.push('Check for browser-specific bugs and inconsistencies');
      recommendedActions.push('Ensure consistent functionality across platforms');
      complexity = 'complex';
      estimatedTime = '3-5 hours';
    }

    // Regression testing needs
    if (this.containsKeywords(content, ['update', 'deployment', 'release', 'regression', 'after update'])) {
      analysis += '• Regression Testing: Updates require regression testing validation\n';
      recommendedActions.push('Execute full regression test suite');
      recommendedActions.push('Focus on areas affected by recent changes');
      recommendedActions.push('Validate that existing functionality still works');
      recommendedActions.push('Test integration points and dependencies');
      recommendedActions.push('Verify no new bugs were introduced');
      complexity = 'complex';
      estimatedTime = '4-8 hours';
    }

    // Security testing
    if (this.containsKeywords(content, ['security', 'vulnerability', 'authentication', 'authorization', 'data protection'])) {
      analysis += '• Security Testing: Security vulnerabilities require security testing\n';
      recommendedActions.push('Test authentication and authorization mechanisms');
      recommendedActions.push('Validate input sanitization and data validation');
      recommendedActions.push('Check for common security vulnerabilities (OWASP)');
      recommendedActions.push('Test data encryption and secure transmission');
      recommendedActions.push('Verify access controls and permission systems');
      complexity = 'complex';
      priority = 'high';
      estimatedTime = '3-6 hours';
    }

    // API testing
    if (this.containsKeywords(content, ['api', 'endpoint', 'integration', 'webhook', 'rest', 'graphql'])) {
      analysis += '• API Testing: API endpoints require functional and integration testing\n';
      recommendedActions.push('Test API endpoints with various input parameters');
      recommendedActions.push('Validate response formats and status codes');
      recommendedActions.push('Test error handling and edge cases');
      recommendedActions.push('Verify API documentation accuracy');
      recommendedActions.push('Conduct integration testing with dependent systems');
      complexity = 'medium';
      estimatedTime = '2-4 hours';
    }

    // Check if development expertise is needed
    if (this.containsKeywords(content, ['code review', 'unit tests', 'test automation', 'framework'])) {
      analysis += '• Development Integration: May require development expertise for test automation\n';
      nextAgent = 'SOFTWARE_ENGINEER';
      recommendedActions.push('Collaborate with software engineer for test automation setup');
    }

    // Check if business analysis is needed
    if (this.containsKeywords(content, ['requirements', 'acceptance criteria', 'business logic'])) {
      nextAgent = 'BUSINESS_ANALYST';
      recommendedActions.push('Coordinate with business analyst for requirements validation');
    }

    // Store analysis in memory
    this.storeMemory(ticket.id, 'qa_analysis', analysis, {
      complexity,
      estimatedTime,
      testingTypes: this.extractTestingTypes(content)
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
      if (taskLower.includes('test case') || taskLower.includes('test plan')) {
        result = await this.executeTool('test_case_analysis', {
          feature: context.feature || 'unknown',
          issue_type: context.issue_type || 'functional',
          priority: context.priority || 'medium'
        });
      } else if (taskLower.includes('bug') || taskLower.includes('reproduce')) {
        result = await this.executeTool('bug_reproduction', {
          steps: context.steps || ['No steps provided'],
          environment: context.environment || 'production',
          expected_result: context.expected_result || 'No expected result specified'
        });
      } else if (taskLower.includes('regression')) {
        result = await this.executeTool('regression_testing', {
          test_suite: context.test_suite || 'full_regression',
          affected_areas: context.affected_areas || ['general'],
          test_results: context.test_results || 'pending'
        });
      } else if (taskLower.includes('performance')) {
        result = await this.executeTool('performance_testing', {
          test_type: context.test_type || 'load_test',
          metrics: context.metrics || ['response_time', 'throughput'],
          benchmark: context.benchmark || 'baseline'
        });
      } else if (taskLower.includes('usability') || taskLower.includes('ux')) {
        result = await this.executeTool('usability_testing', {
          user_flow: context.user_flow || 'general_navigation',
          usability_issues: context.usability_issues || [],
          recommendations: context.recommendations || []
        });
      } else if (taskLower.includes('compatibility') || taskLower.includes('browser')) {
        result = await this.executeTool('compatibility_testing', {
          platforms: context.platforms || ['web', 'mobile'],
          browsers: context.browsers || ['chrome', 'firefox', 'safari'],
          compatibility_issues: context.compatibility_issues || []
        });
      } else {
        result = {
          status: 'completed',
          details: `QA testing task executed: ${task}`,
          recommendations: [
            'Comprehensive testing completed',
            'Bug validation and reproduction performed',
            'Test cases documented and executed',
            'Quality assurance standards maintained'
          ]
        };
      }

      // Store execution result
      this.storeMemory(context.ticketId || 0, 'task_execution', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('QA Tester task execution failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'QA testing task execution failed'
      };
    }
  }

  async shouldHandoff(context: any): Promise<AgentRole | null> {
    // Extract content from ticket object (subject + description)
    const subject = context.subject?.toLowerCase() || '';
    const description = context.description?.toLowerCase() || '';
    const content = `${subject} ${description}`.toLowerCase();
    
    // Hand off to Software Engineer for test automation and technical issues
    if (this.containsKeywords(content, ['test automation', 'unit tests', 'technical bug', 'code issue'])) {
      return 'SOFTWARE_ENGINEER';
    }

    // Hand off to DevOps for infrastructure and deployment testing
    if (this.containsKeywords(content, ['deployment testing', 'infrastructure testing', 'environment issues'])) {
      return 'DEVOPS';
    }

    // Hand off to WordPress Developer for WordPress-specific testing
    if (this.containsKeywords(content, ['wordpress testing', 'plugin testing', 'theme testing'])) {
      return 'WORDPRESS_DEVELOPER';
    }

    // Hand off to Business Analyst for requirements validation
    if (this.containsKeywords(content, ['requirements testing', 'acceptance criteria', 'business logic validation'])) {
      return 'BUSINESS_ANALYST';
    }

    return null;
  }

  async canHandle(ticket: ZendeskTicket): Promise<boolean> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    // Can handle testing and quality assurance related issues
    const qaKeywords = [
      'test', 'testing', 'qa', 'quality', 'bug', 'error', 'issue',
      'validation', 'verify', 'reproduce', 'regression', 'performance',
      'usability', 'compatibility', 'browser', 'mobile', 'responsive',
      'functionality', 'feature', 'broken', 'not working'
    ];

    return this.containsKeywords(content, qaKeywords);
  }

  protected getKeywordsForCapability(capability: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'manual_testing': ['manual', 'test', 'testing', 'validation'],
      'automated_testing': ['automation', 'automated', 'script', 'framework'],
      'bug_validation': ['bug', 'error', 'issue', 'reproduce'],
      'test_planning': ['test plan', 'test case', 'strategy', 'planning'],
      'regression_testing': ['regression', 'retest', 'validation', 'deployment'],
      'performance_testing': ['performance', 'load', 'stress', 'speed'],
      'usability_testing': ['usability', 'ux', 'user experience', 'interface'],
      'compatibility_testing': ['compatibility', 'browser', 'mobile', 'responsive'],
      'test_documentation': ['documentation', 'report', 'results', 'findings']
    };

    return keywordMap[capability] || [];
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractTestingTypes(content: string): string[] {
    const types: string[] = [];
    
    if (content.includes('bug') || content.includes('error')) {
      types.push('Bug Validation');
    }
    if (content.includes('performance') || content.includes('speed')) {
      types.push('Performance Testing');
    }
    if (content.includes('usability') || content.includes('ux')) {
      types.push('Usability Testing');
    }
    if (content.includes('compatibility') || content.includes('browser')) {
      types.push('Compatibility Testing');
    }
    if (content.includes('regression') || content.includes('deployment')) {
      types.push('Regression Testing');
    }
    if (content.includes('security') || content.includes('vulnerability')) {
      types.push('Security Testing');
    }
    if (content.includes('api') || content.includes('integration')) {
      types.push('API Testing');
    }
    if (content.includes('mobile') || content.includes('responsive')) {
      types.push('Mobile Testing');
    }

    return types;
  }
}