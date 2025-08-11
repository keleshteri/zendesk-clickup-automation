# Environment Configuration Guide

This project uses environment-specific Wrangler configurations to support both development and production deployments with different KV namespace configurations.

## Configuration Files

- **`wrangler.jsonc`** - Default development configuration
- **`wrangler.dev.jsonc`** - Explicit development configuration  
- **`wrangler.production.jsonc`** - Production/company configuration

## Key Differences

### Development Environment
- **Worker Name**: `zendesk-clickup-automation-dev`
- **KV Binding**: `TASK_MAPPING`
- **KV Namespace ID**: `9fdfd867b4bd4c5c9ef760578ffd7b52`

### Production Environment  
- **Worker Name**: `zendesk-clickup-automation-prod`
- **KV Binding**: `KV_BINDING`
- **KV Namespace ID**: `74c4672059e84e7db2d86dcc82aa4d96`

## Usage Commands

### Deployment
```bash
npm run deploy:dev    # Deploy to development
npm run deploy:prod   # Deploy to production  
npm run deploy        # Deploy to development (default)
```

### Local Development
```bash
npm run dev           # Run locally with dev config
npm run dev:prod      # Run locally with prod config
```

### Manual Commands
```bash
wrangler deploy --config wrangler.dev.jsonc
wrangler deploy --config wrangler.production.jsonc
wrangler dev --config wrangler.production.jsonc
```

## Git Workflow

Both configuration files are tracked in git, so:
- Push to **origin** (personal repo) → use `npm run deploy:dev`
- Push to **company** remote → use `npm run deploy:prod`

This allows you to maintain separate environments without conflicts.
