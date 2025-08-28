/**
 * @ai-metadata
 * @component: DocsRoutes
 * @description: API documentation routes providing OpenAPI schema and interactive docs
 * @last-update: 2025-01-27
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/docs-routes.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../utils/route-discovery.ts"]
 * @tests: ["./tests/docs.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Provides API documentation endpoints for the Zendesk-ClickUp automation system"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { Hono } from 'hono';
import { createRouteDiscovery } from '../utils/route-discovery';

const docs = new Hono();

// OpenAPI JSON schema endpoint
docs.get('/openapi.json', (c) => {
  const routeDiscovery = createRouteDiscovery({
    metadata: {
      title: 'Zendesk-ClickUp Automation API',
      version: (c.env as any).APP_VERSION || '1.0.0',
      description: 'Bidirectional synchronization between Zendesk and ClickUp platforms',
      baseUrl: c.req.url.replace(c.req.path, '').replace('/docs', '')
    }
  });

  const openApiSchema = routeDiscovery.getOpenApiSchema();
  
  return c.json(openApiSchema, 200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  });
});

// Interactive API documentation (HTML)
docs.get('/', (c) => {
  const baseUrl = c.req.url.replace(c.req.path, '').replace('/docs', '');
  const openApiUrl = `${baseUrl}/docs/openapi.json`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zendesk-ClickUp Automation API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
          --primary-color: #2563eb;
          --secondary-color: #64748b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --error-color: #ef4444;
          --background-color: #f8fafc;
          --surface-color: #ffffff;
          --border-color: #e2e8f0;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
        }
        
        html { 
          box-sizing: border-box; 
          overflow: -moz-scrollbars-vertical; 
          overflow-y: scroll; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        *, *:before, *:after { box-sizing: inherit; }
        
        body { 
          margin: 0; 
          background: var(--background-color);
          color: var(--text-primary);
          line-height: 1.6;
        }
        
        .api-header {
          background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
          color: white;
          padding: 2rem 0;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .api-header h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        
        .api-header p {
          margin: 0.5rem 0 0;
          font-size: 1.125rem;
          opacity: 0.9;
          font-weight: 400;
        }
        
        .api-nav {
          background: var(--surface-color);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        
        .nav-link:hover {
          color: var(--primary-color);
          background: #eff6ff;
        }
        
        .nav-link.active {
          color: var(--primary-color);
          background: #eff6ff;
        }
        
        .swagger-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { 
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }
        
        .swagger-ui .scheme-container {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .swagger-ui .opblock {
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--success-color);
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary {
          background: rgba(245, 158, 11, 0.1);
          border-color: var(--warning-color);
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error-color);
        }
        
        .feature-badges {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
          flex-wrap: wrap;
        }
        
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .badge.primary {
          background: #eff6ff;
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-secondary);
        }
        
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid var(--border-color);
          border-top: 2px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .api-header h1 { font-size: 2rem; }
          .nav-container { flex-direction: column; gap: 1rem; }
          .swagger-container { padding: 0 0.5rem; }
        }
    </style>
</head>
<body>
    <header class="api-header">
        <h1>🔗 Zendesk-ClickUp Automation API</h1>
        <p>Bidirectional synchronization between Zendesk and ClickUp platforms</p>
        <div class="feature-badges">
            <span class="badge primary">🔒 OAuth 2.0</span>
            <span class="badge primary">🌐 CORS Enabled</span>
            <span class="badge primary">📊 Real-time Webhooks</span>
            <span class="badge primary">🤖 AI-Powered Routing</span>
        </div>
    </header>
    
    <nav class="api-nav">
        <div class="nav-container">
            <a href="${baseUrl}/" class="nav-link">🏠 Home</a>
            <a href="${baseUrl}/docs" class="nav-link active">📚 Documentation</a>
            <a href="${baseUrl}/docs/openapi.json" class="nav-link">📄 OpenAPI Schema</a>
            <a href="${baseUrl}/health" class="nav-link">💚 Health Check</a>
            <a href="${baseUrl}/docs/status" class="nav-link">📊 API Status</a>
        </div>
    </nav>
    
    <div class="swagger-container">
        <div id="loading" class="loading">
            <div class="spinner"></div>
            Loading API documentation...
        </div>
        <div id="swagger-ui" style="display: none;"></div>
    </div>
    
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const loadingEl = document.getElementById('loading');
            const swaggerEl = document.getElementById('swagger-ui');
            
            SwaggerUIBundle({
                url: '${openApiUrl}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                docExpansion: 'list',
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                displayOperationId: false,
                showExtensions: true,
                showCommonExtensions: true,
                onComplete: function() {
                    console.log('Swagger UI loaded successfully');
                    loadingEl.style.display = 'none';
                    swaggerEl.style.display = 'block';
                    
                    // Add custom styling after load
                    setTimeout(() => {
                        const style = document.createElement('style');
                        style.textContent = \`
                            .swagger-ui .info .title {
                                font-family: 'Inter', sans-serif !important;
                                font-weight: 600 !important;
                            }
                        \`;
                        document.head.appendChild(style);
                    }, 100);
                },
                onFailure: function(error) {
                    console.error('Failed to load Swagger UI:', error);
                    loadingEl.innerHTML = \`
                        <div style="text-align: center; color: var(--error-color);">
                            <h3>❌ Failed to load API documentation</h3>
                            <p>Please try refreshing the page or contact support.</p>
                            <details style="margin-top: 1rem; text-align: left;">
                                <summary>Error details</summary>
                                <pre style="background: #f1f5f9; padding: 1rem; border-radius: 0.375rem; margin-top: 0.5rem; overflow: auto;">\${JSON.stringify(error, null, 2)}</pre>
                            </details>
                        </div>
                    \`;
                }
            });
        };
    </script>
</body>
</html>`;

  return c.html(html);
});

// API status and metadata endpoint
docs.get('/status', (c) => {
  const routeDiscovery = createRouteDiscovery();
  const documentation = routeDiscovery.getApiDocumentation();
  
  return c.json({
    status: 'operational',
    version: (c.env as any).APP_VERSION || '1.0.0',
    environment: (c.env as any).ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      total: documentation.categories.reduce((sum, cat) => sum + cat.endpoints.length, 0),
      byCategory: documentation.categories.map(cat => ({
        category: cat.name,
        count: cat.endpoints.length,
        description: cat.description
      }))
    },
    features: {
      authentication: ['Bearer Token', 'OAuth 2.0', 'Webhook Signatures'],
      integrations: ['Zendesk', 'ClickUp', 'Slack'],
      capabilities: ['Bidirectional Sync', 'Real-time Webhooks', 'AI-Powered Routing']
    },
    links: {
      documentation: '/docs',
      openapi: '/docs/openapi.json',
      health: '/health',
      root: '/'
    }
  });
});

export { docs as docsRoutes };