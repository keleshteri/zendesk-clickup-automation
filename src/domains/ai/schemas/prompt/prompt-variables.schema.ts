import { z } from 'zod';
/**
 * Schema for prompt variables validation
 */
export const PromptVariablesSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined()
  ])
);