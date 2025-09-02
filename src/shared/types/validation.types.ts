/**
 * @type: types
 * @domain: shared
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// Validation Error
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.unknown().optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Validation Result
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  data: z.unknown().optional(),
});

export type ValidationResult<T = unknown> = {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly data?: T;
};

// Validation Success Result
export type ValidationSuccess<T> = {
  readonly isValid: true;
  readonly errors: readonly [];
  readonly data: T;
};

// Validation Failure Result
export type ValidationFailure = {
  readonly isValid: false;
  readonly errors: readonly ValidationError[];
  readonly data?: undefined;
};

// Validation Rule
export const ValidationRuleSchema = z.object({
  field: z.string(),
  required: z.boolean().default(false),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object', 'date']).optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  custom: z.function().optional(),
});

export type ValidationRule = z.infer<typeof ValidationRuleSchema>;

// Validation Schema
export const ValidationSchemaSchema = z.object({
  name: z.string(),
  rules: z.array(ValidationRuleSchema),
  strict: z.boolean().default(true),
});

export type ValidationSchema = z.infer<typeof ValidationSchemaSchema>;

// Common Validation Error Codes
export const VALIDATION_ERROR_CODES = {
  REQUIRED: 'REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  TOO_SMALL: 'TOO_SMALL',
  TOO_BIG: 'TOO_BIG',
  INVALID_PATTERN: 'INVALID_PATTERN',
  CUSTOM_ERROR: 'CUSTOM_ERROR',
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];

// Validator Interface
export interface IValidator<T = unknown> {
  validate(data: unknown): ValidationResult<T>;
  validateAsync(data: unknown): Promise<ValidationResult<T>>;
}

// Schema Validator Interface
export interface ISchemaValidator<T = unknown> {
  validate(data: unknown, schema: ValidationSchema): ValidationResult<T>;
  validateAsync(data: unknown, schema: ValidationSchema): Promise<ValidationResult<T>>;
}