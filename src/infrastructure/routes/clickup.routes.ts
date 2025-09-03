/**
 * @type: routes
 * @domain: clickup
 * @purpose: ClickUp API routes with comprehensive endpoint coverage
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

// Import validation schemas
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  TaskQueryParamsSchema,
} from '../../domains/clickup/types/task.types';

import {
  CreateSpaceRequestSchema,
  UpdateSpaceRequestSchema,
  CreateFolderRequestSchema,
  CreateListRequestSchema,
} from '../../domains/clickup/types/workspace.types';

import {
  CreateWebhookRequestSchema,
  UpdateWebhookRequestSchema,
} from '../../domains/clickup/types/webhook.types';

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
clickupRoutes.get('/auth/token/:userId', async (c: DIContext) => {
  try {
    const { clickUpOAuthService } = c.get('deps');
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json(
        {
          error: 'Missing Parameter',
          message: 'User ID is required',
        },
        400
      );
    }
    
    // Retrieve stored token
    const tokenData = await clickUpOAuthService.getUserToken(userId);
    
    if (!tokenData) {
      return c.json(
        {
          error: 'Token Not Found',
          message: 'No valid token found for this user',
        },
        404
      );
    }
    
    return c.json({
      message: 'Token retrieved successfully',
      user_id: userId,
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });
  } catch (error) {
    console.error('Token retrieval error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

clickupRoutes.delete('/auth/token/:userId', async (c: DIContext) => {
  try {
    const { clickUpOAuthService } = c.get('deps');
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json(
        {
          error: 'Missing Parameter',
          message: 'User ID is required',
        },
        400
      );
    }
    
    // Remove stored token
    await clickUpOAuthService.removeUserToken(userId);
    
    return c.json({
      message: 'Token removed successfully',
      user_id: userId,
    });
  } catch (error) {
    console.error('Token removal error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to remove token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

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
  // Skip authentication for OAuth routes and debug routes
  if (c.req.path.includes('/auth') || c.req.path.includes('/debug')) {
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
// TASK MANAGEMENT ROUTES
// ============================================================================

/**
 * Get task by ID
 * GET /api/clickup/tasks/:taskId
 */
clickupRoutes.get('/tasks/:taskId', async (c: DIContextWithAuth) => {
  try {
    const { clickUpTaskService } = c.get('deps');
    const taskId = c.req.param('taskId');
    const accessToken = c.get('accessToken');
    
    if (!taskId) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Task ID is required',
        },
        400
      );
    }
    
    const result = await clickUpTaskService.getTask(taskId, accessToken);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Task Not Found',
          message: result.error || 'Task not found',
        },
        404
      );
    }
    
    return c.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve task',
      },
      500
    );
  }
});

/**
 * Get tasks from a list
 * GET /api/clickup/lists/:listId/tasks
 */
clickupRoutes.get('/lists/:listId/tasks', async (c: DIContextWithAuth) => {
  try {
    const { clickUpTaskService } = c.get('deps');
    const listId = c.req.param('listId');
    const accessToken = c.get('accessToken');
    
    // Parse and validate query parameters
    const queryParams = {
      archived: c.req.query('archived'),
      page: c.req.query('page'),
      order_by: c.req.query('order_by'),
      reverse: c.req.query('reverse'),
      subtasks: c.req.query('subtasks'),
      statuses: c.req.query('statuses'),
      include_closed: c.req.query('include_closed'),
      assignees: c.req.query('assignees'),
      tags: c.req.query('tags'),
      due_date_gt: c.req.query('due_date_gt'),
      due_date_lt: c.req.query('due_date_lt'),
      date_created_gt: c.req.query('date_created_gt'),
      date_created_lt: c.req.query('date_created_lt'),
      date_updated_gt: c.req.query('date_updated_gt'),
      date_updated_lt: c.req.query('date_updated_lt'),
    };
    
    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value !== undefined)
    );
    
    const validationResult = TaskQueryParamsSchema.safeParse(cleanParams);
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpTaskService.getTasks(listId, validationResult.data, accessToken);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Failed to Retrieve Tasks',
          message: result.error || 'Failed to retrieve tasks',
        },
        400
      );
    }
    
    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve tasks',
      },
      500
    );
  }
});

/**
 * Create a new task
 * POST /api/clickup/lists/:listId/tasks
 */
clickupRoutes.post('/lists/:listId/tasks', async (c: DIContextWithAuth) => {
  try {
    const { clickUpTaskService } = c.get('deps');
    const listId = c.req.param('listId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = CreateTaskRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid task data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpTaskService.createTask(listId, validationResult.data, accessToken);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Task Creation Failed',
          message: result.error || 'Failed to create task',
        },
        400
      );
    }
    
    return c.json(
      {
        success: true,
        data: result.data,
        message: 'Task created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Create task error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create task',
      },
      500
    );
  }
});

/**
 * Update a task
 * PUT /api/clickup/tasks/:taskId
 */
clickupRoutes.put('/tasks/:taskId', async (c: DIContextWithAuth) => {
  try {
    const { clickUpTaskService } = c.get('deps');
    const taskId = c.req.param('taskId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = UpdateTaskRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid task update data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpTaskService.updateTask(taskId, validationResult.data, accessToken);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Task Update Failed',
          message: result.error || 'Failed to update task',
        },
        400
      );
    }
    
    return c.json({
      success: true,
      data: result.data,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update task',
      },
      500
    );
  }
});

/**
 * Delete a task
 * DELETE /api/clickup/tasks/:taskId
 */
clickupRoutes.delete('/tasks/:taskId', async (c: DIContextWithAuth) => {
  try {
    const { clickUpTaskService } = c.get('deps');
    const taskId = c.req.param('taskId');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpTaskService.deleteTask(taskId, accessToken);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Task Deletion Failed',
          message: result.error || 'Failed to delete task',
        },
        400
      );
    }
    
    return c.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete task',
      },
      500
    );
  }
});

// ============================================================================
// WORKSPACE MANAGEMENT ROUTES
// ============================================================================

/**
 * Get all spaces for authorized teams
 * GET /api/clickup/spaces
 */
clickupRoutes.get('/spaces', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpSpaceService.getSpacesByTeam('', {});
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get spaces error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve spaces',
      },
      500
    );
  }
});

/**
 * Get space by ID
 * GET /api/clickup/spaces/:spaceId
 */
clickupRoutes.get('/spaces/:spaceId', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const spaceId = c.req.param('spaceId');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpSpaceService.getSpaceById(spaceId);
    
    if (!result.success) {
      return c.json(
        {
          error: 'Space Not Found',
          message: result.error || 'Space not found',
        },
        404
      );
    }
    
    return c.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get space error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve space',
      },
      500
    );
  }
});

/**
 * Create a new space
 * POST /api/clickup/teams/:teamId/spaces
 */
clickupRoutes.post('/teams/:teamId/spaces', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const teamId = c.req.param('teamId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = CreateSpaceRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid space data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpSpaceService.createSpace(teamId, validationResult.data);
    
    return c.json(
      {
        success: true,
        data: result,
        message: 'Space created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Create space error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create space',
      },
      500
    );
  }
});

/**
 * Get folders in a space
 * GET /api/clickup/spaces/:spaceId/folders
 */
clickupRoutes.get('/spaces/:spaceId/folders', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const spaceId = c.req.param('spaceId');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpSpaceService.getFoldersBySpace(spaceId, {});
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get folders error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve folders',
      },
      500
    );
  }
});

/**
 * Create a folder in a space
 * POST /api/clickup/spaces/:spaceId/folders
 */
clickupRoutes.post('/spaces/:spaceId/folders', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const spaceId = c.req.param('spaceId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = CreateFolderRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid folder data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpSpaceService.createFolder(spaceId, validationResult.data);
    
    return c.json(
      {
        success: true,
        data: result,
        message: 'Folder created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Create folder error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create folder',
      },
      500
    );
  }
});

/**
 * Get lists in a folder
 * GET /api/clickup/folders/:folderId/lists
 */
clickupRoutes.get('/folders/:folderId/lists', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const folderId = c.req.param('folderId');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpSpaceService.getListsByFolder(folderId, {});
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get lists error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve lists',
      },
      500
    );
  }
});

/**
 * Get folderless lists in a space
 * GET /api/clickup/spaces/:spaceId/lists
 */
clickupRoutes.get('/spaces/:spaceId/lists', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const spaceId = c.req.param('spaceId');
    const accessToken = c.get('accessToken');
    
    const result = await clickUpSpaceService.getFolderlessLists(spaceId, {});
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get folderless lists error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve folderless lists',
      },
      500
    );
  }
});

/**
 * Create a list in a folder
 * POST /api/clickup/folders/:folderId/lists
 */
clickupRoutes.post('/folders/:folderId/lists', async (c: DIContextWithAuth) => {
  try {
    const { clickUpSpaceService } = c.get('deps');
    const folderId = c.req.param('folderId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = CreateListRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid list data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    const result = await clickUpSpaceService.createList(folderId, validationResult.data);
    
    return c.json(
      {
        success: true,
        data: result,
        message: 'List created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Create list error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create list',
      },
      500
    );
  }
});

// ============================================================================
// WEBHOOK MANAGEMENT ROUTES
// ============================================================================

/**
 * Get webhooks for a team
 * GET /api/clickup/teams/:teamId/webhooks
 */
clickupRoutes.get('/teams/:teamId/webhooks', async (c: DIContextWithAuth) => {
  try {
    const { clickUpClient } = c.get('deps');
    const teamId = c.req.param('teamId');
    const accessToken = c.get('accessToken');
    
    // Note: This would need to be implemented in the client service
    // For now, return a placeholder response
    return c.json({
      success: true,
      data: { webhooks: [] },
      message: 'Webhook management coming soon',
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve webhooks',
      },
      500
    );
  }
});

/**
 * Create a webhook
 * POST /api/clickup/teams/:teamId/webhooks
 */
clickupRoutes.post('/teams/:teamId/webhooks', async (c: DIContextWithAuth) => {
  try {
    const { clickUpClient } = c.get('deps');
    const teamId = c.req.param('teamId');
    const accessToken = c.get('accessToken');
    
    const body = await c.req.json();
    const validationResult = CreateWebhookRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid webhook data',
          details: validationResult.error.errors,
        },
        400
      );
    }
    
    // Note: This would need to be implemented in the client service
    return c.json(
      {
        success: true,
        data: { webhook: validationResult.data },
        message: 'Webhook creation coming soon',
      },
      201
    );
  } catch (error) {
    console.error('Create webhook error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create webhook',
      },
      500
    );
  }
});

// ============================================================================
// USER AND TEAM ROUTES
// ============================================================================

/**
 * Get authorized user information
 * GET /api/clickup/user
 */
clickupRoutes.get('/user', async (c: DIContextWithAuth) => {
  try {
    const { clickUpClient } = c.get('deps');
    const accessToken = c.get('accessToken');
    
    const userResponse = await clickUpClient.getAuthorizedUser(accessToken);
    
    if (!userResponse.success) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Failed to retrieve user information',
        },
        401
      );
    }
    
    return c.json({
      success: true,
      data: userResponse.data,
      statusCode: userResponse.statusCode,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve user information',
      },
      500
    );
  }
});

/**
 * Get authorized teams
 * GET /api/clickup/teams
 */
clickupRoutes.get('/teams', async (c: DIContextWithAuth) => {
  try {
    const { clickUpClient } = c.get('deps');
    const accessToken = c.get('accessToken');
    
    const teamsResponse = await clickUpClient.getAuthorizedTeams(accessToken);
    
    if (!teamsResponse.success) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Failed to retrieve teams information',
        },
        401
      );
    }
    
    return c.json({
      success: true,
      data: teamsResponse.data,
      statusCode: teamsResponse.statusCode,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve teams information',
      },
      500
    );
  }
});

// ============================================================================
// DEBUG ROUTES (Development only)
// ============================================================================

/**
 * List stored tokens (debug endpoint)
 * GET /api/clickup/debug/tokens
 */
clickupRoutes.get('/debug/tokens', async (c: DIContext) => {
  try {
    const { clickUpOAuthService } = c.get('deps');
    
    // Get token storage service from OAuth service
    const tokenStorageService = (clickUpOAuthService as any).tokenStorage;
    
    if (!tokenStorageService) {
      return c.json(
        {
          error: 'Service Error',
          message: 'Token storage service not available',
        },
        500
      );
    }
    
    const tokenKeys = await tokenStorageService.listTokenKeys();
    
    return c.json({
      message: 'Stored tokens retrieved successfully',
      total_tokens: tokenKeys.length,
      token_user_ids: tokenKeys,
      note: 'Use GET /api/clickup/auth/token/:userId to retrieve specific token details'
    });
  } catch (error) {
    console.error('Debug tokens error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve stored tokens',
      },
      500
    );
  }
});

export { clickupRoutes };