import type { MessageTemplate } from '../interfaces/templates/message-template.interface.js';
import { TemplateCategory } from '../types/slack.types.js';
import { getTemplateRegistry } from './template-registry.js';

// Import all template categories for backward compatibility
import { welcomeTemplates } from './welcome/index.js';
import { helpTemplates } from './help/index.js';
import { errorTemplates } from './error/index.js';
import { successTemplates } from './success/index.js';
import { customTemplates } from './custom/index.js';

/**
 * Default message templates for Slack bot
 * Now using modular template system with registry
 * 
 * @deprecated Use getTemplateRegistry() for better performance and features
 */
export const defaultTemplates: MessageTemplate[] = [
  ...welcomeTemplates,
  ...helpTemplates,
  ...errorTemplates,
  ...successTemplates,
  ...customTemplates
];



/**
 * Get default template by ID
 * @deprecated Use getTemplateRegistry().getTemplate() instead
 */
export function getDefaultTemplate(templateId: string): MessageTemplate | undefined {
  const registry = getTemplateRegistry();
  return registry.getTemplate(templateId);
}

/**
 * Get default templates by category
 * @deprecated Use getTemplateRegistry().getTemplatesByCategory() instead
 */
export function getDefaultTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
  const registry = getTemplateRegistry();
  return registry.getTemplatesByCategory(category);
}

/**
 * Get all welcome message templates
 * @deprecated Use getTemplateRegistry().getTemplatesByCategory(TemplateCategory.WELCOME) instead
 */
export function getWelcomeTemplates(): MessageTemplate[] {
  return getDefaultTemplatesByCategory(TemplateCategory.WELCOME);
}

/**
 * Get all help templates
 * @deprecated Use getTemplateRegistry().getTemplatesByCategory(TemplateCategory.HELP) instead
 */
export function getHelpTemplates(): MessageTemplate[] {
  return getDefaultTemplatesByCategory(TemplateCategory.HELP);
}