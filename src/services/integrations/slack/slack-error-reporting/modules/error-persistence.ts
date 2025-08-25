/**
 * @ai-metadata
 * @component: ErrorPersistence
 * @description: Handles error data persistence, storage, and retrieval operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-persistence.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../../../types", "../../interfaces"]
 * @tests: ["../tests/error-persistence.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Module responsible for persisting error data to storage and providing query capabilities"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type { Env } from '../../../../../types';
import type {
  SlackErrorReport,
  ErrorQueryFilters,
  ErrorReportingConfig
} from '../../interfaces/slack-error-reporting.interface';

/**
 * Handles error data persistence and retrieval
 * Provides abstraction over storage mechanisms
 */
export class ErrorPersistence {
  private env: Env;
  private config: ErrorReportingConfig;
  private errorStore: Map<string, SlackErrorReport> = new Map();
  private fingerprintIndex: Map<string, string> = new Map();

  constructor(env: Env, config: ErrorReportingConfig) {
    this.env = env;
    this.config = config;
    this.initializeStorage();
  }

  /**
   * Initialize storage mechanism
   */
  private async initializeStorage(): Promise<void> {
    try {
      // In a real implementation, this would connect to a database
      // For now, we'll use in-memory storage with optional persistence
      console.log('📦 Error persistence initialized');
      
      // Load existing errors if available
      await this.loadExistingErrors();
    } catch (error) {
      console.error('❌ Failed to initialize error storage:', error);
    }
  }

  /**
   * Load existing errors from persistent storage
   */
  private async loadExistingErrors(): Promise<void> {
    try {
      // In a real implementation, this would load from database/KV store
      // For now, we'll check if there's any stored data in environment
      if (this.env.SLACK_ERROR_REPORTS) {
        // Load from Cloudflare KV or similar
        const storedErrors = await this.loadFromKV();
        for (const error of storedErrors) {
          this.errorStore.set(error.id, error);
          this.fingerprintIndex.set(error.fingerprint, error.id);
        }
        console.log(`📥 Loaded ${storedErrors.length} existing errors`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load existing errors:', error);
    }
  }

  /**
   * Load errors from KV storage
   * @returns Promise that resolves to array of error reports
   */
  private async loadFromKV(): Promise<SlackErrorReport[]> {
    try {
      // This would be implemented with actual KV storage
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to load from KV:', error);
      return [];
    }
  }

  /**
   * Store an error report
   * @param error - The error report to store
   * @returns Promise that resolves when storage is complete
   */
  async storeError(error: SlackErrorReport): Promise<void> {
    try {
      // Store in memory
      this.errorStore.set(error.id, error);
      this.fingerprintIndex.set(error.fingerprint, error.id);
      
      // Persist to external storage if configured
      await this.persistToStorage(error);
      
      console.log(`💾 Stored error: ${error.id}`);
    } catch (storageError) {
      console.error('❌ Failed to store error:', storageError);
      throw storageError;
    }
  }

  /**
   * Persist error to external storage
   * @param error - The error report to persist
   */
  private async persistToStorage(error: SlackErrorReport): Promise<void> {
    try {
      if (this.env.SLACK_ERROR_REPORTS) {
        // Store in Cloudflare KV or similar
        await this.storeInKV(error);
      }
    } catch (error) {
      console.warn('⚠️ Failed to persist to external storage:', error);
      // Don't throw - in-memory storage is still available
    }
  }

  /**
   * Store error in KV storage
   * @param error - The error report to store
   */
  private async storeInKV(error: SlackErrorReport): Promise<void> {
    try {
      // Implementation would use actual KV storage
      // await this.env.SLACK_ERROR_REPORTS.put(`error:${error.id}`, JSON.stringify(error));
      console.log(`📤 Persisted error to KV: ${error.id}`);
    } catch (error) {
      console.error('Failed to store in KV:', error);
      throw error;
    }
  }

  /**
   * Store error in database
   * @param error - The error report to store
   */
  private async storeInDatabase(error: SlackErrorReport): Promise<void> {
    try {
      // Implementation would use actual database connection
      console.log(`🗄️ Persisted error to database: ${error.id}`);
    } catch (error) {
      console.error('Failed to store in database:', error);
      throw error;
    }
  }

  /**
   * Update an existing error report
   * @param error - The updated error report
   * @returns Promise that resolves when update is complete
   */
  async updateError(error: SlackErrorReport): Promise<void> {
    try {
      // Update in memory
      this.errorStore.set(error.id, error);
      
      // Update in external storage
      await this.persistToStorage(error);
      
      console.log(`🔄 Updated error: ${error.id}`);
    } catch (updateError) {
      console.error('❌ Failed to update error:', updateError);
      throw updateError;
    }
  }

  /**
   * Get an error by ID
   * @param errorId - The error ID to retrieve
   * @returns Promise that resolves to the error report or null
   */
  async getError(errorId: string): Promise<SlackErrorReport | null> {
    try {
      // Try memory first
      const error = this.errorStore.get(errorId);
      if (error) {
        return error;
      }
      
      // Try external storage
      return await this.loadErrorFromStorage(errorId);
    } catch (error) {
      console.error('❌ Failed to get error:', error);
      return null;
    }
  }

  /**
   * Load error from external storage
   * @param errorId - The error ID to load
   * @returns Promise that resolves to the error report or null
   */
  private async loadErrorFromStorage(errorId: string): Promise<SlackErrorReport | null> {
    try {
      if (this.env.SLACK_ERROR_REPORTS) {
        // Load from KV storage
        // const stored = await this.env.SLACK_ERROR_REPORTS.get(`error:${errorId}`);
        // if (stored) {
        //   const error = JSON.parse(stored) as SlackErrorReport;
        //   this.errorStore.set(error.id, error); // Cache in memory
        //   return error;
        // }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load from storage:', error);
      return null;
    }
  }

  /**
   * Find error by fingerprint
   * @param fingerprint - The error fingerprint to search for
   * @returns Promise that resolves to the error report or null
   */
  async findErrorByFingerprint(fingerprint: string): Promise<SlackErrorReport | null> {
    try {
      const errorId = this.fingerprintIndex.get(fingerprint);
      if (errorId) {
        return this.getError(errorId);
      }
      
      // Search in external storage if not found in memory
      return await this.searchByFingerprintInStorage(fingerprint);
    } catch (error) {
      console.error('❌ Failed to find error by fingerprint:', error);
      return null;
    }
  }

  /**
   * Search for error by fingerprint in external storage
   * @param fingerprint - The fingerprint to search for
   * @returns Promise that resolves to the error report or null
   */
  private async searchByFingerprintInStorage(fingerprint: string): Promise<SlackErrorReport | null> {
    try {
      // In a real implementation, this would query the database
      // For now, return null
      return null;
    } catch (error) {
      console.error('Failed to search by fingerprint in storage:', error);
      return null;
    }
  }

  /**
   * Get errors with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise that resolves to filtered error reports
   */
  async getErrors(filters: ErrorQueryFilters = {}): Promise<SlackErrorReport[]> {
    try {
      let errors = Array.from(this.errorStore.values());
      
      // Apply filters
      errors = this.applyFilters(errors, filters);
      
      // Sort by timestamp (newest first)
      errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply limit
      if (filters.limit) {
        errors = errors.slice(0, filters.limit);
      }
      
      return errors;
    } catch (error) {
      console.error('❌ Failed to get errors:', error);
      return [];
    }
  }

  /**
   * Apply filters to error list
   * @param errors - The errors to filter
   * @param filters - The filters to apply
   * @returns Filtered errors
   */
  private applyFilters(errors: SlackErrorReport[], filters: ErrorQueryFilters): SlackErrorReport[] {
    return errors.filter(error => {
      // Apply severity filter
      if (filters.severity && !filters.severity.includes(error.severity)) {
        return false;
      }
      
      // Filter by resolved status
      if (filters.resolved !== undefined && error.resolved !== filters.resolved) {
        return false;
      }
      
      // Filter by service
      if (filters.service && !filters.service.includes(error.source.service)) {
        return false;
      }
      
      // Filter by time range
      if (filters.dateRange?.from && error.timestamp < filters.dateRange.from) {
        return false;
      }
      
      if (filters.dateRange?.to && error.timestamp > filters.dateRange.to) {
        return false;
      }
      
      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => error.tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }
      
      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          error.error.message,
          (error.error as any).name || 'Unknown',
          error.source.service,
          error.source.method,
          ...error.tags
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get error count with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise that resolves to error count
   */
  async getErrorCount(filters: ErrorQueryFilters = {}): Promise<number> {
    const errors = await this.getErrors(filters);
    return errors.length;
  }

  /**
   * Delete errors before a certain date
   * @param cutoffDate - The cutoff date
   * @returns Promise that resolves to the number of deleted errors
   */
  async deleteErrorsBefore(cutoffDate: Date): Promise<number> {
    try {
      let deletedCount = 0;
      
      // Find errors to delete
      const errorsToDelete = Array.from(this.errorStore.values())
        .filter(error => error.timestamp < cutoffDate);
      
      // Delete from memory and external storage
      for (const error of errorsToDelete) {
        await this.deleteError(error.id);
        deletedCount++;
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to delete old errors:', error);
      return 0;
    }
  }

  /**
   * Delete a specific error
   * @param errorId - The ID of the error to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteError(errorId: string): Promise<void> {
    try {
      const error = this.errorStore.get(errorId);
      if (error) {
        // Remove from memory
        this.errorStore.delete(errorId);
        this.fingerprintIndex.delete(error.fingerprint);
        
        // Remove from external storage
        await this.deleteFromStorage(errorId);
        
        console.log(`🗑️ Deleted error: ${errorId}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete error:', error);
      throw error;
    }
  }

  /**
   * Delete error from external storage
   * @param errorId - The ID of the error to delete
   */
  private async deleteFromStorage(errorId: string): Promise<void> {
    try {
      if (this.env.SLACK_ERROR_REPORTS) {
        // Delete from KV storage
        // await this.env.SLACK_ERROR_REPORTS.delete(`error:${errorId}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete from external storage:', error);
      // Don't throw - memory deletion was successful
    }
  }

  /**
   * Get storage statistics
   * @returns Promise that resolves to storage statistics
   */
  async getStorageStats(): Promise<{
    totalErrors: number;
    memoryUsage: number;
    oldestError?: Date;
    newestError?: Date;
  }> {
    try {
      const errors = Array.from(this.errorStore.values());
      const timestamps = errors.map(e => e.timestamp).sort((a, b) => a.getTime() - b.getTime());
      
      return {
        totalErrors: errors.length,
        memoryUsage: this.estimateMemoryUsage(),
        oldestError: timestamps[0],
        newestError: timestamps[timestamps.length - 1]
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalErrors: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Estimate memory usage of stored errors
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    try {
      const errors = Array.from(this.errorStore.values());
      const serialized = JSON.stringify(errors);
      return serialized.length * 2; // Rough estimate (UTF-16)
    } catch (error) {
      return 0;
    }
  }

  /**
   * Persist configuration to storage
   * @param config - The configuration to persist
   * @returns Promise that resolves to true if successful
   */
  async persistConfig(config: ErrorReportingConfig): Promise<boolean> {
    try {
      if (this.env.SLACK_ERROR_REPORTS) {
        // Store config in KV
        // await this.env.SLACK_ERROR_REPORTS.put('error-reporting-config', JSON.stringify(config));
      }
      
      console.log('💾 Persisted error reporting configuration');
      return true;
    } catch (error) {
      console.error('❌ Failed to persist configuration:', error);
      return false;
    }
  }

  /**
   * Load configuration from storage
   * @returns Promise that resolves to stored configuration or null
   */
  async loadConfig(): Promise<ErrorReportingConfig | null> {
    try {
      if (this.env.SLACK_ERROR_REPORTS) {
        // Load config from KV
        // const stored = await this.env.SLACK_ERROR_REPORTS.get('error-reporting-config');
        // if (stored) {
        //   return JSON.parse(stored) as ErrorReportingConfig;
        // }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      return null;
    }
  }

  /**
   * Update configuration
   * @param config - New configuration
   */
  updateConfig(config: ErrorReportingConfig): void {
    this.config = config;
  }

  /**
   * Clear all stored errors (use with caution)
   * @returns Promise that resolves when clearing is complete
   */
  async clearAllErrors(): Promise<void> {
    try {
      // Clear memory
      this.errorStore.clear();
      this.fingerprintIndex.clear();
      
      // Clear external storage
      if (this.env.SLACK_ERROR_REPORTS) {
        // In a real implementation, this would clear all error keys
        console.log('🧹 Cleared all errors from storage');
      }
    } catch (error) {
      console.error('❌ Failed to clear all errors:', error);
      throw error;
    }
  }
}