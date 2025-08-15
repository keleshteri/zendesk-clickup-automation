# Zendesk-ClickUp Automation Project Overview

## Project Purpose
This is a **Cloudflare Worker** application that provides bidirectional synchronization between **Zendesk** (customer support) and **ClickUp** (project management) platforms. It serves as a webhook-based automation bridge with AI-powered enhancements.

## Key Features
- **Bidirectional Sync**: Automatic synchronization between Zendesk tickets and ClickUp tasks
- **AI-Powered Analysis**: Intelligent ticket analysis using Google Gemini API
- **Multi-Agent System**: LangGraph-based multi-agent orchestration for complex workflows
- **Slack Integration**: Intelligent notifications and bot interactions
- **OAuth Support**: Secure ClickUp OAuth authentication flow
- **Smart Mapping**: Intelligent conversion of statuses and priorities between platforms
- **Persistent Storage**: Task mapping storage using Cloudflare KV
- **Error Resilience**: Built-in retry mechanisms with exponential backoff

## Tech Stack
- **Platform**: Cloudflare Workers (serverless)
- **Runtime**: TypeScript with Web APIs
- **Storage**: Cloudflare KV for task mapping persistence
- **Communication**: REST API webhooks
- **AI**: Google Gemini API for ticket analysis
- **Framework**: Hono for routing, Chanfana for OpenAPI docs
- **Dependencies**: LangGraph for multi-agent orchestration, Zod for validation

## Architecture
The application uses a microservices-like architecture within a single Cloudflare Worker:

- **Main Handler** (`src/index.ts`): Routes requests and handles webhook events
- **Services**: 
  - `ZendeskService`: Zendesk API integration
  - `ClickUpService`: ClickUp API integration with OAuth support
  - `SlackService`: Slack Bot API integration
  - `AIService`: Google Gemini AI integration
  - `MultiAgentService`: LangGraph multi-agent orchestration
- **Types**: Comprehensive TypeScript interfaces
- **Utils**: Utility functions for mapping, authentication, error handling
- **Routes**: Agent-specific endpoints for multi-agent workflows

## Current Status
✅ **Fully Functional** with advanced features:
- Core automation (Zendesk → ClickUp)
- AI ticket analysis and enhancement
- Multi-agent workflow processing
- Slack bot integration with intelligent notifications
- OAuth authentication flow for ClickUp
- Comprehensive testing endpoints

## Environment Requirements
The project requires multiple service configurations:
- Zendesk (domain, email, API token)
- ClickUp (API token, OAuth credentials, workspace IDs)
- Slack (bot token, signing secret)
- Google Gemini AI (API key)
- Cloudflare (KV namespace for storage)
