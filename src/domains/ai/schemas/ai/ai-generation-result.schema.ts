import { z } from 'zod';
/**
 * Schema for generation result validation
 */
export const AIGenerationResultSchema = z.object({
  text: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});