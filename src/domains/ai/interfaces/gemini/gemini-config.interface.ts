import { GeminiModel } from "../../enums";

/**
 * Gemini API configuration
 */
export interface GeminiConfig {
  /** API key for Gemini API */
  apiKey: string;
  /** Model to use for generation */
  model: GeminiModel;
  /** Base URL for the Gemini API */
  baseUrl?: string;
}