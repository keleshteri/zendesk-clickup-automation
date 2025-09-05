import { z } from 'zod';
/**
 * Schema for generation options validation
 */
export const AIGenerationOptionsSchema = z.object({
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().positive().optional(),
  stream: z.boolean().optional()
});