/**
 * @ai-metadata
 * @component: MonitoringRoutes
 * @description: API endpoints for monitoring duplicate event detection and system health
 * @last-update: 2025-01-24
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/monitoring-routes.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../utils/duplicate-event-monitor.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Monitoring endpoints for tracking duplicate events and system analytics"
 */

import { Hono } from 'hono';
import { getDuplicateEventMonitor } from '../utils';
import { HTTP_STATUS } from '../config';

/**
 * Monitoring routes for duplicate event detection and system health
 */
const monitoringRoutes = new Hono();

/**
 * GET /monitoring/duplicate-events/stats
 * Get current duplicate event statistics
 */
monitoringRoutes.get('/duplicate-events/stats', async (c) => {
  try {
    const monitor = getDuplicateEventMonitor();
    const stats = monitor.getStats();
    
    return c.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('[MonitoringRoutes] Error getting duplicate event stats:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve duplicate event statistics',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/duplicate-events/report
 * Get a human-readable duplicate event report
 */
monitoringRoutes.get('/duplicate-events/report', async (c) => {
  try {
    const monitor = getDuplicateEventMonitor();
    const report = monitor.generateReport();
    
    return c.text(report, HTTP_STATUS.OK, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
  } catch (error) {
    console.error('[MonitoringRoutes] Error generating duplicate event report:', error);
    return c.json({
      success: false,
      error: 'Failed to generate duplicate event report',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/duplicate-events/export
 * Export duplicate event statistics as JSON
 */
monitoringRoutes.get('/duplicate-events/export', async (c) => {
  try {
    const monitor = getDuplicateEventMonitor();
    const exportData = monitor.exportStats();
    
    return c.text(exportData, HTTP_STATUS.OK, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="duplicate-events-${Date.now()}.json"`
    });
  } catch (error) {
    console.error('[MonitoringRoutes] Error exporting duplicate event stats:', error);
    return c.json({
      success: false,
      error: 'Failed to export duplicate event statistics',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/duplicate-events/by-type/:eventType
 * Get duplicate events for a specific event type
 */
monitoringRoutes.get('/duplicate-events/by-type/:eventType', async (c) => {
  try {
    const eventType = c.req.param('eventType');
    const monitor = getDuplicateEventMonitor();
    const duplicates = monitor.getDuplicatesForType(eventType);
    
    return c.json({
      success: true,
      data: {
        eventType,
        duplicates,
        count: duplicates.length
      },
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('[MonitoringRoutes] Error getting duplicates by type:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve duplicates by type',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/duplicate-events/by-source/:source
 * Get duplicate events from a specific source
 */
monitoringRoutes.get('/duplicate-events/by-source/:source', async (c) => {
  try {
    const source = c.req.param('source') as 'deduplication' | 'processing-lock' | 'route-level' | 'other';
    const monitor = getDuplicateEventMonitor();
    const duplicates = monitor.getDuplicatesFromSource(source);
    
    return c.json({
      success: true,
      data: {
        source,
        duplicates,
        count: duplicates.length
      },
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('[MonitoringRoutes] Error getting duplicates by source:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve duplicates by source',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/duplicate-events/health
 * Check if duplicate rate is within acceptable thresholds
 */
monitoringRoutes.get('/duplicate-events/health', async (c) => {
  try {
    const threshold = parseFloat(c.req.query('threshold') || '10'); // Default 10%
    const monitor = getDuplicateEventMonitor();
    const stats = monitor.getStats();
    const isHealthy = !monitor.isDuplicateRateHigh(threshold);
    
    return c.json({
      success: true,
      data: {
        healthy: isHealthy,
        duplicateRate: stats.duplicateRate,
        threshold,
        totalEvents: stats.totalEvents,
        duplicateEvents: stats.duplicateEvents,
        status: isHealthy ? 'healthy' : 'warning',
        message: isHealthy 
          ? `Duplicate rate (${stats.duplicateRate}%) is within acceptable threshold (${threshold}%)`
          : `Duplicate rate (${stats.duplicateRate}%) exceeds threshold (${threshold}%)`
      },
      timestamp: new Date().toISOString()
    }, isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.OK); // Still return 200 for warnings
  } catch (error) {
    console.error('[MonitoringRoutes] Error checking duplicate event health:', error);
    return c.json({
      success: false,
      error: 'Failed to check duplicate event health',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /monitoring/duplicate-events/reset
 * Reset duplicate event statistics (admin only)
 */
monitoringRoutes.post('/duplicate-events/reset', async (c) => {
  try {
    const monitor = getDuplicateEventMonitor();
    monitor.reset();
    
    return c.json({
      success: true,
      message: 'Duplicate event statistics have been reset',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('[MonitoringRoutes] Error resetting duplicate event stats:', error);
    return c.json({
      success: false,
      error: 'Failed to reset duplicate event statistics',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /monitoring/health
 * Overall system health check
 */
monitoringRoutes.get('/health', async (c) => {
  try {
    const monitor = getDuplicateEventMonitor();
    const stats = monitor.getStats();
    const duplicateHealthy = !monitor.isDuplicateRateHigh(10); // 10% threshold
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - stats.startTime,
      checks: {
        duplicateEvents: {
          status: duplicateHealthy ? 'healthy' : 'warning',
          duplicateRate: stats.duplicateRate,
          totalEvents: stats.totalEvents,
          duplicateEvents: stats.duplicateEvents
        }
      }
    };
    
    // Overall status based on individual checks
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
    health.status = hasWarnings ? 'warning' : 'healthy';
    
    return c.json({
      success: true,
      data: health
    }, HTTP_STATUS.OK);
  } catch (error) {
    console.error('[MonitoringRoutes] Error checking system health:', error);
    return c.json({
      success: false,
      error: 'Failed to check system health',
      timestamp: new Date().toISOString()
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export { monitoringRoutes };