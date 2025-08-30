/**
 * @ai-metadata
 * @component: ProcessingLockService
 * @description: Provides processing locks to prevent concurrent handling of the same event
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/processing-locks.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Processing lock service to prevent duplicate concurrent event processing"
 */

/**
 * Interface for processing lock options
 */
export interface ProcessingLockOptions {
  /** Lock timeout in milliseconds (default: 30000 = 30 seconds) */
  timeoutMs?: number;
  /** Maximum number of locks to keep in memory (default: 1000) */
  maxLocks?: number;
}

/**
 * Interface for lock information
 */
interface LockInfo {
  /** Timestamp when the lock was acquired */
  acquiredAt: number;
  /** Timeout for the lock in milliseconds */
  timeoutMs: number;
  /** Timer ID for automatic cleanup */
  timerId: NodeJS.Timeout;
}

/**
 * Service for managing processing locks to prevent concurrent event handling
 */
export class ProcessingLockService {
  private locks: Map<string, LockInfo> = new Map();
  private readonly defaultTimeoutMs: number;
  private readonly maxLocks: number;

  constructor(options: ProcessingLockOptions = {}) {
    this.defaultTimeoutMs = options.timeoutMs || 30000; // 30 seconds default
    this.maxLocks = options.maxLocks || 1000;
  }

  /**
   * Attempt to acquire a lock for the given key
   * @param key - Unique identifier for the lock
   * @param timeoutMs - Optional timeout override for this specific lock
   * @returns true if lock was acquired, false if already locked
   */
  acquireLock(key: string, timeoutMs?: number): boolean {
    // Check if lock already exists and is still valid
    if (this.isLocked(key)) {
      return false;
    }

    // Clean up expired locks before acquiring new one
    this.cleanupExpiredLocks();

    // Enforce maximum locks limit
    if (this.locks.size >= this.maxLocks) {
      console.warn(`[ProcessingLock] Maximum locks (${this.maxLocks}) reached, cleaning up oldest locks`);
      this.cleanupOldestLocks(Math.floor(this.maxLocks * 0.1)); // Remove 10% of oldest locks
    }

    const timeout = timeoutMs || this.defaultTimeoutMs;
    const acquiredAt = Date.now();

    // Set up automatic cleanup timer
    const timerId = setTimeout(() => {
      this.releaseLock(key);
      console.log(`[ProcessingLock] Auto-released expired lock: ${key}`);
    }, timeout);

    // Store lock information
    this.locks.set(key, {
      acquiredAt,
      timeoutMs: timeout,
      timerId
    });

    console.log(`[ProcessingLock] Acquired lock: ${key} (timeout: ${timeout}ms)`);
    return true;
  }

  /**
   * Release a lock for the given key
   * @param key - Unique identifier for the lock
   * @returns true if lock was released, false if lock didn't exist
   */
  releaseLock(key: string): boolean {
    const lockInfo = this.locks.get(key);
    if (!lockInfo) {
      return false;
    }

    // Clear the timeout timer
    clearTimeout(lockInfo.timerId);

    // Remove the lock
    this.locks.delete(key);

    console.log(`[ProcessingLock] Released lock: ${key}`);
    return true;
  }

  /**
   * Check if a key is currently locked
   * @param key - Unique identifier for the lock
   * @returns true if locked, false otherwise
   */
  isLocked(key: string): boolean {
    const lockInfo = this.locks.get(key);
    if (!lockInfo) {
      return false;
    }

    // Check if lock has expired
    const now = Date.now();
    const isExpired = (now - lockInfo.acquiredAt) > lockInfo.timeoutMs;

    if (isExpired) {
      // Clean up expired lock
      this.releaseLock(key);
      return false;
    }

    return true;
  }

  /**
   * Get information about a specific lock
   * @param key - Unique identifier for the lock
   * @returns lock information or null if not found
   */
  getLockInfo(key: string): { acquiredAt: number; timeoutMs: number; remainingMs: number } | null {
    const lockInfo = this.locks.get(key);
    if (!lockInfo) {
      return null;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, lockInfo.timeoutMs - (now - lockInfo.acquiredAt));

    return {
      acquiredAt: lockInfo.acquiredAt,
      timeoutMs: lockInfo.timeoutMs,
      remainingMs
    };
  }

  /**
   * Get current statistics about locks
   * @returns lock statistics
   */
  getStats(): { totalLocks: number; maxLocks: number; defaultTimeoutMs: number } {
    return {
      totalLocks: this.locks.size,
      maxLocks: this.maxLocks,
      defaultTimeoutMs: this.defaultTimeoutMs
    };
  }

  /**
   * Clear all locks (useful for testing or emergency cleanup)
   */
  clearAllLocks(): void {
    for (const [key, lockInfo] of this.locks.entries()) {
      clearTimeout(lockInfo.timerId);
    }
    this.locks.clear();
    console.log('[ProcessingLock] Cleared all locks');
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, lockInfo] of this.locks.entries()) {
      const isExpired = (now - lockInfo.acquiredAt) > lockInfo.timeoutMs;
      if (isExpired) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.releaseLock(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`[ProcessingLock] Cleaned up ${expiredKeys.length} expired locks`);
    }
  }

  /**
   * Clean up oldest locks when limit is reached
   * @param count - Number of locks to remove
   */
  private cleanupOldestLocks(count: number): void {
    const sortedLocks = Array.from(this.locks.entries())
      .sort(([, a], [, b]) => a.acquiredAt - b.acquiredAt)
      .slice(0, count);

    for (const [key] of sortedLocks) {
      this.releaseLock(key);
    }

    console.log(`[ProcessingLock] Cleaned up ${count} oldest locks`);
  }
}

/**
 * Global processing lock service instance
 */
let globalProcessingLockService: ProcessingLockService | null = null;

/**
 * Get the global processing lock service instance
 * @param options - Optional configuration for the service
 * @returns ProcessingLockService instance
 */
export function getProcessingLockService(options?: ProcessingLockOptions): ProcessingLockService {
  if (!globalProcessingLockService) {
    globalProcessingLockService = new ProcessingLockService(options);
  }
  return globalProcessingLockService;
}

/**
 * Helper function to execute a function with a processing lock
 * @param key - Unique identifier for the lock
 * @param fn - Function to execute while holding the lock
 * @param timeoutMs - Optional timeout for the lock
 * @returns Promise that resolves with the function result or rejects if lock couldn't be acquired
 */
export async function withProcessingLock<T>(
  key: string,
  fn: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  const lockService = getProcessingLockService();
  
  if (!lockService.acquireLock(key, timeoutMs)) {
    throw new Error(`Failed to acquire processing lock for key: ${key}`);
  }

  try {
    const result = await fn();
    return result;
  } finally {
    lockService.releaseLock(key);
  }
}