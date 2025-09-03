/**
 * @type: types
 * @domain: shared
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';
import type { LogLevel } from './logger.types';

// Environment Types
export const EnvironmentSchema = z.enum(['development', 'staging', 'production', 'test']);
export type Environment = z.infer<typeof EnvironmentSchema>;

// Database Configuration
export const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().min(1).max(65535),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  connectionTimeout: z.number().positive().default(30000),
  maxConnections: z.number().positive().default(10),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// API Configuration
export const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().positive().default(1000),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    maxRequests: z.number().positive().default(100),
    windowMs: z.number().positive().default(60000),
  }).optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

// ClickUp Configuration
export const ClickUpConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().default('https://api.clickup.com/api/v2'),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3),
  retryDelay: z.number().positive().default(1000),
  webhookSecret: z.string().optional(),
  // Workspace Configuration
  defaultTeamId: z.string().optional(),
  defaultSpaceId: z.string().optional(),
  defaultListId: z.string().optional(),
});

export type ClickUpConfig = z.infer<typeof ClickUpConfigSchema>;

// Zendesk Configuration
export const ZendeskConfigSchema = z.object({
  subdomain: z.string().min(1),
  email: z.string().email(),
  apiToken: z.string().min(1),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3),
});

export type ZendeskConfig = z.infer<typeof ZendeskConfigSchema>;

// Logging Configuration
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
  timestamp: z.boolean().default(true),
  colorize: z.boolean().default(false),
  prettyPrint: z.boolean().default(false),
  service: z.string().optional(),
});

export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

// Security Configuration
export const SecurityConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('24h'),
  bcryptRounds: z.number().min(10).max(15).default(12),
  corsOrigins: z.array(z.string()).default(['*']),
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    maxRequests: z.number().positive().default(100),
    windowMs: z.number().positive().default(900000), // 15 minutes
  }),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

// Server Configuration
export const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(8787),
  host: z.string().default('0.0.0.0'),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE']),
    headers: z.array(z.string()).default(['Content-Type', 'Authorization']),
  }),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// Main Application Configuration
export const ConfigSchema = z.object({
  environment: EnvironmentSchema.default('development'),
  server: ServerConfigSchema,
  logging: LoggingConfigSchema,
  security: SecurityConfigSchema.optional(),
  database: DatabaseConfigSchema.optional(),
  clickup: ClickUpConfigSchema,
  zendesk: ZendeskConfigSchema,
  apis: z.record(ApiConfigSchema).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// Environment Variables Schema
export const EnvSchema = z.object({
  NODE_ENV: EnvironmentSchema.default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('8787'),
  
  // ClickUp
  CLICKUP_API_KEY: z.string().min(1),
  CLICKUP_WEBHOOK_SECRET: z.string().optional(),
  CLICKUP_DEFAULT_TEAM_ID: z.string().optional(),
  CLICKUP_DEFAULT_SPACE_ID: z.string().optional(),
  CLICKUP_DEFAULT_LIST_ID: z.string().optional(),
  
  // Zendesk
  ZENDESK_SUBDOMAIN: z.string().min(1),
  ZENDESK_EMAIL: z.string().email(),
  ZENDESK_API_TOKEN: z.string().min(1),
  
  // Security
  JWT_SECRET: z.string().min(32).optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  
  // Database (optional)
  DATABASE_URL: z.string().url().optional(),
  
  // CORS
  CORS_ORIGINS: z.string().transform(str => str.split(',')).pipe(z.array(z.string())).default('*'),
});

export type Env = z.infer<typeof EnvSchema>;

// Configuration Factory Interface
export interface IConfigFactory {
  create(env: Record<string, string | undefined>): Config;
  validate(config: unknown): Config;
}

// Configuration Provider Interface
export interface IConfigProvider {
  get<T extends keyof Config>(key: T): Config[T];
  getAll(): Config;
  reload(): Promise<void>;
}