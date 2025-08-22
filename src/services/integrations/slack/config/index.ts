/**
 * @ai-metadata
 * @component: SlackConfigModule
 * @description: Central configuration module for Slack integration with channel management, templates, and permissions
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-config-module.md
 * @stability: stable
 * @edit-permissions: "full"
 * @method-permissions: { "initialize": "allow", "validateConfigurations": "allow", "getConfigurationSummary": "read-only", "resetToDefaults": "allow" }
 * @dependencies: ["./slack-channels.ts", "./slack-templates.ts", "./slack-permissions.ts"]
 * @tests: ["./tests/slack-config.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core configuration module that orchestrates all Slack integration settings including channels, templates, and permissions. Changes here affect the entire Slack integration system."
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

/**
 * Slack Configuration Module
 * 
 * This module exports all Slack configuration classes and types for:
 * - Channel management and routing
 * - Message templates and formatting
 * - User permissions and access control
 */

// Import classes for internal use
import { SlackChannels } from './slack-channels';
import { SlackTemplates, type MessageTemplate } from './slack-templates';
import { SlackPermissions, type RolePermissions } from './slack-permissions';

// Channel Configuration
export {
  SlackChannels,
  type ChannelConfig,
  type ChannelMapping,
  type TeamChannels
} from './slack-channels';

// Template Configuration
export {
  SlackTemplates,
  type MessageTemplate,
  type TemplateVariables,
  type TemplateCategory
} from './slack-templates';

// Permission Configuration
export {
  SlackPermissions,
  type UserRole,
  type PermissionType,
  type ChannelAccessLevel,
  type UserPermissions,
  type RolePermissions,
  type PermissionCheckResult
} from './slack-permissions';

/**
 * Configuration utilities and helpers
 */
export class SlackConfig {
  /**
   * Initialize all configuration modules
   */
  static initialize(): void {
    // Any initialization logic for configurations
    console.log('Slack configuration modules initialized');
  }

  /**
   * Validate all configurations
   */
  static validateConfigurations(): boolean {
    try {
      // Validate channels
      const channels = Object.values(SlackChannels.DEFAULT_CHANNELS);
      const channelsValid = channels.every(channel => 
        SlackChannels.validateChannelConfig(channel)
      );

      // Validate templates
      const templates = Object.values(SlackTemplates.TEMPLATES) as MessageTemplate[];
      const templatesValid = templates.every(template => 
        template.id && template.name && template.template
      );

      // Validate permissions
      const roles = Object.values(SlackPermissions.ROLE_PERMISSIONS) as RolePermissions[];
      const permissionsValid = roles.every(role => 
        role.role && Array.isArray(role.permissions)
      );

      return channelsValid && templatesValid && permissionsValid;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get configuration summary
   */
  static getConfigurationSummary(): {
    channels: number;
    templates: number;
    roles: number;
    permissions: number;
  } {
    return {
      channels: Object.keys(SlackChannels.DEFAULT_CHANNELS).length,
      templates: Object.keys(SlackTemplates.TEMPLATES).length,
      roles: Object.keys(SlackPermissions.ROLE_PERMISSIONS).length,
      permissions: (Object.values(SlackPermissions.ROLE_PERMISSIONS) as RolePermissions[])
        .reduce((total, role) => total + role.permissions.length, 0)
    };
  }

  /**
   * Reset all configurations to defaults
   */
  static resetToDefaults(): void {
    SlackPermissions.clearCache();
    console.log('Slack configurations reset to defaults');
  }
}