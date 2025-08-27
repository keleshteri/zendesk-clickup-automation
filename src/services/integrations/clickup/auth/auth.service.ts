/**
 * @ai-metadata
 * @component: ClickUpAuthenticationModule
 * @description: ClickUp-specific authentication and credential validation
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/clickup-auth.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/env.ts", "../../../utils/error-logger.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Handles ClickUp API authentication, credential validation, and OAuth flow"
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

import { Context, Next } from 'hono';
import { MiddlewareHandler } from 'hono';
import { Env } from '../../../../types/env';
import { AuthenticationError } from '../../../../middleware/error';
import { errorLogger, ErrorSeverity, ErrorCategory } from '../../../../utils/error-logger';

/**
 * Interface for ClickUp credential validation result
 */
export interface ClickUpCredentialValidationResult {
  isValid: boolean;
  service: 'clickup';
  errors: string[];
  warnings?: string[];
  authType?: 'oauth' | 'api_token';
  lastValidated?: Date;
}

/**
 * Interface for ClickUp credential requirements
 */
export interface ClickUpCredentialConfig {
  required: string[];
  optional: string[];
  oauth: string[];
}

/**
 * ClickUp credential configuration
 */
export const CLICKUP_CREDENTIAL_CONFIG: ClickUpCredentialConfig = {
  required: [], // Either OAuth or API token is required
  optional: ['CLICKUP_TEAM_ID', 'CLICKUP_SPACE_ID', 'CLICKUP_LIST_ID'],
  oauth: ['CLICKUP_CLIENT_ID', 'CLICKUP_CLIENT_SECRET', 'CLICKUP_REDIRECT_URI']
};

/**
 * Validate ClickUp API credentials
 * 
 * Performs comprehensive validation of ClickUp credentials including:
 * - OAuth configuration checks
 * - API token validation
 * - API connectivity testing
 * - Configuration completeness warnings
 * 
 * @param env - Environment configuration containing ClickUp credentials
 * @returns Promise resolving to validation result with detailed feedback
 */
export async function validateClickUpCredentials(env: Env): Promise<ClickUpCredentialValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let authType: 'oauth' | 'api_token' | undefined;
  
  // Check for OAuth configuration
  const hasOAuthConfig = env.CLICKUP_CLIENT_ID && env.CLICKUP_CLIENT_SECRET && env.CLICKUP_REDIRECT_URI;
  const hasApiToken = env.CLICKUP_API_TOKEN;
  const hasAccessToken = env.CLICKUP_API_TOKEN;
  
  if (!hasOAuthConfig && !hasApiToken && !hasAccessToken) {
    errors.push('ClickUp authentication requires either OAuth configuration (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) or API_TOKEN/ACCESS_TOKEN');
  } else {
    // Validate OAuth configuration if present
    if (hasOAuthConfig) {
      authType = 'oauth';
      
      if (!env.CLICKUP_CLIENT_ID || env.CLICKUP_CLIENT_ID.length < 10) {
        errors.push('CLICKUP_CLIENT_ID appears to be invalid or too short');
      }
      
      if (!env.CLICKUP_CLIENT_SECRET || env.CLICKUP_CLIENT_SECRET.length < 10) {
        errors.push('CLICKUP_CLIENT_SECRET appears to be invalid or too short');
      }
      
      if (!env.CLICKUP_REDIRECT_URI || !/^https?:\/\/.+/.test(env.CLICKUP_REDIRECT_URI)) {
        errors.push('CLICKUP_REDIRECT_URI must be a valid HTTP/HTTPS URL');
      }
      
      if (!hasAccessToken) {
        warnings.push('OAuth is configured but no ACCESS_TOKEN found - users will need to authenticate');
      }
    }
    
    // Validate API token if present
    if (hasApiToken || hasAccessToken) {
      authType = 'api_token';
      const token = env.CLICKUP_API_TOKEN;
      
      if (token && token.length < 20) {
        errors.push('ClickUp API token appears to be too short');
      }
      
      if (token && !token.startsWith('pk_')) {
        warnings.push('ClickUp API token does not start with "pk_" - ensure you are using a valid API token');
      }
    }
  }
  
  // Check optional configuration
  if (!env.CLICKUP_TEAM_ID) {
    warnings.push('CLICKUP_TEAM_ID is not configured - some operations may require manual team selection');
  }
  
  if (!env.CLICKUP_SPACE_ID) {
    warnings.push('CLICKUP_SPACE_ID is not configured - tasks will be created in default space');
  }
  
  if (!env.CLICKUP_LIST_ID) {
    warnings.push('CLICKUP_LIST_ID is not configured - tasks will be created in default list');
  }
  
  // Test API connectivity if we have a valid token
  if (errors.length === 0 && (hasApiToken || hasAccessToken)) {
    try {
      const token = env.CLICKUP_API_TOKEN;
      const testUrl = 'https://api.clickup.com/api/v2/user';
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': token!,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          errors.push('ClickUp API authentication failed - check API token');
        } else if (response.status === 403) {
          errors.push('ClickUp API access forbidden - check token permissions');
        } else if (response.status === 429) {
          warnings.push('ClickUp API rate limit reached - connectivity test skipped');
        } else {
          errors.push(`ClickUp API test failed with status ${response.status}`);
        }
      }
    } catch (error) {
      errors.push(`ClickUp API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    service: 'clickup',
    errors,
    warnings,
    authType,
    lastValidated: new Date()
  };
}

/**
 * Check if ClickUp has valid authentication
 * 
 * Determines if ClickUp service has valid authentication credentials
 * available, either through OAuth access token or API token.
 * 
 * @param env - Environment configuration
 * @returns True if valid authentication is available
 */
export function hasValidClickUpAuth(env: Env): boolean {
  // Check for OAuth access token
  if (env.CLICKUP_API_TOKEN && env.CLICKUP_API_TOKEN.length > 20) {
    return true;
  }
  
  // Check for API token
  if (env.CLICKUP_API_TOKEN && env.CLICKUP_API_TOKEN.length > 20) {
    return true;
  }
  
  return false;
}

/**
 * Get ClickUp authentication header
 * 
 * Returns the appropriate authorization header for ClickUp API requests
 * based on available credentials (OAuth access token or API token).
 * 
 * @param env - Environment configuration
 * @returns Authorization header value
 * @throws {Error} When no valid authentication is available
 */
export function getClickUpAuthHeader(env: Env): string {
  if (env.CLICKUP_API_TOKEN) {
    return env.CLICKUP_API_TOKEN;
  }
  
  if (env.CLICKUP_API_TOKEN) {
    return env.CLICKUP_API_TOKEN;
  }
  
  throw new Error('No valid ClickUp authentication token available');
}

/**
 * Get ClickUp OAuth authorization URL
 * 
 * Constructs the OAuth authorization URL for ClickUp authentication flow.
 * 
 * @param env - Environment configuration
 * @param state - Optional state parameter for CSRF protection
 * @returns OAuth authorization URL
 * @throws {Error} When OAuth configuration is incomplete
 */
export function getClickUpOAuthUrl(env: Env, state?: string): string {
  if (!env.CLICKUP_CLIENT_ID || !env.CLICKUP_REDIRECT_URI) {
    throw new Error('ClickUp OAuth configuration is incomplete');
  }
  
  const params = new URLSearchParams({
    client_id: env.CLICKUP_CLIENT_ID,
    redirect_uri: env.CLICKUP_REDIRECT_URI,
    response_type: 'code'
  });
  
  if (state) {
    params.set('state', state);
  }
  
  return `https://app.clickup.com/api?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 * 
 * Exchanges the OAuth authorization code for an access token
 * that can be used for API requests.
 * 
 * @param env - Environment configuration
 * @param code - OAuth authorization code
 * @returns Promise resolving to access token response
 * @throws {Error} When token exchange fails
 */
export async function exchangeClickUpOAuthCode(env: Env, code: string): Promise<{
  access_token: string;
  token_type: string;
}> {
  if (!env.CLICKUP_CLIENT_ID || !env.CLICKUP_CLIENT_SECRET) {
    throw new Error('ClickUp OAuth configuration is incomplete');
  }
  
  const response = await fetch('https://api.clickup.com/api/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.CLICKUP_CLIENT_ID,
      client_secret: env.CLICKUP_CLIENT_SECRET,
      code
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClickUp OAuth token exchange failed: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Middleware for ClickUp credential validation
 * 
 * Validates ClickUp credentials before processing requests and stores
 * validation results in the request context for later use.
 * 
 * @returns Hono middleware handler
 */
export function validateClickUpCredentialsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context, next: Next) => {
    const env = c.env;
    
    try {
      const result = await validateClickUpCredentials(env);
      
      if (!result.isValid) {
        // Log credential validation failure
        await errorLogger.logError(
          new AuthenticationError(`ClickUp credential validation failed: ${result.errors.join(', ')}`),
          ErrorSeverity.HIGH,
          ErrorCategory.AUTHENTICATION,
          {
            request: c,
            operation: 'clickup_credential_validation',
            metadata: {
              service: 'clickup',
              errors: result.errors,
              warnings: result.warnings,
              authType: result.authType
            }
          }
        );
        
        throw new AuthenticationError(
          `ClickUp credentials are invalid or missing: ${result.errors.join(', ')}`
        );
      }
      
      // Log warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn(`⚠️  ClickUp credential warnings:`, result.warnings);
      }
      
      // Store validation result in context
      c.set('clickupCredentialValidation', result);
      
      console.log(`✅ ClickUp credential validation passed (${result.authType})`);
      
      await next();
      
    } catch (error) {
      // If it's already an AuthenticationError, re-throw it
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      // Log unexpected validation errors
      const err = error instanceof Error ? error : new Error(String(error));
      await errorLogger.logError(
        err,
        ErrorSeverity.HIGH,
        ErrorCategory.AUTHENTICATION,
        {
          request: c,
          operation: 'clickup_credential_validation_error',
          metadata: {
            service: 'clickup'
          }
        }
      );
      
      throw new AuthenticationError(
        `ClickUp credential validation failed due to internal error: ${err.message}`
      );
    }
  };
}

/**
 * Helper function to get ClickUp credential validation results from context
 * 
 * @param c - Hono context
 * @returns ClickUp credential validation result or null if not available
 */
export function getClickUpCredentialValidationResult(c: Context): ClickUpCredentialValidationResult | null {
  return c.get('clickupCredentialValidation') || null;
}

/**
 * Helper function to check if ClickUp credentials are valid in context
 * 
 * @param c - Hono context
 * @returns True if ClickUp credentials are valid, false otherwise
 */
export function isClickUpCredentialValid(c: Context): boolean {
  const result = getClickUpCredentialValidationResult(c);
  return result?.isValid || false;
}

/**
 * Get ClickUp API base URL
 * 
 * @returns ClickUp API base URL
 */
export function getClickUpBaseUrl(): string {
  return 'https://api.clickup.com/api/v2';
}