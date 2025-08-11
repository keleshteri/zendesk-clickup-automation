# 🧞‍♂️ TaskGenie - AI-Powered Slack Bot

TaskGenie is an intelligent Slack bot that seamlessly integrates Zendesk, ClickUp, and AI-powered summarization to streamline your support workflow.

## ✨ Features

### 🎫 Automated Task Creation
- **Zendesk Integration**: Automatically creates ClickUp tasks when new Zendesk tickets are created
- **Smart Notifications**: Sends beautiful Slack messages with ticket and task links
- **Bidirectional Sync**: Maintains synchronization between platforms

### 🤖 AI-Powered Summarization
- **Google Gemini Integration**: Uses Google's Gemini Pro model for intelligent ticket summarization
- **Thread-Based Interaction**: Reply to task creation messages and ask for "summarize"
- **Contextual Understanding**: AI analyzes ticket content and provides concise summaries

### 💬 Slack Bot Capabilities
- **App Mentions**: Mention @TaskGenie for help and information
- **Slash Commands**: Use `/taskgenie` for quick assistance
- **Thread Responses**: Interactive summarization in message threads

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# AI Provider (start with Google Gemini)
AI_PROVIDER=googlegemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Existing Zendesk & ClickUp configs...
```

### 2. Slack App Setup

1. **Create a Slack App** at [api.slack.com](https://api.slack.com/apps)
2. **Enable Features**:
   - Bot Token Scopes: `app_mentions:read`, `chat:write`, `channels:read`
   - Event Subscriptions: `app_mention`, `message.channels`
   - Slash Commands: `/taskgenie`

3. **Configure Endpoints**:
   - Events: `https://your-worker.your-subdomain.workers.dev/slack/events`
   - Commands: `https://your-worker.your-subdomain.workers.dev/slack/commands`

### 3. Google Gemini Setup

1. **Get API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Add to Environment**: Set `GOOGLE_GEMINI_API_KEY`
3. **Set Provider**: `AI_PROVIDER=googlegemini`

## 🎯 How It Works

### Workflow Overview

```mermaid
graph LR
    A[Zendesk Ticket Created] --> B[TaskGenie Webhook]
    B --> C[Create ClickUp Task]
    C --> D[Send Slack Notification]
    D --> E[User Replies "summarize"]
    E --> F[AI Analyzes Ticket]
    F --> G[Send Summary to Thread]
```

### Example Interaction

1. **New Zendesk Ticket**: Customer creates support ticket
2. **Automatic Task Creation**: TaskGenie creates ClickUp task
3. **Slack Notification**:
   ```
   🧞‍♂️ TaskGenie
   Hi Steve! 👋
   
   I've created a task for this Zendesk ticket.
   
   Zendesk Ticket: #12345
   ClickUp Task: View Task
   
   Need a summary of this ticket? Just reply to this thread 
   and ask for "summarize" - I can help with that! 🤖
   ```

4. **User Interaction**:
   ```
   👤 Steve: Can you summarize this ticket?
   
   🧞‍♂️ TaskGenie: 🤔 Let me analyze the ticket and create a summary for you...
   
   📋 Ticket Summary (powered by googlegemini)
   
   Customer experiencing login issues with their account. 
   Unable to access dashboard after password reset. 
   Priority: High. Requires immediate attention from 
   technical support team.
   ```

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and service status |
| `GET` | `/test` | Environment configuration test |
| `POST` | `/zendesk-webhook` | Zendesk ticket events |
| `POST` | `/clickup-webhook` | ClickUp task events |
| `POST` | `/slack/events` | Slack Events API |
| `POST` | `/slack/commands` | Slack slash commands |

## 🔧 Configuration

### Required Environment Variables

```env
# Zendesk
ZENDESK_DOMAIN=your-subdomain
ZENDESK_EMAIL=your-email@company.com
ZENDESK_TOKEN=your-zendesk-api-token

# ClickUp
CLICKUP_TOKEN=your-clickup-api-token
CLICKUP_LIST_ID=your-list-id

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# AI Provider
AI_PROVIDER=googlegemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Security
WEBHOOK_SECRET=your-webhook-secret
```

### Optional Configuration

```env
# ClickUp Organization
CLICKUP_TEAM_ID=your-team-id
CLICKUP_SPACE_ID=your-space-id

# Slack App Token (for Socket Mode)
SLACK_APP_TOKEN=xapp-your-app-token

# Future AI Providers
# OPENAI_API_KEY=your-openai-api-key
# OPENROUTER_API_KEY=your-openrouter-api-key
# OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

## 🎨 Customization

### Slack Channel Configuration

By default, TaskGenie sends notifications to `#taskgenie`. To customize:

1. **Environment Variable** (future): `SLACK_DEFAULT_CHANNEL=#your-channel`
2. **Code Modification**: Update `defaultChannel` in `src/index.ts`

### AI Provider Selection

Currently supports Google Gemini. Future providers:

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **OpenRouter**: Multiple models including Llama, Claude, etc.

## 🔒 Security

- **Webhook Verification**: All webhooks use signature verification
- **Environment Variables**: Sensitive data stored securely
- **CORS Protection**: Proper cross-origin request handling
- **Error Handling**: Comprehensive error logging and responses

## 🚀 Deployment

### Cloudflare Workers

```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy

# Development mode
npm run dev
```

### Environment Variables Setup

```bash
# Set environment variables in Cloudflare Workers
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put GOOGLE_GEMINI_API_KEY
wrangler secret put WEBHOOK_SECRET
# ... etc
```

## 🐛 Troubleshooting

### Common Issues

1. **Slack Events Not Received**
   - Check Event Subscriptions URL
   - Verify bot token scopes
   - Ensure webhook signature verification

2. **AI Summarization Fails**
   - Verify Google Gemini API key
   - Check API quota limits
   - Review error logs

3. **Task Creation Issues**
   - Validate ClickUp token and list ID
   - Check Zendesk webhook configuration
   - Review webhook secret

### Debug Mode

Check the `/test` endpoint for configuration validation:

```bash
curl https://your-worker.your-subdomain.workers.dev/test
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional AI providers (OpenAI, OpenRouter)
- Enhanced Slack interactions
- Custom notification templates
- Advanced routing rules
- Multi-language support

## 📄 License

MIT License - see LICENSE file for details.

---

**TaskGenie** - Making support workflows magical! 🧞‍♂️✨