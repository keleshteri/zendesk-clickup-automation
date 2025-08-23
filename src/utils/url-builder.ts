/**
 * @ai-metadata
 * @component: URLBuilder
 * @description: Centralized URL building utility for dynamic environment-based URL generation
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Utility for building URLs dynamically based on environment and request context"
 */

import { Env } from '../types/index.js';
import { APP_ENDPOINTS } from '../config/endpoints.js';

/**
 * URL Builder Configuration
 */
export interface URLBuilderConfig {
  env: Env;
  request?: Request;
}

/**
 * URL Builder Service
 * Provides centralized URL generation based on environment and request context
 */
export class URLBuilder {
  private env: Env;
  private request?: Request;

  constructor(config: URLBuilderConfig) {
    this.env = config.env;
    this.request = config.request;
  }

  /**
   * Get the base worker URL
   * Priority: request context > WORKER_BASE_URL env var > environment-based fallback
   */
  getWorkerBaseUrl(): string {
    // Try to get URL from request context first (most reliable)
    if (this.request) {
      try {
        const url = new URL(this.request.url);
        return `${url.protocol}//${url.host}`;
      } catch (error) {
        console.warn('Failed to parse request URL, falling back to environment variables');
      }
    }

    // Try environment variable
    if (this.env.WORKER_BASE_URL) {
      // Ensure URL doesn't end with slash
      return this.env.WORKER_BASE_URL.replace(/\/$/, '');
    }

    // Fallback to environment-based detection
    const environment = this.env.ENVIRONMENT || 'development';
    
    if (environment === 'production') {
      return 'https://zendesk-clickup-automation.mehdi-shaban-keleshteri.workers.dev';
    } else {
      return 'https://zendesk-clickup-automation-dev.mehdi-shaban-keleshteri.workers.dev';
    }
  }

  /**
   * Get Slack events endpoint URL
   */
  getSlackEventsUrl(): string {
    const baseUrl = this.getWorkerBaseUrl();
    const endpoint = this.env.SLACK_EVENTS_ENDPOINT || APP_ENDPOINTS.SLACK_EVENTS;
    return `${baseUrl}${this.normalizeEndpoint(endpoint)}`;
  }

  /**
   * Get Slack OAuth callback URL
   */
  getSlackAuthCallbackUrl(): string {
    const baseUrl = this.getWorkerBaseUrl();
    const endpoint = this.env.SLACK_AUTH_CALLBACK_ENDPOINT || '/auth/slack/callback';
    return `${baseUrl}${this.normalizeEndpoint(endpoint)}`;
  }

  /**
   * Normalize endpoint to ensure it starts with /
   */
  private normalizeEndpoint(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  /**
   * Get ClickUp OAuth callback URL
   */
  getClickUpAuthCallbackUrl(): string {
    const baseUrl = this.getWorkerBaseUrl();
    return `${baseUrl}/auth/clickup/callback`;
  }

  /**
   * Build a complete URL for any endpoint
   */
  buildUrl(endpoint: string): string {
    const baseUrl = this.getWorkerBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Get webhook URLs for external services
   */
  getWebhookUrls() {
    const baseUrl = this.getWorkerBaseUrl();
    return {
      zendesk: `${baseUrl}${APP_ENDPOINTS.WEBHOOK_ZENDESK}`,
      clickup: `${baseUrl}${APP_ENDPOINTS.WEBHOOK_CLICKUP}`,
      slack: {
        events: this.getSlackEventsUrl(),
        commands: `${baseUrl}${APP_ENDPOINTS.SLACK_COMMANDS}`,
        oauth: `${baseUrl}${APP_ENDPOINTS.SLACK_OAUTH}`,
        install: `${baseUrl}${APP_ENDPOINTS.SLACK_INSTALL}`
      }
    };
  }

  /**
   * Static factory method for quick URL building
   */
  static create(env: Env, request?: Request): URLBuilder {
    return new URLBuilder({ env, request });
  }

  /**
   * Static method to get worker base URL without instantiating the class
   */
  static getWorkerBaseUrl(env: Env, request?: Request): string {
    return URLBuilder.create(env, request).getWorkerBaseUrl();
  }

  /**
   * Static method to get Slack events URL without instantiating the class
   */
  static getSlackEventsUrl(env: Env, request?: Request): string {
    return URLBuilder.create(env, request).getSlackEventsUrl();
  }

  /**
   * Static method to get Slack auth callback URL without instantiating the class
   */
  static getSlackAuthCallbackUrl(env: Env, request?: Request): string {
    return URLBuilder.create(env, request).getSlackAuthCallbackUrl();
  }
}

/**
 * Legacy compatibility function - use URLBuilder.getWorkerBaseUrl instead
 * @deprecated Use URLBuilder.getWorkerBaseUrl instead
 */
export function getWorkerUrl(env: Env, request?: Request): string {
  return URLBuilder.getWorkerBaseUrl(env, request);
}