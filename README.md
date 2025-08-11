# Zendesk-ClickUp Automation

🚀 A Cloudflare Worker that provides bidirectional synchronization between Zendesk (customer support) and ClickUp (project management) platforms.

## Overview

This application serves as a webhook-based automation bridge that synchronizes tickets and tasks between Zendesk and ClickUp, enabling seamless workflow integration between customer support and project management teams.

## Features

- ✅ **Bidirectional Sync**: Automatic synchronization between Zendesk tickets and ClickUp tasks
- 🔄 **Smart Mapping**: Intelligent conversion of statuses and priorities between platforms
- 💾 **Persistent Storage**: Task mapping storage using Cloudflare KV
- 🛡️ **Error Resilience**: Built-in retry mechanisms with exponential backoff
- 🌐 **CORS Support**: Cross-origin requests enabled
- 📊 **Environment Validation**: Built-in configuration checking
- 🔐 **Secure Authentication**: Proper API authentication for both platforms

## Architecture

- **Platform**: Cloudflare Workers (serverless)
- **Runtime**: TypeScript with Web APIs
- **Storage**: Cloudflare KV for task mapping persistence
- **Communication**: REST API webhooks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and service status |
| `GET` | `/test` | Environment configuration validation |
| `POST` | `/zendesk-webhook` | Receives Zendesk ticket events |
| `POST` | `/clickup-webhook` | Receives ClickUp task events |

## Environment Variables

### Required Configuration

```bash
# Zendesk Configuration
ZENDESK_DOMAIN=your-domain.zendesk.com
ZENDESK_EMAIL=your-email@company.com
ZENDESK_TOKEN=your-zendesk-api-token

# ClickUp Configuration
CLICKUP_TOKEN=your-clickup-api-token
CLICKUP_LIST_ID=your-clickup-list-id
```

### Optional Configuration

```bash
# Additional ClickUp settings
CLICKUP_TEAM_ID=your-team-id
CLICKUP_SPACE_ID=your-space-id

# Environment
ENVIRONMENT=production
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers enabled
- Zendesk admin access
- ClickUp workspace admin access

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd zendesk-clickup-automation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configuration

#### Zendesk Setup
1. Go to Zendesk Admin → Apps and integrations → APIs → Zendesk API
2. Enable Token Access
3. Generate a new API token
4. Note your Zendesk domain and admin email

#### ClickUp Setup
1. Go to ClickUp Settings → Apps
2. Generate a new API token
3. Find your List ID from the ClickUp URL or API

#### Environment Configuration
Update your `.env` file with the obtained credentials:

```bash
ZENDESK_DOMAIN=yourcompany.zendesk.com
ZENDESK_EMAIL=admin@yourcompany.com
ZENDESK_TOKEN=your_zendesk_token_here
CLICKUP_TOKEN=your_clickup_token_here
CLICKUP_LIST_ID=your_list_id_here
```

### 4. Development

```bash
# Start local development server
npm run dev

# Test the endpoints
curl http://localhost:8787/
curl http://localhost:8787/test
```

### 5. Deployment

The project supports environment-specific configurations:

**Development Deployment:**
```bash
# Deploy to development environment (your personal KV namespace)
npm run deploy:dev
# or
npm run deploy  # Uses default dev config
```

**Production Deployment:**
```bash
# Deploy to production environment (company KV namespace)
npm run deploy:prod
```

**Manual Deployment with Specific Config:**
```bash
# Development
wrangler deploy --config wrangler.dev.jsonc

# Production  
wrangler deploy --config wrangler.production.jsonc
```

**Local Development:**
```bash
# Run locally with dev config
npm run dev

# Run locally with production config
npm run dev:prod
```

## Webhook Configuration

### Zendesk Webhook Setup
1. Go to Zendesk Admin → Extensions → Webhooks
2. Create a new webhook with your worker URL: `https://your-worker.your-subdomain.workers.dev/zendesk-webhook`
3. Configure triggers for ticket events (created, updated, status changed)

### ClickUp Webhook Setup
1. Go to ClickUp Settings → Integrations → Webhooks
2. Create a new webhook with your worker URL: `https://your-worker.your-subdomain.workers.dev/clickup-webhook`
3. Configure events for task changes (created, updated, status changed)

## Data Mapping

### Priority Mapping
| Zendesk | ClickUp |
|---------|----------|
| Low | 4 (Low) |
| Normal | 3 (Normal) |
| High | 2 (High) |
| Urgent | 1 (Urgent) |

### Status Mapping
| Zendesk | ClickUp |
|---------|----------|
| New | Open |
| Open | Open |
| Pending | In Progress |
| Solved | Complete |
| Closed | Closed |

## Project Structure

```
src/
├── index.ts          # Main worker handler and routing
├── types/
│   └── index.ts      # TypeScript interfaces and types
└── utils/
    └── index.ts      # Utility functions and helpers
```

## Key Components

- **Main Handler**: Routes requests and handles webhook events
- **Type Definitions**: Comprehensive interfaces for both platforms
- **Utility Functions**: Status mapping, authentication, error handling
- **Task Mapping**: Persistent storage for ticket-task relationships

## Development Status

✅ **Current Status**: Core Functionality Implemented

The application currently includes:
- ✅ Complete type definitions
- ✅ Webhook endpoint structure
- ✅ Utility functions for mapping and authentication
- ✅ Error handling and retry mechanisms
- ✅ **Zendesk → ClickUp Integration**: Automatic task creation when tickets are created
- ✅ Priority mapping between platforms
- ✅ Task mapping storage in KV
- 🔄 **Future Enhancement**: ClickUp → Zendesk sync (task updates back to tickets)

## Testing

### Health Check
```bash
curl https://your-worker.your-subdomain.workers.dev/
```

### Environment Test
```bash
curl https://your-worker.your-subdomain.workers.dev/test
```

### Webhook Test
```bash
# Test Zendesk webhook (will create actual ClickUp task)
curl -X POST https://your-worker.your-subdomain.workers.dev/zendesk-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ticket.created",
    "ticket": {
      "id": 12345,
      "subject": "Test ticket from API",
      "description": "This is a test ticket that should create a ClickUp task",
      "priority": "high",
      "status": "new"
    }
  }'

# Expected response:
# {
#   "status": "processed",
#   "message": "Zendesk ticket successfully converted to ClickUp task",
#   "data": {
#     "zendesk_ticket_id": 12345,
#     "zendesk_subject": "Test ticket from API",
#     "clickup_task_id": "abc123",
#     "clickup_task_url": "https://app.clickup.com/t/abc123"
#   }
# }
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the environment validation endpoint: `/test`
2. Review Cloudflare Workers logs
3. Verify webhook configurations in both platforms
4. Check API token permissions and validity