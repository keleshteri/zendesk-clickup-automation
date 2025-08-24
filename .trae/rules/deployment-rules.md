# Deployment Rules

## Overview
This document outlines CI/CD pipeline standards, deployment procedures, and infrastructure requirements for the Zendesk-ClickUp Automation project.

## CI/CD Pipeline Standards

### Pipeline Structure
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Run SAST scan
        uses: github/codeql-action/analyze@v2

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Build Docker image
        run: |
          docker build -t zendesk-clickup-automation:${{ github.sha }} .
          docker tag zendesk-clickup-automation:${{ github.sha }} zendesk-clickup-automation:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Deployment commands for staging
          echo "Deploying to staging environment"

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Deployment commands for production
          echo "Deploying to production environment"
```

### Quality Gates

#### Pre-deployment Checks
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code coverage ≥ 80%
- [ ] No high/critical security vulnerabilities
- [ ] TypeScript compilation successful
- [ ] Linting passes with no errors
- [ ] Build completes successfully
- [ ] Docker image builds without errors

#### Deployment Approval
- Staging: Automatic deployment on develop branch
- Production: Manual approval required
- Hotfixes: Emergency approval process

## Environment Configuration

### Environment Hierarchy
1. **Development** - Local development environment
2. **Staging** - Pre-production testing environment
3. **Production** - Live production environment

### Environment Variables
```bash
# Development (.env.development)
NODE_ENV=development
LOG_LEVEL=debug
ZENDESK_SUBDOMAIN=dev-subdomain
ZENDESK_EMAIL=dev@example.com
ZENDESK_TOKEN=dev-token
CLICKUP_API_KEY=dev-api-key
DATABASE_URL=postgresql://dev:dev@localhost:5432/zendesk_clickup_dev
REDIS_URL=redis://localhost:6379

# Staging (.env.staging)
NODE_ENV=staging
LOG_LEVEL=info
ZENDESK_SUBDOMAIN=staging-subdomain
ZENDESK_EMAIL=staging@example.com
ZENDESK_TOKEN=${STAGING_ZENDESK_TOKEN}
CLICKUP_API_KEY=${STAGING_CLICKUP_API_KEY}
DATABASE_URL=${STAGING_DATABASE_URL}
REDIS_URL=${STAGING_REDIS_URL}

# Production (.env.production)
NODE_ENV=production
LOG_LEVEL=warn
ZENDESK_SUBDOMAIN=${PROD_ZENDESK_SUBDOMAIN}
ZENDESK_EMAIL=${PROD_ZENDESK_EMAIL}
ZENDESK_TOKEN=${PROD_ZENDESK_TOKEN}
CLICKUP_API_KEY=${PROD_CLICKUP_API_KEY}
DATABASE_URL=${PROD_DATABASE_URL}
REDIS_URL=${PROD_REDIS_URL}
```

### Secret Management
- Use GitHub Secrets for sensitive environment variables
- Implement secret rotation policies
- Never commit secrets to version control
- Use different secrets for each environment

## Docker Configuration

### Dockerfile
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

### Docker Compose (Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zendesk_clickup_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Database Migrations

### Migration Strategy
- Use database migration tools (e.g., Prisma, TypeORM)
- Version all database changes
- Test migrations in staging before production
- Implement rollback procedures

### Migration Pipeline
```typescript
// migrations/001_initial_schema.ts
export async function up(db: Database): Promise<void> {
  await db.schema.createTable('sync_records', (table) => {
    table.uuid('id').primary();
    table.string('zendesk_ticket_id').notNullable();
    table.string('clickup_task_id').nullable();
    table.enum('status', ['pending', 'synced', 'failed']).notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    
    table.index(['zendesk_ticket_id']);
    table.index(['status']);
  });
}

export async function down(db: Database): Promise<void> {
  await db.schema.dropTable('sync_records');
}
```

## Monitoring and Observability

### Health Checks
```typescript
// src/health/health.controller.ts
export class HealthController {
  @Get('/health')
  async getHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkZendeskAPI(),
      this.checkClickUpAPI()
    ]);

    const status = checks.every(check => check.status === 'fulfilled') 
      ? 'healthy' 
      : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckStatus(checks[0]),
        redis: this.getCheckStatus(checks[1]),
        zendesk: this.getCheckStatus(checks[2]),
        clickup: this.getCheckStatus(checks[3])
      }
    };
  }
}
```

### Logging Configuration
```typescript
// src/config/logger.config.ts
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
};
```

### Metrics Collection
```typescript
// src/metrics/metrics.service.ts
export class MetricsService {
  private readonly syncCounter = new Counter({
    name: 'sync_operations_total',
    help: 'Total number of sync operations',
    labelNames: ['status', 'direction']
  });

  private readonly syncDuration = new Histogram({
    name: 'sync_duration_seconds',
    help: 'Duration of sync operations',
    labelNames: ['direction']
  });

  recordSyncOperation(status: string, direction: string): void {
    this.syncCounter.inc({ status, direction });
  }

  recordSyncDuration(duration: number, direction: string): void {
    this.syncDuration.observe({ direction }, duration);
  }
}
```

## Rollback Procedures

### Application Rollback
1. Identify the last known good version
2. Deploy previous Docker image
3. Verify application functionality
4. Monitor for issues

### Database Rollback
1. Stop application instances
2. Run rollback migrations
3. Restore from backup if necessary
4. Restart application with previous version

### Emergency Procedures
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

set -e

PREVIOUS_VERSION=${1:-"latest-stable"}

echo "Starting emergency rollback to version: $PREVIOUS_VERSION"

# Stop current application
docker-compose down

# Deploy previous version
docker pull zendesk-clickup-automation:$PREVIOUS_VERSION
docker tag zendesk-clickup-automation:$PREVIOUS_VERSION zendesk-clickup-automation:latest

# Start application
docker-compose up -d

# Verify health
sleep 30
curl -f http://localhost:3000/health || {
  echo "Health check failed after rollback"
  exit 1
}

echo "Rollback completed successfully"
```

## Performance Monitoring

### Application Performance Monitoring (APM)
- Implement distributed tracing
- Monitor response times and throughput
- Track error rates and exceptions
- Set up alerting for performance degradation

### Infrastructure Monitoring
- CPU and memory usage
- Disk space and I/O
- Network connectivity
- Database performance

## Security in Deployment

### Container Security
- Use minimal base images
- Run as non-root user
- Scan images for vulnerabilities
- Keep base images updated

### Network Security
- Use HTTPS/TLS for all communications
- Implement proper firewall rules
- Use VPN for internal communications
- Regular security audits

## AI Assistant Deployment Rules

### Deployment Checklist for AI
- [ ] All quality gates pass
- [ ] Environment variables configured correctly
- [ ] Database migrations tested
- [ ] Health checks implemented
- [ ] Monitoring and logging configured
- [ ] Security scans completed
- [ ] Rollback procedures documented
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Stakeholders notified

### Automated Deployment Guidelines
- Generate deployment scripts with proper error handling
- Include comprehensive health checks
- Implement gradual rollout strategies
- Ensure proper secret management
- Add monitoring and alerting configurations

## Deployment Environments

### Local Development
- Docker Compose for local services
- Hot reloading for development
- Debug logging enabled
- Mock external services

### Staging Environment
- Production-like configuration
- Real external service integrations
- Performance testing
- User acceptance testing

### Production Environment
- High availability setup
- Load balancing
- Auto-scaling capabilities
- Comprehensive monitoring
- Backup and disaster recovery

## Compliance and Governance

### Change Management
- All changes must go through code review
- Deployment approvals required for production
- Change logs maintained
- Rollback plans documented

### Audit Trail
- Log all deployment activities
- Track who deployed what and when
- Maintain deployment history
- Regular compliance reviews

---

**Note**: These deployment rules should be regularly reviewed and updated to reflect changes in infrastructure, security requirements, and operational procedures.