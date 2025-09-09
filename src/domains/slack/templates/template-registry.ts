import type { MessageTemplate } from '../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../types/slack.types.js';

// Import all template categories
import { welcomeTemplates } from './welcome/index.js';
import { helpTemplates } from './help/index.js';
import { errorTemplates } from './error/index.js';
import { successTemplates } from './success/index.js';
import { customTemplates } from './custom/index.js';

/**
 * Template Registry - Central management system for all message templates
 * Provides methods to find, filter, and manage templates across categories
 */
export class TemplateRegistry {
  private static instance: TemplateRegistry;
  private templates: Map<string, MessageTemplate> = new Map();
  private categorizedTemplates: Map<TemplateCategory, MessageTemplate[]> = new Map();

  private constructor() {
    this.loadTemplates();
  }

  /**
   * Get singleton instance of TemplateRegistry
   */
  public static getInstance(): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry();
    }
    return TemplateRegistry.instance;
  }

  /**
   * Load all templates from modular structure
   */
  private loadTemplates(): void {
    const allTemplates = [
      ...welcomeTemplates,
      ...helpTemplates,
      ...errorTemplates,
      ...successTemplates,
      ...customTemplates
    ];

    // Clear existing data
    this.templates.clear();
    this.categorizedTemplates.clear();

    // Load templates into registry
    for (const template of allTemplates) {
      this.templates.set(template.id, template);
      
      // Group by category (only if category is defined)
      if (template.category) {
        const categoryTemplates = this.categorizedTemplates.get(template.category as TemplateCategory) || [];
        categoryTemplates.push(template);
        this.categorizedTemplates.set(template.category as TemplateCategory, categoryTemplates);
      }
    }
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): MessageTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): MessageTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
    return this.categorizedTemplates.get(category) || [];
  }

  /**
   * Get all available template categories
   */
  public getCategories(): TemplateCategory[] {
    return Array.from(this.categorizedTemplates.keys());
  }

  /**
   * Search templates by name or description
   */
  public searchTemplates(query: string): MessageTemplate[] {
    const searchTerm = query.toLowerCase();
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description && template.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get template count by category
   */
  public getTemplateCount(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [category, templates] of this.categorizedTemplates) {
      counts[category] = templates.length;
    }
    return counts;
  }

  /**
   * Reload templates (useful for hot-reloading in development)
   */
  public reload(): void {
    this.loadTemplates();
  }
}

/**
 * Convenience function to get the template registry instance
 */
export const getTemplateRegistry = (): TemplateRegistry => TemplateRegistry.getInstance();