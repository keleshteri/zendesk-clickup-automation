// Using any for Slack block types since @slack/bolt exports may vary
type Block = any;
type KnownBlock = any;

/**
 * Rendered message after template processing
 */
export interface RenderedMessage {
  /** Rendered text content */
  text?: string;
  /** Rendered block content */
  blocks?: (KnownBlock | Block)[];
  /** Rendered attachments */
  attachments?: any[];
  /** Template ID used for rendering */
  templateId: string;
  /** Variables used in rendering */
  variables: Record<string, any>;
  /** Rendering metadata */
  metadata?: {
    /** Rendering timestamp */
    renderedAt: Date;
    /** Template version used */
    templateVersion: string;
    /** Rendering context */
    context?: Record<string, any>;
  };
}