// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;

/**
 * Template variable for dynamic content replacement
 */
export interface TemplateVariable {
  /** Variable name (used in template as {{name}}) */
  name: string;
  /** Variable value */
  value: string | number | boolean;
  /** Optional formatting function */
  formatter?: (value: any) => string;
}

/**
 * Message template data structure
 */
export interface MessageTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name for easy reference */
  name: string;
  /** Template description */
  description?: string;
  /** Plain text version of the message */
  text: string;
  /** Rich Block Kit blocks (optional) */
  blocks?: (KnownBlock | Block)[];
  /** Default variables for the template */
  defaultVariables?: Record<string, any>;
  /** Template category for organization */
  category?: string;
}

/**
 * Rendered message ready for sending
 */
export interface RenderedMessage {
  /** Final text content */
  text: string;
  /** Final blocks content */
  blocks?: (KnownBlock | Block)[];
  /** Channel to send to */
  channel?: string;
  /** Thread timestamp if replying in thread */
  threadTimestamp?: string;
  /** Additional message options */
  options?: Record<string, any>;
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  /** Variables to replace in template */
  variables: Record<string, any>;
  /** Target channel information */
  channel?: {
    id: string;
    name: string;
  };
  /** User context */
  user?: {
    id: string;
    name: string;
    displayName?: string;
  };
  /** Additional context data */
  metadata?: Record<string, any>;
}

/**
 * Message template manager interface
 */
export interface IMessageTemplateManager {
  /**
   * Register a new message template
   */
  registerTemplate(template: MessageTemplate): void;
  
  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): MessageTemplate | undefined;
  
  /**
   * Get all templates in a category
   */
  getTemplatesByCategory(category: string): MessageTemplate[];
  
  /**
   * Get all available templates
   */
  getAllTemplates(): MessageTemplate[];
  
  /**
   * Render a template with provided context
   */
  renderTemplate(templateId: string, context: TemplateContext): RenderedMessage;
  
  /**
   * Render template with variables
   */
  renderTemplateWithVariables(templateId: string, variables: Record<string, any>): RenderedMessage;
  
  /**
   * Validate template syntax and variables
   */
  validateTemplate(template: MessageTemplate): boolean;
  
  /**
   * Remove a template
   */
  removeTemplate(templateId: string): boolean;
  
  /**
   * Update an existing template
   */
  updateTemplate(templateId: string, template: Partial<MessageTemplate>): boolean;
}

/**
 * Template loader interface for loading templates from various sources
 */
export interface ITemplateLoader {
  /**
   * Load templates from a directory
   */
  loadFromDirectory(directoryPath: string): Promise<MessageTemplate[]>;
  
  /**
   * Load templates from JSON files
   */
  loadFromJson(jsonPath: string): Promise<MessageTemplate[]>;
  
  /**
   * Load a single template from file
   */
  loadTemplate(filePath: string): Promise<MessageTemplate>;
}