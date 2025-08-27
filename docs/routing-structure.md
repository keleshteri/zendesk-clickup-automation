# Routing Structure Documentation

## Overview

This document describes the organized routing structure for the Zendesk-ClickUp Automation API. The routes have been restructured to provide better organization, maintainability, and clear separation of concerns.

## Route Organization

### Base Routes Structure

```
/
├── /health              # Health check endpoints
├── /slack               # Slack integration endpoints
├── /zendesk             # Zendesk integration endpoints
└── /clickup             # ClickUp integration endpoints
```

## Detailed Route Documentation

### Health Routes (`/health`)

#### `GET /health`
- **Purpose**: Basic health check with service availability
- **Response**: Overall system status, uptime, version, and service statuses
- **Authentication**: None required
- **CORS**: Public access allowed
- **Services Checked**: Slack, Zendesk, ClickUp, AI, OAuth
- **Status Codes**: 200 (healthy/degraded), 503 (unhealthy)
- **Response Format**:
  ```json
  {
    "status": "healthy|degraded|unhealthy",
    "timestamp": "2025-01-16T10:30:00Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "development",
    "services": [
      {
        "name": "slack",
        "status": "available|unavailable|degraded",
        "configured": true
      }
    ]
  }
  ```

#### `GET /health/detailed`
- **Purpose**: Detailed health check with actual service testing
- **Response**: Comprehensive health information with API call tests
- **Authentication**: None required
- **CORS**: Public access allowed
- **Features**: Real API calls to test service connectivity and response times
- **Response Format**: Includes `checks` array with individual service test results

### Zendesk Routes (`/zendesk`)

#### `POST /zendesk/webhook`
- **Purpose**: Handle Zendesk ticket webhooks with AI analysis
- **Authentication**: Webhook signature verification (X-Zendesk-Webhook-Signature)
- **Required Headers**: 
  - `X-Zendesk-Webhook-Signature`: Webhook signature
  - `X-Zendesk-Webhook-Signature-Timestamp`: Request timestamp
- **Processing Flow**: 
  1. Signature verification using webhook secret
  2. Payload validation and normalization
  3. AI ticket analysis and categorization
  4. OAuth token resolution for user context
  5. Automatic ClickUp task creation with AI insights
  6. Slack notification dispatch
  7. Task mapping logging
- **CORS**: Webhook-specific CORS policy
- **Features**: 
  - Intelligent routing based on AI analysis
  - OAuth-aware user context
  - Multi-service integration
- **Payload Format**:
  ```json
  {
    "ticket_id": 12345,
    "ticket": {
      "id": 12345,
      "subject": "Issue with login",
      "description": "User cannot log in...",
      "status": "new",
      "priority": "normal",
      "tags": ["login", "authentication"]
    },
    "current_user": {
      "email": "user@company.com"
    }
  }
  ```

#### `GET /zendesk/tickets`
- **Purpose**: Retrieve Zendesk tickets with filtering
- **Authentication**: API key or OAuth required
- **Parameters**: status, priority, assignee filters
- **CORS**: Standard CORS policy

#### `GET /zendesk/tickets/:id`
- **Purpose**: Get specific ticket details
- **Authentication**: API key or OAuth required
- **Response**: Complete ticket information
- **CORS**: Standard CORS policy

### Slack Routes (`/slack`)

#### `POST /slack/events`
- **Purpose**: Handle Slack Events API with signature verification
- **Authentication**: Slack signature verification (X-Slack-Signature)
- **Required Headers**: 
  - `X-Slack-Signature`: Request signature
  - `X-Slack-Request-Timestamp`: Request timestamp
- **Supported Events**: 
  - `url_verification`: Returns challenge for endpoint verification
  - `event_callback`: Processes actual Slack events
  - `app_mention`: Bot mentions in channels
  - `member_joined_channel`: New member notifications
- **Processing**: Event routing and response handling
- **CORS**: Webhook-specific CORS policy
- **Response**: `{ "ok": true }` or challenge string

#### `POST /slack/commands`
- **Purpose**: Handle Slack slash commands with token verification
- **Authentication**: Slack verification token validation
- **Content-Type**: `application/x-www-form-urlencoded`
- **Supported Commands**: 
  - `/status`: System and service status
  - `/summarize`: AI-powered ticket summaries
  - `/list-tickets`: Filtered ticket listings
  - `/analytics`: Performance analytics
- **Response**: Interactive Slack message responses
- **CORS**: Webhook-specific CORS policy
- **Payload Format**: Form data with fields like `command`, `text`, `user_id`, `channel_id`

#### `GET /slack/socket/status`
- **Purpose**: Check Slack Socket Mode connection status
- **Authentication**: Internal service check
- **Response**: Socket connection health and metrics
- **CORS**: Standard CORS policy
- **Response Format**:
  ```json
  {
    "connected": true,
    "connectionId": "conn_123",
    "lastPing": "2025-01-16T10:30:00Z",
    "messagesSent": 150,
    "messagesReceived": 200
  }
  ```

#### `POST /slack/socket/connect`
- **Purpose**: Establish Socket Mode connection
- **Authentication**: Slack app token required
- **Processing**: WebSocket connection management
- **CORS**: Strict CORS policy
- **Response**: Connection establishment confirmation

#### `POST /slack/socket/disconnect`
- **Purpose**: Disconnect Socket Mode connection
- **Authentication**: Internal service authorization
- **Processing**: Graceful connection termination
- **CORS**: Strict CORS policy
- **Response**: Disconnection confirmation



### ClickUp Routes (`/clickup`)

#### Authentication Endpoints

##### `GET /clickup/auth`
- **Purpose**: Initiate ClickUp OAuth flow with security checks
- **Authentication**: Bearer token required
- **Parameters**: 
  - `user_id` (required): User identifier for OAuth association
  - `redirect_url` (optional): Post-authorization redirect URL
- **Security Features**: 
  - State parameter with nonce and timestamp
  - 10-minute expiration window
  - Cryptographically secure state generation
- **Response Format**:
  ```json
  {
    "authUrl": "https://app.clickup.com/api/oauth/authorize?...",
    "state": "base64-encoded-state",
    "expiresAt": "2025-01-16T10:40:00Z",
    "timestamp": "2025-01-16T10:30:00Z"
  }
  ```
- **CORS**: Standard CORS policy

##### `GET /clickup/auth/callback`
- **Purpose**: Handle ClickUp OAuth callback with comprehensive validation
- **Authentication**: OAuth state verification and expiration check
- **Parameters**: 
  - `code`: Authorization code from ClickUp
  - `state`: State parameter for validation
  - `error` (optional): OAuth error code
  - `error_description` (optional): Error description
- **Processing Flow**: 
  1. State parameter validation and expiration check
  2. Authorization code exchange for tokens
  3. User OAuth data storage with metadata
  4. Optional redirect handling
- **Response**: Success confirmation or redirect to specified URL
- **CORS**: Standard CORS policy

##### `DELETE /clickup/auth/:userId`
- **Purpose**: Revoke ClickUp OAuth tokens for user
- **Authentication**: Bearer token required
- **Processing**: 
  - Token cleanup and revocation
  - OAuth data removal
  - Audit logging
- **Response**: Revocation confirmation
- **CORS**: Standard CORS policy

#### API Endpoints

##### `GET /clickup/workspaces`
- **Purpose**: List user's accessible ClickUp workspaces
- **Authentication**: OAuth token or API key
- **Response**: Available workspaces with permissions and metadata
- **CORS**: Standard CORS policy
- **Response Format**:
  ```json
  {
    "workspaces": [
      {
        "id": "workspace_123",
        "name": "My Workspace",
        "color": "#7B68EE",
        "avatar": "https://...",
        "members": []
      }
    ]
  }
  ```

##### `GET /clickup/spaces`
- **Purpose**: List spaces within a workspace
- **Authentication**: OAuth token or API key
- **Parameters**: 
  - `workspace_id` (optional): Filter by specific workspace
- **Response**: Spaces with folder and list structure
- **CORS**: Standard CORS policy

##### `GET /clickup/tasks`
- **Purpose**: List tasks with advanced filtering and pagination
- **Authentication**: OAuth token or API key
- **Parameters**: 
  - `list_id`: Target list identifier
  - `status`: Task status filter
  - `assignee`: Assignee filter
  - `page`: Pagination page number
  - `limit`: Results per page
- **Response**: Paginated task list with metadata
- **CORS**: Standard CORS policy

##### `POST /clickup/tasks`
- **Purpose**: Create new ClickUp task with full feature support
- **Authentication**: OAuth token or API key
- **Body**: Comprehensive task details
- **Features**: 
  - AI-enhanced task creation
  - Automatic assignee resolution
  - Custom field population
  - Zendesk ticket linking
- **Response**: Created task with ID and URL
- **CORS**: Standard CORS policy

##### `GET /clickup/tasks/:taskId`
- **Purpose**: Retrieve specific task with complete details
- **Authentication**: OAuth token or API key
- **Response**: Complete task information including custom fields
- **CORS**: Standard CORS policy

##### `PUT /clickup/tasks/:taskId`
- **Purpose**: Update existing task with change tracking
- **Authentication**: OAuth token or API key
- **Body**: Updated task fields
- **Features**: 
  - Partial update support
  - Change history tracking
  - Webhook notification triggers
- **Response**: Updated task information
- **CORS**: Standard CORS policy

#### Webhook Endpoints

##### `POST /clickup/webhook`
- **Purpose**: Handle ClickUp task webhooks with comprehensive event processing
- **Authentication**: Webhook signature verification
- **Supported Events**: 
  - `taskCreated`: New task creation
  - `taskUpdated`: Task modifications
  - `taskDeleted`: Task deletion
  - `taskStatusUpdated`: Status changes
  - `taskMoved`: Task list/folder changes
- **Processing Flow**: 
  1. Webhook signature validation
  2. Event type identification and parsing
  3. Zendesk ticket synchronization
  4. Slack notification dispatch
  5. Audit trail logging
- **CORS**: Webhook-specific CORS policy
- **Payload Format**:
  ```json
  {
    "event": "taskUpdated",
    "task_id": "task_123",
    "history_items": [
      {
        "field": "status",
        "before": "in progress",
        "after": "complete",
        "user": {
          "email": "user@company.com"
        }
      }
    ],
    "webhook_id": "webhook_456"
  }
  ```

## Route Migration Guide

### Recent Changes

| Old Route | New Route | Status | Migration Notes |
|-----------|-----------|--------|----------------|
| `/webhook/zendesk` | `/zendesk/webhook` | **MOVED** | Update webhook URLs in Zendesk admin |
| `/webhook/clickup` | `/clickup/webhook` | **MOVED** | Update webhook URLs in ClickUp settings |
| `/auth/clickup/*` | `/clickup/auth/*` | **MOVED** | OAuth flows now under ClickUp namespace |

### Deprecated Routes

The following routes have been removed:
- `/auth/*` (general auth routes) - Moved to service-specific namespaces
- `/webhook/*` (general webhook routes) - Moved to service-specific namespaces

### Migration Timeline

- **Phase 1**: New routes available alongside old routes
- **Phase 2**: Old routes return deprecation warnings
- **Phase 3**: Old routes removed (breaking change)

### Backward Compatibility

Currently, there is no backward compatibility layer. Client applications must update their endpoints to use the new route structure.

## Implementation Details

### File Structure

The routing system is organized into service-specific modules:

```
src/routes/
├── health.ts           # Health check and system status routes
├── slack.ts            # Slack integration routes (events, commands, socket)
├── zendesk.ts          # Zendesk integration routes (webhooks, API)
└── clickup.ts          # ClickUp integration routes (OAuth, API, webhooks)
```

### Route Registration

Routes are registered in `src/app.ts` with service-specific namespaces:

```typescript
import { healthRoutes } from './routes/health';
import { slackRoutes } from './routes/slack';
import { zendeskRoutes } from './routes/zendesk';
import { clickupRoutes } from './routes/clickup';

// Register routes with service namespaces
app.route('/health', healthRoutes);
app.route('/slack', slackRoutes);
app.route('/zendesk', zendeskRoutes);
app.route('/clickup', clickupRoutes);
```

### Route Features

#### AI Metadata Integration
All route files include comprehensive AI metadata headers for:
- Component tracking and versioning
- Approval workflow management
- Dependency tracking
- Breaking change risk assessment

#### Security Implementation
- **Webhook Signature Verification**: All webhook endpoints verify signatures
- **OAuth State Management**: Secure state handling with expiration
- **CORS Policies**: Service-specific CORS configurations
- **Authentication Middleware**: Bearer token and API key validation

#### Error Handling
- **Structured Error Responses**: Consistent error format across all routes
- **Async Error Handling**: Comprehensive error catching and logging
- **Validation Middleware**: Request validation with detailed error messages
- **Service Availability Checks**: Required service validation

## Security Considerations

### Authentication Methods

#### Webhook Security
- **Slack Events**: X-Slack-Signature with timestamp validation
- **Zendesk Webhooks**: X-Zendesk-Webhook-Signature verification
- **ClickUp Webhooks**: Signature-based authentication
- **Timestamp Validation**: Prevents replay attacks

#### API Authentication
- **Bearer Tokens**: OAuth access tokens for user context
- **API Keys**: Service-level authentication
- **OAuth State Management**: Cryptographically secure state with expiration
- **Token Refresh**: Automatic token renewal handling

### CORS Policies

#### Policy Types
- **Public CORS**: Health endpoints allow unrestricted access
- **Webhook CORS**: Restricted to webhook source domains
- **Standard CORS**: API endpoints with authentication requirements
- **Strict CORS**: OAuth and sensitive operations

#### Implementation
```typescript
// Public access for monitoring
healthRoutes.use('*', publicCORSMiddleware);

// Webhook-specific CORS
slackRoutes.post('/events', webhookCORSMiddleware, handler);

// Standard API CORS
clickupRoutes.get('/tasks', corsMiddleware, handler);

// Strict CORS for sensitive operations
clickupRoutes.post('/auth', strictCORSMiddleware, handler);
```

### Rate Limiting Strategy

- **Health Checks**: No rate limiting (monitoring requirements)
- **Webhooks**: Source IP-based rate limiting
- **API Endpoints**: User-based rate limiting with OAuth context
- **OAuth Endpoints**: Strict rate limiting for security

## Error Handling

### Standardized Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "user_id",
      "issue": "Required field missing"
    },
    "timestamp": "2025-01-16T10:30:00Z",
    "requestId": "req_123456",
    "service": "clickup"
  }
}
```

### Error Categories and Handling

#### Client Errors (4xx)
- **400 Bad Request**: Validation errors, malformed JSON
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource or endpoint not found
- **429 Too Many Requests**: Rate limit exceeded

#### Server Errors (5xx)
- **500 Internal Server Error**: Unhandled server-side errors
- **502 Bad Gateway**: External service failures
- **503 Service Unavailable**: Required services unavailable
- **504 Gateway Timeout**: External service timeouts

#### Error Middleware
```typescript
// Centralized error handling
export const handleAsync = async (fn: Function, context: string) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`${context}:`, error);
    throw new APIError(error.message, error.status || 500);
  }
};
```

## Usage Examples

### ClickUp OAuth Flow

```javascript
// 1. Initiate OAuth with security features
const authResponse = await fetch('/clickup/auth?user_id=user123&redirect_url=https://app.com/success', {
  headers: { 'Authorization': 'Bearer token' }
});
const { authUrl, state, expiresAt } = await authResponse.json();

// 2. Redirect user to authUrl (state is automatically handled)
window.location.href = authUrl;

// 3. Handle callback (automatic with validation)
// User will be redirected back with success/error
// State validation and expiration are handled automatically
```

### Webhook Configuration

#### Zendesk Webhook Setup
```javascript
const zendeskWebhook = {
  url: 'https://your-domain.com/zendesk/webhook',
  events: ['ticket.created', 'ticket.updated', 'ticket.solved'],
  signature_secret: process.env.ZENDESK_WEBHOOK_SECRET,
  headers: {
    'X-Zendesk-Webhook-Signature': 'auto-generated',
    'X-Zendesk-Webhook-Signature-Timestamp': 'auto-generated'
  }
};
```

#### ClickUp Webhook Setup
```javascript
const clickupWebhook = {
  url: 'https://your-domain.com/clickup/webhook',
  events: ['taskCreated', 'taskUpdated', 'taskStatusUpdated', 'taskMoved'],
  secret: process.env.CLICKUP_WEBHOOK_SECRET
};
```

### API Operations

#### Task Management
```javascript
// Create ClickUp task with AI enhancement
const task = await fetch('/clickup/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer oauth-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Fix login issue',
    description: 'User cannot log in to the system',
    list_id: 'list_123',
    assignees: ['user_456'],
    priority: 2,
    custom_fields: [
      {
        id: 'zendesk_ticket_id',
        value: '12345'
      }
    ]
  })
});

// Get tasks with filtering
const tasks = await fetch('/clickup/tasks?list_id=list_123&status=open&assignee=user_456', {
  headers: { 'Authorization': 'Bearer oauth-token' }
});
```

#### Health Monitoring
```javascript
// Basic health check
const health = await fetch('/health');
const status = await health.json();
console.log('System status:', status.status);
console.log('Services:', status.services);

// Detailed health check with service testing
const detailedHealth = await fetch('/health/detailed');
const detailed = await detailedHealth.json();
console.log('Service checks:', detailed.checks);
```

#### Slack Integration
```javascript
// Check Slack Socket Mode status
const socketStatus = await fetch('/slack/socket/status');
const status = await socketStatus.json();
console.log('Socket connected:', status.connected);

// Slack command handling (server-side)
app.post('/slack/commands', (req, res) => {
  const { command, text, user_id } = req.body;
  
  switch (command) {
    case '/status':
      return res.json({
        response_type: 'ephemeral',
        text: 'System is operational'
      });
    case '/list-tickets':
      // Handle ticket listing
      break;
  }
});
```

## Best Practices

### Route Organization

1. **Group related functionality**: Keep related endpoints under the same base route
2. **Use consistent naming**: Follow RESTful conventions where applicable
3. **Separate concerns**: Authentication, API operations, and webhooks are clearly separated
4. **Maintain hierarchy**: Sub-routes should logically belong to their parent

### Error Handling

1. **Consistent error responses**: All endpoints return standardized error formats
2. **Proper HTTP status codes**: Use appropriate status codes for different error types
3. **Detailed error messages**: Provide helpful error messages for debugging

### Security

1. **Authentication required**: All sensitive endpoints require proper authentication
2. **Signature verification**: Webhooks must verify signatures
3. **Input validation**: All inputs are validated before processing

## Future Considerations

### Potential Enhancements

1. **API Versioning**: Consider adding version prefixes (e.g., `/v1/clickup/...`)
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Caching**: Add caching for frequently accessed data
4. **Monitoring**: Add detailed logging and metrics

### Zendesk Integration

Similar to ClickUp, Zendesk integration could be organized under `/zendesk` routes:

```
/zendesk
├── /auth              # Zendesk OAuth endpoints
├── /tickets           # Ticket management
├── /users             # User management
└── /webhook           # Zendesk webhooks (moved from /webhook/zendesk)
```

This would provide consistent organization across all integrations.

## Troubleshooting

### Common Issues

1. **404 Not Found**: Check if you're using the new route structure
2. **401 Unauthorized**: Ensure proper Authorization header is included
3. **400 Bad Request**: Verify request payload format and required fields

### Debug Endpoints

- `GET /auth/debug`: Provides OAuth debugging information
- `GET /auth/test`: Tests OAuth functionality
- `GET /health/detailed`: Provides detailed system health information

---

**Last Updated**: 2025-01-16  
**Version**: 1.0.0  
**Maintainer**: Development Team