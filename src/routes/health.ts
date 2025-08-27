/**
 * @ai-metadata
 * @component: HealthRoutes
 * @description: Health check and system status endpoints
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/health-routes.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono", "../middleware/error.ts"]
 * @tests: ["./tests/routes/health.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Health check endpoints for monitoring and service status"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { publicCORSMiddleware } from '../middleware/cors';
import { handleAsync } from '../middleware/error';

/**
 * Health check response interface
 */
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
  services?: ServiceStatus[];
  checks?: HealthCheck[];
}

/**
 * Service status interface
 */
interface ServiceStatus {
  name: string;
  status: 'available' | 'unavailable' | 'degraded';
  configured: boolean;
  lastCheck?: string;
  responseTime?: number;
  error?: string;
}

/**
 * Health check interface
 */
interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  output?: string;
  error?: string;
}

/**
 * Create health routes
 */
export const healthRoutes = new Hono<{ Bindings: Env }>();

// Apply public CORS to all health endpoints
healthRoutes.use('*', publicCORSMiddleware);

/**
 * Basic health check endpoint
 * GET /health
 */
healthRoutes.get('/', async (c) => {
  const _startTime = Date.now();
  
  return handleAsync(async () => {
    const services = c.get('services');
    const uptime = process.uptime ? process.uptime() : 0;
    
    // Quick service availability check
    const serviceStatuses: ServiceStatus[] = [
      {
        name: 'slack',
        status: services.slack ? 'available' : 'unavailable',
        configured: !!c.env.SLACK_BOT_TOKEN
      },
      {
        name: 'zendesk',
        status: services.zendesk ? 'available' : 'unavailable',
        configured: !!(c.env.ZENDESK_SUBDOMAIN && c.env.ZENDESK_EMAIL && c.env.ZENDESK_TOKEN)
      },
      {
        name: 'clickup',
        status: services.clickup ? 'available' : 'unavailable',
        configured: !!c.env.CLICKUP_API_TOKEN
      },
      {
        name: 'ai',
        status: services.ai ? 'available' : 'unavailable',
        configured: !!c.env.OPENAI_API_KEY
      },
      {
        name: 'oauth',
        status: services.oauth ? 'available' : 'unavailable',
        configured: !!(c.env.CLICKUP_CLIENT_ID && c.env.CLICKUP_CLIENT_SECRET)
      },
  
    ];
    
    // Determine overall status
    const criticalServices = ['slack', 'zendesk', 'clickup', 'ai'];
    const criticalStatuses = serviceStatuses.filter(s => criticalServices.includes(s.name));
    const availableCritical = criticalStatuses.filter(s => s.status === 'available').length;
    const totalCritical = criticalStatuses.length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (availableCritical === totalCritical) {
      overallStatus = 'healthy';
    } else if (availableCritical > totalCritical / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: c.env.APP_VERSION || '1.0.0',
      environment: c.env.NODE_ENV || 'development',
      services: serviceStatuses
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    return c.json(response, statusCode);
  }, 'Health check failed');
});

/**
 * Detailed health check endpoint with service testing
 * GET /health/detailed
 */
healthRoutes.get('/detailed', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    const uptime = process.uptime ? process.uptime() : 0;
    const checks: HealthCheck[] = [];
    
    // Test each service with actual API calls
    const serviceStatuses: ServiceStatus[] = [];
    
    // Test Slack service
    if (services.slack) {
      const slackCheck = await testService('slack', async () => {
        const healthStatus = await services.slack!.getHealthStatus();
        return { status: 'ok', slack: healthStatus };
      });
      checks.push(slackCheck);
      serviceStatuses.push({
        name: 'slack',
        status: slackCheck.status === 'pass' ? 'available' : 'degraded',
        configured: true,
        lastCheck: new Date().toISOString(),
        responseTime: slackCheck.duration,
        error: slackCheck.error
      });
    } else {
      serviceStatuses.push({
        name: 'slack',
        status: 'unavailable',
        configured: !!c.env.SLACK_BOT_TOKEN
      });
    }
    
    // Test Zendesk service
    if (services.zendesk) {
      const zendeskCheck = await testService('zendesk', async () => {
        return await services.zendesk!.testConnection();
      });
      checks.push(zendeskCheck);
      serviceStatuses.push({
        name: 'zendesk',
        status: zendeskCheck.status === 'pass' ? 'available' : 'degraded',
        configured: true,
        lastCheck: new Date().toISOString(),
        responseTime: zendeskCheck.duration,
        error: zendeskCheck.error
      });
    } else {
      serviceStatuses.push({
        name: 'zendesk',
        status: 'unavailable',
        configured: !!(c.env.ZENDESK_SUBDOMAIN && c.env.ZENDESK_EMAIL && c.env.ZENDESK_TOKEN)
      });
    }
    
    // Test ClickUp service
    if (services.clickup) {
      const clickupCheck = await testService('clickup', async () => {
        return await services.clickup!.getCurrentUser();
      });
      checks.push(clickupCheck);
      serviceStatuses.push({
        name: 'clickup',
        status: clickupCheck.status === 'pass' ? 'available' : 'degraded',
        configured: true,
        lastCheck: new Date().toISOString(),
        responseTime: clickupCheck.duration,
        error: clickupCheck.error
      });
    } else {
      serviceStatuses.push({
        name: 'clickup',
        status: 'unavailable',
        configured: !!c.env.CLICKUP_API_TOKEN
      });
    }
    
    // Test AI service
    if (services.ai) {
      const aiCheck = await testService('ai', async () => {
        return await services.ai!.testConnection();
      });
      checks.push(aiCheck);
      serviceStatuses.push({
        name: 'ai',
        status: aiCheck.status === 'pass' ? 'available' : 'degraded',
        configured: true,
        lastCheck: new Date().toISOString(),
        responseTime: aiCheck.duration,
        error: aiCheck.error
      });
    } else {
      serviceStatuses.push({
        name: 'ai',
        status: 'unavailable',
        configured: !!c.env.OPENAI_API_KEY
      });
    }
    
    // Add other services without detailed testing
    serviceStatuses.push(
      {
        name: 'oauth',
        status: services.oauth ? 'available' : 'unavailable',
        configured: !!(c.env.CLICKUP_CLIENT_ID && c.env.CLICKUP_CLIENT_SECRET)
      }

    );
    
    // Determine overall status based on checks
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const totalChecks = checks.length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (totalChecks === 0) {
      overallStatus = 'degraded'; // No services to test
    } else if (passedChecks === totalChecks) {
      overallStatus = 'healthy';
    } else if (passedChecks > totalChecks / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: c.env.APP_VERSION || '1.0.0',
      environment: c.env.NODE_ENV || 'development',
      services: serviceStatuses,
      checks
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    return c.json(response, statusCode);
  }, 'Detailed health check failed');
});

/**
 * Readiness probe endpoint
 * GET /health/ready
 */
healthRoutes.get('/ready', async (c) => {
  return handleAsync(async () => {
    const services = c.get('services');
    
    // Check if critical services are available
    const criticalServices = {
      slack: !!services.slack,
      zendesk: !!services.zendesk,
      clickup: !!services.clickup,
      ai: !!services.ai
    };
    
    const availableServices = Object.values(criticalServices).filter(Boolean).length;
    const totalServices = Object.keys(criticalServices).length;
    const isReady = availableServices >= totalServices / 2; // At least 50% of services
    
    const response = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      services: criticalServices,
      availableServices,
      totalServices
    };
    
    return c.json(response, isReady ? 200 : 503);
  }, 'Readiness check failed');
});

/**
 * Liveness probe endpoint
 * GET /health/live
 */
healthRoutes.get('/live', async (c) => {
  return handleAsync(async () => {
    const response = {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0
    };
    
    return c.json(response);
  }, 'Liveness check failed');
});

/**
 * Helper function to test a service
 */
async function testService(serviceName: string, testFn: () => Promise<any>): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    await testFn();
    return {
      name: serviceName,
      status: 'pass',
      duration: Date.now() - startTime,
      output: 'Service test passed'
    };
  } catch (error) {
    return {
      name: serviceName,
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}