# Project Structure and Architecture

## Directory Structure
```
zendesk-clickup-automation/
├── src/                          # Source code
│   ├── index.ts                  # Main worker entry point
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts             # Core types (ZendeskTicket, ClickUpWebhook, etc.)
│   │   └── agents.ts            # Agent system types
│   ├── services/                 # Business logic services
│   │   ├── ai.ts                # Google Gemini AI integration
│   │   ├── slack.ts             # Slack Bot API service
│   │   ├── zendesk.ts           # Zendesk API service
│   │   ├── multi-agent-service.ts  # LangGraph orchestration
│   │   ├── clickup/             # ClickUp-related services
│   │   │   ├── clickup.ts       # Main ClickUp API service
│   │   │   └── clickup_oauth.ts # OAuth authentication service
│   │   └── agents/              # Individual agent implementations
│   │       ├── base-agent.ts    # Base agent class
│   │       ├── business-analyst.ts
│   │       ├── devops.ts
│   │       ├── project-manager.ts
│   │       ├── qa-tester.ts
│   │       ├── software-engineer.ts
│   │       ├── wordpress-developer.ts
│   │       ├── multi-agent-orchestrator.ts
│   │       └── index.ts
│   ├── utils/                    # Utility functions
│   │   └── index.ts             # CORS, response formatting, mapping
│   └── routes/                   # Route handlers
│       └── agents.ts            # Agent-specific routes
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── wrangler.toml                # Base Cloudflare Worker config
├── wrangler.dev.jsonc           # Development environment config
├── wrangler.production.jsonc    # Production environment config
├── worker-configuration.d.ts    # Cloudflare Worker type definitions
├── test-phase1.js              # Integration test script
└── *.md                        # Documentation files
```

## Key Architecture Components

### Main Entry Point (`src/index.ts`)
- Central request router and handler
- Service initialization with graceful error handling
- CORS handling for all responses
- Comprehensive endpoint definitions
- Error handling and response formatting

### Service Layer
**AIService** (`src/services/ai.ts`)
- Google Gemini API integration
- Ticket analysis and summarization
- Configurable AI provider support

**ClickUpService** (`src/services/clickup/clickup.ts`)
- ClickUp API integration
- Task creation from Zendesk tickets
- OAuth token support
- AI-enhanced task descriptions

**ZendeskService** (`src/services/zendesk.ts`)
- Zendesk API integration
- Ticket retrieval and processing

**SlackService** (`src/services/slack.ts`)
- Slack Bot API integration
- Intelligent notifications
- Webhook signature verification
- Multi-agent integration for responses

**MultiAgentService** (`src/services/multi-agent-service.ts`)
- LangGraph-based orchestration
- Agent routing and coordination
- Workflow metrics and tracking

### Data Flow
1. **Webhook Received** → `src/index.ts` routing
2. **Service Initialization** → All services initialized with error handling
3. **Data Processing** → Service-specific logic (AI analysis, task creation)
4. **Storage** → Cloudflare KV for mappings and OAuth data
5. **Notifications** → Slack integration for user updates
6. **Response** → Standardized JSON response format

### Environment Configuration
**Development** (`wrangler.dev.jsonc`)
- Personal KV namespaces
- Development-specific environment variables
- Local testing configuration

**Production** (`wrangler.production.jsonc`)
- Company/shared KV namespaces
- Production environment variables
- Production deployment settings

## API Design Patterns

### Webhook Endpoints
- `/zendesk-webhook` - Processes Zendesk ticket events
- `/clickup-webhook` - Processes ClickUp task events
- `/slack/events` - Slack Events API
- `/slack/commands` - Slack Slash Commands

### Testing Endpoints
- `/test-ai` - AI functionality testing
- `/test-clickup` - ClickUp integration testing
- `/test-slack` - Slack integration testing

### OAuth Endpoints
- `/auth/clickup` - Start OAuth flow
- `/auth/clickup/callback` - OAuth callback handler
- `/auth/clickup/status` - Check authorization status

### Agent Endpoints
- `/agents/process-ticket` - Multi-agent ticket processing
- `/agents/analyze-and-create-tasks` - AI + agent analysis
- `/agents/comprehensive-insights` - Full workflow insights
- `/agents/capabilities` - List agent capabilities

## Storage Architecture
**Cloudflare KV Usage:**
- Task mapping storage (`zendesk_{ticket_id}` → ClickUp task details)
- OAuth token storage (`oauth_user_{user_id}` → OAuth credentials)
- OAuth state storage (`oauth_state_{state}` → CSRF protection)
- Agent metrics and workflow data
