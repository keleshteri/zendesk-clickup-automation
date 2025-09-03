/**
 * @type: routes
 * @domain: zendesk
 * @purpose: Essential Zendesk routes for health checks and API testing
 * @framework: Hono
 * @validation: Zod
 */

import { Hono } from 'hono';
import type { DIContext } from '../di/container';
import type { Env } from '../di/dependencies';

// Create Zendesk routes app
const zendeskRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// STATUS AND CONNECTIVITY ROUTES
// ============================================================================

/**
 * Check Zendesk connectivity and authentication status
 * GET /api/zendesk/status
 */
zendeskRoutes.get('/status', async (c: DIContext) => {
  try {
    const { zendeskClient } = c.get('deps');
    
    // Check Zendesk API health and authentication
    const healthCheck = await zendeskClient.healthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      return c.json(
        {
          status: 'error',
          message: 'Zendesk API is not accessible',
          connectivity: false,
          authentication: 'failed',
          timestamp: new Date().toISOString(),
          error: healthCheck.details,
        },
        503
      );
    }
    
    return c.json({
      status: 'ok',
      message: 'Zendesk integration is ready',
      connectivity: healthCheck.status,
      authentication: 'authenticated',
      timestamp: new Date().toISOString(),
      endpoints: {
        status: '/api/zendesk/status',
      },
    });
  } catch (error) {
    console.error('Zendesk status check error:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to check Zendesk status',
        connectivity: false,
        authentication: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

// ============================================================================
// TEST ROUTES FOR API FUNCTIONALITY
// ============================================================================

/**
 * Test Zendesk ticket retrieval
 * GET /api/zendesk/test/ticket?id=123
 */
// zendeskRoutes.get('/test/ticket', async (c: DIContext) => {
//   try {
//     const { zendeskTicketService } = c.get('deps');
//     const ticketId = c.req.query('id');
    
//     if (!ticketId) {
//       return c.json(
//         {
//           error: 'Missing Parameter',
//           message: 'Ticket ID is required. Use ?id=123',
//           example: '/api/zendesk/test/ticket?id=123',
//         },
//         400
//       );
//     }
    
//     // Test ticket retrieval
//     const ticket = await zendeskTicketService.getTicket(parseInt(ticketId, 10));
    
//     if (!ticket) {
//       return c.json(
//         {
//           status: 'not_found',
//           message: `Ticket ${ticketId} not found`,
//           ticket_id: ticketId,
//         },
//         404
//       );
//     }
    
//     return c.json({
//       status: 'success',
//       message: 'Ticket retrieved successfully',
//       ticket: {
//         id: ticket.id,
//         subject: ticket.subject,
//         status: ticket.status,
//         priority: ticket.priority,
//         created_at: ticket.created_at,
//         updated_at: ticket.updated_at,
//         requester_id: ticket.requester_id,
//         assignee_id: ticket.assignee_id,
//         description: ticket.description?.substring(0, 200) + (ticket.description && ticket.description.length > 200 ? '...' : ''),
//       },
//       test_passed: true,
//     });
//   } catch (error) {
//     console.error('Zendesk ticket test error:', error);
//     return c.json(
//       {
//         status: 'error',
//         message: 'Failed to retrieve ticket',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         test_passed: false,
//       },
//       500
//     );
//   }
// });

// /**
//  * Test Zendesk user retrieval (current user)
//  * GET /api/zendesk/test/user
//  */
// zendeskRoutes.get('/test/user', async (c: DIContext) => {
//   try {
//     const { zendeskClient } = c.get('deps');
    
//     // Test current user retrieval
//     const currentUser = await zendeskClient.getCurrentUser();
    
//     return c.json({
//       status: 'success',
//       message: 'Current user retrieved successfully',
//       user: {
//         id: currentUser.id,
//         name: currentUser.name,
//         email: currentUser.email,
//         role: currentUser.role,
//         active: currentUser.active,
//         created_at: currentUser.created_at,
//         updated_at: currentUser.updated_at,
//       },
//       test_passed: true,
//     });
//   } catch (error) {
//     console.error('Zendesk user test error:', error);
//     return c.json(
//       {
//         status: 'error',
//         message: 'Failed to retrieve current user',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         test_passed: false,
//       },
//       500
//     );
//   }
// });

// /**
//  * Test Zendesk ticket comments retrieval
//  * GET /api/zendesk/test/comments?ticket_id=123
//  */
// zendeskRoutes.get('/test/comments', async (c: DIContext) => {
//   try {
//     const { zendeskTicketService } = c.get('deps');
//     const ticketId = c.req.query('ticket_id');
    
//     if (!ticketId) {
//       return c.json(
//         {
//           error: 'Missing Parameter',
//           message: 'Ticket ID is required. Use ?ticket_id=123',
//           example: '/api/zendesk/test/comments?ticket_id=123',
//         },
//         400
//       );
//     }
    
//     // Test comments retrieval
//     const commentsResponse = await zendeskTicketService.getTicketComments(parseInt(ticketId, 10));
    
//     return c.json({
//       status: 'success',
//       message: 'Ticket comments retrieved successfully',
//       ticket_id: parseInt(ticketId, 10),
//       comments_count: commentsResponse.items.length,
//       comments: commentsResponse.items.slice(0, 5).map(comment => ({
//         id: comment.id,
//         author_id: comment.author_id,
//         created_at: comment.created_at,
//         type: comment.type,
//         public: comment.public,
//         body: comment.body?.substring(0, 150) + (comment.body && comment.body.length > 150 ? '...' : ''),
//       })),
//       note: commentsResponse.items.length > 5 ? `Showing first 5 of ${commentsResponse.items.length} comments` : undefined,
//       test_passed: true,
//     });
//   } catch (error) {
//     console.error('Zendesk comments test error:', error);
//     return c.json(
//       {
//         status: 'error',
//         message: 'Failed to retrieve ticket comments',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         test_passed: false,
//       },
//       500
//     );
//   }
// });

export { zendeskRoutes };