# 🧪 TaskGenie Testing Guide

This comprehensive guide will help you set up and test all components of the TaskGenie AI-powered Slack bot, including Slack integration, AI summarization, and the complete Zendesk-ClickUp workflow.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Cloudflare account with Workers enabled
- [ ] Zendesk admin access
- [ ] ClickUp workspace admin access
- [ ] Slack workspace admin access
- [ ] Google AI Studio account (for Gemini API)

## 🚀 Step 1: Environment Setup

### 1.1 Clone and Install Dependencies

```bash
# Navigate to your project directory
cd d:\Development\Projects\Products\zendesk-clickup-automation

# Install dependencies (if not already done)
npm install

# Copy environment template
cp .env.example .env
```

### 1.2 Configure Environment Variables

Edit your `.env` file with the following configuration:

```env
# Zendesk Configuration
ZENDESK_DOMAIN=your-subdomain.zendesk.com
ZENDESK_EMAIL=your-email@company.com
ZENDESK_TOKEN=your-zendesk-api-token

# ClickUp Configuration  
CLICKUP_TOKEN=your-clickup-api-token
CLICKUP_LIST_ID=your-list-id
CLICKUP_SPACE_ID=your-space-id

# Slack Configuration (TaskGenie Bot)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token

# AI Provider Configuration
AI_PROVIDER=googlegemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Security & Development
WEBHOOK_SECRET=your-webhook-secret
ENVIRONMENT=development
```

## 🤖 Step 2: Google Gemini AI Setup

### 2.1 Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file as `GOOGLE_GEMINI_API_KEY`

### 2.2 Test AI Integration

```bash
# Start the development server
npm run dev

# Test the AI endpoint (in a new terminal)
curl -X POST http://127.0.0.1:8787/test-ai \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Customer is experiencing login issues with their account. Unable to access dashboard after password reset. This is urgent and needs immediate attention."
  }'
```

Expected response:
```json
{
  "provider": "googlegemini",
  "summary": "Customer experiencing login issues after password reset, unable to access dashboard. Urgent priority requiring immediate technical support."
}
```

## 💬 Step 3: Slack App Setup

### 3.1 Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name: "TaskGenie"
4. Select your workspace
5. Click "Create App"

### 3.2 Configure Bot Token Scopes

1. Go to "OAuth & Permissions" in the sidebar
2. Scroll to "Scopes" → "Bot Token Scopes"
3. Add the following scopes:
   - `app_mentions:read`
   - `chat:write`
   - `channels:read`
   - `im:read`
   - `im:write`

### 3.3 Install App to Workspace

1. Scroll to "OAuth Tokens for Your Workspace"
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
5. Add it to your `.env` file as `SLACK_BOT_TOKEN`

### 3.4 Get Signing Secret

1. Go to "Basic Information" in the sidebar
2. Scroll to "App Credentials"
3. Copy the "Signing Secret"
4. Add it to your `.env` file as `SLACK_SIGNING_SECRET`

### 3.5 Configure Event Subscriptions

1. Go to "Event Subscriptions" in the sidebar
2. Toggle "Enable Events" to ON
3. Set Request URL: `https://your-worker.your-subdomain.workers.dev/slack/events`
   - For local testing: Use ngrok or similar tunneling service
4. Subscribe to bot events:
   - `app_mention`
   - `message.channels`
   - `message.im`

### 3.6 Configure Slash Commands

1. Go to "Slash Commands" in the sidebar
2. Click "Create New Command"
3. Configure:
   - Command: `/taskgenie`
   - Request URL: `https://your-worker.your-subdomain.workers.dev/slack/commands`
   - Short Description: "Get help from TaskGenie AI bot"
   - Usage Hint: `help | summarize`

## 🔧 Step 4: Local Development Testing

### 4.1 Start Development Server

```bash
# Start the server
npm run dev

# Server should start on http://127.0.0.1:8787
```

### 4.2 Test Health Endpoints

```bash
# Test health check
curl http://127.0.0.1:8787/

# Test environment configuration
curl http://127.0.0.1:8787/test
```

Expected responses:
- Health check: `{"status":"healthy","message":"TaskGenie is running!"}`
- Environment test: Configuration validation with all services

### 4.3 Test Slack Integration (Local)

For local testing, you'll need to expose your local server:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Expose local server
ngrok http 8787

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your Slack app endpoints to use this URL
```

## 🧪 Step 5: Slack Bot Testing

### 5.1 Test App Mentions

1. Invite TaskGenie to a channel: `/invite @TaskGenie`
2. Mention the bot: `@TaskGenie help`
3. Expected response: Help message with available commands

### 5.2 Test Slash Commands

1. Use the slash command: `/taskgenie help`
2. Expected response: Interactive help message

### 5.3 Test Direct Messages

1. Send a DM to TaskGenie: "help"
2. Expected response: Help message with bot capabilities

## 🎫 Step 6: End-to-End Workflow Testing

### 6.1 Test Zendesk → ClickUp → Slack Flow

```bash
# Simulate a Zendesk ticket creation
curl -X POST http://127.0.0.1:8787/zendesk-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ticket.created",
    "ticket": {
      "id": 12345,
      "subject": "Customer login issues - URGENT",
      "description": "Customer John Doe is unable to log into his account after password reset. He gets an error message saying invalid credentials. This is affecting his ability to access important documents. Priority: High. Customer is frustrated and needs immediate assistance.",
      "priority": "high",
      "status": "new",
      "requester": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  }'
```

Expected workflow:
1. ✅ ClickUp task created
2. ✅ Slack notification sent to #taskgenie channel
3. ✅ Message includes ticket and task links

### 6.2 Test AI Summarization in Slack

1. Find the Slack notification from the previous test
2. Reply to the thread: "Can you summarize this ticket?"
3. Expected response: AI-powered summary of the ticket content

## 🚀 Step 7: Production Deployment Testing

### 7.1 Deploy to Cloudflare Workers

```bash
# Deploy the worker
npm run deploy

# Note the deployed URL (e.g., https://your-worker.your-subdomain.workers.dev)
```

### 7.2 Update Slack App URLs

1. Go back to your Slack app configuration
2. Update all URLs to use your production worker URL:
   - Event Subscriptions: `https://your-worker.your-subdomain.workers.dev/slack/events`
   - Slash Commands: `https://your-worker.your-subdomain.workers.dev/slack/commands`

### 7.3 Configure Production Environment Variables

```bash
# Set secrets in Cloudflare Workers
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put GOOGLE_GEMINI_API_KEY
wrangler secret put ZENDESK_TOKEN
wrangler secret put CLICKUP_TOKEN
wrangler secret put WEBHOOK_SECRET

# Set other environment variables
wrangler env put ZENDESK_DOMAIN your-subdomain.zendesk.com
wrangler env put ZENDESK_EMAIL your-email@company.com
wrangler env put CLICKUP_LIST_ID your-list-id
wrangler env put AI_PROVIDER googlegemini
wrangler env put ENVIRONMENT production
```

### 7.4 Test Production Deployment

```bash
# Test health check
curl https://your-worker.your-subdomain.workers.dev/

# Test environment configuration
curl https://your-worker.your-subdomain.workers.dev/test
```

## 🔍 Step 8: Advanced Testing Scenarios

### 8.1 Test Different AI Prompts

```bash
# Test various ticket scenarios
curl -X POST https://your-worker.your-subdomain.workers.dev/test-ai \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Customer reports that the mobile app crashes every time they try to upload a photo. They are using iPhone 12 with iOS 15.6. Error occurs consistently. Customer has tried restarting the app and phone. Issue started after the latest app update."
  }'
```

### 8.2 Test Error Handling

```bash
# Test with invalid data
curl -X POST https://your-worker.your-subdomain.workers.dev/zendesk-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invalid.event",
    "ticket": {}
  }'
```

### 8.3 Test Slack Thread Interactions

1. Create a test ticket (as in 6.1)
2. In the Slack thread, try various commands:
   - "summarize"
   - "help"
   - "what is this ticket about?"
   - "give me a summary"

## 📊 Step 9: Monitoring and Validation

### 9.1 Check Cloudflare Workers Logs

1. Go to Cloudflare Dashboard → Workers
2. Click on your worker
3. Go to "Logs" tab
4. Monitor real-time logs during testing

### 9.2 Validate Integrations

- [ ] ✅ Zendesk tickets create ClickUp tasks
- [ ] ✅ Slack notifications are sent
- [ ] ✅ AI summarization works in threads
- [ ] ✅ Bot responds to mentions
- [ ] ✅ Slash commands work
- [ ] ✅ Error handling is graceful
- [ ] ✅ All environment variables are configured

## 🐛 Troubleshooting Common Issues

### Issue: Slack Events Not Received

**Solution:**
1. Check Event Subscriptions URL is correct
2. Verify bot token scopes include required permissions
3. Ensure webhook signature verification is working
4. Check Cloudflare Workers logs for errors

### Issue: AI Summarization Fails

**Solution:**
1. Verify Google Gemini API key is valid
2. Check API quota limits in Google AI Studio
3. Review error logs for specific API errors
4. Test with simpler text content

### Issue: ClickUp Task Creation Fails

**Solution:**
1. Validate ClickUp token and list ID
2. Check ClickUp API permissions
3. Verify list exists and is accessible
4. Review ClickUp webhook configuration

### Issue: Slack Bot Not Responding

**Solution:**
1. Check bot is invited to the channel
2. Verify bot token is correctly configured
3. Ensure app is installed in workspace
4. Check signing secret matches

## 🎉 Success Criteria

Your TaskGenie setup is successful when:

- [ ] ✅ Health endpoints return 200 OK
- [ ] ✅ Environment test shows all services configured
- [ ] ✅ Slack bot responds to mentions and commands
- [ ] ✅ AI summarization works with Google Gemini
- [ ] ✅ Zendesk tickets automatically create ClickUp tasks
- [ ] ✅ Slack notifications are sent for new tasks
- [ ] ✅ Thread-based AI summarization works
- [ ] ✅ Error handling is graceful and informative

## 📞 Support

If you encounter issues:

1. Check the `/test` endpoint for configuration validation
2. Review Cloudflare Workers logs
3. Verify all API tokens and permissions
4. Test individual components in isolation
5. Check webhook configurations in all platforms

---

**Happy Testing!** 🧞‍♂️✨

Your TaskGenie bot should now be fully functional and ready to make your support workflow magical!