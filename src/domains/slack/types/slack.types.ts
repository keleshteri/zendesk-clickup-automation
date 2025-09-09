import { z } from 'zod';

/**
 * Slack event types
 */
export enum SlackEventType {
  MESSAGE = 'message',
  APP_MENTION = 'app_mention',
  MEMBER_JOINED_CHANNEL = 'member_joined_channel',
  MEMBER_LEFT_CHANNEL = 'member_left_channel',
  CHANNEL_CREATED = 'channel_created',
  CHANNEL_DELETED = 'channel_deleted',
  CHANNEL_RENAME = 'channel_rename',
  USER_CHANGE = 'user_change',
  TEAM_JOIN = 'team_join'
}

/**
 * Slack channel types
 */
export enum SlackChannelType {
  PUBLIC_CHANNEL = 'channel',
  PRIVATE_CHANNEL = 'group',
  DIRECT_MESSAGE = 'im',
  MULTI_PARTY_DIRECT_MESSAGE = 'mpim'
}

/**
 * Message template categories
 */
export enum TemplateCategory {
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  SUCCESS = 'success',
  HELP = 'help',
  REMINDER = 'reminder',
  CUSTOM = 'custom'
}

/**
 * Bot response types
 */
export enum BotResponseType {
  GREETING = 'greeting',
  HELP = 'help',
  UNKNOWN_COMMAND = 'unknown_command',
  ERROR = 'error',
  ACKNOWLEDGMENT = 'acknowledgment',
  INFORMATION = 'information'
}

/**
 * Zod schemas for validation
 */

// Slack Bot Configuration Schema
export const SlackBotConfigSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  botUserId: z.string().optional(),
  signingSecret: z.string().optional(),
  port: z.number().int().positive().optional()
});

// Slack Channel Schema
export const SlackChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(SlackChannelType),
  isMember: z.boolean()
});

// Slack User Schema
export const SlackUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  isBot: z.boolean()
});

// Message Template Schema
export const MessageTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  text: z.string().min(1),
  blocks: z.array(z.any()).optional(),
  defaultVariables: z.record(z.any()).optional(),
  category: z.nativeEnum(TemplateCategory).optional()
});

// Template Context Schema
export const TemplateContextSchema = z.object({
  variables: z.record(z.any()),
  channel: z.object({
    id: z.string(),
    name: z.string()
  }).optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

// Message Options Schema
export const MessageOptionsSchema = z.object({
  channel: z.string().min(1),
  text: z.string().min(1),
  blocks: z.array(z.any()).optional(),
  threadTimestamp: z.string().optional(),
  replyBroadcast: z.boolean().optional(),
  username: z.string().optional(),
  iconEmoji: z.string().optional(),
  iconUrl: z.string().url().optional(),
  parse: z.enum(['full', 'none']).optional(),
  linkNames: z.boolean().optional(),
  unfurlLinks: z.boolean().optional(),
  unfurlMedia: z.boolean().optional()
});

/**
 * Type inference from Zod schemas
 */
export type SlackBotConfigDto = z.infer<typeof SlackBotConfigSchema>;
export type SlackChannelDto = z.infer<typeof SlackChannelSchema>;
export type SlackUserDto = z.infer<typeof SlackUserSchema>;
export type MessageTemplateDto = z.infer<typeof MessageTemplateSchema>;

// Slack Event Types for Cloudflare Workers
export interface SlackEvent {
  type: string;
  user?: string;
  channel?: string;
  channel_type?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
  [key: string]: any;
}

// Slack Interaction Types
export interface SlackInteraction {
  type: string;
  user: {
    id: string;
    name: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    domain: string;
  };
  actions?: Array<{
    action_id: string;
    value?: string;
    selected_option?: {
      value: string;
      text: {
        type: string;
        text: string;
      };
    };
  }>;
  response_url: string;
  trigger_id: string;
  [key: string]: any;
}

// Slack Command Types
export interface SlackCommand {
  command: string;
  text: string;
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  team_id: string;
  team_domain: string;
  response_url: string;
  trigger_id: string;
  [key: string]: any;
}
export type TemplateContextDto = z.infer<typeof TemplateContextSchema>;
export type MessageOptionsDto = z.infer<typeof MessageOptionsSchema>;

/**
 * Error types for Slack operations
 */
export interface SlackError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Slack API response wrapper
 */
export interface SlackApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: SlackError;
  metadata?: {
    rateLimit?: {
      remaining: number;
      resetTime: Date;
    };
    responseTime: number;
  };
}

/**
 * Bot mention context
 */
export interface BotMentionContext {
  messageText: string;
  cleanText: string; // Text without bot mention
  command?: string;
  args?: string[];
  isDirectMention: boolean;
  isInThread: boolean;
}

/**
 * Welcome message configuration
 */
export interface WelcomeConfig {
  enabled: boolean;
  templateId: string;
  customVariables?: Record<string, any>;
  sendDelay?: number; // Delay in milliseconds
  onlyOnFirstJoin?: boolean;
}

/**
 * Bot mention configuration
 */
export interface MentionConfig {
  enabled: boolean;
  defaultResponseTemplateId: string;
  commandHandlers?: Record<string, string>; // command -> templateId
  unknownCommandTemplateId?: string;
  respondInThread?: boolean;
}

/**
 * Slack module configuration
 */
export interface SlackModuleConfig {
  bot: SlackBotConfigDto;
  welcome: WelcomeConfig;
  mentions: MentionConfig;
  templates: {
    directory?: string;
    autoLoad?: boolean;
  };
}