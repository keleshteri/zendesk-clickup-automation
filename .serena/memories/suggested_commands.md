# Development Commands and Scripts

## Essential Commands

### Development and Testing
```bash
# Start local development server
npm run dev
# or
npm start

# Start with production config locally
npm run dev:prod

# Run Phase 1 test (AI features)
node test-phase1.js
```

### Deployment Commands
```bash
# Deploy to development environment (default)
npm run deploy
# or explicitly
npm run deploy:dev

# Deploy to production environment
npm run deploy:prod

# Manual deployment with specific configs
wrangler deploy --config wrangler.dev.jsonc     # Development
wrangler deploy --config wrangler.production.jsonc  # Production
```

### Cloudflare-specific Commands
```bash
# Generate TypeScript types for Cloudflare bindings
npm run cf-typegen

# View logs in real-time
wrangler tail

# Check worker status
wrangler whoami
wrangler kv:namespace list
```

### Testing Endpoints (when worker is running)
```bash
# Health check
curl http://localhost:8787/

# Environment test
curl http://localhost:8787/test

# Test AI functionality
curl -X POST http://localhost:8787/test-ai \
  -H "Content-Type: application/json" \
  -d '{"text":"Customer reporting payment issues"}'

# Test ClickUp integration
curl -X POST http://localhost:8787/test-clickup \
  -H "Content-Type: application/json" \
  -d '{"action":"test_auth"}'

# Test Slack integration
curl -X POST http://localhost:8787/test-slack \
  -H "Content-Type: application/json" \
  -d '{"action":"test_auth"}'
```

### OAuth Flow Testing
```bash
# Start ClickUp OAuth (requires WEBHOOK_SECRET)
curl http://localhost:8787/auth/clickup

# Check OAuth status (requires auth)
curl -H "Authorization: Bearer <WEBHOOK_SECRET>" \
     http://localhost:8787/auth/clickup/status
```

## Windows-Specific Utilities
Since this project runs on Windows, use these commands:
- `dir` instead of `ls`
- `cd` for navigation
- `type` instead of `cat` for file viewing
- `findstr` instead of `grep` for text search
- PowerShell or Command Prompt for terminal operations

## Environment Setup
1. Copy `.env.example` to `.env` (if exists)
2. Configure all required environment variables
3. Use `.dev.vars` for local development secrets
4. Use wrangler secrets for production deployment

## Debugging
- Use `wrangler tail` to view real-time logs
- Check `/test` endpoint for environment validation
- Use individual test endpoints to isolate issues
- Check browser DevTools for client-side debugging
