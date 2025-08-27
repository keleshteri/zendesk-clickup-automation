/**
 * @ai-metadata
 * @component: ErrorAlerting
 * @description: Manages error alerts, notifications, and escalation workflows
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/error-alerting.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../interfaces", "./error-persistence"]
 * @tests: ["../tests/error-alerting.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Module that handles error alerting, notifications, and escalation workflows"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import type {
  SlackErrorReport
} from '../../interfaces/slack-error-reporting.interface';
import { ErrorSeverity } from '../../interfaces/slack-error-reporting.interface';
import type { AlertChannel, AlertRule } from '../types';
import type { ErrorPersistence } from './error-persistence';

/**
 * Alert configuration interface
 */
interface AlertConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: AlertChannel[];
  escalationRules: EscalationRule[];
  rateLimits: RateLimitConfig;
  templates: AlertTemplates;
}

/**
 * Escalation rule interface
 */
interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    severity: ErrorSeverity[];
    timeThreshold: number; // minutes
    occurrenceThreshold: number;
  };
  actions: EscalationAction[];
  enabled: boolean;
}

/**
 * Escalation action interface
 */
interface EscalationAction {
  type: 'slack' | 'email' | 'webhook' | 'pagerduty';
  target: string;
  delay: number; // minutes
  template: string;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxAlertsPerHour: number;
  maxAlertsPerDay: number;
  cooldownPeriod: number; // minutes
  burstLimit: number;
}

/**
 * Alert templates
 */
interface AlertTemplates {
  error: string;
  warning: string;
  critical: string;
  escalation: string;
  resolution: string;
}

/**
 * Alert status tracking
 */
interface AlertStatus {
  alertId: string;
  errorId: string;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  sentAt?: Date;
  acknowledgedAt?: Date;
  escalatedAt?: Date;
  attempts: number;
  lastAttempt?: Date;
}

/**
 * Manages error alerting and notifications
 * Handles alert rules, escalation, and rate limiting
 */
export class ErrorAlerting {
  private persistence: ErrorPersistence;
  private config: AlertConfig;
  private alertHistory: Map<string, AlertStatus> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(persistence: ErrorPersistence, config?: Partial<AlertConfig>) {
    this.persistence = persistence;
    this.config = this.mergeWithDefaultConfig(config || {});
  }

  /**
   * Process error for alerting
   * @param error - Error report to process
   * @returns Promise that resolves when processing is complete
   */
  async processErrorForAlerting(error: SlackErrorReport): Promise<void> {
    try {
      if (!this.config.enabled) {
        return;
      }

      // Check if error matches any alert rules
      const matchingRules = this.getMatchingRules(error);
      if (matchingRules.length === 0) {
        return;
      }

      // Check rate limits
      if (this.isRateLimited(error)) {
        console.warn(`⚠️ Alert rate limited for error: ${error.id}`);
        return;
      }

      // Send alerts for matching rules
      for (const rule of matchingRules) {
        await this.sendAlertWithRule(error, rule);
      }

      // Set up escalation if needed
      await this.setupEscalation(error);

    } catch (error) {
      console.error('❌ Failed to process error for alerting:', error);
    }
  }

  /**
   * Get alert rules that match the error
   * @param error - Error report to check
   * @returns Array of matching alert rules
   */
  private getMatchingRules(error: SlackErrorReport): AlertRule[] {
    return this.config.rules.filter(rule => {
      if (!rule.enabled) {
        return false;
      }

      // Check severity
      if (rule.conditions.severity && !rule.conditions.severity.includes(error.severity)) {
        return false;
      }

      // Check service
      if (rule.conditions.services && rule.conditions.services.length > 0 && !rule.conditions.services.includes(error.source.service)) {
        return false;
      }

      // Check error pattern
      if (rule.conditions.errorPatterns && rule.conditions.errorPatterns.length > 0) {
        const regex = new RegExp(rule.conditions.errorPatterns[0], 'i');
        if (!regex.test(error.error.message)) {
          return false;
        }
      }

      // Check occurrence threshold
      if (rule.conditions.thresholds.count && error.occurrenceCount < rule.conditions.thresholds.count) {
        return false;
      }

      // Check time window if specified
      if (rule.conditions.thresholds.timeWindow) {
        const windowStart = new Date(Date.now() - rule.conditions.thresholds.timeWindow * 60 * 1000);
        if (error.timestamp < windowStart) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if alerting is rate limited for this error
   * @param error - Error report to check
   * @returns True if rate limited
   */
  private isRateLimited(error: SlackErrorReport): boolean {
    const now = Date.now();
    const hourKey = `hour_${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `day_${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    const errorKey = `error_${error.fingerprint}`;

    // Check hourly limit
    const hourlyTracker = this.rateLimitTracker.get(hourKey);
    if (hourlyTracker && hourlyTracker.count >= this.config.rateLimits.maxAlertsPerHour) {
      return true;
    }

    // Check daily limit
    const dailyTracker = this.rateLimitTracker.get(dayKey);
    if (dailyTracker && dailyTracker.count >= this.config.rateLimits.maxAlertsPerDay) {
      return true;
    }

    // Check cooldown period for this specific error
    const errorTracker = this.rateLimitTracker.get(errorKey);
    if (errorTracker && now - errorTracker.resetTime < this.config.rateLimits.cooldownPeriod * 60 * 1000) {
      return true;
    }

    return false;
  }

  /**
   * Send alert for error report
   * @param error - Error report to send alert for
   * @returns Promise that resolves to success status
   */
  async sendAlert(error: SlackErrorReport): Promise<boolean> {
    try {
      const matchingRules = this.getMatchingRules(error);
      if (matchingRules.length === 0 || this.isRateLimited(error)) {
        return false;
      }

      for (const rule of matchingRules) {
        await this.sendAlertWithRule(error, rule);
      }
      return true;
    } catch (error) {
      console.error('Failed to send alert:', error);
      return false;
    }
  }

  /**
   * Send alert for error and rule
   * @param error - Error report
   * @param rule - Alert rule
   * @returns Promise that resolves when alert is sent
   */
  private async sendAlertWithRule(error: SlackErrorReport, rule: AlertRule): Promise<void> {
    try {
      const alertId = this.generateAlertId(error, rule);
      const alertStatus: AlertStatus = {
        alertId,
        errorId: error.id,
        status: 'pending',
        attempts: 0
      };

      this.alertHistory.set(alertId, alertStatus);

      // Send to each channel in the rule
      for (const channelName of rule.actions.channels) {
        const channel = this.config.channels.find(c => c.name === channelName);
        if (channel) {
          await this.sendToChannel(error, rule, channel, alertStatus);
        }
      }

      // Update rate limit trackers
      this.updateRateLimitTrackers(error);

    } catch (error) {
      console.error('❌ Failed to send alert:', error);
    }
  }

  /**
   * Send alert to specific channel
   * @param error - Error report
   * @param rule - Alert rule
   * @param channel - Alert channel
   * @param alertStatus - Alert status tracker
   * @returns Promise that resolves when sent
   */
  private async sendToChannel(
    error: SlackErrorReport,
    rule: AlertRule,
    channel: AlertChannel,
    alertStatus: AlertStatus
  ): Promise<void> {
    try {
      alertStatus.attempts++;
      alertStatus.lastAttempt = new Date();

      const message = this.formatAlertMessage(error, rule, channel);

      switch (channel.type) {
        case 'slack':
          await this.sendSlackAlert(channel.config.channelId || channel.config.webhookUrl || '', message, error);
          break;
        case 'email':
          await this.sendEmailAlert(channel.config.recipients?.join(',') || '', message, error);
          break;
        case 'webhook':
          await this.sendWebhookAlert(channel.config.url || '', message, error);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(channel.config.integrationKey || '', message, error);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      alertStatus.status = 'sent';
      alertStatus.sentAt = new Date();

    } catch (error) {
      console.error(`❌ Failed to send alert to ${channel.type} channel:`, error);
      alertStatus.status = 'failed';
    }
  }

  /**
   * Format alert message
   * @param error - Error report
   * @param rule - Alert rule
   * @param channel - Alert channel
   * @returns Formatted message
   */
  private formatAlertMessage(
    error: SlackErrorReport,
    rule: AlertRule,
    channel: AlertChannel
  ): string {
    const template = this.getTemplate(error.severity);
    
    return template
      .replace('{{severity}}', error.severity.toUpperCase())
      .replace('{{service}}', error.source.service)
      .replace('{{message}}', error.error.message)
      .replace('{{count}}', error.occurrenceCount.toString())
      .replace('{{timestamp}}', error.timestamp.toISOString())
      .replace('{{fingerprint}}', error.fingerprint)
      .replace('{{rule}}', rule.name)
      .replace('{{channel}}', channel.name);
  }

  /**
   * Get message template for severity
   * @param severity - Error severity
   * @returns Message template
   */
  private getTemplate(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return this.config.templates.critical;
      case ErrorSeverity.HIGH:
        return this.config.templates.error;
      case ErrorSeverity.MEDIUM:
        return this.config.templates.warning;
      default:
        return this.config.templates.error;
    }
  }

  /**
   * Send Slack alert
   * @param target - Slack channel or webhook URL
   * @param message - Alert message
   * @param error - Error report
   * @returns Promise that resolves when sent
   */
  private async sendSlackAlert(
    target: string,
    message: string,
    error: SlackErrorReport
  ): Promise<void> {
    // Implementation would depend on Slack SDK
    // This is a placeholder for the actual Slack integration
    console.log(`📢 Slack Alert to ${target}: ${message}`);
    
    // In a real implementation, you would:
    // 1. Use the Slack Web API or webhook
    // 2. Format the message with rich formatting
    // 3. Include action buttons for acknowledgment
    // 4. Handle rate limiting and retries
  }

  /**
   * Send email alert
   * @param target - Email address
   * @param message - Alert message
   * @param error - Error report
   * @returns Promise that resolves when sent
   */
  private async sendEmailAlert(
    target: string,
    message: string,
    error: SlackErrorReport
  ): Promise<void> {
    // Implementation would depend on email service
    console.log(`📧 Email Alert to ${target}: ${message}`);
    
    // In a real implementation, you would:
    // 1. Use an email service (SendGrid, SES, etc.)
    // 2. Format as HTML email with error details
    // 3. Include links to error dashboard
    // 4. Handle delivery failures
  }

  /**
   * Send webhook alert
   * @param target - Webhook URL
   * @param message - Alert message
   * @param error - Error report
   * @returns Promise that resolves when sent
   */
  private async sendWebhookAlert(
    target: string,
    message: string,
    error: SlackErrorReport
  ): Promise<void> {
    try {
      const payload = {
        message,
        error: {
          id: error.id,
          severity: error.severity,
          service: error.source.service,
          fingerprint: error.fingerprint,
          timestamp: error.timestamp.toISOString(),
          count: error.occurrenceCount
        },
        timestamp: new Date().toISOString()
      };

      // In a real implementation, you would make an HTTP POST request
      console.log(`🔗 Webhook Alert to ${target}:`, payload);
      
      // Example:
      // await fetch(target, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
    } catch (_error) {
      console.error('❌ Failed to send webhook alert:', _error);
      throw _error;
    }
  }

  /**
   * Send PagerDuty alert
   * @param target - PagerDuty integration key
   * @param message - Alert message
   * @param error - Error report
   * @returns Promise that resolves when sent
   */
  private async sendPagerDutyAlert(
    target: string,
    message: string,
    error: SlackErrorReport
  ): Promise<void> {
    // Implementation would depend on PagerDuty API
    console.log(`🚨 PagerDuty Alert to ${target}: ${message}`);
    
    // In a real implementation, you would:
    // 1. Use PagerDuty Events API
    // 2. Create incident with proper severity mapping
    // 3. Include error context and links
    // 4. Handle deduplication
  }

  /**
   * Setup escalation for error if needed
   * @param error - Error report
   * @returns Promise that resolves when escalation is set up
   */
  private async setupEscalation(error: SlackErrorReport): Promise<void> {
    const matchingEscalationRules = this.config.escalationRules.filter(rule => {
      return rule.enabled && 
             rule.conditions.severity.includes(error.severity) &&
             error.occurrenceCount >= rule.conditions.occurrenceThreshold;
    });

    for (const rule of matchingEscalationRules) {
      const escalationKey = `${error.id}_${rule.id}`;
      
      // Clear existing timer if any
      const existingTimer = this.escalationTimers.get(escalationKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set up new escalation timer
      const timer = setTimeout(async () => {
        await this.executeEscalation(error, rule);
        this.escalationTimers.delete(escalationKey);
      }, rule.conditions.timeThreshold * 60 * 1000);

      this.escalationTimers.set(escalationKey, timer);
    }
  }

  /**
   * Execute escalation actions
   * @param error - Error report
   * @param rule - Escalation rule
   * @returns Promise that resolves when escalation is executed
   */
  private async executeEscalation(
    error: SlackErrorReport,
    rule: EscalationRule
  ): Promise<void> {
    try {
      console.log(`🚨 Executing escalation rule: ${rule.name} for error: ${error.id}`);

      for (const action of rule.actions) {
        // Add delay between actions if specified
        if (action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay * 60 * 1000));
        }

        await this.executeEscalationAction(error, action, rule);
      }

      // Mark alert as escalated
      const alertId = this.generateAlertId(error, rule as any);
      const alertStatus = this.alertHistory.get(alertId);
      if (alertStatus) {
        alertStatus.escalatedAt = new Date();
      }

    } catch (_error) {
      console.error('❌ Failed to execute escalation:', _error);
    }
  }

  /**
   * Execute individual escalation action
   * @param error - Error report
   * @param action - Escalation action
   * @param rule - Escalation rule
   * @returns Promise that resolves when action is executed
   */
  private async executeEscalationAction(
    error: SlackErrorReport,
    action: EscalationAction,
    rule: EscalationRule
  ): Promise<void> {
    const message = this.config.templates.escalation
      .replace('{{severity}}', error.severity.toUpperCase())
      .replace('{{service}}', error.source.service)
      .replace('{{message}}', error.error.message)
      .replace('{{count}}', error.occurrenceCount.toString())
      .replace('{{rule}}', rule.name)
      .replace('{{threshold}}', rule.conditions.timeThreshold.toString());

    switch (action.type) {
      case 'slack':
        await this.sendSlackAlert(action.target, message, error);
        break;
      case 'email':
        await this.sendEmailAlert(action.target, message, error);
        break;
      case 'webhook':
        await this.sendWebhookAlert(action.target, message, error);
        break;
      case 'pagerduty':
        await this.sendPagerDutyAlert(action.target, message, error);
        break;
    }
  }

  /**
   * Acknowledge alert
   * @param alertId - Alert ID to acknowledge
   * @param acknowledgedBy - Who acknowledged the alert
   * @returns Promise that resolves when acknowledged
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const alertStatus = this.alertHistory.get(alertId);
      if (alertStatus) {
        alertStatus.status = 'acknowledged';
        alertStatus.acknowledgedAt = new Date();
        
        // Cancel any pending escalations for this alert
        const escalationKey = `${alertStatus.errorId}_${alertId}`;
        const timer = this.escalationTimers.get(escalationKey);
        if (timer) {
          clearTimeout(timer);
          this.escalationTimers.delete(escalationKey);
        }

        console.log(`✅ Alert ${alertId} acknowledged by ${acknowledgedBy}`);
      }
    } catch (_error) {
      console.error('❌ Failed to acknowledge alert:', _error);
    }
  }

  /**
   * Send resolution notification
   * @param error - Resolved error report
   * @returns Promise that resolves when notification is sent
   */
  async sendResolutionNotification(error: SlackErrorReport): Promise<void> {
    try {
      if (!this.config.enabled || !error.resolution) {
        return;
      }

      const _message = this.config.templates.resolution
        .replace('{{severity}}', error.severity.toUpperCase())
        .replace('{{service}}', error.source.service)
        .replace('{{message}}', error.error.message)
        .replace('{{resolvedBy}}', 'System')
        .replace('{{resolutionTime}}', this.formatDuration(
          error.resolution.resolvedAt!.getTime() - error.timestamp.getTime()
        ));

      // Send to all configured channels
      for (const channel of this.config.channels) {
        if (channel.enabled) {
          await this.sendToChannel(error, { channels: [channel.name] } as any, channel, {
            alertId: `resolution_${error.id}`,
            errorId: error.id,
            status: 'pending',
            attempts: 0
          });
        }
      }

    } catch (_error) {
      console.error('❌ Failed to send resolution notification:', _error);
    }
  }

  /**
   * Update rate limit trackers
   * @param error - Error report
   */
  private updateRateLimitTrackers(error: SlackErrorReport): void {
    const now = Date.now();
    const hourKey = `hour_${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `day_${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    const errorKey = `error_${error.fingerprint}`;

    // Update hourly tracker
    const hourlyTracker = this.rateLimitTracker.get(hourKey) || { count: 0, resetTime: now };
    hourlyTracker.count++;
    this.rateLimitTracker.set(hourKey, hourlyTracker);

    // Update daily tracker
    const dailyTracker = this.rateLimitTracker.get(dayKey) || { count: 0, resetTime: now };
    dailyTracker.count++;
    this.rateLimitTracker.set(dayKey, dailyTracker);

    // Update error-specific tracker
    this.rateLimitTracker.set(errorKey, { count: 1, resetTime: now });
  }

  /**
   * Generate alert ID
   * @param error - Error report
   * @param rule - Alert rule
   * @returns Alert ID
   */
  private generateAlertId(error: SlackErrorReport, rule: any): string {
    return `alert_${error.id}_${rule.id || 'default'}_${Date.now()}`;
  }

  /**
   * Format duration in human-readable format
   * @param milliseconds - Duration in milliseconds
   * @returns Formatted duration string
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Merge with default configuration
   * @param config - Partial configuration
   * @returns Complete configuration
   */
  private mergeWithDefaultConfig(config: Partial<AlertConfig>): AlertConfig {
    const defaultConfig: AlertConfig = {
      enabled: true,
      rules: [],
      channels: [],
      escalationRules: [],
      rateLimits: {
        maxAlertsPerHour: 50,
        maxAlertsPerDay: 200,
        cooldownPeriod: 15, // 15 minutes
        burstLimit: 5
      },
      templates: {
        error: '🚨 **{{severity}}** Error in {{service}}\n**Message:** {{message}}\n**Count:** {{count}}\n**Time:** {{timestamp}}',
        warning: '⚠️ **{{severity}}** Warning in {{service}}\n**Message:** {{message}}\n**Count:** {{count}}\n**Time:** {{timestamp}}',
        critical: '🔥 **{{severity}}** Critical Error in {{service}}\n**Message:** {{message}}\n**Count:** {{count}}\n**Time:** {{timestamp}}\n**IMMEDIATE ATTENTION REQUIRED**',
        escalation: '🚨 **ESCALATION** - {{rule}}\n**{{severity}}** Error in {{service}} has not been resolved after {{threshold}} minutes\n**Message:** {{message}}\n**Count:** {{count}}',
        resolution: '✅ **RESOLVED** - {{severity}} Error in {{service}}\n**Message:** {{message}}\n**Resolved by:** {{resolvedBy}}\n**Resolution time:** {{resolutionTime}}'
      }
    };

    return {
      ...defaultConfig,
      ...config,
      rateLimits: { ...defaultConfig.rateLimits, ...config.rateLimits },
      templates: { ...defaultConfig.templates, ...config.templates }
    };
  }

  /**
   * Get alert history
   * @param filters - Optional filters
   * @returns Array of alert statuses
   */
  getAlertHistory(filters?: {
    errorId?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): AlertStatus[] {
    let alerts = Array.from(this.alertHistory.values());

    if (filters) {
      if (filters.errorId) {
        alerts = alerts.filter(a => a.errorId === filters.errorId);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.from && filters.to) {
        alerts = alerts.filter(a => 
          a.sentAt && a.sentAt >= filters.from! && a.sentAt <= filters.to!
        );
      }
    }

    return alerts.sort((a, b) => {
      const aTime = a.sentAt || a.lastAttempt || new Date(0);
      const bTime = b.sentAt || b.lastAttempt || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
  }

  /**
   * Update alert configuration
   * @param newConfig - New configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = this.mergeWithDefaultConfig({
      ...this.config,
      ...newConfig
    });
  }

  /**
   * Get current configuration
   * @returns Current alert configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Check if an alert should be sent for an error
   * @param error - Error report to check
   * @returns Whether alert should be sent
   */
  shouldSendAlert(error: SlackErrorReport): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Check if there are matching rules
    const matchingRules = this.getMatchingRules(error);
    if (matchingRules.length === 0) {
      return false;
    }

    // Check rate limits
    if (this.isRateLimited(error)) {
      return false;
    }

    return true;
  }

  /**
   * Clean up expired timers and trackers
   */
  cleanup(): void {
    // Clear all escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    // Clean up old rate limit trackers
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    for (const [key, tracker] of this.rateLimitTracker.entries()) {
      if (tracker.resetTime < oneDayAgo) {
        this.rateLimitTracker.delete(key);
      }
    }
  }
}