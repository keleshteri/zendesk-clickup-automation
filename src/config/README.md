# Configuration Management 🔧

This directory contains centralized configuration files, constants, and environment-specific settings for the Zendesk-ClickUp automation system. It provides a structured approach to managing application settings, API configurations, and system parameters.

## Purpose

The Config directory provides:
- Centralized configuration management
- Environment-specific settings
- API endpoint and credential configuration
- System constants and default values
- Feature flags and toggles
- Validation schemas for configuration
- Runtime configuration loading

## File Structure

```
config/
├── index.ts              # Main configuration loader and exports
├── app.ts               # Application-level configuration
├── database.ts          # Database connection settings
├── integrations.ts      # Third-party integration configs
├── agents.ts            # Agent system configuration
├── security.ts          # Security and authentication settings
├── monitoring.ts        # Logging and monitoring configuration
├── features.ts          # Feature flags and toggles
├── constants.ts         # System constants and enums
├── validation.ts        # Configuration validation schemas
└── environments/        # Environment-specific configurations
    ├── development.ts
    ├── staging.ts
    ├── production.ts
    └── test.ts
```

## Core Configuration Categories

### Application Configuration (`app.ts`)
Core application settings and runtime parameters:

```typescript
import { Environment, LogLevel } from '../types';

export interface AppConfig {
  name: string;
  version: string;
  environment: Environment;
  port: number;
  host: string;
  baseUrl: string;
  debug: boolean;
  logLevel: LogLevel;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  session: SessionConfig;
  upload: UploadConfig;
}

interface CorsConfig {
  enabled: boolean;
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

interface SessionConfig {
  secret: string;
  name: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  tempPath: string;
}

export const appConfig: AppConfig = {
  name: process.env.APP_NAME || 'Zendesk-ClickUp Automation',
  version: process.env.APP_VERSION || '1.0.0',
  environment: (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT,
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  debug: process.env.DEBUG === 'true',
  logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    name: process.env.SESSION_NAME || 'sessionId',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json'
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    tempPath: process.env.TEMP_PATH || './temp'
  }
};
```

### Database Configuration (`database.ts`)
Database connection and ORM settings:

```typescript
export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool: PoolConfig;
  migrations: MigrationConfig;
  logging: boolean;
  synchronize: boolean;
  cache: CacheConfig;
}

interface PoolConfig {
  min: number;
  max: number;
  idle: number;
  acquire: number;
  evict: number;
}

interface MigrationConfig {
  directory: string;
  tableName: string;
  schemaName?: string;
}

interface CacheConfig {
  enabled: boolean;
  duration: number;
  type: 'memory' | 'redis';
}

enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLITE = 'sqlite'
}

export const databaseConfig: DatabaseConfig = {
  type: (process.env.DB_TYPE as DatabaseType) || DatabaseType.POSTGRESQL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'zendesk_clickup_automation',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000', 10),
    evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10)
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'migrations',
    schemaName: process.env.DB_SCHEMA
  },
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  cache: {
    enabled: process.env.DB_CACHE_ENABLED === 'true',
    duration: parseInt(process.env.DB_CACHE_DURATION || '30000', 10),
    type: (process.env.DB_CACHE_TYPE as 'memory' | 'redis') || 'memory'
  }
};

// Redis configuration for caching and sessions
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  connectTimeout: number;
  commandTimeout: number;
}

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DATABASE || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'zca:',
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
  enableReadyCheck: true,
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  lazyConnect: true,
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),
  family: 4,
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10)
};
```

### Integration Configuration (`integrations.ts`)
Third-party service configurations:

```typescript
export interface IntegrationsConfig {
  zendesk: ZendeskConfig;
  clickup: ClickUpConfig;
  slack: SlackConfig;
  email: EmailConfig;
  webhook: WebhookConfig;
}

// Zendesk configuration
export interface ZendeskConfig {
  subdomain: string;
  email: string;
  token: string;
  apiVersion: string;
  baseUrl: string;
  rateLimiting: RateLimitConfig;
  timeout: number;
  retries: RetryConfig;
  webhooks: ZendeskWebhookConfig;
}

interface ZendeskWebhookConfig {
  enabled: boolean;
  endpoint: string;
  secret: string;
  events: string[];
}

// ClickUp configuration
export interface ClickUpConfig {
  apiToken: string;
  teamId: string;
  apiVersion: string;
  baseUrl: string;
  rateLimiting: RateLimitConfig;
  timeout: number;
  retries: RetryConfig;
  webhooks: ClickUpWebhookConfig;
}

interface ClickUpWebhookConfig {
  enabled: boolean;
  endpoint: string;
  secret: string;
  events: string[];
}

// Slack configuration
export interface SlackConfig {
  botToken: string;
  appToken: string;
  signingSecret: string;
  clientId: string;
  clientSecret: string;
  rateLimiting: RateLimitConfig;
  timeout: number;
  retries: RetryConfig;
  channels: SlackChannelConfig;
}

interface SlackChannelConfig {
  notifications: string;
  alerts: string;
  general: string;
}

// Email configuration
export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  smtp?: SmtpConfig;
  sendgrid?: SendGridConfig;
  ses?: SesConfig;
  from: string;
  replyTo: string;
  templates: EmailTemplateConfig;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendGridConfig {
  apiKey: string;
}

interface SesConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface EmailTemplateConfig {
  path: string;
  engine: 'handlebars' | 'ejs' | 'pug';
}

// Webhook configuration
export interface WebhookConfig {
  enabled: boolean;
  port: number;
  path: string;
  security: WebhookSecurityConfig;
  retries: RetryConfig;
  timeout: number;
}

interface WebhookSecurityConfig {
  verifySignature: boolean;
  allowedIps: string[];
  rateLimiting: RateLimitConfig;
}

export const integrationsConfig: IntegrationsConfig = {
  zendesk: {
    subdomain: process.env.ZENDESK_SUBDOMAIN || '',
    email: process.env.ZENDESK_EMAIL || '',
    token: process.env.ZENDESK_TOKEN || '',
    apiVersion: process.env.ZENDESK_API_VERSION || 'v2',
    baseUrl: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2`,
    rateLimiting: {
      requests: parseInt(process.env.ZENDESK_RATE_LIMIT || '700', 10),
      window: parseInt(process.env.ZENDESK_RATE_WINDOW || '60000', 10)
    },
    timeout: parseInt(process.env.ZENDESK_TIMEOUT || '30000', 10),
    retries: {
      maxAttempts: parseInt(process.env.ZENDESK_MAX_RETRIES || '3', 10),
      baseDelay: parseInt(process.env.ZENDESK_RETRY_DELAY || '1000', 10)
    },
    webhooks: {
      enabled: process.env.ZENDESK_WEBHOOKS_ENABLED === 'true',
      endpoint: process.env.ZENDESK_WEBHOOK_ENDPOINT || '/webhooks/zendesk',
      secret: process.env.ZENDESK_WEBHOOK_SECRET || '',
      events: [
        'ticket.created',
        'ticket.updated',
        'ticket.solved',
        'ticket.closed'
      ]
    }
  },
  clickup: {
    apiToken: process.env.CLICKUP_API_TOKEN || '',
    teamId: process.env.CLICKUP_TEAM_ID || '',
    apiVersion: process.env.CLICKUP_API_VERSION || 'v2',
    baseUrl: 'https://api.clickup.com/api/v2',
    rateLimiting: {
      requests: parseInt(process.env.CLICKUP_RATE_LIMIT || '100', 10),
      window: parseInt(process.env.CLICKUP_RATE_WINDOW || '60000', 10)
    },
    timeout: parseInt(process.env.CLICKUP_TIMEOUT || '30000', 10),
    retries: {
      maxAttempts: parseInt(process.env.CLICKUP_MAX_RETRIES || '3', 10),
      baseDelay: parseInt(process.env.CLICKUP_RETRY_DELAY || '1000', 10)
    },
    webhooks: {
      enabled: process.env.CLICKUP_WEBHOOKS_ENABLED === 'true',
      endpoint: process.env.CLICKUP_WEBHOOK_ENDPOINT || '/webhooks/clickup',
      secret: process.env.CLICKUP_WEBHOOK_SECRET || '',
      events: [
        'taskCreated',
        'taskUpdated',
        'taskStatusUpdated',
        'taskDeleted'
      ]
    }
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    rateLimiting: {
      requests: parseInt(process.env.SLACK_RATE_LIMIT || '50', 10),
      window: parseInt(process.env.SLACK_RATE_WINDOW || '60000', 10)
    },
    timeout: parseInt(process.env.SLACK_TIMEOUT || '30000', 10),
    retries: {
      maxAttempts: parseInt(process.env.SLACK_MAX_RETRIES || '3', 10),
      baseDelay: parseInt(process.env.SLACK_RETRY_DELAY || '1000', 10)
    },
    channels: {
      notifications: process.env.SLACK_NOTIFICATIONS_CHANNEL || '#notifications',
      alerts: process.env.SLACK_ALERTS_CHANNEL || '#alerts',
      general: process.env.SLACK_GENERAL_CHANNEL || '#general'
    }
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses') || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || ''
    },
    ses: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@example.com',
    templates: {
      path: process.env.EMAIL_TEMPLATES_PATH || './src/templates/email',
      engine: (process.env.EMAIL_TEMPLATE_ENGINE as 'handlebars' | 'ejs' | 'pug') || 'handlebars'
    }
  },
  webhook: {
    enabled: process.env.WEBHOOKS_ENABLED === 'true',
    port: parseInt(process.env.WEBHOOK_PORT || '3001', 10),
    path: process.env.WEBHOOK_PATH || '/webhooks',
    security: {
      verifySignature: process.env.WEBHOOK_VERIFY_SIGNATURE === 'true',
      allowedIps: process.env.WEBHOOK_ALLOWED_IPS?.split(',') || [],
      rateLimiting: {
        requests: parseInt(process.env.WEBHOOK_RATE_LIMIT || '1000', 10),
        window: parseInt(process.env.WEBHOOK_RATE_WINDOW || '60000', 10)
      }
    },
    retries: {
      maxAttempts: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
      baseDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000', 10)
    },
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000', 10)
  }
};
```

### Agent System Configuration (`agents.ts`)
Configuration for the multi-agent system:

```typescript
export interface AgentsConfig {
  maxConcurrentAgents: number;
  defaultTimeout: number;
  heartbeatInterval: number;
  taskQueue: TaskQueueConfig;
  communication: CommunicationConfig;
  orchestration: OrchestrationConfig;
  monitoring: AgentMonitoringConfig;
  agents: Record<AgentType, AgentTypeConfig>;
}

interface TaskQueueConfig {
  provider: 'memory' | 'redis' | 'rabbitmq';
  maxRetries: number;
  retryDelay: number;
  maxConcurrency: number;
  priority: boolean;
}

interface CommunicationConfig {
  protocol: 'http' | 'websocket' | 'messagequeue';
  timeout: number;
  retries: number;
  compression: boolean;
  encryption: boolean;
}

interface OrchestrationConfig {
  strategy: 'round-robin' | 'least-loaded' | 'capability-based';
  loadBalancing: boolean;
  failover: boolean;
  healthChecks: boolean;
}

interface AgentMonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
  performanceTracking: boolean;
}

interface AgentTypeConfig {
  enabled: boolean;
  maxInstances: number;
  defaultCapabilities: string[];
  resourceLimits: ResourceLimits;
  specialization: AgentSpecialization;
}

interface ResourceLimits {
  memory: number;
  cpu: number;
  timeout: number;
  maxTasks: number;
}

interface AgentSpecialization {
  domain: string;
  skills: string[];
  tools: string[];
  integrations: string[];
}

export const agentsConfig: AgentsConfig = {
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '10', 10),
  defaultTimeout: parseInt(process.env.AGENT_DEFAULT_TIMEOUT || '300000', 10), // 5 minutes
  heartbeatInterval: parseInt(process.env.AGENT_HEARTBEAT_INTERVAL || '30000', 10), // 30 seconds
  taskQueue: {
    provider: (process.env.TASK_QUEUE_PROVIDER as 'memory' | 'redis' | 'rabbitmq') || 'redis',
    maxRetries: parseInt(process.env.TASK_QUEUE_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.TASK_QUEUE_RETRY_DELAY || '5000', 10),
    maxConcurrency: parseInt(process.env.TASK_QUEUE_MAX_CONCURRENCY || '5', 10),
    priority: process.env.TASK_QUEUE_PRIORITY === 'true'
  },
  communication: {
    protocol: (process.env.AGENT_COMMUNICATION_PROTOCOL as 'http' | 'websocket' | 'messagequeue') || 'http',
    timeout: parseInt(process.env.AGENT_COMMUNICATION_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.AGENT_COMMUNICATION_RETRIES || '3', 10),
    compression: process.env.AGENT_COMMUNICATION_COMPRESSION === 'true',
    encryption: process.env.AGENT_COMMUNICATION_ENCRYPTION === 'true'
  },
  orchestration: {
    strategy: (process.env.AGENT_ORCHESTRATION_STRATEGY as 'round-robin' | 'least-loaded' | 'capability-based') || 'capability-based',
    loadBalancing: process.env.AGENT_LOAD_BALANCING === 'true',
    failover: process.env.AGENT_FAILOVER === 'true',
    healthChecks: process.env.AGENT_HEALTH_CHECKS === 'true'
  },
  monitoring: {
    enabled: process.env.AGENT_MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.AGENT_METRICS_INTERVAL || '60000', 10),
    healthCheckInterval: parseInt(process.env.AGENT_HEALTH_CHECK_INTERVAL || '30000', 10),
    performanceTracking: process.env.AGENT_PERFORMANCE_TRACKING === 'true'
  },
  agents: {
    [AgentType.BUSINESS_ANALYST]: {
      enabled: process.env.BUSINESS_ANALYST_ENABLED === 'true',
      maxInstances: parseInt(process.env.BUSINESS_ANALYST_MAX_INSTANCES || '2', 10),
      defaultCapabilities: ['analysis', 'requirements', 'documentation'],
      resourceLimits: {
        memory: parseInt(process.env.BUSINESS_ANALYST_MEMORY_LIMIT || '512', 10),
        cpu: parseInt(process.env.BUSINESS_ANALYST_CPU_LIMIT || '50', 10),
        timeout: parseInt(process.env.BUSINESS_ANALYST_TIMEOUT || '600000', 10),
        maxTasks: parseInt(process.env.BUSINESS_ANALYST_MAX_TASKS || '5', 10)
      },
      specialization: {
        domain: 'business-analysis',
        skills: ['requirement-gathering', 'process-mapping', 'stakeholder-analysis'],
        tools: ['zendesk', 'clickup', 'documentation'],
        integrations: ['zendesk', 'clickup', 'slack']
      }
    },
    [AgentType.SOFTWARE_ENGINEER]: {
      enabled: process.env.SOFTWARE_ENGINEER_ENABLED === 'true',
      maxInstances: parseInt(process.env.SOFTWARE_ENGINEER_MAX_INSTANCES || '3', 10),
      defaultCapabilities: ['development', 'testing', 'deployment'],
      resourceLimits: {
        memory: parseInt(process.env.SOFTWARE_ENGINEER_MEMORY_LIMIT || '1024', 10),
        cpu: parseInt(process.env.SOFTWARE_ENGINEER_CPU_LIMIT || '75', 10),
        timeout: parseInt(process.env.SOFTWARE_ENGINEER_TIMEOUT || '1800000', 10),
        maxTasks: parseInt(process.env.SOFTWARE_ENGINEER_MAX_TASKS || '3', 10)
      },
      specialization: {
        domain: 'software-development',
        skills: ['coding', 'testing', 'debugging', 'code-review'],
        tools: ['git', 'ide', 'testing-frameworks', 'ci-cd'],
        integrations: ['github', 'clickup', 'slack']
      }
    },
    // ... other agent types
  }
};
```

### Security Configuration (`security.ts`)
Security and authentication settings:

```typescript
export interface SecurityConfig {
  authentication: AuthConfig;
  authorization: AuthzConfig;
  encryption: EncryptionConfig;
  cors: CorsConfig;
  csrf: CsrfConfig;
  headers: SecurityHeadersConfig;
  rateLimit: RateLimitConfig;
  audit: AuditConfig;
}

interface AuthConfig {
  strategy: 'jwt' | 'session' | 'oauth';
  jwt?: JwtConfig;
  oauth?: OAuthConfig;
  session?: SessionConfig;
  passwordPolicy: PasswordPolicyConfig;
}

interface JwtConfig {
  secret: string;
  algorithm: string;
  expiresIn: string;
  issuer: string;
  audience: string;
  refreshToken: RefreshTokenConfig;
}

interface RefreshTokenConfig {
  enabled: boolean;
  expiresIn: string;
  rotateOnUse: boolean;
}

interface OAuthConfig {
  providers: OAuthProvider[];
  redirectUrl: string;
  scope: string[];
}

interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
  preventReuse: number;
}

interface AuthzConfig {
  rbac: RbacConfig;
  permissions: PermissionConfig;
}

interface RbacConfig {
  enabled: boolean;
  defaultRole: string;
  roleHierarchy: Record<string, string[]>;
}

interface PermissionConfig {
  granular: boolean;
  caching: boolean;
  inheritance: boolean;
}

interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  saltRounds: number;
  secretKey: string;
  iv: string;
}

interface CsrfConfig {
  enabled: boolean;
  secret: string;
  cookieName: string;
  headerName: string;
}

interface SecurityHeadersConfig {
  hsts: HstsConfig;
  csp: CspConfig;
  xss: XssConfig;
  frameOptions: string;
  contentTypeOptions: boolean;
}

interface HstsConfig {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

interface CspConfig {
  enabled: boolean;
  directives: Record<string, string[]>;
  reportOnly: boolean;
  reportUri?: string;
}

interface XssConfig {
  enabled: boolean;
  mode: 'block' | 'sanitize';
}

interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number;
  storage: 'database' | 'file' | 'external';
}

export const securityConfig: SecurityConfig = {
  authentication: {
    strategy: (process.env.AUTH_STRATEGY as 'jwt' | 'session' | 'oauth') || 'jwt',
    jwt: {
      secret: process.env.JWT_SECRET || 'your-jwt-secret',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: process.env.JWT_ISSUER || 'zendesk-clickup-automation',
      audience: process.env.JWT_AUDIENCE || 'api-users',
      refreshToken: {
        enabled: process.env.JWT_REFRESH_ENABLED === 'true',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        rotateOnUse: process.env.JWT_REFRESH_ROTATE === 'true'
      }
    },
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
      maxAge: parseInt(process.env.PASSWORD_MAX_AGE || '7776000000', 10), // 90 days
      preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5', 10)
    }
  },
  authorization: {
    rbac: {
      enabled: process.env.RBAC_ENABLED === 'true',
      defaultRole: process.env.RBAC_DEFAULT_ROLE || 'user',
      roleHierarchy: {
        admin: ['manager', 'user'],
        manager: ['user'],
        user: []
      }
    },
    permissions: {
      granular: process.env.PERMISSIONS_GRANULAR === 'true',
      caching: process.env.PERMISSIONS_CACHING === 'true',
      inheritance: process.env.PERMISSIONS_INHERITANCE === 'true'
    }
  },
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    keySize: parseInt(process.env.ENCRYPTION_KEY_SIZE || '32', 10),
    saltRounds: parseInt(process.env.ENCRYPTION_SALT_ROUNDS || '12', 10),
    secretKey: process.env.ENCRYPTION_SECRET_KEY || 'your-encryption-key',
    iv: process.env.ENCRYPTION_IV || 'your-initialization-vector'
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  csrf: {
    enabled: process.env.CSRF_ENABLED === 'true',
    secret: process.env.CSRF_SECRET || 'your-csrf-secret',
    cookieName: process.env.CSRF_COOKIE_NAME || '_csrf',
    headerName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token'
  },
  headers: {
    hsts: {
      enabled: process.env.HSTS_ENABLED === 'true',
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10), // 1 year
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS === 'true',
      preload: process.env.HSTS_PRELOAD === 'true'
    },
    csp: {
      enabled: process.env.CSP_ENABLED === 'true',
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"]
      },
      reportOnly: process.env.CSP_REPORT_ONLY === 'true',
      reportUri: process.env.CSP_REPORT_URI
    },
    xss: {
      enabled: process.env.XSS_PROTECTION_ENABLED === 'true',
      mode: (process.env.XSS_PROTECTION_MODE as 'block' | 'sanitize') || 'block'
    },
    frameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    contentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS === 'true'
  },
  rateLimit: {
    windowMs: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.SECURITY_RATE_LIMIT_MAX || '100', 10),
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  audit: {
    enabled: process.env.AUDIT_ENABLED === 'true',
    events: [
      'user.login',
      'user.logout',
      'user.created',
      'user.updated',
      'user.deleted',
      'permission.granted',
      'permission.revoked',
      'data.accessed',
      'data.modified',
      'system.error'
    ],
    retention: parseInt(process.env.AUDIT_RETENTION || '2592000000', 10), // 30 days
    storage: (process.env.AUDIT_STORAGE as 'database' | 'file' | 'external') || 'database'
  }
};
```

### Feature Flags (`features.ts`)
Feature toggles and experimental functionality:

```typescript
export interface FeatureFlags {
  multiAgent: boolean;
  advancedAnalytics: boolean;
  realTimeSync: boolean;
  aiAssistant: boolean;
  customWorkflows: boolean;
  advancedReporting: boolean;
  integrationHub: boolean;
  mobileApp: boolean;
  apiV3: boolean;
  experimentalFeatures: ExperimentalFeatures;
}

interface ExperimentalFeatures {
  nlpProcessing: boolean;
  predictiveAnalytics: boolean;
  autoTicketRouting: boolean;
  smartNotifications: boolean;
  voiceIntegration: boolean;
  blockchainLogging: boolean;
}

export const featureFlags: FeatureFlags = {
  multiAgent: process.env.FEATURE_MULTI_AGENT === 'true',
  advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
  realTimeSync: process.env.FEATURE_REAL_TIME_SYNC === 'true',
  aiAssistant: process.env.FEATURE_AI_ASSISTANT === 'true',
  customWorkflows: process.env.FEATURE_CUSTOM_WORKFLOWS === 'true',
  advancedReporting: process.env.FEATURE_ADVANCED_REPORTING === 'true',
  integrationHub: process.env.FEATURE_INTEGRATION_HUB === 'true',
  mobileApp: process.env.FEATURE_MOBILE_APP === 'true',
  apiV3: process.env.FEATURE_API_V3 === 'true',
  experimentalFeatures: {
    nlpProcessing: process.env.EXPERIMENTAL_NLP_PROCESSING === 'true',
    predictiveAnalytics: process.env.EXPERIMENTAL_PREDICTIVE_ANALYTICS === 'true',
    autoTicketRouting: process.env.EXPERIMENTAL_AUTO_TICKET_ROUTING === 'true',
    smartNotifications: process.env.EXPERIMENTAL_SMART_NOTIFICATIONS === 'true',
    voiceIntegration: process.env.EXPERIMENTAL_VOICE_INTEGRATION === 'true',
    blockchainLogging: process.env.EXPERIMENTAL_BLOCKCHAIN_LOGGING === 'true'
  }
};

// Feature flag utilities
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature] as boolean;
}

export function isExperimentalFeatureEnabled(feature: keyof ExperimentalFeatures): boolean {
  return featureFlags.experimentalFeatures[feature];
}

export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature, _]) => feature);
}
```

### System Constants (`constants.ts`)
System-wide constants and enumerations:

```typescript
// API Constants
export const API_CONSTANTS = {
  VERSION: 'v1',
  BASE_PATH: '/api',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  AGENT_ERROR: 'AGENT_ERROR',
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
} as const;

// Agent Constants
export const AGENT_CONSTANTS = {
  MAX_TASK_DURATION: 1800000, // 30 minutes
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 3,
  DEFAULT_PRIORITY: 'medium',
  MAX_CONCURRENT_TASKS: 5
} as const;

// Integration Constants
export const INTEGRATION_CONSTANTS = {
  ZENDESK: {
    API_VERSION: 'v2',
    RATE_LIMIT: 700, // requests per minute
    MAX_RESULTS: 100,
    TIMEOUT: 30000
  },
  CLICKUP: {
    API_VERSION: 'v2',
    RATE_LIMIT: 100, // requests per minute
    MAX_RESULTS: 100,
    TIMEOUT: 30000
  },
  SLACK: {
    RATE_LIMIT: 50, // requests per minute
    MAX_MESSAGE_LENGTH: 4000,
    TIMEOUT: 30000
  }
} as const;

// File Constants
export const FILE_CONSTANTS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json',
    'text/csv'
  ],
  UPLOAD_PATH: './uploads',
  TEMP_PATH: './temp'
} as const;

// Cache Constants
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 3600, // 1 hour
  MAX_TTL: 86400, // 24 hours
  KEY_PREFIX: 'zca:',
  SEPARATOR: ':'
} as const;

// Validation Constants
export const VALIDATION_CONSTANTS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,3}[\s\-\(\)]?[\d\s\-\(\)]{7,14}$/,
  URL_REGEX: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128
} as const;

// Date Constants
export const DATE_CONSTANTS = {
  FORMATS: {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY: 'MMM DD, YYYY'
  },
  TIMEZONES: {
    UTC: 'UTC',
    EST: 'America/New_York',
    PST: 'America/Los_Angeles',
    GMT: 'Europe/London'
  }
} as const;

// Event Types
export const EVENT_TYPES = {
  SYSTEM: {
    STARTUP: 'system.startup',
    SHUTDOWN: 'system.shutdown',
    ERROR: 'system.error',
    HEALTH_CHECK: 'system.health_check'
  },
  AGENT: {
    CREATED: 'agent.created',
    STARTED: 'agent.started',
    STOPPED: 'agent.stopped',
    ERROR: 'agent.error',
    TASK_ASSIGNED: 'agent.task_assigned',
    TASK_COMPLETED: 'agent.task_completed'
  },
  INTEGRATION: {
    CONNECTED: 'integration.connected',
    DISCONNECTED: 'integration.disconnected',
    ERROR: 'integration.error',
    DATA_SYNC: 'integration.data_sync'
  },
  USER: {
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted'
  }
} as const;
```

### Environment-Specific Configurations

#### Development Environment (`environments/development.ts`)
```typescript
import { SystemConfig } from '../types';

export const developmentConfig: Partial<SystemConfig> = {
  app: {
    debug: true,
    logLevel: 'debug',
    port: 3000
  },
  database: {
    logging: true,
    synchronize: true
  },
  security: {
    cors: {
      enabled: true,
      origin: ['http://localhost:3000', 'http://localhost:3001']
    },
    csrf: {
      enabled: false
    }
  },
  monitoring: {
    enabled: true,
    level: 'debug'
  }
};
```

#### Production Environment (`environments/production.ts`)
```typescript
import { SystemConfig } from '../types';

export const productionConfig: Partial<SystemConfig> = {
  app: {
    debug: false,
    logLevel: 'warn',
    port: parseInt(process.env.PORT || '8080', 10)
  },
  database: {
    logging: false,
    synchronize: false,
    ssl: true
  },
  security: {
    cors: {
      enabled: true,
      origin: process.env.ALLOWED_ORIGINS?.split(',') || []
    },
    csrf: {
      enabled: true
    },
    headers: {
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },
  monitoring: {
    enabled: true,
    level: 'error'
  }
};
```

## Configuration Loading Strategy

The main configuration loader (`index.ts`) provides centralized access:

```typescript
import { merge } from 'lodash';
import { appConfig } from './app';
import { databaseConfig, redisConfig } from './database';
import { integrationsConfig } from './integrations';
import { agentsConfig } from './agents';
import { securityConfig } from './security';
import { featureFlags } from './features';
import { developmentConfig } from './environments/development';
import { stagingConfig } from './environments/staging';
import { productionConfig } from './environments/production';
import { testConfig } from './environments/test';
import { validateConfig } from './validation';

// Base configuration
const baseConfig = {
  app: appConfig,
  database: databaseConfig,
  redis: redisConfig,
  integrations: integrationsConfig,
  agents: agentsConfig,
  security: securityConfig,
  features: featureFlags
};

// Environment-specific overrides
const environmentConfigs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
  test: testConfig
};

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envConfig = environmentConfigs[environment as keyof typeof environmentConfigs] || {};

// Merge configurations
export const config = merge({}, baseConfig, envConfig);

// Validate configuration
validateConfig(config);

// Export individual configurations
export { appConfig, databaseConfig, redisConfig, integrationsConfig, agentsConfig, securityConfig, featureFlags };

// Export utilities
export { isFeatureEnabled, isExperimentalFeatureEnabled } from './features';
export * from './constants';

// Configuration getter with type safety
export function getConfig<T extends keyof typeof config>(key: T): typeof config[T] {
  return config[key];
}

// Environment checker
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
```

## Configuration Validation

The validation module (`validation.ts`) ensures configuration integrity:

```typescript
import Joi from 'joi';
import { SystemConfig } from '../types';

// Configuration validation schema
const configSchema = Joi.object({
  app: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
    environment: Joi.string().valid('development', 'staging', 'production', 'test').required(),
    port: Joi.number().port().required(),
    host: Joi.string().required(),
    baseUrl: Joi.string().uri().required(),
    debug: Joi.boolean().required(),
    logLevel: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').required()
  }).required(),
  
  database: Joi.object({
    type: Joi.string().valid('postgresql', 'mysql', 'mongodb', 'sqlite').required(),
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    ssl: Joi.boolean().required()
  }).required(),
  
  integrations: Joi.object({
    zendesk: Joi.object({
      subdomain: Joi.string().required(),
      email: Joi.string().email().required(),
      token: Joi.string().required()
    }).required(),
    
    clickup: Joi.object({
      apiToken: Joi.string().required(),
      teamId: Joi.string().required()
    }).required(),
    
    slack: Joi.object({
      botToken: Joi.string().required(),
      appToken: Joi.string().required(),
      signingSecret: Joi.string().required()
    }).required()
  }).required(),
  
  security: Joi.object({
    authentication: Joi.object({
      strategy: Joi.string().valid('jwt', 'session', 'oauth').required(),
      jwt: Joi.when('strategy', {
        is: 'jwt',
        then: Joi.object({
          secret: Joi.string().min(32).required(),
          algorithm: Joi.string().required(),
          expiresIn: Joi.string().required()
        }).required(),
        otherwise: Joi.optional()
      })
    }).required()
  }).required()
});

export function validateConfig(config: SystemConfig): void {
  const { error } = configSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false
  });
  
  if (error) {
    const errorMessage = error.details
      .map(detail => detail.message)
      .join(', ');
    throw new Error(`Configuration validation failed: ${errorMessage}`);
  }
}

// Environment variable validation
export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'ZENDESK_SUBDOMAIN',
    'ZENDESK_EMAIL',
    'ZENDESK_TOKEN',
    'CLICKUP_API_TOKEN',
    'CLICKUP_TEAM_ID',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
```

## Usage Examples

### Basic Configuration Access
```typescript
import { config, getConfig, isFeatureEnabled } from '../config';

// Access full configuration
console.log('App config:', config.app);

// Type-safe configuration access
const dbConfig = getConfig('database');
const port = getConfig('app').port;

// Feature flag checking
if (isFeatureEnabled('multiAgent')) {
  // Initialize multi-agent system
}
```

### Environment-Specific Logic
```typescript
import { isDevelopment, isProduction } from '../config';

if (isDevelopment()) {
  // Development-specific code
  console.log('Running in development mode');
}

if (isProduction()) {
  // Production-specific optimizations
  enableProductionOptimizations();
}
```

### Integration Configuration
```typescript
import { integrationsConfig } from '../config';

const zendeskClient = new ZendeskClient({
  subdomain: integrationsConfig.zendesk.subdomain,
  email: integrationsConfig.zendesk.email,
  token: integrationsConfig.zendesk.token
});
```

## Best Practices

### Security
- Store sensitive data in environment variables
- Use strong encryption for stored secrets
- Validate all configuration values
- Implement proper access controls

### Maintainability
- Use TypeScript for type safety
- Organize configurations by domain
- Provide sensible defaults
- Document all configuration options

### Performance
- Cache configuration values
- Minimize configuration loading overhead
- Use lazy loading for optional configurations
- Optimize for common access patterns

### Deployment
- Use environment-specific configurations
- Implement configuration validation
- Support configuration hot-reloading
- Provide configuration migration tools