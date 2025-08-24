# API Design Standards

## Overview
This document outlines REST API design standards, integration patterns, and best practices for the Zendesk-ClickUp Automation project.

## REST API Design Principles

### Resource-Based URLs
Use nouns to represent resources, not verbs:

```typescript
// ✅ GOOD - Resource-based URLs
GET    /api/v1/tickets
GET    /api/v1/tickets/123
POST   /api/v1/tickets
PUT    /api/v1/tickets/123
DELETE /api/v1/tickets/123

// ❌ BAD - Verb-based URLs
GET    /api/v1/getTickets
POST   /api/v1/createTicket
POST   /api/v1/updateTicket
```

### HTTP Methods
Use appropriate HTTP methods for different operations:

- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources
- **PUT**: Update entire resources (idempotent)
- **PATCH**: Partial updates
- **DELETE**: Remove resources (idempotent)

### Status Codes
Use standard HTTP status codes consistently:

```typescript
// Success responses
200 OK          // Successful GET, PUT, PATCH
201 Created     // Successful POST
204 No Content  // Successful DELETE

// Client error responses
400 Bad Request     // Invalid request data
401 Unauthorized    // Authentication required
403 Forbidden       // Access denied
404 Not Found       // Resource doesn't exist
409 Conflict        // Resource conflict
422 Unprocessable   // Validation errors

// Server error responses
500 Internal Server Error  // Unexpected server error
502 Bad Gateway           // External service error
503 Service Unavailable   // Temporary unavailability
```

## API Structure

### Versioning
Use URL path versioning for major API versions:

```typescript
// API versioning
/api/v1/tickets
/api/v2/tickets

// Version configuration
export const API_CONFIG = {
  currentVersion: 'v1',
  supportedVersions: ['v1'],
  deprecatedVersions: [],
  baseUrl: '/api'
} as const;
```

### Request/Response Format
Use JSON for all API communications:

```typescript
// Request headers
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>

// Response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### Pagination
Implement consistent pagination for list endpoints:

```typescript
interface PaginationParams {
  page?: number;        // Page number (1-based)
  limit?: number;       // Items per page (max 100)
  sort?: string;        // Sort field
  order?: 'asc' | 'desc'; // Sort order
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Example endpoint
GET /api/v1/tickets?page=1&limit=20&sort=createdAt&order=desc
```

### Filtering and Search
Provide flexible filtering options:

```typescript
// Query parameters for filtering
GET /api/v1/tickets?status=open&priority=high&assignee=user123
GET /api/v1/tickets?search=bug&createdAfter=2024-01-01
GET /api/v1/tickets?tags=urgent,customer

interface FilterParams {
  status?: TicketStatus[];
  priority?: Priority[];
  assignee?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
  tags?: string[];
}
```

## Data Models

### Request/Response DTOs
Define clear data transfer objects:

```typescript
// Ticket DTOs
export interface CreateTicketDto {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'pending' | 'solved' | 'closed';
  assigneeId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface TicketResponseDto {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'pending' | 'solved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: UserResponseDto;
  requester: UserResponseDto;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  url: string;
}
```

### Validation
Implement comprehensive input validation:

```typescript
import { IsString, IsEnum, IsOptional, Length, IsArray } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  @Length(1, 10000)
  description: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

## Error Handling

### Error Response Format
Standardize error responses:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
  path: string;
}

// Validation error example
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "title": ["Title is required"],
      "priority": ["Priority must be one of: low, medium, high, urgent"]
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456",
    "version": "v1"
  }
}
```

### Error Codes
Define consistent error codes:

```typescript
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  TICKET_ALREADY_CLOSED: 'TICKET_ALREADY_CLOSED',
  INVALID_ASSIGNMENT: 'INVALID_ASSIGNMENT',
  SYNC_CONFLICT: 'SYNC_CONFLICT'
} as const;
```

## Authentication & Authorization

### API Key Authentication
```typescript
// API key in header
Authorization: Bearer <api-key>

// API key validation middleware
export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required'
      }
    });
  }
  
  const apiKey = authHeader.substring(7);
  const isValid = await validateApiKeyInDatabase(apiKey);
  
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key'
      }
    });
  }
  
  next();
}
```

### Role-Based Access Control
```typescript
interface UserContext {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  permissions: string[];
}

// Permission-based authorization
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    next();
  };
}
```

## Rate Limiting

### Rate Limiting Configuration
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded for this endpoint'
    }
  }
});
```

## External API Integration

### Zendesk API Integration
```typescript
export class ZendeskApiClient {
  private readonly baseUrl: string;
  private readonly auth: string;
  
  constructor(config: ZendeskConfig) {
    this.baseUrl = `https://${config.subdomain}.zendesk.com/api/v2`;
    this.auth = Buffer.from(`${config.email}/token:${config.token}`).toString('base64');
  }
  
  async createTicket(ticketData: CreateZendeskTicketDto): Promise<ZendeskTicket> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tickets.json`,
        { ticket: ticketData },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data.ticket;
    } catch (error) {
      throw new ExternalServiceError('Failed to create Zendesk ticket', error);
    }
  }
  
  async getTicket(ticketId: string): Promise<ZendeskTicket> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tickets/${ticketId}.json`,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`
          },
          timeout: 30000
        }
      );
      
      return response.data.ticket;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundError(`Zendesk ticket ${ticketId} not found`);
      }
      throw new ExternalServiceError('Failed to get Zendesk ticket', error);
    }
  }
}
```

### ClickUp API Integration
```typescript
export class ClickUpApiClient {
  private readonly baseUrl = 'https://api.clickup.com/api/v2';
  private readonly apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async createTask(listId: string, taskData: CreateClickUpTaskDto): Promise<ClickUpTask> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/list/${listId}/task`,
        taskData,
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data;
    } catch (error) {
      throw new ExternalServiceError('Failed to create ClickUp task', error);
    }
  }
}
```

### Retry Logic
```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 'exponential' } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
        
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Retry logic failed unexpectedly');
}
```

## API Documentation

### OpenAPI/Swagger Specification
```typescript
// swagger.config.ts
export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zendesk-ClickUp Automation API',
      version: '1.0.0',
      description: 'API for synchronizing tickets between Zendesk and ClickUp'
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/controllers/*.ts']
};
```

### API Endpoint Documentation
```typescript
/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get all tickets
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 */
```

## Testing APIs

### API Testing Strategy
```typescript
// API integration tests
describe('Tickets API', () => {
  let app: Application;
  let server: Server;
  
  beforeAll(async () => {
    app = await createTestApp();
    server = app.listen(0);
  });
  
  afterAll(async () => {
    await server.close();
  });
  
  describe('POST /api/v1/tickets', () => {
    it('should create a new ticket', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high'
      };
      
      const response = await request(app)
        .post('/api/v1/tickets')
        .send(ticketData)
        .set('Authorization', 'Bearer test-api-key')
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(ticketData.title);
    });
    
    it('should return validation error for invalid data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        priority: 'invalid' // Invalid: not in enum
      };
      
      const response = await request(app)
        .post('/api/v1/tickets')
        .send(invalidData)
        .set('Authorization', 'Bearer test-api-key')
        .expect(422);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## AI Assistant API Rules

### API Generation Guidelines
- Generate RESTful endpoints following standard conventions
- Include comprehensive input validation
- Implement proper error handling and status codes
- Add rate limiting to all endpoints
- Include API documentation comments
- Generate corresponding test files

### API Quality Checklist for AI
- [ ] RESTful URL structure
- [ ] Appropriate HTTP methods and status codes
- [ ] Comprehensive input validation
- [ ] Consistent error response format
- [ ] Authentication and authorization
- [ ] Rate limiting implemented
- [ ] Pagination for list endpoints
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Integration tests included
- [ ] External API error handling
- [ ] Retry logic for external calls
- [ ] Proper logging and monitoring

## Performance Considerations

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### Database Optimization
- Use database indexes for frequently queried fields
- Implement connection pooling
- Use read replicas for read-heavy operations
- Optimize N+1 query problems

---

**Note**: These API design standards should be consistently applied across all endpoints to ensure a cohesive and maintainable API surface.