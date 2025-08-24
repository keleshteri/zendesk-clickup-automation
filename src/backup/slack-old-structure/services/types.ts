/**
 * @fileoverview Slack Services Types
 * @description Type definitions for all Slack domain services
 * @version 1.0.0
 * @author Zendesk-ClickUp Integration Team
 * @since 2024
 */

import type {
  SlackMessage,
  SlackChannel,
  SlackUser,
  SlackThread,
  SlackFile,
  SlackEvent,
  SlackCommand,
  SlackWorkflow
} from '../libs/@types';

// Base Service Types
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: Record<string, any>;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ServiceContext {
  userId?: string;
  teamId?: string;
  channelId?: string;
  requestId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface ServiceOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  context?: ServiceContext;
}

// Base Service Configuration
export interface BaseServiceConfig {
  client: {
    token: string;
    signingSecret?: string;
    appToken?: string;
  };
  auth: {
    signingSecret: string;
    clientId?: string;
    clientSecret?: string;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize?: number;
  };
  logger?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
  retries?: number;
  timeout?: number;
}

// Integration Service
export interface SlackIntegrationServiceConfig extends BaseServiceConfig {
  zendesk?: {
    apiUrl: string;
    token: string;
    webhookUrl?: string;
  };
  clickup?: {
    apiUrl: string;
    token: string;
    webhookUrl?: string;
  };
  webhooks?: {
    enabled: boolean;
    endpoints: string[];
    secret?: string;
  };
}

export interface IntegrationRequest {
  type: 'zendesk' | 'clickup' | 'webhook';
  action: string;
  payload: Record<string, any>;
  source?: {
    platform: string;
    id: string;
    url?: string;
  };
  target?: {
    channel: string;
    thread?: string;
    user?: string;
  };
}

export interface IntegrationResponse {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Message Service
export interface SlackMessageServiceConfig extends BaseServiceConfig {
  formatting?: {
    enableMarkdown: boolean;
    enableEmojis: boolean;
    maxLength: number;
  };
  attachments?: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export interface MessageRequest {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface MessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: SlackMessage;
  error?: string;
}

// Notification Service
export interface SlackNotificationServiceConfig extends BaseServiceConfig {
  templates?: {
    zendesk: Record<string, any>;
    clickup: Record<string, any>;
    custom: Record<string, any>;
  };
  channels?: {
    default: string;
    alerts: string;
    updates: string;
  };
  scheduling?: {
    enabled: boolean;
    timezone: string;
    quietHours?: {
      start: string;
      end: string;
    };
  };
  scheduler?: {
    maxScheduled?: number;
  };
  filters?: Array<{
    type: string;
    condition: string;
    value: any;
  }>;
}

export interface NotificationRequest {
  type: 'zendesk' | 'clickup' | 'alert' | 'update' | 'custom';
  template: string;
  data: Record<string, any>;
  recipients: {
    channels?: string[];
    users?: string[];
    groups?: string[];
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduling?: {
    sendAt?: Date;
    timezone?: string;
  };
}

// Thread Service
export interface SlackThreadServiceConfig extends BaseServiceConfig {
  analysis?: {
    enabled: boolean;
    sentiment: boolean;
    keywords: boolean;
    participants: boolean;
  };
  archiving?: {
    enabled: boolean;
    retentionDays: number;
    location: string;
  };
}

export interface ThreadRequest {
  channel: string;
  timestamp: string;
  action: 'create' | 'update' | 'archive' | 'analyze';
  data?: Record<string, any>;
}

export interface ThreadAnalysis {
  messageCount: number;
  participantCount: number;
  duration: number;
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  keywords?: string[];
  summary?: string;
}

// User Service
export interface SlackUserServiceConfig extends BaseServiceConfig {
  profiles?: {
    syncEnabled: boolean;
    fields: string[];
    updateInterval: number;
  };
  presence?: {
    trackEnabled: boolean;
    updateInterval: number;
  };
}

export interface UserRequest {
  userId?: string;
  email?: string;
  action: 'get' | 'update' | 'list' | 'search';
  data?: Partial<SlackUser>;
  filters?: Record<string, any>;
}

// Channel Service
export interface SlackChannelServiceConfig extends BaseServiceConfig {
  management?: {
    autoCreate: boolean;
    autoArchive: boolean;
    retentionDays: number;
  };
  permissions?: {
    defaultPrivate: boolean;
    allowGuests: boolean;
    moderationEnabled: boolean;
  };
}

export interface ChannelRequest {
  channelId?: string;
  name?: string;
  action: 'create' | 'update' | 'archive' | 'list' | 'join' | 'leave';
  data?: Partial<SlackChannel>;
  options?: {
    private?: boolean;
    members?: string[];
    purpose?: string;
    topic?: string;
  };
}

// Workflow Service
export interface SlackWorkflowServiceConfig extends BaseServiceConfig {
  automation?: {
    enabled: boolean;
    triggers: string[];
    actions: string[];
  };
  approval?: {
    enabled: boolean;
    approvers: string[];
    timeout: number;
  };
}

export interface WorkflowRequest {
  workflowId?: string;
  trigger: {
    type: string;
    data: Record<string, any>;
  };
  steps: WorkflowStep[];
  context?: ServiceContext;
}

export interface WorkflowStep {
  id: string;
  type: 'message' | 'notification' | 'integration' | 'approval' | 'condition';
  config: Record<string, any>;
  dependencies?: string[];
}

// Event Service
export interface SlackEventServiceConfig extends BaseServiceConfig {
  handlers?: {
    enabled: string[];
    disabled: string[];
  };
  processing?: {
    async: boolean;
    batchSize: number;
    timeout: number;
  };
}

export interface EventRequest {
  type: string;
  event: SlackEvent;
  context?: ServiceContext;
  options?: {
    async?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
}

// Command Service
export interface SlackCommandServiceConfig extends BaseServiceConfig {
  commands?: {
    enabled: string[];
    permissions: Record<string, string[]>;
  };
  responses?: {
    ephemeral: boolean;
    timeout: number;
  };
}

export interface CommandRequest {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  teamId: string;
  context?: ServiceContext;
}

export interface CommandResponse {
  response_type?: 'in_channel' | 'ephemeral';
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

// File Service
export interface SlackFileServiceConfig extends BaseServiceConfig {
  storage?: {
    provider: 'slack' | 's3' | 'gcs' | 'azure';
    bucket?: string;
    region?: string;
  };
  processing?: {
    enabled: boolean;
    maxSize: number;
    allowedTypes: string[];
  };
}

export interface FileRequest {
  fileId?: string;
  action: 'upload' | 'download' | 'delete' | 'share' | 'process';
  file?: {
    content: Buffer | string;
    filename: string;
    filetype: string;
  };
  options?: {
    channels?: string[];
    title?: string;
    comment?: string;
    public?: boolean;
  };
}

// Service Factory Types
export interface ServiceFactoryConfig {
  token: string;
  signingSecret: string;
  appToken?: string;
  clientId?: string;
  clientSecret?: string;
  services?: {
    integration?: Partial<SlackIntegrationServiceConfig>;
    message?: Partial<SlackMessageServiceConfig>;
    notification?: Partial<SlackNotificationServiceConfig>;
    thread?: Partial<SlackThreadServiceConfig>;
    user?: Partial<SlackUserServiceConfig>;
    channel?: Partial<SlackChannelServiceConfig>;
    workflow?: Partial<SlackWorkflowServiceConfig>;
    event?: Partial<SlackEventServiceConfig>;
    command?: Partial<SlackCommandServiceConfig>;
    file?: Partial<SlackFileServiceConfig>;
  };
}

// Service Registry Types
export interface ServiceRegistryEntry {
  name: string;
  instance: any;
  config: any;
  created: Date;
  lastAccessed: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  details?: Record<string, any>;
}

// Service Metrics
export interface ServiceMetrics {
  uptime: number;
  isHealthy: boolean;
  requestCount: number;
  errorCount: number;
}

// Service Events
export interface ServiceEvent {
  type: 'started' | 'stopped' | 'error' | 'warning' | 'info';
  service: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export type ServiceEventHandler = (event: ServiceEvent) => void | Promise<void>;

// Service Lifecycle
export interface ServiceLifecycle {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getMetrics(): ServiceMetrics;
  shutdown(): Promise<void>;
}