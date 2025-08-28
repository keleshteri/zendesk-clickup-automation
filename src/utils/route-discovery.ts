/**
 * @ai-metadata
 * @component: RouteDiscovery
 * @description: Dynamic route discovery utility for automatic endpoint documentation
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/route-discovery.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono"]
 * @tests: ["./tests/utils/route-discovery.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Utility for automatically discovering and documenting API endpoints"
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

import type { Hono } from 'hono';
import type { Env } from '../types/env';
import type {
  EndpointInfo,
  EndpointCategory,
  RouteDiscoveryConfig,
  RouteMetadata
} from '../interfaces';
import { DEFAULT_CATEGORIES, ENDPOINT_REGISTRY } from '../interfaces';

/**
 * Re-export interfaces for backward compatibility
 */
export type {
  EndpointInfo,
  EndpointCategory,
  RouteDiscoveryConfig,
  RouteMetadata
} from '../interfaces';

/**
 * Re-export constants for backward compatibility
 */
export { DEFAULT_CATEGORIES, ENDPOINT_REGISTRY } from '../interfaces';

// All endpoint definitions have been moved to '../interfaces/endpoint-categories.ts'
// This file now focuses on route discovery functionality

/**
 * Route discovery utility class
 */
export class RouteDiscovery {
  private config: RouteDiscoveryConfig;

  constructor(config?: Partial<RouteDiscoveryConfig>) {
    this.config = {
      categories: DEFAULT_CATEGORIES,
      endpoints: ENDPOINT_REGISTRY,
      metadata: {
        title: 'Zendesk-ClickUp Automation API',
        version: '1.0.0',
        description: 'Bidirectional synchronization between Zendesk and ClickUp platforms',
        ...config?.metadata
      },
      ...config
    };
  }

  /**
   * Get all endpoints grouped by category
   */
  getEndpointsByCategory(): Record<string, EndpointInfo[]> {
    const grouped: Record<string, EndpointInfo[]> = {};
    
    for (const endpoint of this.config.endpoints) {
      if (!grouped[endpoint.category]) {
        grouped[endpoint.category] = [];
      }
      grouped[endpoint.category].push(endpoint);
    }
    
    return grouped;
  }

  /**
   * Get formatted endpoint list for API responses
   */
  getFormattedEndpoints(): string[] {
    const grouped = this.getEndpointsByCategory();
    const formatted: string[] = [];
    
    // Sort categories by order
    const sortedCategories = Object.entries(this.config.categories)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key);
    
    for (const categoryKey of sortedCategories) {
      const category = this.config.categories[categoryKey];
      const endpoints = grouped[categoryKey] || [];
      
      if (endpoints.length > 0) {
        formatted.push(`--- ${category.name} ---`);
        
        for (const endpoint of endpoints) {
          let line = `${endpoint.method} ${endpoint.path}`;
          const authBadge = endpoint.authentication && endpoint.authentication !== 'none' ? ' 🔒' : '';
          const corsBadge = endpoint.cors === 'public' ? ' 🌐' : endpoint.cors === 'webhook' ? ' 🔗' : ' 🔐';
          line += authBadge + corsBadge;
          if (endpoint.deprecated) {
            line += ' (DEPRECATED)';
          }
          formatted.push(line);
        }
      }
    }
    
    return formatted;
  }

  /**
   * Get enhanced formatted endpoints with rich metadata
   */
  getEnhancedFormattedEndpoints(): Array<{
    category: string;
    description: string;
    icon: string;
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
      authentication: string;
      cors: string;
      tags: string[];
      deprecated: boolean;
      badges: {
        auth: string;
        cors: string;
        method: string;
      };
    }>;
  }> {
    const grouped = this.getEndpointsByCategory();
    
    // Sort categories by order
    const sortedCategories = Object.entries(this.config.categories)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key);
    
    return sortedCategories.map(categoryKey => {
      const category = this.config.categories[categoryKey];
      const endpoints = grouped[categoryKey] || [];
      
      return {
        category: category.name,
        description: category.description,
        icon: category.icon || '📁',
        endpoints: endpoints.map(endpoint => ({
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.description || '',
          authentication: endpoint.authentication || 'none',
          cors: endpoint.cors || 'restricted',
          tags: endpoint.tags || [],
          deprecated: endpoint.deprecated || false,
          badges: {
            auth: endpoint.authentication && endpoint.authentication !== 'none' ? '🔒 Auth Required' : '🔓 Public',
            cors: endpoint.cors === 'public' ? '🌐 CORS: Public' : 
                  endpoint.cors === 'webhook' ? '🔗 CORS: Webhook' : '🔐 CORS: Restricted',
            method: this.getMethodBadge(endpoint.method)
          }
        }))
      };
    }).filter(category => category.endpoints.length > 0);
  }

  /**
   * Get method badge with color coding
   */
  private getMethodBadge(method: string): string {
    const badges = {
      'GET': '🟢 GET',
      'POST': '🟡 POST',
      'PUT': '🔵 PUT',
      'DELETE': '🔴 DELETE',
      'PATCH': '🟠 PATCH'
    };
    return badges[method as keyof typeof badges] || `⚪ ${method}`;
  }

  /**
   * Get API documentation object
   */
  getApiDocumentation() {
    const grouped = this.getEndpointsByCategory();
    const totalEndpoints = Object.values(grouped).reduce((sum, endpoints) => sum + endpoints.length, 0);
    
    return {
      ...this.config.metadata,
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints,
        totalCategories: Object.keys(grouped).length,
        authenticationMethods: ['Bearer Token', 'OAuth 2.0', 'Webhook Signatures'],
        supportedFormats: ['JSON', 'Form Data', 'Multipart'],
        corsSupport: ['Public', 'Restricted', 'Webhook-specific']
      },
      categories: Object.entries(this.config.categories)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([key, category]) => {
          const endpoints = grouped[key] || [];
          const authEndpoints = endpoints.filter(e => e.authentication && e.authentication !== 'none').length;
          const publicEndpoints = endpoints.filter(e => e.cors === 'public').length;
          
          return {
            key,
            ...category,
            stats: {
              total: endpoints.length,
              authenticated: authEndpoints,
              public: publicEndpoints,
              methods: [...new Set(endpoints.map(e => e.method))]
            },
            endpoints: endpoints.map(endpoint => ({
              ...endpoint,
              metadata: {
                requiresAuth: endpoint.authentication && endpoint.authentication !== 'none',
                isPublic: endpoint.cors === 'public',
                isWebhook: endpoint.cors === 'webhook',
                hasDescription: !!endpoint.description,
                hasTags: !!(endpoint.tags && endpoint.tags.length > 0)
              }
            }))
          };
        }),
      navigation: {
        quickLinks: [
          { name: 'Health Check', path: '/health', description: 'API health status' },
          { name: 'Documentation', path: '/docs', description: 'Interactive API docs' },
          { name: 'OpenAPI Schema', path: '/docs/openapi.json', description: 'OpenAPI 3.0 specification' }
        ],
        categories: Object.entries(this.config.categories)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([key, category]) => ({
            key,
            name: category.name,
            icon: category.icon,
            anchor: `#${key}`,
            count: (grouped[key] || []).length
          }))
          .filter(cat => cat.count > 0)
      }
    };
  }

  /**
   * Get OpenAPI-compatible schema
   */
  getOpenApiSchema() {
    const grouped = this.getEndpointsByCategory();
    const metadata: RouteMetadata = this.config.metadata || {};

    const paths: Record<string, any> = {};
    const tags: Array<{ name: string; description: string; externalDocs?: any }> = [];
    const components: any = {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication'
        },
        oAuth2: {
          type: 'oauth2',
          description: 'OAuth 2.0 authentication',
          flows: {
            authorizationCode: {
              authorizationUrl: '/clickup/auth',
              tokenUrl: '/clickup/auth/callback',
              scopes: {
                'read': 'Read access to resources',
                'write': 'Write access to resources'
              }
            }
          }
        },
        webhookSignature: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Webhook-Signature',
          description: 'Webhook signature verification'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message', 'timestamp'],
          properties: {
            error: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-27T10:30:00Z'
            },
            path: {
              type: 'string',
              example: '/api/endpoint'
            },
            method: {
              type: 'string',
              example: 'GET'
            }
          }
        },
        Success: {
          type: 'object',
          required: ['success', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            meta: {
              type: 'object',
              description: 'Additional metadata'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-27T10:30:00Z'
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            uptime: {
              type: 'number',
              description: 'Uptime in seconds'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: true,
                message: 'Invalid request parameters',
                timestamp: '2025-01-27T10:30:00Z'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: true,
                message: 'Authentication required',
                timestamp: '2025-01-27T10:30:00Z'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: true,
                message: 'Insufficient permissions',
                timestamp: '2025-01-27T10:30:00Z'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: true,
                message: 'Resource not found',
                timestamp: '2025-01-27T10:30:00Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: true,
                message: 'Internal server error',
                timestamp: '2025-01-27T10:30:00Z'
              }
            }
          }
        }
      }
    };

    // Generate tags from categories
    Object.entries(this.config.categories).forEach(([key, category]) => {
      const endpoints = grouped[key] || [];
      if (endpoints.length > 0) {
        tags.push({
          name: category.name,
          description: category.description || `${category.name} related endpoints`
        });
      }
    });

    // Generate paths
    Object.values(grouped).flat().forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const method = endpoint.method.toLowerCase();
      const operationId = `${method}${endpoint.path.replace(/[^a-zA-Z0-9]/g, '').replace(/^/, '')}`;
      
      const operation: any = {
        tags: [this.config.categories[endpoint.category]?.name || endpoint.category],
        summary: endpoint.description || `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description || `${endpoint.method} operation for ${endpoint.path}`,
        operationId,
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      };

      // Add security based on authentication requirements
      if (endpoint.authentication && endpoint.authentication !== 'none') {
        switch (endpoint.authentication) {
          case 'bearer':
            operation.security = [{ bearerAuth: [] }];
            break;
          case 'oauth':
            operation.security = [{ oAuth2: ['read', 'write'] }];
            break;
          case 'webhook':
            operation.security = [{ webhookSignature: [] }];
            break;
          default:
            operation.security = [{ bearerAuth: [] }];
        }
      }

      // Add request body for POST/PUT/PATCH methods
      if (['post', 'put', 'patch'].includes(method)) {
        operation.requestBody = {
          description: 'Request payload',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Request data'
              }
            },
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                description: 'Form data'
              }
            }
          }
        };
      }

      // Add CORS information
      if (endpoint.cors) {
        operation['x-cors-policy'] = endpoint.cors;
      }

      // Add tags information
      if (endpoint.tags && endpoint.tags.length > 0) {
        operation['x-tags'] = endpoint.tags;
      }

      // Mark deprecated endpoints
      if (endpoint.deprecated) {
        operation.deprecated = true;
      }

      paths[endpoint.path][method] = operation;
    });

    return {
      openapi: '3.0.3',
      info: {
        title: metadata.title || 'API Documentation',
        version: metadata.version || '1.0.0',
        description: metadata.description || 'API endpoints documentation',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        },
        termsOfService: metadata.baseUrl ? `${metadata.baseUrl}/terms` : undefined
      },
      servers: [
        {
          url: metadata.baseUrl || '',
          description: 'Production API Server'
        },
        {
          url: 'http://localhost:8787',
          description: 'Development Server'
        }
      ],
      tags: tags.sort((a, b) => a.name.localeCompare(b.name)),
      paths,
      components,
      security: [
        {},
        { bearerAuth: [] },
        { oAuth2: ['read'] }
      ],
      externalDocs: {
        description: 'Find more info here',
        url: metadata.baseUrl ? `${metadata.baseUrl}/docs` : '/docs'
      }
    };
  }

  /**
   * Get security requirement for OpenAPI
   */
  private getSecurityRequirement(auth?: string): any[] {
    switch (auth) {
      case 'bearer':
        return [{ bearerAuth: [] }];
      case 'webhook':
        return [{ webhookAuth: [] }];
      case 'oauth':
        return [{ oauthAuth: ['read', 'write'] }];
      case 'none':
      default:
        return [];
    }
  }

  /**
   * Add or update an endpoint
   */
  addEndpoint(endpoint: EndpointInfo): void {
    const existingIndex = this.config.endpoints.findIndex(
      e => e.method === endpoint.method && e.path === endpoint.path
    );
    
    if (existingIndex >= 0) {
      this.config.endpoints[existingIndex] = endpoint;
    } else {
      this.config.endpoints.push(endpoint);
    }
  }

  /**
   * Remove an endpoint
   */
  removeEndpoint(method: string, path: string): boolean {
    const index = this.config.endpoints.findIndex(
      e => e.method === method && e.path === path
    );
    
    if (index >= 0) {
      this.config.endpoints.splice(index, 1);
      return true;
    }
    
    return false;
  }
}

/**
 * Create a default route discovery instance
 */
export function createRouteDiscovery(config?: Partial<RouteDiscoveryConfig>): RouteDiscovery {
  return new RouteDiscovery(config);
}

/**
 * Get formatted endpoints for backward compatibility
 */
export function getFormattedEndpoints(): string[] {
  const discovery = createRouteDiscovery();
  return discovery.getFormattedEndpoints();
}

// Export default instance
export const routeDiscovery = createRouteDiscovery();

/**
 * Add an endpoint to the default route discovery instance
 */
export function addEndpoint(endpoint: EndpointInfo): void {
  routeDiscovery.addEndpoint(endpoint);
}

/**
 * Remove an endpoint from the default route discovery instance
 */
export function removeEndpoint(method: string, path: string): boolean {
  return routeDiscovery.removeEndpoint(method, path);
}