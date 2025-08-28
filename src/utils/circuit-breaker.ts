/**
 * @ai-metadata
 * @component: CircuitBreaker
 * @description: Circuit breaker pattern implementation for handling downstream service failures
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/circuit-breaker.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../utils/error-logger.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Implements circuit breaker pattern to prevent cascading failures from downstream services"
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

import { errorLogger, ErrorSeverity, ErrorCategory } from './error-logger';

import {
  CircuitBreakerState,
  CircuitBreakerOptions,
  CircuitBreakerStats,
  CircuitBreakerOpenError
} from '../interfaces';

export {
  CircuitBreakerState,
  CircuitBreakerOptions,
  CircuitBreakerStats,
  CircuitBreakerOpenError
};

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangedAt: Date = new Date();
  private nextAttemptTime?: Date;
  private monitorTimer?: NodeJS.Timeout;
  private failures: Date[] = [];

  constructor(private options: CircuitBreakerOptions) {
    // Start monitoring if interval is specified
    if (options.monitorInterval) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be opened
    this.updateState();

    // If circuit is open, fail fast
    if (this.state === CircuitBreakerState.OPEN) {
      const stats = this.getStats();
      const nextAttemptAt = this.nextAttemptTime || new Date(Date.now() + this.options.timeout);
      
      // Log circuit breaker open event
      console.error(`🚨 Circuit breaker opened for ${this.options.serviceName}:`, {
        stats,
        nextAttemptAt: nextAttemptAt.toISOString()
      });
      
      throw new CircuitBreakerOpenError(this.options.serviceName, stats, nextAttemptAt);
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.options.successThreshold) {
        this.setState(CircuitBreakerState.CLOSED);
        this.reset();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = new Date();
    this.failureCount++;
    this.lastFailureTime = now;
    this.failures.push(now);

    // Clean old failures outside time window
    this.cleanOldFailures();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Go back to open state on any failure in half-open
      this.setState(CircuitBreakerState.OPEN);
      this.scheduleNextAttempt();
    }
  }

  /**
   * Update circuit breaker state based on current conditions
   */
  private updateState(): void {
    const now = new Date();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        this.cleanOldFailures();
        if (this.failures.length >= this.options.failureThreshold) {
          this.setState(CircuitBreakerState.OPEN);
          this.scheduleNextAttempt();
        }
        break;

      case CircuitBreakerState.OPEN:
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.setState(CircuitBreakerState.HALF_OPEN);
          this.successCount = 0; // Reset success count for half-open state
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        // State transitions are handled in onSuccess/onFailure
        break;
    }
  }

  /**
   * Set circuit breaker state and log the change
   */
  private setState(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChangedAt = new Date();

    console.log(`🔄 Circuit breaker for ${this.options.serviceName} changed from ${oldState} to ${newState}`);

    // Log state change
    console.log(`📊 Circuit breaker state change for ${this.options.serviceName}:`, {
      oldState,
      newState,
      stats: this.getStats()
    });
  }

  /**
   * Schedule next attempt time for half-open state
   */
  private scheduleNextAttempt(): void {
    this.nextAttemptTime = new Date(Date.now() + this.options.timeout);
  }

  /**
   * Clean failures outside the time window
   */
  private cleanOldFailures(): void {
    const cutoff = new Date(Date.now() - this.options.timeWindow);
    this.failures = this.failures.filter(failure => failure > cutoff);
  }

  /**
   * Reset circuit breaker to initial state
   */
  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.failures = [];
    this.nextAttemptTime = undefined;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const now = new Date();
    const uptime = now.getTime() - this.stateChangedAt.getTime();
    const failureRate = this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt,
      uptime,
      failureRate
    };
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(): void {
    this.setState(CircuitBreakerState.OPEN);
    this.scheduleNextAttempt();
  }

  /**
   * Force circuit breaker to closed state
   */
  forceClosed(): void {
    this.setState(CircuitBreakerState.CLOSED);
    this.reset();
  }

  /**
   * Start monitoring and periodic logging
   */
  private startMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }

    this.monitorTimer = setInterval(() => {
      const stats = this.getStats();
      console.log(`📊 Circuit breaker stats for ${this.options.serviceName}:`, {
        state: stats.state,
        failureRate: `${(stats.failureRate * 100).toFixed(2)}%`,
        totalRequests: stats.totalRequests,
        uptime: `${Math.round(stats.uptime / 1000)}s`
      });
    }, this.options.monitorInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
  }
}

/**
 * Default circuit breaker configurations for different services
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Record<string, CircuitBreakerOptions> = {
  zendesk: {
    failureThreshold: 5,
    successThreshold: 3,
    timeWindow: 60000, // 1 minute
    timeout: 30000,    // 30 seconds
    monitorInterval: 60000, // 1 minute
    serviceName: 'zendesk'
  },
  clickup: {
    failureThreshold: 5,
    successThreshold: 3,
    timeWindow: 60000, // 1 minute
    timeout: 30000,    // 30 seconds
    monitorInterval: 60000, // 1 minute
    serviceName: 'clickup'
  }
};

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuitBreaker(serviceName: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const defaultOptions = DEFAULT_CIRCUIT_BREAKER_OPTIONS[serviceName];
      if (!defaultOptions && !options) {
        throw new Error(`No default circuit breaker configuration for service: ${serviceName}`);
      }

      const finalOptions = {
        ...defaultOptions,
        ...options,
        serviceName
      } as CircuitBreakerOptions;

      this.breakers.set(serviceName, new CircuitBreaker(finalOptions));
    }

    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [serviceName, breaker] of this.breakers) {
      stats[serviceName] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Cleanup all circuit breakers
   */
  destroy(): void {
    for (const breaker of this.breakers.values()) {
      breaker.destroy();
    }
    this.breakers.clear();
  }
}

/**
 * Global circuit breaker registry instance
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Helper function to execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options?: Partial<CircuitBreakerOptions>
): Promise<T> {
  const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker(serviceName, options);
  return circuitBreaker.execute(fn);
}