/**
 * @type: routes
 * @domain: clickup
 * @purpose: Essential ClickUp routes for automation setup and status
 * @framework: Hono
 * @validation: Zod
 */

import { Hono } from 'hono';
import type { DIContext } from '../di/container';
import type { Env } from '../di/dependencies';
import type { Context } from 'hono';

// Type for context with access token
type DIContextWithAuth = Context<{
  Bindings: Env;
  Variables: {
    deps: any;
    accessToken: string;
  };
}>;

// Create ClickUp routes app
const clickupRoutes = new Hono<{ Bindings: Env }>();

// OAuth routes (no authentication required)
clickupRoutes.get('/auth', async (c: DIContext) => {
  try {
    const { clickUpOAuthService } = c.get('deps');
    const state = crypto.randomUUID();
    
    // Store state in a secure way (in production, use KV storage)
    // For now, we'll include it in the authorization URL
    const authUrl = await clickUpOAuthService.generateAuthorizationUrl(state);
    
    return c.json({
      authorization_url: authUrl,
      state,
      message: 'Redirect user to this URL to authorize ClickUp access',
    });
  } catch (error) {
    console.error('OAuth authorization error:', error);
    return c.json(
      {
        error: 'OAuth Error',
        message: 'Failed to generate authorization URL',
      },
      500
    );
  }
});

// Token management routes
// Token management endpoints removed - using system token for health checks

clickupRoutes.get('/auth/callback', async (c: DIContext) => {
  try {
    const { clickUpOAuthService } = c.get('deps');
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Handle OAuth errors
    if (error) {
      return c.json(
        {
          error: 'OAuth Error',
          message: `Authorization failed: ${error}`,
          description: c.req.query('error_description') || 'Unknown error',
        },
        400
      );
    }
    
    // Validate required parameters
    if (!code) {
      return c.json(
        {
          error: 'Missing Parameter',
          message: 'Authorization code is required',
        },
        400
      );
    }
    
    if (!state) {
      return c.json(
        {
          error: 'Missing Parameter',
          message: 'State parameter is required for security',
        },
        400
      );
    }
    
    // Exchange code for tokens
    const tokenResponse = await clickUpOAuthService.exchangeCodeForToken(code, state);
    
    // Generate a user ID for token storage
    // In a real application, this would come from user session or authentication
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the token in KV storage
    try {
      await clickUpOAuthService.storeUserToken(userId, tokenResponse);
      console.log(`[OAuth Callback] Token stored for user: ${userId}`);
    } catch (storageError) {
      console.error('[OAuth Callback] Failed to store token:', storageError);
      // Continue with response even if storage fails
    }
    
    return c.json({
      message: 'Authorization successful',
      user_id: userId,
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      scope: tokenResponse.scope,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json(
      {
        error: 'OAuth Error',
        message: 'Failed to process authorization callback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Middleware for authentication validation (applies to all routes except OAuth)
clickupRoutes.use('*', async (c: DIContextWithAuth, next) => {
  // Skip authentication for OAuth routes, debug routes, and status routes
  if (c.req.path.includes('/auth') || c.req.path.includes('/debug') || c.req.path.includes('/status')) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Bearer token required in Authorization header',
      },
      401
    );
  }
  
  // Store token for use in route handlers
  c.set('accessToken', authHeader.replace('Bearer ', ''));
  await next();
});

// ============================================================================
// STATUS AND CONNECTIVITY ROUTES
// ============================================================================

/**
 * Check ClickUp connectivity and authentication status
 * GET /api/clickup/status
 */
clickupRoutes.get('/status', async (c: DIContext) => {
  try {
    const { clickUpClient } = c.get('deps');
    
    // Check ClickUp API health (includes system token validation if available)
    const healthCheck = await clickUpClient.healthCheck();
    
    if (!healthCheck.success) {
      return c.json(
        {
          status: 'error',
          message: 'ClickUp API is not accessible',
          connectivity: false,
          authentication: healthCheck.data?.authentication || 'unknown',
          timestamp: healthCheck.data?.timestamp,
        },
        503
      );
    }
    
    return c.json({
      status: 'ok',
      message: 'ClickUp integration is ready',
      connectivity: true,
      authentication: healthCheck.data?.authentication || 'unknown',
      timestamp: healthCheck.data?.timestamp,
      endpoints: {
        auth: '/api/clickup/auth',
        callback: '/api/clickup/auth/callback',
        status_auth: '/api/clickup/status/auth',
      },
    });
  } catch (error) {
    console.error('ClickUp status check error:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to check ClickUp status',
        connectivity: false,
        authentication: 'unknown',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

/**
 * Check authenticated user's ClickUp access
 * GET /api/clickup/status/auth
 */
clickupRoutes.get('/status/auth', async (c: DIContext) => {
  try {
    const { clickUpClient } = c.get('deps');
    
    // Extract token directly from Authorization header since middleware skips /status routes
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          status: 'error',
          message: 'Bearer token required in Authorization header',
          connectivity: true,
          authentication: false,
        },
        401
      );
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Test authentication by getting user info
    const userResponse = await clickUpClient.getAuthorizedUser(accessToken);
    
    if (!userResponse.success) {
      return c.json(
        {
          status: 'error',
          message: 'Authentication failed',
          connectivity: true,
          authentication: false,
          error: userResponse.error || 'Invalid or expired token',
        },
        401
      );
    }
    
    // Get teams to verify full access
    const teamsResponse = await clickUpClient.getAuthorizedTeams(accessToken);
    
    return c.json({
      status: 'ok',
      message: 'ClickUp authentication successful',
      connectivity: true,
      authentication: true,
      user: {
        id: userResponse.data?.id,
        username: userResponse.data?.username,
        email: userResponse.data?.email,
      },
      teams_count: teamsResponse.success ? teamsResponse.data?.teams?.length || 0 : 0,
    });
  } catch (error) {
    console.error('ClickUp auth status check error:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to verify authentication',
        connectivity: true,
        authentication: false,
      },
      500
    );
  }
});

// ============================================================================
// AUTOMATION SETUP ROUTES
// ============================================================================

/**
 * Get automation configuration status
 * GET /api/clickup/automation/config
 */
clickupRoutes.get('/automation/config', async (c: DIContextWithAuth) => {
  try {
    const { clickUpClient } = c.get('deps');
    const accessToken = c.get('accessToken');
    
    // Get user and teams info for automation setup
    const [userResponse, teamsResponse] = await Promise.all([
      clickUpClient.getAuthorizedUser(accessToken),
      clickUpClient.getAuthorizedTeams(accessToken),
    ]);
    
    if (!userResponse.success || !teamsResponse.success) {
      return c.json(
        {
          status: 'error',
          message: 'Failed to retrieve ClickUp configuration',
          authentication: false,
        },
        401
      );
    }
    
    return c.json({
      status: 'ok',
      message: 'ClickUp automation configuration ready',
      user: {
        id: userResponse.data.user?.id,
        username: userResponse.data.user?.username,
        email: userResponse.data.user?.email,
      },
      teams: teamsResponse.data?.teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        color: team.color,
      })) || [],
      automation_ready: true,
    });
  } catch (error) {
    console.error('ClickUp automation config error:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to retrieve automation configuration',
        automation_ready: false,
      },
      500
    );
  }
});

export { clickupRoutes };