// Export all template categories
export * from './welcome/index.js';
export * from './help/index.js';
export * from './error/index.js';
export * from './success/index.js';
export * from './custom/index.js';

// Export template registry
export { TemplateRegistry, getTemplateRegistry } from './template-registry.js';

// Export legacy default templates for backward compatibility
export { 
  defaultTemplates, 
  getDefaultTemplate, 
  getDefaultTemplatesByCategory, 
  getWelcomeTemplates, 
  getHelpTemplates 
} from './default-templates.js';

// Re-export types and interfaces
export type { MessageTemplate } from '../interfaces/templates/message-template.interface.js';
export { TemplateCategory } from '../types/slack.types.js';