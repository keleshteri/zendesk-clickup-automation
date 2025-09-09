import type { MessageTemplate } from './message-template.interface.js';

/**
 * Template loader interface for loading templates from various sources
 */
export interface ITemplateLoader {
  /**
   * Load a template by ID
   */
  load(templateId: string): Promise<MessageTemplate | null>;

  /**
   * Load all templates
   */
  loadAll(): Promise<MessageTemplate[]>;

  /**
   * Save a template
   */
  save(template: MessageTemplate): Promise<void>;

  /**
   * Delete a template
   */
  delete(templateId: string): Promise<void>;

  /**
   * Check if template exists
   */
  exists(templateId: string): Promise<boolean>;

  /**
   * Get template metadata without loading full content
   */
  getMetadata(templateId: string): Promise<MessageTemplate['metadata'] | null>;

  /**
   * List all template IDs
   */
  listTemplateIds(): Promise<string[]>;

  /**
   * Search templates by criteria
   */
  search(criteria: {
    name?: string;
    category?: string;
    tags?: string[];
    author?: string;
  }): Promise<MessageTemplate[]>;

  /**
   * Validate template format
   */
  validate(template: MessageTemplate): { isValid: boolean; errors: string[] };

  /**
   * Get templates by category
   */
  getByCategory(category: string): Promise<MessageTemplate[]>;

  /**
   * Get template versions
   */
  getVersions(templateId: string): Promise<string[]>;

  /**
   * Load specific template version
   */
  loadVersion(templateId: string, version: string): Promise<MessageTemplate | null>;
}