# 📁 slack-service Module Map

> **Purpose**: Class-based components and services

## 📊 Quick Stats
- **Files**: 6
- **Classes**: 6
- **Interfaces**: 0
- **Functions**: 0

## 🗂️ Files Overview

### `slack-bot-manager.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackBotManager`
**Methods**:
- `constructor(client, messagingService, env)`
- `setBotUserId(botUserId)`
- `handleBotJoinedChannel(channel)`
- `private getBotJoinData(channelId)`
- `private storeBotJoinData(channelId, data)`
- `resetChannelTracking(channelId)`
- `getBotJoinTracker()`

**Properties**:
- `client: WebClient`
- `messagingService: SlackMessagingService`
- `env: Env`
- `botJoinTracker: BotJoinTracker`
- `botUserId: string`
- `KV_BOT_JOIN_PREFIX: unknown`
- `BOT_JOIN_COOLDOWN: unknown`

---

### `slack-emoji.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackEmojiService`
**Methods**:
- `constructor()`
- `getCategoryEmoji(category)`
- `getPriorityEmoji(priority)`
- `getStatusEmoji(status)`
- `getActionEmoji(action)`
- `getSystemEmoji(type)`
- `getAllCategoryEmojis()`
- `getAllPriorityEmojis()`
- `getAllStatusEmojis()`
- `getAllActionEmojis()`
- `getAllSystemEmojis()`
- `setCategoryEmoji(category, emoji)`
- `setPriorityEmoji(priority, emoji)`
- `setStatusEmoji(status, emoji)`
- `setActionEmoji(action, emoji)`
- `setSystemEmoji(type, emoji)`
- `formatMessage(type, value, message)`
- `getCombinedEmoji(priority, category)`

**Properties**:
- `categoryEmojis: Record`
- `priorityEmojis: Record`
- `statusEmojis: Record`
- `actionEmojis: Record`
- `systemEmojis: Record`

---

### `slack-event-handler.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackEventHandler`
**Methods**:
- `constructor(client, messagingService, botManager, multiAgentService, taskGenie)`
- `setBotUserId(botUserId)`
- `handleMention(event)`
- `handleMemberJoined(event)`
- `private isDirectMention(text)`
- `private parseSlackCommand(text)`
- `private handleSlackCommand(channel, threadTs, command, user)`
- `handleStatusRequest(channel, threadTs, ticketId)`
- `handleSummarizeRequest(channel, threadTs, ticketId)`
- `handleListTicketsRequest(channel, user, threadTs)`
- `handleAnalyticsRequest(channel, user, threadTs)`
- `handleEvent(event)`

**Properties**:
- `client: WebClient`
- `messagingService: SlackMessagingService`
- `botManager: SlackBotManager`
- `multiAgentService: unknown`
- `taskGenie: unknown`
- `botUserId: string`

---

### `slack-messaging.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackMessagingService`
**Methods**:
- `constructor(client, env)`
- `sendMessage(channel, text, threadTs)`
- `sendIntelligentNotification(channel, ticketData, param)`
- `sendTaskCreationMessage(channel, ticketData, taskData, threadTs)`
- `sendThreadedAIAnalysis(channel, threadTs, analysis)`
- `sendThreadedTeamMentions(channel, threadTs, mentions, enhancedMessage, timeline, nextSteps)`
- `sendThreadedMessage(channel, threadTs, text, blocks)`
- `sendBotIntroMessage(channel)`
- `getCategoryEmoji(category)`
- `getPriorityEmoji(priority)`
- `getEmojiService()`
- `getHelpMessage()`

**Properties**:
- `client: WebClient`
- `env: Env`
- `emojiService: SlackEmojiService`

---

### `slack-security.service.ts`
**Purpose**: Class definitions and implementations | **Risk**: high

**CLASS**: `SlackSecurityService`
**Methods**:
- `constructor(client, env)`
- `verifyRequest(signature, body, timestamp)`
- `verifyRequestWithAudit(signature, body, timestamp)`
- `getSecurityMetrics()`
- `getSecurityAuditLog()`
- `getTokenMetadata()`
- `checkTokenRotationStatus()`
- `forceTokenRotation()`
- `updateTokenRotationConfig(config)`
- `getTokenRotationConfig()`
- `validateTokenPermissions(requiredScopes)`
- `isTokenValid()`
- `checkManifestPermissions()`

**Properties**:
- `client: WebClient`
- `env: Env`

---

### `slack-service.ts`
**Purpose**: Class definitions and implementations | **Risk**: medium

**CLASS**: `SlackService`
**Methods**:
- `constructor(env)`
- `private initializeBotUserId()`
- `sendMessage(channel, text, threadTs)`
- `sendIntelligentNotification(channel, ticketData, clickupUrl, assignmentRecommendation)`
- `sendTaskCreationMessage(channel, ticketId, zendeskUrl, clickupUrl, userName)`
- `sendThreadedAIAnalysis(channel, threadTs, analysis)`
- `sendThreadedTeamMentions(channel, threadTs, mentions, enhancedMessage, timeline, nextSteps)`
- `sendThreadedMessage(channel, threadTs, text, blocks)`
- `sendBotIntroMessage(channel)`
- `getCategoryEmoji(category)`
- `getPriorityEmoji(priority)`
- `getHelpMessage()`
- `handleEvent(event)`
- `handleMention(event)`
- `handleMemberJoined(event)`
- `handleStatusRequest(channel, user, threadTs)`
- `handleSummarizeRequest(channel, user, threadTs)`
- `handleListTicketsRequest(channel, user, threadTs)`
- `handleAnalyticsRequest(channel, user, threadTs)`
- `handleBotJoinedChannel(channel)`
- `getBotJoinData()`
- `storeBotJoinData(channel, data)`
- `resetChannelTracking(channelId)`
- `verifyRequest(signature, body, timestamp)`
- `verifyRequestWithAudit(signature, body, timestamp)`
- `getSecurityMetrics()`
- `getSecurityAuditLog()`
- `getTokenMetadata()`
- `checkTokenRotationStatus()`
- `forceTokenRotation()`
- `updateTokenRotationConfig(config)`
- `checkManifestPermissions()`
- `getAppTemplates()`
- `deployAppFromTemplate(template, appId)`
- `updateAppConfiguration(appId, updates, options)`
- `validateAppConfiguration(appId)`
- `getSocketModeStatus()`
- `setClickUpService(clickupService)`
- `isSocketModeAvailable()`
- `reconnectSocketMode()`
- `shutdownSocketMode()`
- `getBotUserId()`
- `getClient()`
- `getMessagingService()`
- `getEventHandler()`
- `getBotManager()`
- `getSecurityService()`

**Properties**:
- `client: WebClient`
- `env: Env`
- `botUserId: string`
- `messagingService: SlackMessagingService`
- `eventHandler: SlackEventHandler`
- `botManager: SlackBotManager`
- `securityService: SlackSecurityService`

---

## 🔗 Dependencies
- `../../../../types`
- `../interfaces`
- `../types`
- `../utils`
- `./slack-bot-manager.service`
- `./slack-emoji.service`
- `./slack-event-handler.service`
- `./slack-messaging.service`
- `./slack-security.service`

## 📝 Usage Examples
```typescript
// Add usage examples here
```

---
*Generated on: 8/24/2025, 2:46:13 PM*
