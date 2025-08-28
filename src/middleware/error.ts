/**
 * @ai-metadata
 * @component: ErrorMiddleware
 * @description: Centralized error handling middleware for standardized error responses
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/error-middleware.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["hono"]
 * @tests: ["./tests/middleware/error.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Error handling and response standardization for API endpoints"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import type { ErrorHandler, MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';
import { errorLogger, ErrorSeverity, ErrorCategory } from '../utils/error-logger';
import { CircuitBreakerOpenError } from '../utils/circuit-breaker';

/**
 * Standard error response interface
 */
import { ErrorResponse } from '../interfaces';

/**
 * Custom error classes
 */
export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends APIError {
  constructor(
    service: string, 
    options?: {
      cause?: Error;
      retryAfter?: number;
      healthCheckUrl?: string;
      troubleshooting?: string[];
      lastKnownStatus?: string;
    }
  ) {
    const baseMessage = `${service} service is currently unavailable`;
    const troubleshootingSteps = options?.troubleshooting || [
      `Check ${service} service status and connectivity`,
      'Verify API credentials and authentication tokens',
      'Review rate limiting and quota usage',
      'Check network connectivity and firewall settings'
    ];
    
    const details = {
      service,
      cause: options?.cause?.message,
      retryAfter: options?.retryAfter,
      healthCheckUrl: options?.healthCheckUrl,
      troubleshooting: troubleshootingSteps,
      lastKnownStatus: options?.lastKnownStatus,
      timestamp: new Date().toISOString(),
      recoveryActions: [
        'Wait for service to recover automatically',
        'Check service status page for known issues',
        'Verify configuration and credentials',
        'Contact support if issue persists'
      ]
    };
    
    super(baseMessage, 503, 'SERVICE_UNAVAILABLE', details);
    this.name = 'ServiceUnavailableError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, originalError?: Error) {
    const message = `External service error: ${service}`;
    const details = originalError ? {
      originalMessage: originalError.message,
      originalStack: originalError.stack
    } : undefined;
    
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if error should be logged (avoid logging client errors)
 */
function shouldLogError(statusCode: number): boolean {
  return statusCode >= 500;
}

/**
 * Sanitize error details for production
 */
function sanitizeErrorDetails(details: any, isProduction: boolean): any {
  if (!isProduction) {
    return details;
  }

  // In production, remove sensitive information
  if (typeof details === 'object' && details !== null) {
    const sanitized = { ...details };
    delete sanitized.originalStack;
    delete sanitized.env;
    delete sanitized.secrets;
    return sanitized;
  }

  return details;
}

/**
 * Format error response
 */
function formatErrorResponse(
  error: Error,
  requestId: string,
  path: string,
  isProduction: boolean
): { response: ErrorResponse; statusCode: number } {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let details: any;

  // Handle custom API errors
  if (error instanceof APIError) {
    statusCode = error.statusCode;
    code = error.code;
    details = sanitizeErrorDetails(error.details, isProduction);
  }
  // Handle circuit breaker errors
  else if (error instanceof CircuitBreakerOpenError) {
    statusCode = 503;
    code = 'CIRCUIT_BREAKER_OPEN';
    details = {
      reason: 'Circuit breaker is open due to repeated service failures',
      nextAttempt: error.nextAttemptAt.toISOString(),
      recommendations: [
        'Wait for the circuit breaker to attempt service recovery',
        'Check service status and connectivity',
        'Verify API credentials and rate limits',
        'Monitor service health endpoints'
      ],
      serviceStats: {
        state: error.stats.state,
        failureRate: `${(error.stats.failureRate * 100).toFixed(2)}%`,
        totalRequests: error.stats.totalRequests,
        lastFailure: error.stats.lastFailureTime?.toISOString()
      }
    };
  }
  // Handle specific error types
  else if (error.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
  }
  else if (error.name === 'SyntaxError') {
    statusCode = 400;
    code = 'INVALID_JSON';
  }
  else if (error.message.includes('timeout')) {
    statusCode = 504;
    code = 'TIMEOUT';
  }
  else if (error.message.includes('network') || error.message.includes('fetch')) {
    statusCode = 502;
    code = 'NETWORK_ERROR';
  }

  const response: ErrorResponse = {
    error: {
      message: error.message,
      code,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  if (details) {
    response.error.details = details;
  }

  // In development, include stack trace
  if (!isProduction && error.stack) {
    response.error.details = {
      ...response.error.details,
      stack: error.stack
    };
  }

  return { response, statusCode };
}

/**
 * Error handling middleware
 */
export const errorMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Set request ID in context for logging
  c.set('requestId' as any, requestId);
  
  try {
    await next();
  } catch (error) {
    const isProduction = c.env.NODE_ENV === 'production';
    const path = c.req.path;
    const method = c.req.method;
    const userAgent = c.req.header('user-agent') || 'unknown';
    const duration = Date.now() - startTime;
    
    // Ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Format error response
    const { response, statusCode } = formatErrorResponse(err, requestId, path, isProduction);
    
    // Log error if it's a server error
    if (shouldLogError(statusCode)) {
      // Determine error category and severity
      const category = determineErrorCategory(err);
      const severity = determineErrorSeverity(err);
      
      // Use enhanced error logging
      await errorLogger.logError(err, severity, category, {
        request: c,
        operation: 'request_processing',
        metadata: {
          requestId,
          method,
          path,
          statusCode,
          userAgent,
          duration
        }
      });
    }
    
    // Add response time header
    c.header('X-Response-Time', `${duration}ms`);
    c.header('X-Request-Id', requestId);
    
    // Return error response
    return c.json(response, statusCode as any);
  }
};

/**
 * Global error handler for Hono
 */
export const globalErrorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') || generateRequestId();
  const isProduction = c.env?.NODE_ENV === 'production';
  const path = c.req.path;
  
  // Format error response
  const { response, statusCode } = formatErrorResponse(err, requestId, path, isProduction);
  
  // Log error
  if (shouldLogError(statusCode)) {
    // Determine error category and severity
    const category = determineErrorCategory(err);
    const severity = determineErrorSeverity(err);
    
    // Use enhanced error logging
    errorLogger.logError(err, severity, category, {
      request: c,
      operation: 'global_error_handling',
      metadata: {
        requestId,
        method: c.req.method,
        path,
        statusCode
      }
    }).catch(logError => {
      // Fallback to console if enhanced logging fails
      console.error('Enhanced logging failed, falling back to console:', logError);
      console.error('Global Error Handler:', {
        requestId,
        method: c.req.method,
        path,
        statusCode,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // Add headers
  c.header('X-Request-Id', requestId);
  
  return c.json(response, statusCode as any);
};

/**
 * Helper function to throw API errors
 */
export function throwAPIError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): never {
  throw new APIError(message, statusCode, code, details);
}

/**
 * Helper function to handle async operations with error wrapping
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    const message = errorMessage || 'Operation failed';
    throw new APIError(
      message,
      500,
      'OPERATION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Helper function to validate required fields
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * Determine error category based on error type and message
 */
function determineErrorCategory(error: Error): ErrorCategory {
  if (error instanceof CircuitBreakerOpenError) {
    return ErrorCategory.SERVICE_UNAVAILABLE;
  }
  
  if (error instanceof ValidationError) {
    return ErrorCategory.VALIDATION;
  }
  
  if (error instanceof AuthenticationError) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (error instanceof ServiceUnavailableError) {
    return ErrorCategory.SERVICE_UNAVAILABLE;
  }
  
  if (error instanceof RateLimitError) {
    return ErrorCategory.RATE_LIMIT;
  }
  
  const message = error.message.toLowerCase();
  
  if (message.includes('webhook')) {
    return ErrorCategory.WEBHOOK;
  }
  
  if (message.includes('timeout')) {
    return ErrorCategory.TIMEOUT;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorCategory.NETWORK;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity based on error type and impact
 */
function determineErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof CircuitBreakerOpenError) {
    return ErrorSeverity.HIGH;
  }
  
  if (error instanceof ServiceUnavailableError) {
    return ErrorSeverity.HIGH;
  }
  
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return ErrorSeverity.HIGH;
  }
  
  if (error instanceof RateLimitError) {
    return ErrorSeverity.MEDIUM;
  }
  
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return ErrorSeverity.LOW;
  }
  
  // Check for critical system errors
  const message = error.message.toLowerCase();
  if (message.includes('critical') || message.includes('fatal')) {
    return ErrorSeverity.CRITICAL;
  }
  
  return ErrorSeverity.MEDIUM;
}

/**
 * Helper function to check service availability
 */
export function requireService(
  service: any, 
  serviceName: string,
  options?: {
    healthCheckUrl?: string;
    lastKnownStatus?: string;
    additionalContext?: string;
  }
): void {
  if (!service) {
    const troubleshooting = [
      `Verify ${serviceName} service initialization in dependency injection`,
      'Check environment variables and configuration',
      'Ensure service dependencies are properly loaded',
      'Review service startup logs for initialization errors'
    ];
    
    if (options?.additionalContext) {
      troubleshooting.unshift(options.additionalContext);
    }
    
    throw new ServiceUnavailableError(serviceName, {
      healthCheckUrl: options?.healthCheckUrl,
      troubleshooting,
      lastKnownStatus: options?.lastKnownStatus || 'Service not initialized'
    });
  }
}