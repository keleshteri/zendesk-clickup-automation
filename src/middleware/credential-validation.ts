/**
 * @ai-metadata
 * @component: CredentialValidationMiddleware
 * @description: Middleware for validating API credentials before processing requests
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/credential-validation.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../utils/error-logger.ts", "../middleware/error.ts"]
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Validates API credentials for external services before processing requests"
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
import { Env } from '../types/env';
import { AuthenticationError, ValidationError } from './error';
import { errorLogger, ErrorSeverity, ErrorCategory } from '../utils/error-logger';

// Import service-specific authentication modules
import { 
  validateZendeskCredentials as validateZendeskCredentialsInternal,
  ZendeskCredentialValidationResult
} from '../services/integrations/zendesk/auth';
import { 
  validateClickUpCredentials as validateClickUpCredentialsInternal,
  ClickUpCredentialValidationResult
} from '../services/integrations/clickup/auth';

/**
 * Interface for credential validation result
 * (Re-exported from service-specific modules for backward compatibility)
 */
export interface CredentialValidationResult {
  isValid: boolean;
  service: string;
  errors: string[];
  warnings?: string[];
  lastValidated?: Date;
  authType?: string; // For ClickUp OAuth vs API token
}

// Type aliases for service-specific results
export type { ZendeskCredentialValidationResult, ClickUpCredentialValidationResult };

/**
 * Interface for service credential requirements
 */
export interface ServiceCredentials {
  zendesk: {
    validation: (env: Env) => Promise<ZendeskCredentialValidationResult>;
  };
  clickup: {
    validation: (env: Env) => Promise<ClickUpCredentialValidationResult>;
  };
}

/**
 * Service credential configurations using service-specific modules
 */
const SERVICE_CREDENTIALS: ServiceCredentials = {
  zendesk: {
    validation: validateZendeskCredentialsInternal
  },
  clickup: {
    validation: validateClickUpCredentialsInternal
  }
};

// Internal validation functions have been moved to service-specific modules:
// - Zendesk validation: ../services/integrations/zendesk/auth.ts
// - ClickUp validation: ../services/integrations/clickup/auth.ts

/**
 * Middleware to validate API credentials for specific services
 */
export function validateCredentials(services: (keyof ServiceCredentials)[]): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context, next: Next) => {
    const env = c.env;
    const validationResults: CredentialValidationResult[] = [];
    
    try {
      // Validate credentials for each requested service
      for (const service of services) {
        const serviceConfig = SERVICE_CREDENTIALS[service];
        if (!serviceConfig) {
          throw new ValidationError(`Unknown service: ${service}`);
        }
        
        const result = await serviceConfig.validation(env);
        validationResults.push(result);
        
        if (!result.isValid) {
          // Log credential validation failure
          await errorLogger.logError(
            new AuthenticationError(`${service} credential validation failed: ${result.errors.join(', ')}`),
            ErrorSeverity.HIGH,
            ErrorCategory.AUTHENTICATION,
            {
              request: c,
              operation: 'credential_validation',
              metadata: {
                service,
                errors: result.errors,
                warnings: result.warnings
              }
            }
          );
          
          throw new AuthenticationError(
            `${service} credentials are invalid or missing: ${result.errors.join(', ')}`
          );
        }
        
        // Log warnings if any
        if (result.warnings && result.warnings.length > 0) {
          console.warn(`⚠️  ${service} credential warnings:`, result.warnings);
        }
      }
      
      // Store validation results in context for later use
      c.set('credentialValidation', validationResults);
      
      console.log(`✅ Credential validation passed for services: ${services.join(', ')}`);
      
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
          operation: 'credential_validation_error',
          metadata: {
            services,
            validationResults
          }
        }
      );
      
      throw new AuthenticationError(
        `Credential validation failed due to internal error: ${err.message}`
      );
    }
  };
}

/**
 * Re-export service-specific middleware for direct use
 */
export { validateZendeskCredentialsMiddleware as validateZendeskCredentials } from '../services/integrations/zendesk/auth';
export { validateClickUpCredentialsMiddleware as validateClickUpCredentials } from '../services/integrations/clickup/auth';

/**
 * Middleware for validating all service credentials
 * Uses the generic validation function for backward compatibility
 */
export const validateAllCredentials = validateCredentials(['zendesk', 'clickup']);

/**
 * Helper function to get credential validation results from context
 */
export function getCredentialValidationResults(c: Context): CredentialValidationResult[] {
  return c.get('credentialValidation') || [];
}

/**
 * Helper function to check if a specific service's credentials are valid
 */
export function isServiceCredentialValid(c: Context, service: keyof ServiceCredentials): boolean {
  const results = getCredentialValidationResults(c);
  const serviceResult = results.find(r => r.service === service);
  return serviceResult?.isValid || false;
}