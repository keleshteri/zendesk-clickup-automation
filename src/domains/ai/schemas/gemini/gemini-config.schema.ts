import { z } from 'zod';
import { GeminiModel } from '../../enums';
/**
 * Gemini API configuration schema for validation
 */
export const GeminiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.nativeEnum(GeminiModel),
  baseUrl: z.string().url().optional()
});