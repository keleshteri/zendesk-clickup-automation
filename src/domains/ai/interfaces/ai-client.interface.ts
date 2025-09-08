/**
 * @type: domain
 * @domain: ai
 * @purpose: Generic AI client interface
 */

import { AIGenerationOptions } from "./ai/ai-generation-options.interface";
import { AIGenerationResult } from "./ai/ai-generation-result.interface";


/**
 * Generic AI client interface that can be implemented by different providers
 */
export interface IAIClient {
  /**
   * Generate text from a prompt
   * @param prompt The text prompt to generate from
   * @param options Optional generation parameters
   * @returns A promise resolving to the generation result
   */
  generateText(prompt: string, options?: AIGenerationOptions): Promise<AIGenerationResult>;
  
  /**
   * Generate text from a prompt with system instructions
   * @param prompt The user prompt
   * @param systemInstructions System instructions to guide the model
   * @param options Optional generation parameters
   * @returns A promise resolving to the generation result
   */
  generateTextWithInstructions(
    prompt: string,
    systemInstructions: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResult>;
}