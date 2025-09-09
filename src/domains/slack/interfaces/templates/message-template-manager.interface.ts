import type { MessageTemplate } from './message-template.interface.js';
import type { RenderedMessage } from './rendered-message.interface.js';
import type { TemplateContext } from './template-context.interface.js';
import { ITemplateLoader } from './template-loader.interface.js';

/**
 * Message template manager interface
 */
export interface IMessageTemplateManager {
  /** Template loader instance */
  readonly loader: ITemplateLoader;

  /**
   * Load a template by ID
   */
  loadTemplate(templateId: string): Promise<MessageTemplate>;

  /**
   * Render a template with variables
   */
  renderTemplate(
    templateId: string,
    variables: Record<string, any>,
    context?: TemplateContext
  ): Promise<RenderedMessage>;

  /**
   * Validate template variables
   */
  validateVariables(
    template: MessageTemplate,
    variables: Record<string, any>
  ): { isValid: boolean; errors: string[] };

  /**
   * Get all available templates
   */
  getAvailableTemplates(): Promise<MessageTemplate[]>;

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Promise<MessageTemplate[]>;

  /**
   * Register a new template
   */
  registerTemplate(template: MessageTemplate): Promise<void>;

  /**
   * Update an existing template
   */
  updateTemplate(templateId: string, template: Partial<MessageTemplate>): Promise<void>;

  /**
   * Remove a template
   */
  removeTemplate(templateId: string): Promise<void>;

  /**
   * Check if template exists
   */
  templateExists(templateId: string): Promise<boolean>;

  /**
   * Get template metadata
   */
  getTemplateMetadata(templateId: string): Promise<MessageTemplate['metadata']>;

  /**
   * Search templates by name or description
   */
  searchTemplates(query: string): Promise<MessageTemplate[]>;

  /**
   * Validate template syntax
   */
  validateTemplate(template: MessageTemplate): { isValid: boolean; errors: string[] };

  /**
   * Preview template rendering without saving
   */
  previewTemplate(
    template: MessageTemplate,
    variables: Record<string, any>,
    context?: TemplateContext
  ): Promise<RenderedMessage>;
}