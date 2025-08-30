/**
 * @ai-metadata
 * @component: ValidationUtils
 * @description: Centralized validation utilities for AI service data validation and sanitization
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/validation.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts"]
 * @tests: ["./tests/validation.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Utility functions for validating and sanitizing data in AI services"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
}

export class ValidationUtils {
  private static readonly PRIORITY_VALUES = ['low', 'normal', 'high', 'urgent'];
  private static readonly CATEGORY_VALUES = ['technical', 'billing', 'general', 'account', 'bug', 'feature', 'wordpress'];
  private static readonly SENTIMENT_VALUES = ['frustrated', 'neutral', 'happy', 'angry'];
  private static readonly TEAM_VALUES = ['development', 'support', 'billing', 'management'];
  private static readonly STATUS_VALUES = ['new', 'open', 'pending', 'hold', 'solved', 'closed'];

  /**
   * Validate Zendesk ticket data
   */
  static validateZendeskTicket(ticket: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'id', required: true, type: 'number' },
      { field: 'subject', required: true, type: 'string', minLength: 1, maxLength: 500 },
      { field: 'description', required: true, type: 'string', minLength: 1 },
      { field: 'priority', required: false, type: 'string', allowedValues: this.PRIORITY_VALUES },
      { field: 'status', required: false, type: 'string', allowedValues: this.STATUS_VALUES },
      { field: 'created_at', required: true, type: 'string' },
      { field: 'updated_at', required: true, type: 'string' },
      { field: 'requester_id', required: true, type: 'number' }
    ];

    return this.validateObject(ticket, rules);
  }

  /**
   * Validate ticket analysis result
   */
  static validateTicketAnalysis(analysis: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'summary', required: true, type: 'string', minLength: 10, maxLength: 500 },
      { field: 'priority', required: true, type: 'string', allowedValues: this.PRIORITY_VALUES },
      { field: 'category', required: true, type: 'string', allowedValues: this.CATEGORY_VALUES },
      { field: 'sentiment', required: true, type: 'string', allowedValues: this.SENTIMENT_VALUES },
      { field: 'urgency', required: true, type: 'string', allowedValues: ['low', 'medium', 'high', 'critical'] },
      { field: 'complexity', required: true, type: 'string', allowedValues: ['simple', 'medium', 'complex'] },
      { field: 'suggestedTeam', required: true, type: 'string', allowedValues: this.TEAM_VALUES },
      { field: 'actionItems', required: true, type: 'array' },
      { field: 'keywords', required: true, type: 'array' },
      { field: 'estimatedResolutionTime', required: false, type: 'string' },
      { 
        field: 'confidence', 
        required: true, 
        type: 'number',
        customValidator: (value: number) => value >= 0 && value <= 1
      }
    ];

    return this.validateObject(analysis, rules);
  }

  /**
   * Validate duplicate detection result
   */
  static validateDuplicateDetection(result: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'isDuplicate', required: true, type: 'boolean' },
      { 
        field: 'confidence', 
        required: true, 
        type: 'number',
        customValidator: (value: number) => value >= 0 && value <= 1
      },
      { field: 'duplicateOf', required: false, type: 'string' },
      { 
        field: 'similarity', 
        required: true, 
        type: 'number',
        customValidator: (value: number) => value >= 0 && value <= 1
      },
      { field: 'reasoning', required: true, type: 'string', minLength: 10 },
      { field: 'suggestedAction', required: true, type: 'string', allowedValues: ['merge', 'link', 'separate'] },
      { field: 'relatedTickets', required: false, type: 'array' }
    ];

    return this.validateObject(result, rules);
  }

  /**
   * Validate intent classification result
   */
  static validateIntentClassification(result: any): ValidationResult {
    const rules: ValidationRule[] = [
      { 
        field: 'intent', 
        required: true, 
        type: 'string', 
        allowedValues: ['zendesk_query', 'zendesk_action', 'clickup_create', 'clickup_query', 'general']
      },
      { 
        field: 'confidence', 
        required: true, 
        type: 'number',
        customValidator: (value: number) => value >= 0 && value <= 1
      },
      { field: 'entities', required: false, type: 'array' },
      { field: 'reasoning', required: true, type: 'string', minLength: 5 },
      { field: 'suggestedAction', required: false, type: 'string' }
    ];

    return this.validateObject(result, rules);
  }

  /**
   * Sanitize text content for AI processing
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove special characters that might interfere with AI processing
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim()
      // Limit length to prevent token overflow
      .substring(0, 10000);
  }

  /**
   * Sanitize JSON response from AI
   */
  static sanitizeJsonResponse(response: string): string {
    if (!response || typeof response !== 'string') {
      return '{}';
    }

    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*|```\s*/g, '');
    
    // Find JSON object boundaries
    const startIndex = cleaned.indexOf('{');
    const lastIndex = cleaned.lastIndexOf('}');
    
    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, lastIndex + 1);
    }

    return cleaned.trim();
  }

  /**
   * Validate and parse JSON response
   */
  static parseJsonResponse<T>(response: string): { success: boolean; data?: T; error?: string } {
    try {
      const sanitized = this.sanitizeJsonResponse(response);
      const parsed = JSON.parse(sanitized);
      return { success: true, data: parsed };
    } catch (error) {
      return { 
        success: false, 
        error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate ticket ID format
   */
  static isValidTicketId(id: any): boolean {
    return typeof id === 'number' && id > 0 && Number.isInteger(id);
  }

  /**
   * Validate confidence score
   */
  static isValidConfidence(confidence: any): boolean {
    return typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
  }

  /**
   * Generic object validation
   */
  private static validateObject(obj: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: any = {};

    if (!obj || typeof obj !== 'object') {
      return {
        isValid: false,
        errors: ['Input must be an object'],
        warnings: []
      };
    }

    for (const rule of rules) {
      const value = obj[rule.field];
      const fieldErrors = this.validateField(value, rule);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors.map(err => `${rule.field}: ${err}`));
      } else {
        // Sanitize valid data
        if (value !== undefined) {
          sanitizedData[rule.field] = rule.type === 'string' && typeof value === 'string' 
            ? this.sanitizeText(value) 
            : value;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Validate individual field
   */
  private static validateField(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push('is required');
      return errors;
    }

    // Skip further validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`must be of type ${rule.type}, got ${actualType}`);
        return errors;
      }
    }

    // Check string constraints
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`must be no more than ${rule.maxLength} characters long`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push('does not match required pattern');
      }
    }

    // Check allowed values
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(`must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Check custom validator
    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push('fails custom validation');
    }

    return errors;
  }

  /**
   * Create a validation summary for logging
   */
  static createValidationSummary(result: ValidationResult): string {
    const { isValid, errors, warnings } = result;
    
    let summary = `Validation ${isValid ? 'PASSED' : 'FAILED'}`;
    
    if (errors.length > 0) {
      summary += `\nErrors (${errors.length}): ${errors.join('; ')}`;
    }
    
    if (warnings.length > 0) {
      summary += `\nWarnings (${warnings.length}): ${warnings.join('; ')}`;
    }
    
    return summary;
  }
}