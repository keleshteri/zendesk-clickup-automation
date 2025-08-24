/**
 * Bot join tracking interface for in-memory tracking
 * Tracks which channels the bot has joined and when
 */
export interface BotJoinTracker {
  channelsJoined: Set<string>;
  lastJoinTime: Map<string, number>;
}