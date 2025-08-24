/**
 * @ai-metadata
 * @component: BotJoinTrackerTypes
 * @description: Type definitions for bot join tracking functionality and in-memory state management
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 */

/**
 * Bot join tracking interface for in-memory tracking
 * Tracks which channels the bot has joined and when
 */
export interface BotJoinTracker {
  channelsJoined: Set<string>;
  lastJoinTime: Map<string, number>;
}