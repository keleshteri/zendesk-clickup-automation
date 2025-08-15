# Task Completion Guidelines

## Development Workflow
When completing any task on this project, follow these steps:

### 1. Code Quality Checks
- **TypeScript Compilation**: Ensure no TypeScript errors
  ```bash
  npm run cf-typegen  # Update Cloudflare types if needed
  ```
- **Manual Testing**: Test the specific functionality you've modified
- **Integration Testing**: Test how your changes affect the overall system

### 2. Testing Requirements
Before considering a task complete:

#### Local Testing
```bash
# Start the development server
npm run dev

# Test health endpoint
curl http://localhost:8787/

# Test environment configuration
curl http://localhost:8787/test
```

#### Feature-Specific Testing
Depending on what you worked on:

**AI Features:**
```bash
curl -X POST http://localhost:8787/test-ai \
  -H "Content-Type: application/json" \
  -d '{"text":"Test ticket content"}'
```

**ClickUp Integration:**
```bash
curl -X POST http://localhost:8787/test-clickup \
  -H "Content-Type: application/json" \
  -d '{"action":"test_auth"}'
```

**Webhook Integration:**
```bash
node test-phase1.js  # Comprehensive webhook test
```

**Multi-Agent System:**
```bash
curl -X POST http://localhost:8787/agents/simulate-workflow \
  -H "Content-Type: application/json"
```

### 3. Documentation Updates
- Update relevant `.md` files if you added new features
- Update environment variable documentation if new config is needed
- Update API endpoint documentation in the main health check response

### 4. Environment Configuration
- Ensure all required environment variables are documented
- Test with both development and production configurations
- Verify OAuth flows work correctly if modified

### 5. Error Handling Verification
- Test error scenarios (missing env vars, API failures, etc.)
- Ensure proper error responses with appropriate HTTP status codes
- Verify error logging includes sufficient context for debugging

### 6. Deployment Preparation
Before deploying to production:

```bash
# Test with production configuration locally
npm run dev:prod

# Deploy to development first
npm run deploy:dev

# After dev testing, deploy to production
npm run deploy:prod
```

### 7. Post-Deployment Verification
After deployment:
- Verify the health check endpoint responds correctly
- Test webhook endpoints with actual Zendesk/ClickUp webhooks
- Check Cloudflare Worker logs for any errors
- Verify KV storage operations work correctly

### 8. Rollback Plan
Always be prepared to rollback:
- Keep track of the previous working deployment
- Know how to quickly redeploy the previous version
- Have monitoring in place to detect issues quickly

## Definition of Done
A task is complete when:
- [ ] Code compiles without TypeScript errors
- [ ] Local testing passes for modified functionality
- [ ] Integration testing verifies system still works end-to-end
- [ ] Error handling works correctly
- [ ] Documentation is updated if needed
- [ ] Environment variables are properly configured
- [ ] Code follows project conventions and style
- [ ] Changes are deployed and verified in target environment

## Emergency Procedures
If something breaks in production:
1. Check Cloudflare Worker logs immediately
2. Verify environment configuration hasn't changed
3. Test individual service endpoints to isolate the issue
4. Rollback to previous working version if needed
5. Fix the issue and redeploy with thorough testing
