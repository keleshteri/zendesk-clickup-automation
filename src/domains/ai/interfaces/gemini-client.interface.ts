/**
 * @type: domain
 * @domain: ai
 * @purpose: Gemini-specific AI client interface
 */

import { GeminiModel } from '../enums';
import type { IAIClient } from './ai-client.interface';
import { GeminiConfig } from './gemini/gemini-config.interface';

/**
 * Gemini-specific AI client interface
 */
export interface IGeminiClient extends IAIClient {
  /**
   * Get the current Gemini configuration
   */
  getConfig(): GeminiConfig;
  
  /**
   * Set the Gemini model to use
   * @param model The Gemini model to use
   */
  setModel(model: GeminiModel): void;
}