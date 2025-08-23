/**
 * @ai-metadata
 * @component: SlackAppManifestService
 * @description: High-level service for Slack app manifest management with templates, deployment, backup, and rollback capabilities
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-app-manifest-service.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "deployFromTemplate": "allow", "updateAppConfig": "allow", "backupAppConfig": "allow", "rollbackAppConfig": "allow", "getAppBackups": "read-only", "hasBackup": "read-only", "getTemplates": "read-only", "validateAppConfiguration": "read-only", "checkPermissions": "read-only" }
 * @dependencies: ["../../../../types/index.js", "./slack-api-client.js", "./slack-app-manifest-client.js"]
 * @tests: ["./tests/slack-app-manifest-service.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Service layer for Slack app manifest operations with advanced features like templating, backup/restore, and deployment management. Critical for app lifecycle management."
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

import { Env } from '../../../../types/index.js';
import { SlackApiClient } from './slack-api-client.js';
import { 
  SlackAppManifestClient, 
  SlackAppManifest, 
  SlackAppConfig, 
  AppManifestResponse, 
  ManifestValidationResult 
} from './slack-app-manifest-client.js';
import { URLBuilder } from '../../../../utils/url-builder.js';

/**
 * App configuration template options
 */
export interface AppConfigTemplate {
  name: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    socketMode?: boolean;
    tokenRotation?: boolean;
    interactivity?: boolean;
    eventSubscriptions?: boolean;
    slashCommands?: boolean;
    shortcuts?: boolean;
    workflowSteps?: boolean;
  };
  urls: {
    requestUrl?: string;
    redirectUrls?: string[];
  };
  scopes: {
    bot: string[];
    user?: string[];
  };
  events: {
    bot?: string[];
    user?: string[];
  };
}

/**
 * App deployment configuration
 */
export interface AppDeploymentConfig {
  appId?: string;
  manifest: SlackAppManifest;
  validateBeforeUpdate: boolean;
  backupCurrentConfig: boolean;
  rollbackOnFailure: boolean;
}

/**
 * App backup information
 */
export interface AppBackup {
  appId: string;
  timestamp: string;
  manifest: SlackAppManifest;
  version: string;
}

/**
 * Slack App Manifest Service
 * High-level service for managing Slack app configurations programmatically
 */
export class SlackAppManifestService {
  private manifestClient: SlackAppManifestClient;
  private env: Env;
  private backups: Map<string, AppBackup[]> = new Map();

  constructor(env: Env, apiClient?: SlackApiClient) {
    this.env = env;
    this.manifestClient = new SlackAppManifestClient(env, apiClient);
  }

  /**
   * Deploy app configuration from template
   */
  async deployFromTemplate(template: AppConfigTemplate, appId?: string, request?: Request): Promise<AppManifestResponse> {
    try {
      console.log(`🚀 Deploying app configuration: ${template.name}`);
      
      // Generate manifest from template
      const manifest = this.generateManifestFromTemplate(template, request);
      
      // Validate manifest first
      const validation = await this.manifestClient.validateManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Manifest validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Manifest validation warnings:', validation.warnings);
      }
      
      let result: AppManifestResponse;
      
      if (appId) {
        // Update existing app
        console.log(`📝 Updating existing app: ${appId}`);
        
        // Backup current configuration
        await this.backupAppConfig(appId);
        
        result = await this.manifestClient.updateApp(appId, manifest);
      } else {
        // Create new app
        console.log('🆕 Creating new app from manifest');
        result = await this.manifestClient.createApp(manifest);
      }
      
      if (result.ok) {
        console.log(`✅ App deployment successful: ${result.app_id}`);
      } else {
        console.error('❌ App deployment failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to deploy app from template:', error);
      throw error;
    }
  }

  /**
   * Update app configuration with incremental changes
   */
  async updateAppConfig(appId: string, updates: Partial<SlackAppManifest>, options: {
    validateFirst?: boolean;
    backupFirst?: boolean;
    rollbackOnFailure?: boolean;
  } = {}): Promise<AppManifestResponse> {
    const { validateFirst = true, backupFirst = true, rollbackOnFailure = true } = options;
    
    try {
      console.log(`🔄 Updating app configuration: ${appId}`);
      
      // Get current configuration
      const currentConfig = await this.manifestClient.getAppConfig(appId);
      
      // Backup current configuration if requested
      if (backupFirst) {
        await this.backupAppConfig(appId, currentConfig.manifest);
      }
      
      // Merge updates with current manifest
      const updatedManifest = this.manifestClient.mergeManifestUpdates(currentConfig.manifest, updates);
      
      // Validate updated manifest if requested
      if (validateFirst) {
        const validation = await this.manifestClient.validateManifest(updatedManifest);
        if (!validation.valid) {
          throw new Error(`Updated manifest validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Updated manifest validation warnings:', validation.warnings);
        }
      }
      
      // Apply updates
      const result = await this.manifestClient.updateApp(appId, updatedManifest);
      
      if (result.ok) {
        console.log(`✅ App configuration updated successfully: ${appId}`);
      } else {
        console.error('❌ App configuration update failed:', result.error);
        
        // Rollback if requested and we have a backup
        if (rollbackOnFailure && this.hasBackup(appId)) {
          console.log('🔄 Rolling back to previous configuration...');
          await this.rollbackAppConfig(appId);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to update app configuration:', error);
      
      // Rollback on error if requested
      if (rollbackOnFailure && this.hasBackup(appId)) {
        console.log('🔄 Rolling back due to error...');
        try {
          await this.rollbackAppConfig(appId);
        } catch (rollbackError) {
          console.error('Failed to rollback app configuration:', rollbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Backup current app configuration
   */
  async backupAppConfig(appId: string, manifest?: SlackAppManifest): Promise<AppBackup> {
    try {
      let currentManifest = manifest;
      
      if (!currentManifest) {
        const config = await this.manifestClient.getAppConfig(appId);
        currentManifest = config.manifest;
      }
      
      const backup: AppBackup = {
        appId,
        timestamp: new Date().toISOString(),
        manifest: currentManifest,
        version: currentManifest._metadata?.major_version + '.' + currentManifest._metadata?.minor_version || '1.0'
      };
      
      // Store backup
      if (!this.backups.has(appId)) {
        this.backups.set(appId, []);
      }
      
      const appBackups = this.backups.get(appId)!;
      appBackups.push(backup);
      
      // Keep only last 10 backups
      if (appBackups.length > 10) {
        appBackups.splice(0, appBackups.length - 10);
      }
      
      console.log(`💾 App configuration backed up: ${appId} (${backup.version})`);
      return backup;
    } catch (error) {
      console.error('Failed to backup app configuration:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous app configuration
   */
  async rollbackAppConfig(appId: string, backupIndex: number = -1): Promise<AppManifestResponse> {
    try {
      const appBackups = this.backups.get(appId);
      if (!appBackups || appBackups.length === 0) {
        throw new Error(`No backups available for app: ${appId}`);
      }
      
      // Get backup (default to most recent)
      const backup = backupIndex >= 0 ? appBackups[backupIndex] : appBackups[appBackups.length - 1];
      
      console.log(`🔄 Rolling back app configuration: ${appId} to ${backup.version} (${backup.timestamp})`);
      
      const result = await this.manifestClient.updateApp(appId, backup.manifest);
      
      if (result.ok) {
        console.log(`✅ App configuration rollback successful: ${appId}`);
      } else {
        console.error('❌ App configuration rollback failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to rollback app configuration:', error);
      throw error;
    }
  }

  /**
   * List available backups for an app
   */
  getAppBackups(appId: string): AppBackup[] {
    return this.backups.get(appId) || [];
  }

  /**
   * Check if app has backups
   */
  hasBackup(appId: string): boolean {
    const backups = this.backups.get(appId);
    return backups !== undefined && backups.length > 0;
  }

  /**
   * Generate manifest from template
   */
  private generateManifestFromTemplate(template: AppConfigTemplate, request?: Request): SlackAppManifest {
    const botEvents = template.events.bot || [];
    const userEvents = template.events.user || [];
    
    // Add default events based on features
    if (template.features.eventSubscriptions) {
      if (!botEvents.includes('app_mention')) botEvents.push('app_mention');
      if (!botEvents.includes('message.channels')) botEvents.push('message.channels');
    }
    
    const slashCommands = template.features.slashCommands ? [
      {
        command: '/taskgenie',
        description: 'TaskGenie AI assistant for ticket management',
        usage_hint: 'help | summarize | create-task'
      }
    ] : [];
    
    return this.manifestClient.generateDefaultManifest(
      template.name,
      template.description,
      {
        botDisplayName: template.name,
        redirectUrls: template.urls.redirectUrls,
        requestUrl: template.urls.requestUrl,
        socketModeEnabled: template.features.socketMode,
        tokenRotationEnabled: template.features.tokenRotation,
        botScopes: template.scopes.bot,
        userScopes: template.scopes.user,
        slashCommands,
        botEvents,
        userEvents
      }
    );
  }



  /**
   * Get predefined templates for common app configurations
   */
  getTemplates(request?: Request): Record<string, AppConfigTemplate> {
    const urlBuilder = new URLBuilder({ env: this.env, request });
    const workerUrl = urlBuilder.getWorkerBaseUrl();
    
    return {
      development: {
        name: 'TaskGenie Development',
        description: 'Development environment for TaskGenie Slack app',
        environment: 'development',
        features: {
          socketMode: true,
          tokenRotation: false,
          interactivity: true,
          eventSubscriptions: true,
          slashCommands: true,
          shortcuts: false,
          workflowSteps: false
        },
        urls: {
          requestUrl: urlBuilder.getSlackEventsUrl(),
          redirectUrls: [urlBuilder.getSlackAuthCallbackUrl()]
        },
        scopes: {
          bot: [
            'app_mentions:read',
            'channels:read',
            'chat:write',
            'commands',
            'groups:read',
            'im:read',
            'mpim:read',
            'reactions:read',
            'team:read',
            'users:read'
          ]
        },
        events: {
          bot: [
            'app_mention',
            'message.channels',
            'message.groups',
            'message.im',
            'message.mpim',
            'team_join',
            'member_joined_channel',
            'reaction_added'
          ]
        }
      },
      production: {
        name: 'TaskGenie',
        description: 'AI-powered task management assistant for Slack',
        environment: 'production',
        features: {
          socketMode: false,
          tokenRotation: true,
          interactivity: true,
          eventSubscriptions: true,
          slashCommands: true,
          shortcuts: true,
          workflowSteps: true
        },
        urls: {
          requestUrl: urlBuilder.getSlackEventsUrl(),
          redirectUrls: [urlBuilder.getSlackAuthCallbackUrl()]
        },
        scopes: {
          bot: [
            'app_mentions:read',
            'bookmarks:read',
            'channels:read',
            'chat:write',
            'commands',
            'files:read',
            'groups:read',
            'im:read',
            'mpim:read',
            'pins:read',
            'reactions:read',
            'team:read',
            'users:read',
            'workflow.steps:execute'
          ]
        },
        events: {
          bot: [
            'app_mention',
            'message.channels',
            'message.groups',
            'message.im',
            'message.mpim',
            'team_join',
            'member_joined_channel',
            'channel_created',
            'file_shared',
            'reaction_added'
          ]
        }
      },
      minimal: {
        name: 'TaskGenie Minimal',
        description: 'Minimal TaskGenie configuration for basic functionality',
        environment: 'development',
        features: {
          socketMode: true,
          tokenRotation: false,
          interactivity: false,
          eventSubscriptions: true,
          slashCommands: true,
          shortcuts: false,
          workflowSteps: false
        },
        urls: {},
        scopes: {
          bot: [
            'app_mentions:read',
            'chat:write',
            'commands'
          ]
        },
        events: {
          bot: ['app_mention']
        }
      }
    };
  }

  /**
   * Validate app configuration against best practices
   */
  async validateAppConfiguration(appId: string): Promise<{
    valid: boolean;
    issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }>;
    recommendations: string[];
  }> {
    try {
      const config = await this.manifestClient.getAppConfig(appId);
      const manifest = config.manifest;
      const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }> = [];
      const recommendations: string[] = [];
      
      // Check for security best practices
      if (!manifest.settings.token_rotation_enabled) {
        issues.push({
          severity: 'warning',
          message: 'Token rotation is not enabled. Consider enabling for enhanced security.'
        });
        recommendations.push('Enable token rotation for production apps');
      }
      
      // Check for Socket Mode in production
      if (manifest.settings.socket_mode_enabled && manifest.settings.event_subscriptions?.request_url) {
        issues.push({
          severity: 'info',
          message: 'Both Socket Mode and HTTP events are configured. Consider using one approach.'
        });
        recommendations.push('Use Socket Mode for development, HTTP events for production');
      }
      
      // Check for minimal required scopes
      const botScopes = manifest.oauth_config.scopes.bot || [];
      if (!botScopes.includes('chat:write')) {
        issues.push({
          severity: 'error',
          message: 'Missing required scope: chat:write'
        });
      }
      
      // Check for overly broad scopes
      const broadScopes = ['admin', 'admin.apps:read', 'admin.apps:write'];
      const hasBroadScopes = botScopes.some(scope => broadScopes.includes(scope));
      if (hasBroadScopes) {
        issues.push({
          severity: 'warning',
          message: 'App has admin-level scopes. Ensure these are necessary.'
        });
        recommendations.push('Use minimal required scopes for better security');
      }
      
      return {
        valid: !issues.some(issue => issue.severity === 'error'),
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Failed to validate app configuration:', error);
      return {
        valid: false,
        issues: [{
          severity: 'error',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        recommendations: []
      };
    }
  }

  /**
   * Check manifest permissions
   */
  async checkPermissions(): Promise<{ hasPermissions: boolean; missingScopes: string[] }> {
    return this.manifestClient.checkManifestPermissions();
  }
}