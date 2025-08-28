/**
 * @ai-metadata
 * @component: CircuitBreakerInterfaces
 * @description: Interface definitions for circuit breaker functionality
 * @last-update: 2025-01-28
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/circuit-breaker-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["../utils/tests/circuit-breaker.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Circuit breaker pattern interfaces for resilient service calls"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Failure threshold to open the circuit */
  failureThreshold: number;
  /** Success threshold to close the circuit from half-open */
  successThreshold: number;
  /** Time window for counting failures (ms) */
  timeWindow: number;
  /** Timeout before attempting to close circuit (ms) */
  timeout: number;
  /** Monitor interval for logging stats (ms) */
  monitorInterval?: number;
  /** Service name for logging */
  serviceName: string;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangedAt: Date;
  uptime: number;
  failureRate: number;
}

/**
 * Circuit breaker error thrown when circuit is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(
    serviceName: string,
    public readonly stats: CircuitBreakerStats,
    public readonly nextAttemptAt: Date
  ) {
    super(`Circuit breaker is OPEN for ${serviceName}. Service is temporarily unavailable.`);
    this.name = 'CircuitBreakerOpenError';
  }
}