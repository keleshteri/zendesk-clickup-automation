/**
 * @utility: Logger
 * @domain: shared
 * @purpose: Centralized logging utility
 * @responsibility: Provide structured logging across the application
 */

import type { Logger, LogLevel, LogContext, LoggerConfig } from '../types/logger.types.js';

/**
 * Simple console-based logger implementation
 * Suitable for Cloudflare Workers environment
 */
class ConsoleLogger implements Logger {
  private level: LogLevel;
  private service?: string;
  private context: LogContext;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.level = config.level || 'info';
    this.service = config.service;
    this.context = {};
  }

  debug(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('debug')) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('info')) {
      this.log('info', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('warn')) {
      this.log('warn', message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.isLevelEnabled('error')) {
      const errorContext = error ? { error: error.message, stack: error.stack, ...context } : context;
      this.log('error', message, errorContext);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.isLevelEnabled('fatal')) {
      const errorContext = error ? { error: error.message, stack: error.stack, ...context } : context;
      this.log('fatal', message, errorContext);
    }
  }

  child(context: LogContext): Logger {
    const childLogger = new ConsoleLogger({ level: this.level, service: this.service });
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };
    return levelPriority[level] >= levelPriority[this.level];
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      message,
      ...logContext,
    };

    // Use appropriate console method based on level
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
      case 'fatal':
        console.error(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }
}

// Create and export default logger instance
export const logger = new ConsoleLogger({
  level: (globalThis as any)?.process?.env?.LOG_LEVEL as LogLevel || 'info',
  service: 'zendesk-clickup-automation',
});

// Export logger class for custom instances
export { ConsoleLogger };
export type { Logger, LogLevel, LogContext } from '../types/logger.types.js';