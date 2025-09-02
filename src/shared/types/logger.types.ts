/**
 * @type: types
 * @domain: shared
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Log Levels
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

// Log Entry
export const LogEntrySchema = z.object({
  level: LogLevelSchema,
  message: z.string(),
  timestamp: z.date(),
  context: z.record(z.unknown()).optional(),
  error: z.instanceof(Error).optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  service: z.string().optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// Log Context
export const LogContextSchema = z.record(z.unknown());
export type LogContext = z.infer<typeof LogContextSchema>;

// Logger Configuration
export const LoggerConfigSchema = z.object({
  level: LogLevelSchema.default('info'),
  service: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  format: z.enum(['json', 'text']).default('json'),
  timestamp: z.boolean().default(true),
  colorize: z.boolean().default(false),
  prettyPrint: z.boolean().default(false),
});

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

// Logger Interface
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
  
  // Contextual logging
  child(context: LogContext): Logger;
  
  // Configuration
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  
  // Utility methods
  isLevelEnabled(level: LogLevel): boolean;
}

// Structured Logger Interface
export interface StructuredLogger extends Logger {
  log(entry: LogEntry): void;
  logWithContext(level: LogLevel, message: string, context: LogContext): void;
}

// Log Level Priority Map
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const;

// Common Log Context Keys
export const LOG_CONTEXT_KEYS = {
  REQUEST_ID: 'requestId',
  USER_ID: 'userId',
  SESSION_ID: 'sessionId',
  CORRELATION_ID: 'correlationId',
  SERVICE: 'service',
  METHOD: 'method',
  URL: 'url',
  STATUS_CODE: 'statusCode',
  DURATION: 'duration',
  ERROR_CODE: 'errorCode',
  STACK_TRACE: 'stackTrace',
} as const;

export type LogContextKey = typeof LOG_CONTEXT_KEYS[keyof typeof LOG_CONTEXT_KEYS];