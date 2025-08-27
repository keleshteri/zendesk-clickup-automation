/**
 * @ai-metadata
 * @component: ZendeskAuthenticationModule
 * @description: Zendesk-specific authentication and credential validation
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/zendesk-auth.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/env.ts", "../../../utils/error-logger.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Handles Zendesk API authentication, credential validation, and security"
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
import { Env } from '../../../types/env';
import { AuthenticationError } from '../../../middleware/error';
import { errorLogger, ErrorSeverity, ErrorCategory } from '../../../utils/error-logger';

/**
 * Interface for Zendesk credential validation result
 */
export interface ZendeskCredentialValidationResult {
  isValid: boolean;
  service: 'zendesk';
  errors: string[];
  warnings?: string[];
  lastValidated?: Date;
}

/**
 * Interface for Zendesk credential requirements
 */
export interface ZendeskCredentialConfig {
  required: string[];
  optional: string[];
}

/**
 * Zendesk credential configuration
 */
export const ZENDESK_CREDENTIAL_CONFIG: ZendeskCredentialConfig = {
  required: ['ZENDESK_DOMAIN', 'ZENDESK_EMAIL', 'ZENDESK_TOKEN'],
  optional: ['ZENDESK_SUBDOMAIN', 'ZENDESK_WEBHOOK_SECRET']
};

/**
 * Validate Zendesk API credentials
 * 
 * Performs comprehensive validation of Zendesk credentials including:
 * - Required environment variable checks
 * - Format validation for email and domain
 * - API connectivity testing
 * - Optional credential warnings
 * 
 * @param env - Environment configuration containing Zendesk credentials
 * @returns Promise resolving to validation result with detailed feedback
 */
export async function validateZendeskCredentials(env: Env): Promise<ZendeskCredentialValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required credentials
  if (!env.ZENDESK_DOMAIN && !env.ZENDESK_SUBDOMAIN) {
    errors.push('Either ZENDESK_DOMAIN or ZENDESK_SUBDOMAIN is required');
  } else {
    const domain = env.ZENDESK_DOMAIN || env.ZENDESK_SUBDOMAIN;
    if (domain && !/^[a-zA-Z0-9-]+(\.zendesk\.com)?$/.test(domain)) {
      errors.push('ZENDESK_DOMAIN/ZENDESK_SUBDOMAIN contains invalid characters');
    }
  }
  
  if (!env.ZENDESK_EMAIL) {
    errors.push('ZENDESK_EMAIL is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ZENDESK_EMAIL)) {
    errors.push('ZENDESK_EMAIL format is invalid');
  }
  
  if (!env.ZENDESK_TOKEN && !env.ZENDESK_API_TOKEN) {
    errors.push('Either ZENDESK_TOKEN or ZENDESK_API_TOKEN is required');
  } else {
    const token = env.ZENDESK_TOKEN || env.ZENDESK_API_TOKEN;
    if (token && token.length < 10) {
      errors.push('Zendesk API token appears to be too short');
    }
  }
  
  // Check optional but recommended credentials
  if (!env.ZENDESK_WEBHOOK_SECRET) {
    warnings.push('ZENDESK_WEBHOOK_SECRET is not configured - webhook signature verification will be skipped');
  }
  
  // Test API connectivity if all required credentials are present
  if (errors.length === 0) {
    try {
      const domain = env.ZENDESK_DOMAIN || env.ZENDESK_SUBDOMAIN;
      const finalDomain = domain?.includes('.zendesk.com') ? domain : `${domain}.zendesk.com`;
      const testUrl = `https://${finalDomain}/api/v2/users/me.json`;
      const token = env.ZENDESK_TOKEN || env.ZENDESK_API_TOKEN;
      const auth = btoa(`${env.ZENDESK_EMAIL}/token:${token}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          errors.push('Zendesk API authentication failed - check email and API token');
        } else if (response.status === 403) {
          errors.push('Zendesk API access forbidden - check user permissions');
        } else {
          errors.push(`Zendesk API test failed with status ${response.status}`);
        }
      }
    } catch (error) {
      errors.push(`Zendesk API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    service: 'zendesk',
    errors,
    warnings,
    lastValidated: new Date()
  };
}

/**
 * Create Zendesk authentication header
 * 
 * Generates the Basic authentication header for Zendesk API requests
 * using the email and API token from environment variables.
 * 
 * @param env - Environment configuration
 * @returns Base64 encoded authentication header
 * @throws {Error} When required credentials are missing
 */
export function createZendeskAuthHeader(env: Env): string {
  const email = env.ZENDESK_EMAIL;
  const token = env.ZENDESK_TOKEN || env.ZENDESK_API_TOKEN;
  
  if (!email || !token) {
    throw new Error('Zendesk email and token are required for authentication');
  }
  
  return `Basic ${btoa(`${email}/token:${token}`)}`;
}

/**
 * Get Zendesk API base URL
 * 
 * Constructs the base URL for Zendesk API calls using the domain
 * from environment variables.
 * 
 * @param env - Environment configuration
 * @returns Zendesk API base URL
 * @throws {Error} When domain is not configured
 */
export function getZendeskBaseUrl(env: Env): string {
  const domain = env.ZENDESK_DOMAIN || env.ZENDESK_SUBDOMAIN;
  
  if (!domain) {
    throw new Error('Zendesk domain is required');
  }
  
  const finalDomain = domain.includes('.zendesk.com') ? domain : `${domain}.zendesk.com`;
  return `https://${finalDomain}/api/v2`;
}

/**
 * Middleware for Zendesk credential validation
 * 
 * Validates Zendesk credentials before processing requests and stores
 * validation results in the request context for later use.
 * 
 * @returns Hono middleware handler
 */
export function validateZendeskCredentialsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context, next: Next) => {
    const env = c.env;
    
    try {
      const result = await validateZendeskCredentials(env);
      
      if (!result.isValid) {
        // Log credential validation failure
        await errorLogger.logError(
          new AuthenticationError(`Zendesk credential validation failed: ${result.errors.join(', ')}`),
          ErrorSeverity.HIGH,
          ErrorCategory.AUTHENTICATION,
          {
            request: c,
            operation: 'zendesk_credential_validation',
            metadata: {
              service: 'zendesk',
              errors: result.errors,
              warnings: result.warnings
            }
          }
        );
        
        throw new AuthenticationError(
          `Zendesk credentials are invalid or missing: ${result.errors.join(', ')}`
        );
      }
      
      // Log warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn(`⚠️  Zendesk credential warnings:`, result.warnings);
      }
      
      // Store validation result in context
      c.set('zendeskCredentialValidation', result);
      
      console.log(`✅ Zendesk credential validation passed`);
      
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
          operation: 'zendesk_credential_validation_error',
          metadata: {
            service: 'zendesk'
          }
        }
      );
      
      throw new AuthenticationError(
        `Zendesk credential validation failed due to internal error: ${err.message}`
      );
    }
  };
}

/**
 * Helper function to get Zendesk credential validation results from context
 * 
 * @param c - Hono context
 * @returns Zendesk credential validation result or null if not available
 */
export function getZendeskCredentialValidationResult(c: Context): ZendeskCredentialValidationResult | null {
  return c.get('zendeskCredentialValidation') || null;
}

/**
 * Helper function to check if Zendesk credentials are valid in context
 * 
 * @param c - Hono context
 * @returns True if Zendesk credentials are valid, false otherwise
 */
export function isZendeskCredentialValid(c: Context): boolean {
  const result = getZendeskCredentialValidationResult(c);
  return result?.isValid || false;
}

/**
 * Verify Zendesk webhook signature
 * 
 * Validates the authenticity of incoming Zendesk webhooks by verifying
 * the HMAC-SHA256 signature against the configured webhook secret.
 * 
 * @param body - Raw request body
 * @param signature - Webhook signature from headers
 * @param timestamp - Webhook timestamp from headers
 * @param secret - Webhook secret from environment
 * @returns Promise resolving to true if signature is valid
 */
export async function verifyZendeskWebhookSignature(
  body: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  try {
    if (!secret) {
      console.error('❌ Zendesk webhook secret not configured');
      return false;
    }

    // Check timestamp to prevent replay attacks (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    if (Math.abs(currentTime - requestTime) > 300) {
      console.error('❌ Zendesk webhook timestamp too old');
      return false;
    }

    // Create the signature base string
    const baseString = `${timestamp}${body}`;
    
    // Create HMAC-SHA256 hash
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(baseString)
    );
    
    // Convert to base64 string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    
    // Compare signatures
    const isValid = signature === hashBase64;
    
    if (!isValid) {
      console.error('❌ Invalid Zendesk webhook signature');
      console.error('Expected:', hashBase64);
      console.error('Received:', signature);
    }
    
    return isValid;
  } catch (error) {
    console.error('💥 Error verifying Zendesk webhook:', error);
    return false;
  }
}