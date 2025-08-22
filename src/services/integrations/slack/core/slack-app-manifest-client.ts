/**
 * @ai-metadata
 * @component: SlackAppManifestClient
 * @description: Client for managing Slack app manifests including creation, updates, validation, and configuration management
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-app-manifest-client.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "createApp": "allow", "updateApp": "allow", "getAppConfig": "read-only", "validateManifest": "read-only", "deleteApp": "allow", "generateDefaultManifest": "read-only", "mergeManifestUpdates": "allow", "checkManifestPermissions": "read-only" }
 * @dependencies: ["../../../../types/index.js", "./slack-api-client.js"]
 * @tests: ["./tests/slack-app-manifest-client.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Manages Slack app manifest operations for app configuration and deployment. Changes here affect app creation, updates, and permission management."
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

import { Env, SlackApiResponse } from '../../../../types/index.js';
import { SlackApiClient } from './slack-api-client.js';

/**
 * App Manifest structure for Slack apps
 */
export interface SlackAppManifest {
  _metadata?: {
    major_version: number;
    minor_version: number;
  };
  display_information: {
    name: string;
    description: string;
    background_color?: string;
    long_description?: string;
  };
  features: {
    app_home?: {
      home_tab_enabled?: boolean;
      messages_tab_enabled?: boolean;
      messages_tab_read_only_enabled?: boolean;
    };
    bot_user?: {
      display_name: string;
      always_online?: boolean;
    };
    shortcuts?: Array<{
      name: string;
      type: 'message' | 'global';
      callback_id: string;
      description: string;
    }>;
    slash_commands?: Array<{
      command: string;
      description: string;
      usage_hint?: string;
      should_escape?: boolean;
    }>;
    unfurl_domains?: string[];
    workflow_steps?: Array<{
      name: string;
      callback_id: string;
    }>;
  };
  oauth_config: {
    redirect_urls?: string[];
    scopes: {
      user?: string[];
      bot: string[];
    };
  };
  settings: {
    event_subscriptions?: {
      request_url?: string;
      bot_events?: string[];
      user_events?: string[];
    };
    interactivity?: {
      is_enabled: boolean;
      request_url?: string;
      message_menu_options_url?: string;
    };
    org_deploy_enabled?: boolean;
    socket_mode_enabled?: boolean;
    token_rotation_enabled?: boolean;
  };
}

/**
 * App configuration response from Slack API
 */
export interface SlackAppConfig {
  app_id: string;
  manifest: SlackAppManifest;
  oauth_authorize_url?: string;
  verification_token?: string;
}

/**
 * App Manifest API response
 */
export interface AppManifestResponse {
  ok: boolean;
  app_id?: string;
  manifest?: SlackAppManifest;
  oauth_authorize_url?: string;
  verification_token?: string;
  error?: string;
  errors?: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
}

/**
 * App Manifest validation result
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
}

/**
 * Slack App Manifest API client for programmatic app configuration
 * Provides methods to create, update, validate, and manage Slack app manifests
 */
export class SlackAppManifestClient {
  private apiClient: SlackApiClient;
  private env: Env;

  constructor(env: Env, apiClient?: SlackApiClient) {
    this.env = env;
    this.apiClient = apiClient || new SlackApiClient(env);
  }

  /**
   * Create a new app from manifest
   */
  async createApp(manifest: SlackAppManifest): Promise<AppManifestResponse> {
    try {
      const response = await this.apiClient.makeAppManifestRequest('apps.manifest.create', {
        manifest: JSON.stringify(manifest)
      });

      return response as AppManifestResponse;
    } catch (error) {
      console.error('Failed to create app from manifest:', error);
      throw new Error(`App creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing app's manifest
   */
  async updateApp(appId: string, manifest: SlackAppManifest): Promise<AppManifestResponse> {
    try {
      const response = await this.apiClient.makeAppManifestRequest('apps.manifest.update', {
        app_id: appId,
        manifest: JSON.stringify(manifest)
      });

      return response as AppManifestResponse;
    } catch (error) {
      console.error('Failed to update app manifest:', error);
      throw new Error(`App update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current app configuration
   */
  async getAppConfig(appId: string): Promise<SlackAppConfig> {
    try {
      const response = await this.apiClient.makeAppManifestRequest('apps.manifest.export', {
        app_id: appId
      });

      if (!response.ok) {
        throw new Error(`Failed to get app config: ${response.error}`);
      }

      const manifestResponse = response as SlackApiResponse & {
        manifest?: SlackAppManifest;
        oauth_authorize_url?: string;
        verification_token?: string;
      };

      return {
        app_id: appId,
        manifest: manifestResponse.manifest,
        oauth_authorize_url: manifestResponse.oauth_authorize_url,
        verification_token: manifestResponse.verification_token
      };
    } catch (error) {
      console.error('Failed to get app configuration:', error);
      throw new Error(`Get app config failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a manifest without creating/updating an app
   */
  async validateManifest(manifest: SlackAppManifest): Promise<ManifestValidationResult> {
    try {
      const response = await this.apiClient.makeAppManifestRequest('apps.manifest.validate', {
        manifest: JSON.stringify(manifest)
      });

      const validationResponse = response as SlackApiResponse & {
        errors?: Array<{ code: string; message: string; path?: string }>;
        warnings?: Array<{ code: string; message: string; path?: string }>;
      };

      return {
        valid: response.ok,
        errors: validationResponse.errors || [],
        warnings: validationResponse.warnings || []
      };
    } catch (error) {
      console.error('Failed to validate manifest:', error);
      return {
        valid: false,
        errors: [{
          code: 'validation_error',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Delete an app (requires app_configurations:write scope)
   */
  async deleteApp(appId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await this.apiClient.makeAppManifestRequest('apps.manifest.delete', {
        app_id: appId
      });

      return { ok: response.ok, error: response.error };
    } catch (error) {
      console.error('Failed to delete app:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a default manifest template
   */
  generateDefaultManifest(appName: string, description: string, options: {
    botDisplayName?: string;
    redirectUrls?: string[];
    requestUrl?: string;
    socketModeEnabled?: boolean;
    tokenRotationEnabled?: boolean;
    botScopes?: string[];
    userScopes?: string[];
    slashCommands?: Array<{ command: string; description: string; usage_hint?: string }>;
    botEvents?: string[];
    userEvents?: string[];
  } = {}): SlackAppManifest {
    const {
      botDisplayName = appName,
      redirectUrls = [],
      requestUrl,
      socketModeEnabled = false,
      tokenRotationEnabled = false,
      botScopes = ['chat:write', 'app_mentions:read', 'channels:read', 'groups:read', 'im:read', 'mpim:read'],
      userScopes = [],
      slashCommands = [],
      botEvents = ['app_mention', 'message.channels', 'message.groups', 'message.im', 'message.mpim'],
      userEvents = []
    } = options;

    const manifest: SlackAppManifest = {
      _metadata: {
        major_version: 1,
        minor_version: 1
      },
      display_information: {
        name: appName,
        description: description
      },
      features: {
        bot_user: {
          display_name: botDisplayName,
          always_online: false
        }
      },
      oauth_config: {
        scopes: {
          bot: botScopes
        }
      },
      settings: {
        socket_mode_enabled: socketModeEnabled,
        token_rotation_enabled: tokenRotationEnabled
      }
    };

    // Add user scopes if provided
    if (userScopes.length > 0) {
      manifest.oauth_config.scopes.user = userScopes;
    }

    // Add redirect URLs if provided
    if (redirectUrls.length > 0) {
      manifest.oauth_config.redirect_urls = redirectUrls;
    }

    // Add slash commands if provided
    if (slashCommands.length > 0) {
      manifest.features.slash_commands = slashCommands;
    }

    // Add event subscriptions if events or request URL provided
    if (botEvents.length > 0 || userEvents.length > 0 || requestUrl) {
      manifest.settings.event_subscriptions = {};
      
      if (requestUrl) {
        manifest.settings.event_subscriptions.request_url = requestUrl;
      }
      
      if (botEvents.length > 0) {
        manifest.settings.event_subscriptions.bot_events = botEvents;
      }
      
      if (userEvents.length > 0) {
        manifest.settings.event_subscriptions.user_events = userEvents;
      }
    }

    // Add interactivity if request URL provided
    if (requestUrl) {
      manifest.settings.interactivity = {
        is_enabled: true,
        request_url: requestUrl
      };
    }

    return manifest;
  }

  /**
   * Merge manifest updates with existing configuration
   */
  mergeManifestUpdates(currentManifest: SlackAppManifest, updates: Partial<SlackAppManifest>): SlackAppManifest {
    const merged = JSON.parse(JSON.stringify(currentManifest)) as SlackAppManifest;

    // Deep merge logic for manifest updates
    if (updates.display_information) {
      merged.display_information = { ...merged.display_information, ...updates.display_information };
    }

    if (updates.features) {
      merged.features = { ...merged.features, ...updates.features };
      
      if (updates.features.bot_user) {
        merged.features.bot_user = { ...merged.features.bot_user, ...updates.features.bot_user };
      }
      
      if (updates.features.slash_commands) {
        merged.features.slash_commands = updates.features.slash_commands;
      }
    }

    if (updates.oauth_config) {
      merged.oauth_config = { ...merged.oauth_config, ...updates.oauth_config };
      
      if (updates.oauth_config.scopes) {
        merged.oauth_config.scopes = { ...merged.oauth_config.scopes, ...updates.oauth_config.scopes };
      }
    }

    if (updates.settings) {
      merged.settings = { ...merged.settings, ...updates.settings };
      
      if (updates.settings.event_subscriptions) {
        merged.settings.event_subscriptions = {
          ...merged.settings.event_subscriptions,
          ...updates.settings.event_subscriptions
        };
      }
      
      if (updates.settings.interactivity) {
        merged.settings.interactivity = {
          ...merged.settings.interactivity,
          ...updates.settings.interactivity
        };
      }
    }

    return merged;
  }

  /**
   * Check if app has required scopes for manifest operations
   */
  async checkManifestPermissions(): Promise<{ hasPermissions: boolean; missingScopes: string[] }> {
    try {
      // Test if we can access app configurations
      const testResult = await this.apiClient.testConnection();
      
      if (!testResult) {
        return {
          hasPermissions: false,
          missingScopes: ['app_configurations:read', 'app_configurations:write']
        };
      }

      // For now, we assume if auth.test passes, we have basic permissions
      // In a real implementation, you'd check the actual scopes returned
      return {
        hasPermissions: true,
        missingScopes: []
      };
    } catch (error) {
      console.error('Failed to check manifest permissions:', error);
      return {
        hasPermissions: false,
        missingScopes: ['app_configurations:read', 'app_configurations:write']
      };
    }
  }
}