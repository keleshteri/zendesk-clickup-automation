/**
 * @ai-metadata
 * @component: ISlackHealthMonitor
 * @description: Interface for health monitoring and status checking following ISP
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Segregated interface for health monitoring concerns following ISP"
 */

/**
 * Health status for individual services
 */
export interface ServiceHealthStatus {
  messaging: boolean;
  botManager: boolean;
  eventHandler: boolean;
  security: boolean;
}

/**
 * Overall health status response
 */
export interface HealthStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealthStatus;
  timestamp: string;
}

/**
 * Interface for health monitoring operations
 * Follows ISP by focusing only on health and status concerns
 */
export interface ISlackHealthMonitor {
  /**
   * Get comprehensive health status of all services
   * @returns Promise that resolves to health status object
   */
  getHealthStatus(): Promise<HealthStatusResponse>;

  /**
   * Check if a specific service is healthy
   * @param serviceName - Name of the service to check
   * @returns Promise that resolves to true if service is healthy
   */
  isServiceHealthy(serviceName: keyof ServiceHealthStatus): Promise<boolean>;

  /**
   * Get detailed health metrics for debugging
   * @returns Promise that resolves to detailed health metrics
   */
  getDetailedHealthMetrics(): Promise<any>;
}