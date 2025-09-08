/**
 * @type: domain
 * @domain: ai
 * @purpose: Prompt management implementation with POML
 */

import { z } from 'zod';
import type { IPromptManager } from '../interfaces/prompt-manager.interface';
import { AIClientError } from '../errors/ai-client.error';
import { PromptManagerConfig } from '../interfaces/prompt/prompt-manager-config.interface';
import { PromptTemplate } from '../interfaces/prompt';
import { PromptManagerConfigSchema } from '../schemas/prompt/prompt-manager-config.schema';
import { PromptVariables } from '../types';
import { PromptVariablesSchema } from '../schemas/prompt/prompt-variables.schema';

/**
 * Implementation of the prompt manager using POML
 */
export class PomlPromptManager implements IPromptManager {
  private config: PromptManagerConfig;
  
  /**
   * Create a new POML prompt manager
   * @param config Configuration for the prompt manager
   */
  constructor(config: PromptManagerConfig = {}) {
    try {
      this.config = PromptManagerConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AIClientError(
          `Invalid prompt manager configuration: ${error.errors.map(e => e.message).join(', ')}`,
          error
        );
      }
      throw new AIClientError('Invalid prompt manager configuration', error);
    }
  }

  /**
   * Load a prompt template from a string
   * @param templateString The POML template string
   * @returns The loaded prompt template
   */
  async loadTemplate(templateString: string): Promise<PromptTemplate> {
    try {
      // For now, we'll use a simple implementation without actual POML parsing
      // This will be replaced with proper POML integration later
      return {
        template: templateString,
        source: templateString
      };
    } catch (error) {
      throw new AIClientError('Failed to load prompt template', error);
    }
  }

  /**
   * Render a prompt template with variables
   * @param template The prompt template to render
   * @param variables Variables to inject into the template
   * @returns The rendered prompt string
   */
  async renderTemplate(template: PromptTemplate, variables: PromptVariables): Promise<string> {
    try {
      // Validate variables
      const validVariables = PromptVariablesSchema.parse(variables);
      
      // Combine with default variables if any
      const allVariables = {
        ...this.config.defaultVariables,
        ...validVariables
      };
      
      // For now, we'll use a simple template replacement
      // This will be replaced with proper POML rendering later
      let result = template.source as string;
      
      // Replace variables in the format {{variable}}
      for (const [key, value] of Object.entries(allVariables)) {
        if (value !== undefined && value !== null) {
          const regex = new RegExp(`\{\{\s*${key}\s*\}\}`, 'g');
          result = result.replace(regex, String(value));
        }
      }
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AIClientError(
          `Invalid prompt variables: ${error.errors.map(e => e.message).join(', ')}`,
          error
        );
      }
      throw new AIClientError('Failed to render prompt template', error);
    }
  }

  /**
   * Load and render a prompt template in one step
   * @param templateString The POML template string
   * @param variables Variables to inject into the template
   * @returns The rendered prompt string
   */
  async processTemplate(templateString: string, variables: PromptVariables): Promise<string> {
    const template = await this.loadTemplate(templateString);
    return this.renderTemplate(template, variables);
  }
}