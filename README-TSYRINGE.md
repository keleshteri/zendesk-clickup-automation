# TSyringe Dependency Injection Guide

This guide explains how to use TSyringe dependency injection in the Zendesk-ClickUp Automation project.

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Service Registration](#service-registration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Reference](#reference)

## 🚀 Installation

TSyringe is already installed and configured in this project. The setup includes:

```bash
npm install tsyringe reflect-metadata
```

### Required Configuration

1. **TypeScript Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

2. **Reflect Metadata Import** (in `src/index.ts`):
```typescript
import 'reflect-metadata';
```

## ⚙️ Configuration

The project uses a centralized DI container configuration in `src/di/container.ts`:

```typescript
import { diContainer, DI_TOKENS, injectable, singleton, inject } from './src/di';
```

### Available Service Tokens

```typescript
export const DI_TOKENS = {
  // Core Services
  AI_SERVICE: 'AIService',
  SLACK_SERVICE: 'SlackService',
  ZENDESK_SERVICE: 'ZendeskService',
  CLICKUP_SERVICE: 'ClickUpService',
  OAUTH_SERVICE: 'OAuthService',
  
  // Automation Services
  AUTOMATION_SERVICE: 'AutomationService',
  TASK_GENIE: 'TaskGenie',
  WORKFLOW_ORCHESTRATOR: 'WorkflowOrchestrator',
  
  // Configuration
  ENVIRONMENT: 'Environment',
  LOGGER: 'Logger'
};
```

## 🔧 Basic Usage

### 1. Creating an Injectable Service

```typescript
import { injectable, inject, DI_TOKENS } from '../di';

@injectable()
export class UserService {
  constructor(
    @inject(DI_TOKENS.LOGGER) private logger: Logger,
    @inject(DI_TOKENS.AI_SERVICE) private aiService: AIService
  ) {}

  async createUser(userData: UserData): Promise<User> {
    this.logger.info('Creating new user');
    const analysis = await this.aiService.analyzeUserData(userData);
    // Implementation...
  }
}
```

### 2. Creating a Singleton Service

```typescript
import { singleton, inject } from '../di';

@singleton()
export class ConfigService {
  private config: AppConfig;

  constructor(
    @inject(DI_TOKENS.ENVIRONMENT) private env: Env
  ) {
    this.config = this.loadConfig();
  }

  getConfig(): AppConfig {
    return this.config;
  }
}
```

### 3. Registering Services

```typescript
import { registerSingleton, registerService } from '../di';

// Register as singleton
registerSingleton(DI_TOKENS.USER_SERVICE, UserService);

// Register as transient (new instance each time)
registerService(DI_TOKENS.NOTIFICATION_SERVICE, NotificationService);

// Register instance
const logger = new ConsoleLogger();
registerInstance(DI_TOKENS.LOGGER, logger);
```

### 4. Resolving Services

```typescript
import { resolveService } from '../di';

// Resolve a service
const userService = resolveService<UserService>(DI_TOKENS.USER_SERVICE);

// Use the service
const user = await userService.createUser(userData);
```

## 🎯 Advanced Examples

### Interface-Based Injection

```typescript
// Define interface
export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

// Implementation
@injectable()
export class SmtpEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
  }
}

// Register with interface token
const EMAIL_SERVICE_TOKEN = 'IEmailService';
registerSingleton(EMAIL_SERVICE_TOKEN, SmtpEmailService);

// Inject using interface
@injectable()
export class UserRegistrationService {
  constructor(
    @inject(EMAIL_SERVICE_TOKEN) private emailService: IEmailService
  ) {}
}
```

### Optional Dependencies

```typescript
@injectable()
export class AnalyticsService {
  constructor(
    @inject(DI_TOKENS.LOGGER) private logger: Logger,
    @inject('OptionalCache', { isOptional: true }) private cache?: CacheService
  ) {}

  track(event: string): void {
    this.logger.info(`Tracking: ${event}`);
    
    // Use cache if available
    if (this.cache) {
      this.cache.store(event);
    }
  }
}
```

### Array Injection

```typescript
// Multiple implementations
@injectable()
export class EmailNotificationHandler implements NotificationHandler {
  handle(notification: Notification): Promise<void> {
    // Email implementation
  }
}

@injectable()
export class SlackNotificationHandler implements NotificationHandler {
  handle(notification: Notification): Promise<void> {
    // Slack implementation
  }
}

// Register multiple handlers
registerService('NotificationHandler', EmailNotificationHandler);
registerService('NotificationHandler', SlackNotificationHandler);

// Inject all handlers
@injectable()
export class NotificationService {
  constructor(
    @injectAll('NotificationHandler') private handlers: NotificationHandler[]
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    await Promise.all(
      this.handlers.map(handler => handler.handle(notification))
    );
  }
}
```

### Factory Pattern

```typescript
// Factory interface
export interface ServiceFactory<T> {
  create(): T;
}

// Factory implementation
@injectable()
export class DatabaseServiceFactory implements ServiceFactory<DatabaseService> {
  constructor(
    @inject(DI_TOKENS.ENVIRONMENT) private env: Env
  ) {}

  create(): DatabaseService {
    if (this.env.NODE_ENV === 'production') {
      return new ProductionDatabaseService();
    }
    return new DevelopmentDatabaseService();
  }
}

// Register factory
registerSingleton('DatabaseServiceFactory', DatabaseServiceFactory);

// Use factory
@injectable()
export class DataRepository {
  private dbService: DatabaseService;

  constructor(
    @inject('DatabaseServiceFactory') private factory: ServiceFactory<DatabaseService>
  ) {
    this.dbService = factory.create();
  }
}
```

## 📝 Service Registration Patterns

### 1. Bootstrap Registration

```typescript
// src/bootstrap.ts
import 'reflect-metadata';
import { registerServices } from './config/service-registration';

export async function bootstrap(env: Env): Promise<void> {
  // Register all services
  registerServices(env);
  
  // Additional setup...
}
```

### 2. Service Registration Module

```typescript
// src/config/service-registration.ts
import { 
  registerSingleton, 
  registerService, 
  registerInstance,
  DI_TOKENS 
} from './di-container';

export function registerServices(env: Env): void {
  // Core services
  registerSingleton(DI_TOKENS.AI_SERVICE, AIService);
  registerSingleton(DI_TOKENS.SLACK_SERVICE, SlackService);
  registerSingleton(DI_TOKENS.ZENDESK_SERVICE, ZendeskService);
  registerSingleton(DI_TOKENS.CLICKUP_SERVICE, ClickUpService);
  
  // Configuration
  registerInstance(DI_TOKENS.ENVIRONMENT, env);
  
  // Automation services
  registerSingleton(DI_TOKENS.AUTOMATION_SERVICE, AutomationService);
  registerSingleton(DI_TOKENS.TASK_GENIE, TaskGenie);
}
```

### 3. Conditional Registration

```typescript
export function registerServices(env: Env): void {
  // Always register core services
  registerSingleton(DI_TOKENS.LOGGER, ConsoleLogger);
  
  // Conditional registration based on environment
  if (env.NODE_ENV === 'production') {
    registerSingleton(DI_TOKENS.CACHE_SERVICE, RedisCache);
  } else {
    registerSingleton(DI_TOKENS.CACHE_SERVICE, MemoryCache);
  }
  
  // Feature flags
  if (env.FEATURE_AI_ENABLED) {
    registerSingleton(DI_TOKENS.AI_SERVICE, AIService);
  } else {
    registerSingleton(DI_TOKENS.AI_SERVICE, MockAIService);
  }
}
```

## ✅ Best Practices

### 1. Use Interfaces for Abstraction

```typescript
// ✅ Good: Interface-based injection
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

@injectable()
export class DatabaseUserRepository implements IUserRepository {
  // Implementation
}

// ❌ Bad: Concrete class injection
@injectable()
export class UserService {
  constructor(
    private userRepo: DatabaseUserRepository // Tightly coupled
  ) {}
}
```

### 2. Prefer Constructor Injection

```typescript
// ✅ Good: Constructor injection
@injectable()
export class OrderService {
  constructor(
    @inject(DI_TOKENS.USER_SERVICE) private userService: IUserService,
    @inject(DI_TOKENS.PAYMENT_SERVICE) private paymentService: IPaymentService
  ) {}
}

// ❌ Bad: Property injection (not supported by TSyringe)
export class OrderService {
  @inject(DI_TOKENS.USER_SERVICE)
  private userService: IUserService; // Won't work
}
```

### 3. Use Meaningful Token Names

```typescript
// ✅ Good: Descriptive tokens
export const DI_TOKENS = {
  USER_REPOSITORY: 'IUserRepository',
  EMAIL_SERVICE: 'IEmailService',
  PAYMENT_GATEWAY: 'IPaymentGateway'
};

// ❌ Bad: Generic tokens
export const DI_TOKENS = {
  SERVICE1: 'Service1',
  REPO: 'Repo',
  THING: 'Thing'
};
```

### 4. Organize Registration by Module

```typescript
// src/modules/user/user.module.ts
export function registerUserModule(): void {
  registerSingleton(DI_TOKENS.USER_REPOSITORY, DatabaseUserRepository);
  registerSingleton(DI_TOKENS.USER_SERVICE, UserService);
  registerService(DI_TOKENS.USER_VALIDATOR, UserValidator);
}

// src/modules/notification/notification.module.ts
export function registerNotificationModule(): void {
  registerSingleton(DI_TOKENS.EMAIL_SERVICE, SmtpEmailService);
  registerSingleton(DI_TOKENS.SMS_SERVICE, TwilioSmsService);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"reflect-metadata" not imported**
   ```
   Error: Reflect.getMetadata is not a function
   ```
   **Solution**: Add `import 'reflect-metadata';` at the top of your entry file.

2. **Decorators not enabled**
   ```
   Error: Unable to resolve signature of class decorator
   ```
   **Solution**: Enable `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig.json`.

3. **Circular dependencies**
   ```
   Error: Cannot resolve dependency
   ```
   **Solution**: Use the `delay` helper or refactor to remove circular dependencies.

4. **Service not registered**
   ```
   Error: TypeInfo not known for "ServiceToken"
   ```
   **Solution**: Ensure the service is registered before resolving.

### Debugging Tips

```typescript
// Check if service is registered
if (diContainer.isRegistered(DI_TOKENS.USER_SERVICE)) {
  console.log('UserService is registered');
}

// Clear container for testing
diContainer.clearInstances();

// Create child container for isolation
const childContainer = diContainer.createChildContainer();
```

## 📚 Reference

### Core Decorators

- `@injectable()` - Marks a class as injectable
- `@singleton()` - Registers class as singleton
- `@inject(token)` - Injects dependency by token
- `@injectAll(token)` - Injects array of dependencies
- `@autoInjectable()` - Auto-resolves dependencies

### Container Methods

- `container.register(token, provider)` - Register a provider
- `container.registerSingleton(token, constructor)` - Register singleton
- `container.registerInstance(token, instance)` - Register instance
- `container.resolve<T>(token)` - Resolve dependency
- `container.isRegistered(token)` - Check registration
- `container.clearInstances()` - Clear all instances

### Helper Functions (from di-container.ts)

- `registerService<T>(token, implementation)` - Register transient service
- `registerSingleton<T>(token, implementation)` - Register singleton service
- `registerInstance<T>(token, instance)` - Register instance
- `resolveService<T>(token)` - Resolve service

### Useful Links

- [TSyringe Documentation](https://github.com/microsoft/tsyringe)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Dependency Injection Patterns](https://martinfowler.com/articles/injection.html)

---

## 🤝 Contributing

When adding new services:

1. Add service token to `DI_TOKENS` in `di-container.ts`
2. Create injectable service class with `@injectable()` decorator
3. Register service in appropriate module registration function
4. Add tests for dependency injection
5. Update this documentation with examples

---

**Happy Injecting! 🎯**