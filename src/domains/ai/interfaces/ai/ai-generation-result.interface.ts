/**
 * Result of text generation
 */
export interface AIGenerationResult {
  /** The generated text */
  text: string;
  /** Whether the generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Additional metadata about the generation */
  metadata?: Record<string, unknown>;
}