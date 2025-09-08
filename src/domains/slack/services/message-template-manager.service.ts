import type {
  IMessageTemplateManager,
  MessageTemplate,
  RenderedMessage,
  TemplateContext
} from '../interfaces/message-template.interface.js';
import {
  SlackTemplateError,
  SlackValidationError
} from '../errors/slack.errors.js';
import {
  MessageTemplateSchema,
  TemplateContextSchema,
  TemplateCategory
} from '../types/slack.types.js';

/**
 * Message template manager implementation
 * Handles template registration, validation, and rendering
 */
export class MessageTemplateManager implements IMessageTemplateManager {
  private templates = new Map<string, MessageTemplate>();

  /**
   * Register a new message template
   */
  registerTemplate(template: MessageTemplate): void {
    try {
      // Validate template structure
      const validatedTemplate = MessageTemplateSchema.parse(template);
      
      // Check for duplicate IDs
      if (this.templates.has(validatedTemplate.id)) {
        throw new SlackTemplateError(
          `Template with ID '${validatedTemplate.id}' already exists`,
          validatedTemplate.id
        );
      }
      
      // Validate template syntax
      if (!this.validateTemplate(validatedTemplate)) {
        throw new SlackTemplateError(
          `Template '${validatedTemplate.id}' has invalid syntax`,
          validatedTemplate.id
        );
      }
      
      this.templates.set(validatedTemplate.id, validatedTemplate);
    } catch (error) {
      if (error instanceof SlackTemplateError) {
        throw error;
      }
      throw new SlackValidationError(
        `Failed to register template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'template',
        [error instanceof Error ? error.message : 'Unknown validation error']
      );
    }
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): MessageTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates in a category
   */
  getTemplatesByCategory(category: string): MessageTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): MessageTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Render a template with provided context
   */
  renderTemplate(templateId: string, context: TemplateContext): RenderedMessage {
    try {
      // Validate context
      const validatedContext = TemplateContextSchema.parse(context);
      
      // Get template
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new SlackTemplateError(
          `Template '${templateId}' not found`,
          templateId
        );
      }
      
      // Merge default variables with provided variables
      const variables = {
        ...template.defaultVariables,
        ...validatedContext.variables
      };
      
      // Render text
      const renderedText = this.replaceVariables(template.text, variables);
      
      // Render blocks if present
      let renderedBlocks;
      if (template.blocks) {
        const blocksJson = JSON.stringify(template.blocks);
        const renderedBlocksJson = this.replaceVariables(blocksJson, variables);
        renderedBlocks = JSON.parse(renderedBlocksJson);
      }
      
      return {
        text: renderedText,
        blocks: renderedBlocks,
        channel: validatedContext.channel?.id,
        options: validatedContext.metadata
      };
    } catch (error) {
      if (error instanceof SlackTemplateError) {
        throw error;
      }
      throw new SlackTemplateError(
        `Failed to render template '${templateId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        templateId,
        { context, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Render template with variables
   */
  renderTemplateWithVariables(templateId: string, variables: Record<string, any>): RenderedMessage {
    return this.renderTemplate(templateId, { variables });
  }

  /**
   * Validate template syntax and variables
   */
  validateTemplate(template: MessageTemplate): boolean {
    try {
      // Check if template has required fields
      if (!template.id || !template.name || !template.text) {
        return false;
      }
      
      // Validate variable syntax in text
      if (!this.validateVariableSyntax(template.text)) {
        return false;
      }
      
      // Validate blocks if present
      if (template.blocks) {
        const blocksJson = JSON.stringify(template.blocks);
        if (!this.validateVariableSyntax(blocksJson)) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a template
   */
  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Update an existing template
   */
  updateTemplate(templateId: string, template: Partial<MessageTemplate>): boolean {
    const existingTemplate = this.getTemplate(templateId);
    if (!existingTemplate) {
      return false;
    }
    
    try {
      const updatedTemplate = { ...existingTemplate, ...template };
      
      // Validate updated template
      const validatedTemplate = MessageTemplateSchema.parse(updatedTemplate);
      
      if (!this.validateTemplate(validatedTemplate)) {
        throw new SlackTemplateError(
          `Updated template '${templateId}' has invalid syntax`,
          templateId
        );
      }
      
      this.templates.set(templateId, validatedTemplate);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Replace variables in text using {{variable}} syntax
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      // Support nested object access with dot notation
      const value = this.getNestedValue(variables, trimmedName);
      
      if (value === undefined || value === null) {
        // Keep the placeholder if variable is not found
        return match;
      }
      
      return String(value);
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Validate variable syntax in text
   */
  private validateVariableSyntax(text: string): boolean {
    // Check for unmatched braces
    const openBraces = (text.match(/\{\{/g) || []).length;
    const closeBraces = (text.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return false;
    }
    
    // Check for empty variables
    const emptyVariables = text.match(/\{\{\s*\}\}/g);
    if (emptyVariables && emptyVariables.length > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get template statistics
   */
  getStats(): {
    totalTemplates: number;
    categoryCounts: Record<string, number>;
  } {
    const templates = this.getAllTemplates();
    const categoryCounts: Record<string, number> = {};
    
    templates.forEach(template => {
      const category = template.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return {
      totalTemplates: templates.length,
      categoryCounts
    };
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): MessageTemplate[] {
    return this.getAllTemplates();
  }

  /**
   * Import templates from JSON
   */
  importTemplates(templates: MessageTemplate[], overwrite = false): void {
    templates.forEach(template => {
      if (!overwrite && this.templates.has(template.id)) {
        throw new SlackTemplateError(
          `Template '${template.id}' already exists. Use overwrite=true to replace.`,
          template.id
        );
      }
      this.registerTemplate(template);
    });
  }
}