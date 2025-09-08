/**
 * @type: domain
 * @domain: ai
 * @purpose: Prompt management interface
 */

import { PromptVariables } from "../types";
import { PromptTemplate } from "./prompt/prompt-template.interface";


/**
 * Interface for managing and rendering prompt templates
 */
export interface IPromptManager {
  /**
   * Load a prompt template from a string
   * @param templateString The POML template string
   * @returns The loaded prompt template
   */
  loadTemplate(templateString: string): Promise<PromptTemplate>;
  
  /**
   * Render a prompt template with variables
   * @param template The prompt template to render
   * @param variables Variables to inject into the template
   * @returns The rendered prompt string
   */
  renderTemplate(template: PromptTemplate, variables: PromptVariables): Promise<string>;
  
  /**
   * Load and render a prompt template in one step
   * @param templateString The POML template string
   * @param variables Variables to inject into the template
   * @returns The rendered prompt string
   */
  processTemplate(templateString: string, variables: PromptVariables): Promise<string>;
}