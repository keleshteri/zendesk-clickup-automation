// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;

// Import and re-export TemplateContext from separate file
import type { TemplateContext } from './template-context.interface.js';
export type { TemplateContext };

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Whether variable is required */
  required: boolean;
  /** Default value if not provided */
  defaultValue?: any;
  /** Variable description */
  description?: string;
  /** Validation pattern for string types */
  pattern?: string;
  /** Minimum value for number types */
  min?: number;
  /** Maximum value for number types */
  max?: number;
}

/**
 * Message template definition
 */
export interface MessageTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template category */
  category?: string;
  /** Template version */
  version: string;
  /** Template variables */
  variables: TemplateVariable[];
  /** Template content */
  content: {
    /** Text content with variable placeholders */
    text?: string;
    /** Block content with variable placeholders */
    blocks?: (KnownBlock | Block)[];
    /** Attachment content */
    attachments?: any[];
  };
  /** Template metadata */
  metadata?: {
    /** Creation timestamp */
    createdAt: Date;
    /** Last updated timestamp */
    updatedAt: Date;
    /** Template author */
    author?: string;
    /** Template tags */
    tags?: string[];
  };
}

// TemplateContext is imported from template-context.interface.ts

// RenderedMessage is exported from rendered-message.interface.ts