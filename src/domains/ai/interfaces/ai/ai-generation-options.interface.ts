/**
 * Options for text generation
 */
export interface AIGenerationOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for generation (0.0 to 1.0) */
  temperature?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Top-k sampling parameter */
  topK?: number;
  /** Whether to stream the response */
  stream?: boolean;
}