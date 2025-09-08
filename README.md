# Zendesk-ClickUp Automation

A Cloudflare Workers application that automates task creation and synchronization between Zendesk tickets and ClickUp tasks using OAuth 2.0 authentication.

## Features

- **OAuth 2.0 Integration**: Secure authentication with ClickUp using authorization code flow
- **Task Automation**: Automatically create ClickUp tasks from Zendesk tickets
- **Real-time Sync**: Webhook-based synchronization between platforms
- **Type-Safe**: Built with TypeScript and Zod validation
- **SOLID Architecture**: Interface-driven design following SOLID principles
- **Comprehensive Testing**: Unit tests for all services and components
- **Cloudflare Workers**: Serverless deployment with global edge distribution

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Language**: TypeScript 5.0+
- **Validation**: Zod (runtime type validation)
- **Testing**: Vitest (with Node.js environment)
- **Authentication**: OAuth 2.0 with PKCE
- **AI Integration**: Google Gemini API for chat and utility functions

## Project Structure

```
src/
├── domains/
│   ├── clickup/
│   │   ├── interfaces/          # ClickUp service contracts
│   │   ├── types/              # ClickUp data types and schemas
│   │   ├── services/           # ClickUp service implementations
│   │   └── __tests__/          # Unit tests
│   ├── zendesk/               # Zendesk integration (future)
│   ├── ai/                    # AI integration with Gemini
│   │   ├── interfaces/        # AI service contracts
│   │   ├── types/             # AI data types and schemas
│   │   ├── services/          # AI service implementations
│   │   └── __tests__/         # Unit tests
│   └── automation/            # Automation workflows (future)
├── shared/
│   ├── interfaces/            # Shared contracts
│   ├── types/                # Common types
│   └── utils/                # Utility functions
├── infrastructure/
│   └── di/                   # Dependency injection setup
└── index.ts                  # Main application entry point
```

## AI Integration

This project integrates with Google's Gemini API to provide AI-powered features:

- **Chat Conversations**: Interactive AI chat for user assistance
- **Ticket Summaries**: Automated summarization of Zendesk tickets
- **Error Analysis**: AI-powered analysis of error logs

For more information about token limits and configuration, see [AI Token Limits Guide](./docs/ai-token-limits.md).

## Prerequisites

1. **Node.js** 18+ and npm
2. **Cloudflare Account** with Workers enabled
3. **ClickUp Account** with API access
4. **Zendesk Account** with API access

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd zendesk-clickup-automation
npm install
```

### 2. ClickUp OAuth Application Setup

1. Go to [ClickUp Apps](https://app.clickup.com/apps)
2. Create a new OAuth app:
   - **App Name**: Zendesk Integration
   - **Redirect URL**: `https://your-worker.your-subdomain.workers.dev/auth/callback`
   - **Scopes**: Select required permissions (tasks, spaces, etc.)
3. Note down your `Client ID` and `Client Secret`

### 3. Environment Configuration

#### Required Secrets (set via Wrangler CLI):

```bash
# ClickUp OAuth credentials
wrangler secret put CLICKUP_CLIENT_ID
wrangler secret put CLICKUP_CLIENT_SECRET
wrangler secret put CLICKUP_WEBHOOK_SECRET

# Zendesk API credentials
wrangler secret put ZENDESK_API_TOKEN
wrangler secret put ZENDESK_SUBDOMAIN

# Security keys
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

#### Environment Variables (in wrangler.jsonc):

```json
{
  "vars": {
    "ENVIRONMENT": "development",
    "LOG_LEVEL": "info",
    "CLICKUP_API_BASE_URL": "https://api.clickup.com/api/v2",
    "ZENDESK_API_BASE_URL": "https://your-domain.zendesk.com/api/v2",
    "GEMINI_API_KEY": "your-gemini-api-key" // Required for AI features
  }
}
```

### 4. Optional: KV Namespaces (for token storage)

```bash
# Create KV namespaces
wrangler kv:namespace create "OAUTH_TOKENS"
wrangler kv:namespace create "USER_SESSIONS"

# Add to wrangler.jsonc
```

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8787`

### Run Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## API Endpoints

### Authentication

- `GET /auth/clickup` - Initiate ClickUp OAuth flow
- `GET /auth/callback` - Handle OAuth callback

### Health Check

- `GET /health` - Application health status

### Future Endpoints

- `POST /api/webhooks/clickup` - ClickUp webhook handler
- `POST /api/webhooks/zendesk` - Zendesk webhook handler
- `GET /api/tasks` - List synchronized tasks
- `POST /api/tasks/sync` - Manual task synchronization

## OAuth Flow

1. **Authorization Request**: User visits `/auth/clickup`
2. **User Consent**: Redirected to ClickUp for authorization
3. **Callback Handling**: ClickUp redirects to `/auth/callback` with authorization code
4. **Token Exchange**: Application exchanges code for access token
5. **Token Storage**: Secure storage of access and refresh tokens

## Architecture Principles

### SOLID Principles

- **Single Responsibility**: Each service has one clear purpose
- **Open/Closed**: Extensible through interfaces, not modification
- **Liskov Substitution**: All implementations honor their contracts
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Key Interfaces

```typescript
// OAuth service contract
interface IClickUpOAuthService {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForTokens(code: string, state: string): Promise<TokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
}

// API client contract
interface IClickUpClient {
  validateToken(): Promise<boolean>;
  createTask(listId: string, task: CreateTaskRequest): Promise<ClickUpTask>;
  getSpaces(teamId: string): Promise<ClickUpSpace[]>;
}
```

## Deployment

### Deploy to Cloudflare Workers

```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging
```

### Environment-Specific Configuration

Create environment-specific configurations in `wrangler.jsonc`:

```json
{
  "env": {
    "staging": {
      "vars": {
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

## Security Considerations

- **OAuth State Parameter**: CSRF protection using cryptographically secure random state
- **Token Encryption**: All stored tokens are encrypted using AES-256
- **HTTPS Only**: All communication over secure channels
- **Input Validation**: All inputs validated using Zod schemas
- **Rate Limiting**: Respect API rate limits with exponential backoff

## Monitoring and Logging

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: Request timing and success rates
- **Health Checks**: Automated health monitoring

## Contributing

1. **Interface First**: Always define interfaces before implementations
2. **Test Coverage**: Write tests for all new functionality
3. **Type Safety**: Use TypeScript strictly, avoid `any` types
4. **SOLID Principles**: Follow architectural guidelines
5. **Documentation**: Update README and code comments

## Troubleshooting

### Common Issues

1. **OAuth Callback Errors**
   - Verify redirect URL matches ClickUp app configuration
   - Check state parameter validation

2. **API Authentication Failures**
   - Verify tokens are properly stored and retrieved
   - Check token expiration and refresh logic

3. **Rate Limiting**
   - Implement exponential backoff
   - Monitor rate limit headers

### Debug Mode

Set `LOG_LEVEL=debug` for verbose logging:

```bash
wrangler secret put LOG_LEVEL debug
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue in the repository
