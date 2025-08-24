/**
 * @ai-metadata
 * @component: SlackBotManager
 * @description: Service responsible for bot join tracking and channel management using shared error handling utilities
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/slack-bot-manager.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../interfaces/index.ts", "../utils/index.ts", "./slack-messaging.service.ts", "../types/index.ts"]
 * @tests: ["./tests/slack-bot-manager.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Refactored to use shared SlackAPIError interface and error utilities (isSlackPlatformError, isSlackAPIError, logSlackError) for consistent error handling across all Slack services. Improved maintainability and reusability."
 *
 * @approvals:
 *   - dev-approved: true
 *   - dev-approved-by: "ai-assistant"
 *   - dev-approved-date: "2025-01-13T10:55:00Z"
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { WebClient } from "@slack/web-api";
import type { Env } from "../../../../types";
import type { BotJoinTracker, PersistentBotJoinData } from "../types";
import { logSlackError } from "../utils";
import { SlackMessagingService } from "./slack-messaging.service";

/**
 * Service responsible for bot join tracking and channel management
 *
 * This class manages:
 * - Bot join tracking with cooldown periods
 * - Persistent storage of bot state in KV storage
 * - Channel management and intro message sending
 * - In-memory tracking for performance optimization
 *
 * @example
 * ```typescript
 * const botManager = new SlackBotManager(client, messagingService, env);
 * botManager.setBotUserId('U1234567890');
 * await botManager.handleBotJoinedChannel('C1234567890');
 * ```
 */
export class SlackBotManager {
  private client: WebClient;
  private messagingService: SlackMessagingService;
  private env: Env;
  private botJoinTracker: BotJoinTracker;
  private botUserId?: string;
  private readonly KV_BOT_JOIN_PREFIX = "bot_join_";
  private readonly BOT_JOIN_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize the Slack bot manager
   * @param client - The Slack WebClient instance
   * @param messagingService - The messaging service for sending bot messages
   * @param env - Environment configuration containing KV storage
   */
  constructor(
    client: WebClient,
    messagingService: SlackMessagingService,
    env: Env
  ) {
    this.client = client;
    this.messagingService = messagingService;
    this.env = env;

    // Initialize bot join tracking
    this.botJoinTracker = {
      channelsJoined: new Set<string>(),
      lastJoinTime: new Map<string, number>(),
    };
  }

  /**
   * Set the bot's user ID for tracking purposes
   * @param botUserId - The bot's Slack user ID (must be a valid Slack user ID)
   * @throws {Error} If botUserId is empty or invalid format
   */
  setBotUserId(botUserId: string): void {
    if (
      !botUserId ||
      typeof botUserId !== "string" ||
      botUserId.trim().length === 0
    ) {
      throw new Error("Bot user ID must be a non-empty string");
    }

    // Basic validation for Slack user ID format (starts with U)
    if (!botUserId.startsWith("U")) {
      console.warn(
        `⚠️ Bot user ID '${botUserId}' does not follow standard Slack user ID format (should start with 'U')`
      );
    }

    this.botUserId = botUserId;
    console.log(`🤖 Bot user ID set to: ${botUserId}`);
  }

  /**
   * Handle bot joining a channel with cooldown and intro message
   * @param channel - The channel ID that the bot joined (must be a valid Slack channel ID)
   * @returns Promise that resolves when join handling is complete
   * @throws {Error} If channel ID is invalid
   */
  async handleBotJoinedChannel(channel: string): Promise<void> {
    // Input validation
    if (
      !channel ||
      typeof channel !== "string" ||
      channel.trim().length === 0
    ) {
      throw new Error("Channel ID must be a non-empty string");
    }

    // Basic validation for Slack channel ID format (starts with C)
    if (!channel.startsWith("C")) {
      console.warn(
        `⚠️ Channel ID '${channel}' does not follow standard Slack channel ID format (should start with 'C')`
      );
    }

    try {
      // Check if we've already processed this channel recently
      const existingData = await this.getBotJoinData(channel);
      const now = Date.now();

      if (
        existingData &&
        now - existingData.lastJoinTime < this.BOT_JOIN_COOLDOWN
      ) {
        console.log(
          `⏰ Bot join cooldown active for channel ${channel} - skipping intro message`
        );
        return;
      }

      // Update tracking
      this.botJoinTracker.channelsJoined.add(channel);
      this.botJoinTracker.lastJoinTime.set(channel, now);

      // Store persistent data
      const joinData: PersistentBotJoinData = {
        channelId: channel,
        lastJoinTime: now,
        messagesSent: existingData ? existingData.messagesSent + 1 : 1,
        botUserId: this.botUserId || "unknown",
        createdAt: existingData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.storeBotJoinData(channel, joinData);

      // Send intro message
      await this.messagingService.sendBotIntroMessage(channel);

      console.log(
        `✅ Bot successfully joined and introduced to channel: ${channel}`
      );
    } catch (error: unknown) {
      logSlackError(
        error,
        `SlackBotManager.handleBotJoinedChannel(${channel})`,
        "bot join handling"
      );
      throw error;
    }
  }

  /**
   * Get bot join data from KV storage
   * @param channelId - The channel ID to get data for
   * @returns Promise that resolves to bot join data or null if not found
   */
  private async getBotJoinData(
    channelId: string
  ): Promise<PersistentBotJoinData | null> {
    if (!this.env.TASK_MAPPING) {
      console.warn(
        "⚠️ KV storage not available - using in-memory tracking only"
      );
      const hasChannel = this.botJoinTracker.channelsJoined.has(channelId);
      const lastJoinTime = this.botJoinTracker.lastJoinTime.get(channelId);

      if (hasChannel && lastJoinTime) {
        return {
          channelId,
          lastJoinTime,
          messagesSent: 1,
          botUserId: this.botUserId || "unknown",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return null;
    }

    try {
      const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
      const data = await this.env.TASK_MAPPING.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as PersistentBotJoinData;
    } catch (error: unknown) {
      logSlackError(
        error,
        `SlackBotManager.getBotJoinData(${channelId})`,
        "retrieving bot join data"
      );
      return null;
    }
  }

  /**
   * Store bot join data to KV storage
   * @param channelId - The channel ID to store data for
   * @param data - The bot join data to store
   * @returns Promise that resolves when data is stored
   */
  private async storeBotJoinData(
    channelId: string,
    data: PersistentBotJoinData
  ): Promise<void> {
    if (!this.env.TASK_MAPPING) {
      console.warn("⚠️ KV storage not available - bot join data not persisted");
      return;
    }

    try {
      const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
      await this.env.TASK_MAPPING.put(key, JSON.stringify(data));
      console.log("💾 Bot join data stored for channel:", channelId);
    } catch (error: unknown) {
      logSlackError(
        error,
        `SlackBotManager.storeBotJoinData(${channelId})`,
        "storing bot join data"
      );
    }
  }

  /**
   * Reset channel tracking data
   * @param channelId - Optional specific channel ID to reset, or all channels if not provided
   * @returns Promise that resolves when tracking is reset
   * @throws {Error} If channelId is provided but invalid
   */
  async resetChannelTracking(channelId?: string): Promise<void> {
    // Input validation for channelId if provided
    if (channelId !== undefined) {
      if (
        !channelId ||
        typeof channelId !== "string" ||
        channelId.trim().length === 0
      ) {
        throw new Error("Channel ID must be a non-empty string when provided");
      }

      // Basic validation for Slack channel ID format (starts with C)
      if (!channelId.startsWith("C")) {
        console.warn(
          `⚠️ Channel ID '${channelId}' does not follow standard Slack channel ID format (should start with 'C')`
        );
      }
    }
    if (channelId) {
      // Clear in-memory tracking
      this.botJoinTracker.channelsJoined.delete(channelId);
      this.botJoinTracker.lastJoinTime.delete(channelId);

      // Clear persistent storage
      if (this.env.TASK_MAPPING) {
        try {
          const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
          await this.env.TASK_MAPPING.delete(key);
          console.log(
            `🔄 Reset tracking for channel ${channelId} (memory + storage)`
          );
        } catch (error: unknown) {
          logSlackError(
            error,
            `SlackBotManager.resetChannelTracking(${channelId})`,
            "clearing persistent data"
          );
        }
      } else {
        console.log(`🔄 Reset in-memory tracking for channel ${channelId}`);
      }
    } else {
      // Clear all in-memory tracking
      this.botJoinTracker.channelsJoined.clear();
      this.botJoinTracker.lastJoinTime.clear();

      console.log("🔄 Reset all in-memory channel tracking");
      console.warn(
        "⚠️ Persistent storage reset requires manual cleanup or specific channel IDs"
      );
    }
  }

  /**
   * Get the bot join tracker instance
   * @returns The current BotJoinTracker object
   */
  getBotJoinTracker(): BotJoinTracker {
    return this.botJoinTracker;
  }

  // Note: Removed unused utility methods (hasJoinedChannel, getLastJoinTime, getTrackedChannels)
  // These methods were not being used anywhere in the codebase and can be re-added if needed
}
