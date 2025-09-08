/**
 * @type: domain
 * @domain: ai
 * @purpose: AI client error definitions
 */

/**
 * Base error class for AI client errors
 */
export class AIClientError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AIClientError';
  }
}

/**
 * Error thrown when the AI client fails to generate a response
 */
export class AIGenerationError extends AIClientError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AIGenerationError';
  }
}

/**
 * Error thrown when the AI client configuration is invalid
 */
export class AIConfigurationError extends AIClientError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AIConfigurationError';
  }
}