/**
 * @ai-metadata
 * @component: ISlackSecurityService
 * @description: Interface defining the contract for Slack security and verification operations
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in Slack security services"
 */

/**
 * Interface for Slack security service operations
 * Defines the contract for request verification, security auditing, and token management
 */
export interface ISlackSecurityService {
  /**
   * Verify Slack request signature using HMAC-SHA256
   * @param signature - The Slack request signature from headers
   * @param body - The raw request body
   * @param timestamp - The request timestamp from headers
   * @returns Promise that resolves to true if signature is valid
   */
  verifyRequest(signature: string, body: string, timestamp: string): Promise<boolean>;

  /**
   * Verify request with additional security auditing
   * @param signature - The Slack request signature from headers
   * @param body - The raw request body
   * @param timestamp - The request timestamp from headers
   * @returns Promise that resolves to true if signature is valid
   */
  verifyRequestWithAudit(signature: string, body: string, timestamp: string): Promise<boolean>;

  /**
   * Perform security audit operations
   * @returns Promise that resolves when audit is complete
   */
  auditSecurity(): Promise<void>;

  /**
   * Get security metrics and statistics
   * @returns Promise that resolves to security metrics object
   */
  getSecurityMetrics(): Promise<any>;

  /**
   * Get security audit log
   * @returns Promise that resolves to audit log data
   */
  getSecurityAuditLog(): Promise<any>;

  /**
   * Get token metadata and information
   * @returns Promise that resolves to token metadata
   */
  getTokenMetadata(): Promise<any>;

  /**
   * Check token rotation status
   * @returns Promise that resolves to rotation status
   */
  checkTokenRotationStatus(): Promise<any>;

  /**
   * Force token rotation
   * @returns Promise that resolves to rotation result
   */
  forceTokenRotation(): Promise<{ success: boolean; message: string }>;

  /**
   * Update token rotation configuration
   * @param config - Partial configuration object to update
   * @returns Promise that resolves to update result
   */
  updateTokenRotationConfig(config: Partial<any>): Promise<{ success: boolean; message: string }>;

  /**
   * Check manifest permissions
   * @returns Manifest permissions data
   */
  checkManifestPermissions(): any;

  /**
   * Validate token permissions against required scopes
   * @param requiredScopes - Array of required permission scopes
   * @returns Promise that resolves to validation result
   */
  validateTokenPermissions(requiredScopes: string[]): Promise<{ valid: boolean; missingScopes: string[] }>;

  /**
   * Check if the current token is valid
   * @returns Promise that resolves to true if token is valid
   */
  isTokenValid(): Promise<boolean>;
}