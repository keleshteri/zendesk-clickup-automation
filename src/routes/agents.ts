import { Hono } from 'hono';
import { MultiAgentService } from '../services/multi-agent-service.js';
import { AIService } from '../services/ai.js';
import { AgentRole, ALL_AGENT_ROLES } from '../types/agents.js';
import { ZendeskTicket } from '../types/index.js';
import type { Env } from '../types/index.js';

const agents = new Hono<{ Bindings: Env }>();

/**
 * POST /agents/process-ticket
 * Process a Zendesk ticket using the multi-agent system
 */
agents.post('/process-ticket', async (c) => {
  try {
    const { ticket, context, preferredAgent } = await c.req.json();
    
    if (!ticket) {
      return c.json({ error: 'Ticket data is required' }, 400);
    }

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Process ticket with multi-agent system
    const result = await multiAgentService.processTicketWithAgents(
      ticket as ZendeskTicket,
      context
    );

    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Multi-agent ticket processing failed:', error);
    return c.json({
      error: 'Failed to process ticket with multi-agent system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /agents/analyze-and-create-tasks
 * Analyze ticket and create ClickUp tasks based on agent recommendations
 */
agents.post('/analyze-and-create-tasks', async (c) => {
  try {
    const { ticket, context } = await c.req.json();
    
    if (!ticket) {
      return c.json({ error: 'Ticket data is required' }, 400);
    }

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Analyze and create tasks
    const result = await multiAgentService.analyzeAndCreateTasks(
      ticket.id.toString(),
      context?.listId
    );

    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ticket analysis and task creation failed:', error);
    return c.json({
      error: 'Failed to analyze ticket and create tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /agents/comprehensive-insights
 * Get comprehensive insights combining AI and multi-agent analysis
 */
agents.post('/comprehensive-insights', async (c) => {
  try {
    const { ticket, context } = await c.req.json();
    
    if (!ticket) {
      return c.json({ error: 'Ticket data is required' }, 400);
    }

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Get comprehensive insights
    const result = await multiAgentService.getComprehensiveInsights(
      ticket.id.toString()
    );

    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Comprehensive insights generation failed:', error);
    return c.json({
      error: 'Failed to generate comprehensive insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /agents/route-ticket
 * Route ticket to the most appropriate agent
 */
agents.post('/route-ticket', async (c) => {
  try {
    const { ticket, preferredAgent } = await c.req.json();
    
    if (!ticket) {
      return c.json({ error: 'Ticket data is required' }, 400);
    }

    // Validate preferred agent if provided
    if (preferredAgent && !ALL_AGENT_ROLES.includes(preferredAgent)) {
      return c.json({
        error: 'Invalid preferred agent',
        validAgents: ALL_AGENT_ROLES
      }, 400);
    }

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Route ticket to appropriate agent
    const result = await multiAgentService.routeTicketToAgent(
      ticket as ZendeskTicket,
      preferredAgent as AgentRole
    );

    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ticket routing failed:', error);
    return c.json({
      error: 'Failed to route ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /agents/metrics
 * Get workflow metrics and performance data
 */
agents.get('/metrics', async (c) => {
  try {
    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Get workflow metrics
    const metrics = multiAgentService.getWorkflowMetrics();

    return c.json({
      success: true,
      data: {
        metrics,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to retrieve metrics:', error);
    return c.json({
      error: 'Failed to retrieve workflow metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /agents/status
 * Get status of all agents
 */
agents.get('/status', async (c) => {
  try {
    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Get all agents status
    const agentsStatus = multiAgentService.getAllAgentsStatus();

    return c.json({
      success: true,
      data: {
        agents: agentsStatus,
        totalAgents: agentsStatus.length,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to retrieve agents status:', error);
    return c.json({
      error: 'Failed to retrieve agents status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /agents/status/:role
 * Get status of a specific agent
 */
agents.get('/status/:role', async (c) => {
  try {
    const role = c.req.param('role') as AgentRole;
    
    if (!ALL_AGENT_ROLES.includes(role)) {
      return c.json({
        error: 'Invalid agent role',
        validRoles: ALL_AGENT_ROLES
      }, 400);
    }

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Get specific agent status
    const agentStatus = multiAgentService.getAgentStatus(role);

    if (!agentStatus) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        agent: agentStatus,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to retrieve agent status:', error);
    return c.json({
      error: 'Failed to retrieve agent status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /agents/reset-metrics
 * Reset workflow metrics
 */
agents.post('/reset-metrics', async (c) => {
  try {
    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Reset metrics
    multiAgentService.resetMetrics();

    return c.json({
      success: true,
      message: 'Workflow metrics have been reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to reset metrics:', error);
    return c.json({
      error: 'Failed to reset workflow metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /agents/capabilities
 * Get available agent roles and their capabilities
 */
agents.get('/capabilities', async (c) => {
  try {
    const capabilities = {
      ['PROJECT_MANAGER']: [
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
      ['SOFTWARE_ENGINEER']: [
        'code_analysis',
        'technical_analysis',
        'api_integration',
        'backend_development',
        'database_optimization',
        'security_analysis',
        'performance_tuning',
        'debugging',
        'architecture_design'
      ],
      ['WORDPRESS_DEVELOPER']: [
        'wordpress_development',
        'plugin_development',
        'theme_development',
        'wordpress_security',
        'performance_optimization',
        'woocommerce_development',
        'custom_post_types',
        'wordpress_api',
        'multisite_management'
      ],
      ['DEVOPS']: [
        'infrastructure_management',
        'deployment_automation',
        'monitoring_setup',
        'security_compliance',
        'backup_recovery',
        'performance_monitoring',
        'scalability_planning',
        'disaster_recovery',
        'cloud_management'
      ],
      ['QA_TESTER']: [
        'test_planning',
        'automated_testing',
        'manual_testing',
        'bug_tracking',
        'regression_testing',
        'performance_testing',
        'security_testing',
        'usability_testing',
        'compatibility_testing'
      ],
      ['BUSINESS_ANALYST']: [
        'requirements_analysis',
        'data_analysis',
        'process_optimization',
        'stakeholder_management',
        'business_intelligence',
        'roi_analysis',
        'market_research',
        'strategic_planning',
        'reporting_dashboards'
      ]
    };

    return c.json({
      success: true,
      data: {
        agentCapabilities: capabilities,
        totalAgents: Object.keys(capabilities).length,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to retrieve capabilities:', error);
    return c.json({
      error: 'Failed to retrieve agent capabilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /agents/simulate-workflow
 * Simulate a workflow with sample data for testing
 */
agents.post('/simulate-workflow', async (c) => {
  try {
    const { scenario } = await c.req.json();
    
    // Create sample ticket based on scenario
    const sampleTickets: Record<string, ZendeskTicket> = {
      'wordpress_issue': {
        id: 12345,
        subject: 'WordPress plugin conflict causing site crashes',
        description: 'Our WordPress site is experiencing frequent crashes after installing a new plugin. The error logs show conflicts between plugins and the site becomes unresponsive.',
        status: 'open',
        priority: 'high',
        requester_id: 67890,
        assignee_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['wordpress', 'plugin', 'crash'],
        url: 'https://example.zendesk.com/api/v2/tickets/12345.json',
        raw_subject: 'WordPress plugin conflict causing site crashes'
      },
      'api_integration': {
        id: 12346,
        subject: 'API integration failing with 500 errors',
        description: 'The third-party API integration is returning 500 internal server errors. This is affecting our data synchronization process and causing delays in reporting.',
        status: 'open',
        priority: 'urgent',
        requester_id: 67891,
        assignee_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['api', 'integration', 'error'],
        url: 'https://example.zendesk.com/api/v2/tickets/12346.json',
        raw_subject: 'API integration failing with 500 errors'
      },
      'performance_issue': {
        id: 12347,
        subject: 'Website loading slowly during peak hours',
        description: 'Users are reporting slow page load times during peak traffic hours. The database queries seem to be taking longer than usual and the server response time has increased.',
        status: 'open',
        priority: 'high',
        requester_id: 67892,
        assignee_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['performance', 'database', 'optimization'],
        url: 'https://example.zendesk.com/api/v2/tickets/12347.json',
        raw_subject: 'Website loading slowly during peak hours'
      },
      'project_planning': {
        id: 12348,
        subject: 'New feature development project planning',
        description: 'We need to plan the development of a new user dashboard feature. This includes resource allocation, timeline planning, and coordination between multiple teams.',
        status: 'open',
        priority: 'normal',
        requester_id: 67893,
        assignee_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['project', 'planning', 'feature'],
        url: 'https://example.zendesk.com/api/v2/tickets/12348.json',
        raw_subject: 'New feature development project planning'
      }
    };

    const ticket = sampleTickets[scenario] || sampleTickets['wordpress_issue'];

    // Initialize services
    const aiService = new AIService(c.env);
    const multiAgentService = new MultiAgentService(c.env, aiService, null, null);

    // Process the sample ticket
    const result = await multiAgentService.processTicketWithAgents(ticket, {
      simulation: true,
      scenario
    });

    return c.json({
      success: true,
      data: {
        scenario,
        sampleTicket: ticket,
        workflowResult: result,
        simulationNote: 'This is a simulated workflow for testing purposes'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Workflow simulation failed:', error);
    return c.json({
      error: 'Failed to simulate workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { agents };