import { z } from 'zod';
import { PromptVariablesSchema } from './prompt-variables.schema';
/**
 * Schema for prompt manager configuration validation
 */
export const PromptManagerConfigSchema = z.object({
  templateLocation: z.string().optional(),
  defaultVariables: PromptVariablesSchema.optional()
});