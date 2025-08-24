/**
 * @ai-metadata
 * @component: PersistentBotJoinDataTypes
 * @description: Type definitions for persistent bot join data stored in KV storage
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 */

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