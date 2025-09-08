/**
 * @type: domain
 * @domain: ai
 * @purpose: Gemini API client implementation
 */

import { z } from 'zod';
import type { IGeminiClient } from '../interfaces/gemini-client.interface';
import { AIClientError, AIGenerationError, AIConfigurationError } from '../errors/ai-client.error';
import { GeminiConfig } from '../interfaces/gemini';
import { AIGenerationOptions } from '../interfaces/ai';
import { AIGenerationOptionsSchema, GeminiConfigSchema } from '../schemas';
import { GeminiModel } from '../enums';
import { AIGenerationResult } from '../interfaces/ai/ai-generation-result.interface';

/**
 * Implementation of the Gemini API client
 */
export class GeminiClient implements IGeminiClient {
  private config: GeminiConfig;
  private readonly defaultOptions: AIGenerationOptions = {
    maxTokens: 4096, // Increased from 1024 to handle longer responses
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    stream: false
  };

  /**
   * Create a new Gemini client
   * @param config The Gemini API configuration
   */
  constructor(config: GeminiConfig) {
    try {
      this.config = GeminiConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AIConfigurationError(
          `Invalid Gemini configuration: ${error.errors.map(e => e.message).join(', ')}`,
          error
        );
      }
      throw new AIConfigurationError('Invalid Gemini configuration', error);
    }
  }

  /**
   * Get the current Gemini configuration
   */
  getConfig(): GeminiConfig {
    return { ...this.config };
  }

  /**
   * Set the Gemini model to use
   * @param model The Gemini model to use
   */
  setModel(model: GeminiModel): void {
    this.config.model = model;
  }

  /**
   * Generate text from a prompt
   * @param prompt The text prompt to generate from
   * @param options Optional generation parameters
   * @returns A promise resolving to the generation result
   */
  async generateText(
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    try {
      // Validate options
      const validOptions = options
        ? AIGenerationOptionsSchema.parse(options)
        : this.defaultOptions;

      // Prepare request body
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: validOptions.maxTokens,
          temperature: validOptions.temperature,
          topP: validOptions.topP,
          topK: validOptions.topK
        }
      };

      // Build API URL
      const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      const url = `${baseUrl}/models/${this.config.model}:generateContent`;

      // Make API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        throw new AIGenerationError(
          `Gemini API error (${response.status}): ${errorText}`,
          { status: response.status, body: errorText }
        );
      }

      const data = await response.json() as any;
      
      // Extract generated text from response
      if (
        data.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        return {
          text: data.candidates[0].content.parts[0].text,
          success: true,
          metadata: {
            model: this.config.model,
            promptTokenCount: data.usageMetadata?.promptTokenCount,
            candidatesTokenCount: data.usageMetadata?.candidatesTokenCount
          }
        };
      }

      // Handle finish reason errors
      if (data.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
        return {
          text: '',
          success: false,
          error: `Generation stopped: ${data.candidates[0].finishReason}`,
          metadata: { finishReason: data.candidates[0].finishReason }
        };
      }

      // Fallback error
      throw new AIGenerationError(
        'Failed to extract generated text from Gemini API response',
        data
      );
    } catch (error) {
      if (error instanceof AIClientError) {
        throw error;
      }

      throw new AIGenerationError(
        'Failed to generate text with Gemini API',
        error
      );
    }
  }

  /**
   * Generate text from a prompt with system instructions
   * @param prompt The user prompt
   * @param systemInstructions System instructions to guide the model
   * @param options Optional generation parameters
   * @returns A promise resolving to the generation result
   */
  async generateTextWithInstructions(
    prompt: string,
    systemInstructions: string,
    options?: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    try {
      // Validate options
      const validOptions = options
        ? AIGenerationOptionsSchema.parse(options)
        : this.defaultOptions;

      // Prepare request body with system instructions
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: systemInstructions
            }
          ]
        },
        generationConfig: {
          maxOutputTokens: validOptions.maxTokens,
          temperature: validOptions.temperature,
          topP: validOptions.topP,
          topK: validOptions.topK
        }
      };

      // Build API URL
      const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      const url = `${baseUrl}/models/${this.config.model}:generateContent`;

      // Make API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        throw new AIGenerationError(
          `Gemini API error (${response.status}): ${errorText}`,
          { status: response.status, body: errorText }
        );
      }

      const data = await response.json() as any;
      
      // Extract generated text from response
      if (
        data.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        return {
          text: data.candidates[0].content.parts[0].text,
          success: true,
          metadata: {
            model: this.config.model,
            promptTokenCount: data.usageMetadata?.promptTokenCount,
            candidatesTokenCount: data.usageMetadata?.candidatesTokenCount
          }
        };
      }

      // Handle finish reason errors
      if (data.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
        return {
          text: '',
          success: false,
          error: `Generation stopped: ${data.candidates[0].finishReason}`,
          metadata: { finishReason: data.candidates[0].finishReason }
        };
      }

      // Fallback error
      throw new AIGenerationError(
        'Failed to extract generated text from Gemini API response',
        data
      );
    } catch (error) {
      if (error instanceof AIClientError) {
        throw error;
      }

      throw new AIGenerationError(
        'Failed to generate text with Gemini API',
        error
      );
    }
  }
}