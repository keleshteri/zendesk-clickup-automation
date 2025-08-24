/**
 * Persistent bot join data type for KV storage
 * Stores comprehensive bot join information that persists across sessions
 */
export type PersistentBotJoinData = {
  channelId: string;
  lastJoinTime: number;
  messagesSent: number;
  botUserId: string;
  createdAt: string;
  updatedAt: string;
};