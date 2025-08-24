/**
 * @ai-metadata
 * @component: SlackBotManager
 * @description: Manages bot join tracking, channel management, and persistent storage of bot state
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types", "../types"]
 */

import { WebClient } from '@slack/web-api';
import type { Env } from '../../../../types';
import type {
  BotJoinTracker,
  PersistentBotJoinData
} from '../types';
import { SlackMessagingService } from './slack-messaging.service';

/**
 * Service responsible for bot join tracking and channel management
 */
export class SlackBotManager {
  private client: WebClient;
  private messagingService: SlackMessagingService;
  private env: Env;
  private botJoinTracker: BotJoinTracker;
  private botUserId?: string;
  private readonly KV_BOT_JOIN_PREFIX = 'bot_join_';
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
      lastJoinTime: new Map<string, number>()
    };
  }

  /**
   * Set the bot's user ID for tracking purposes
   * @param botUserId - The bot's Slack user ID
   */
  setBotUserId(botUserId: string): void {
    this.botUserId = botUserId;
  }

  /**
   * Handle bot joining a channel with cooldown and intro message
   * @param channel - The channel ID that the bot joined
   * @returns Promise that resolves when join handling is complete
   */
  async handleBotJoinedChannel(channel: string): Promise<void> {
    try {
      // Check if we've already processed this channel recently
      const existingData = await this.getBotJoinData(channel);
      const now = Date.now();
      
      if (existingData && (now - existingData.lastJoinTime) < this.BOT_JOIN_COOLDOWN) {
        console.log(`⏰ Bot join cooldown active for channel ${channel} - skipping intro message`);
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
        botUserId: this.botUserId || 'unknown',
        createdAt: existingData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await this.storeBotJoinData(channel, joinData);
      
      // Send intro message
      await this.messagingService.sendBotIntroMessage(channel);
      
      console.log(`✅ Bot successfully joined and introduced to channel: ${channel}`);
    } catch (error) {
      console.error(`❌ Error handling bot join for channel ${channel}:`, error);
    }
  }

  /**
   * Get bot join data from KV storage
   * @param channelId - The channel ID to get data for
   * @returns Promise that resolves to bot join data or null if not found
   */
  private async getBotJoinData(channelId: string): Promise<PersistentBotJoinData | null> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - using in-memory tracking only');
      const hasChannel = this.botJoinTracker.channelsJoined.has(channelId);
      const lastJoinTime = this.botJoinTracker.lastJoinTime.get(channelId);
      
      if (hasChannel && lastJoinTime) {
        return {
          channelId,
          lastJoinTime,
          messagesSent: 1,
          botUserId: this.botUserId || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
    } catch (error) {
      console.error('💥 Error retrieving bot join data:', error);
      return null;
    }
  }

  /**
   * Store bot join data to KV storage
   * @param channelId - The channel ID to store data for
   * @param data - The bot join data to store
   * @returns Promise that resolves when data is stored
   */
  private async storeBotJoinData(channelId: string, data: PersistentBotJoinData): Promise<void> {
    if (!this.env.TASK_MAPPING) {
      console.warn('⚠️ KV storage not available - bot join data not persisted');
      return;
    }

    try {
      const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
      await this.env.TASK_MAPPING.put(key, JSON.stringify(data));
      console.log('💾 Bot join data stored for channel:', channelId);
    } catch (error) {
      console.error('💥 Error storing bot join data:', error);
    }
  }

  /**
   * Reset channel tracking data
   * @param channelId - Optional specific channel ID to reset, or all channels if not provided
   * @returns Promise that resolves when tracking is reset
   */
  async resetChannelTracking(channelId?: string): Promise<void> {
    if (channelId) {
      // Clear in-memory tracking
      this.botJoinTracker.channelsJoined.delete(channelId);
      this.botJoinTracker.lastJoinTime.delete(channelId);
      
      // Clear persistent storage
      if (this.env.TASK_MAPPING) {
        try {
          const key = `${this.KV_BOT_JOIN_PREFIX}${channelId}`;
          await this.env.TASK_MAPPING.delete(key);
          console.log(`🔄 Reset tracking for channel ${channelId} (memory + storage)`);
        } catch (error) {
          console.error(`❌ Failed to clear persistent data for channel ${channelId}:`, error);
        }
      } else {
        console.log(`🔄 Reset in-memory tracking for channel ${channelId}`);
      }
    } else {
      // Clear all in-memory tracking
      this.botJoinTracker.channelsJoined.clear();
      this.botJoinTracker.lastJoinTime.clear();
      
      console.log('🔄 Reset all in-memory channel tracking');
      console.warn('⚠️ Persistent storage reset requires manual cleanup or specific channel IDs');
    }
  }

  /**
   * Get the bot join tracker instance
   * @returns The current BotJoinTracker object
   */
  getBotJoinTracker(): BotJoinTracker {
    return this.botJoinTracker;
  }

  /**
   * Check if bot has joined a specific channel
   * @param channelId - The channel ID to check
   * @returns True if the bot has joined the channel
   */
  hasJoinedChannel(channelId: string): boolean {
    return this.botJoinTracker.channelsJoined.has(channelId);
  }

  /**
   * Get the last join time for a specific channel
   * @param channelId - The channel ID to get join time for
   * @returns The timestamp of last join or undefined if never joined
   */
  getLastJoinTime(channelId: string): number | undefined {
    return this.botJoinTracker.lastJoinTime.get(channelId);
  }

  /**
   * Get all channels that the bot has joined
   * @returns Array of channel IDs that the bot has joined
   */
  getTrackedChannels(): string[] {
    return Array.from(this.botJoinTracker.channelsJoined);
  }
}